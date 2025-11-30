const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const PowersoftProtocol = require('./protocol')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this.protocol = new PowersoftProtocol(this)
		this.pollInterval = null
		this.reconnectInterval = null
	}

	async init(config) {
		this.config = config

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions

		// Initialize variables
		this.setVariableValues({
			connection_status: 'Disconnected',
			power_status: 'Unknown',
			manufacturer: '',
			family: '',
			model: '',
			serial: '',
			last_error: '',
		})

		if (this.config.host) {
			this.connect()
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'No host specified')
		}
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
		this.disconnect()
	}

	async configUpdated(config) {
		const oldHost = this.config.host
		const oldPort = this.config.port
		this.config = config

		// Reconnect if host or port changed
		if (this.config.host !== oldHost || this.config.port !== oldPort) {
			this.disconnect()
			if (this.config.host) {
				this.connect()
			} else {
				this.updateStatus(InstanceStatus.BadConfig, 'No host specified')
			}
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Amplifier IP Address',
				width: 8,
				regex: Regex.IP,
				required: true,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'UDP Port',
				width: 4,
				default: 1234,
				regex: Regex.PORT,
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Status Poll Interval (seconds)',
				width: 4,
				default: 30,
				min: 5,
				max: 300,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	// Connect to amplifier
	async connect() {
		this.disconnect()
		this.updateStatus(InstanceStatus.Connecting)

		try {
			const port = this.config.port || 1234
			await this.protocol.connect(this.config.host, port)
			this.log('info', `Connected to ${this.config.host}:${port}`)
			
			this.setVariableValues({
				connection_status: 'Connected',
				last_error: '',
			})
			
			this.updateStatus(InstanceStatus.Ok)

			// Get amplifier info
			this.getAmplifierInfo()

			// Start polling for status
			this.startPolling()

		} catch (error) {
			this.log('error', `Connection failed: ${error.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			this.setVariableValues({
				connection_status: 'Disconnected',
				last_error: error.message,
			})
			
			// Schedule reconnection attempt
			this.scheduleReconnect()
		}
	}

	// Disconnect from amplifier
	disconnect() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval)
			this.pollInterval = null
		}

		if (this.reconnectInterval) {
			clearTimeout(this.reconnectInterval)
			this.reconnectInterval = null
		}

		if (this.protocol) {
			this.protocol.disconnect()
		}

		this.setVariableValues({
			connection_status: 'Disconnected',
		})
	}

	// Schedule reconnection attempt
	scheduleReconnect() {
		if (this.reconnectInterval) return
		
		this.reconnectInterval = setTimeout(() => {
			this.reconnectInterval = null
			this.log('info', 'Attempting to reconnect...')
			this.connect()
		}, 10000) // Reconnect after 10 seconds
	}

	// Get amplifier information
	async getAmplifierInfo() {
		try {
			const info = await this.protocol.getInfo()
			if (info) {
				this.setVariableValues({
					manufacturer: info.manufacturer || 'Unknown',
					family: info.family || 'Unknown',
					model: info.model || 'Unknown',
					serial: info.serial || 'Unknown',
				})
				this.log('info', `Amplifier: ${info.manufacturer} ${info.family} ${info.model} (${info.serial})`)
			}
		} catch (error) {
			this.log('warn', `Failed to get amplifier info: ${error.message}`)
		}
	}

	// Start status polling
	startPolling() {
		if (this.pollInterval) return

		const pollInterval = (this.config.poll_interval || 30) * 1000
		this.pollInterval = setInterval(() => {
			this.checkPowerStatus()
		}, pollInterval)

		// Check status immediately
		this.checkPowerStatus()
	}

	// Check power status
	async checkPowerStatus() {
		try {
			const status = await this.protocol.getStandbyStatus()
			if (status) {
				const powerStatus = status.online ? 'Online' : (status.standby ? 'Standby' : 'Unknown')
				this.setVariableValues({
					power_status: powerStatus,
				})
				
				// Check feedbacks
				this.checkFeedbacks('power_status')
			} else {
				this.setVariableValues({
					power_status: 'Unknown',
				})
			}
		} catch (error) {
			this.log('warn', `Failed to check power status: ${error.message}`)
			this.setVariableValues({
				power_status: 'Unknown',
				last_error: error.message,
			})
			
			// If we can't communicate, try to reconnect
			this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			this.scheduleReconnect()
		}
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
