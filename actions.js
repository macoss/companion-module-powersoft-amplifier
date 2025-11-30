module.exports = function (self) {
	self.setActionDefinitions({
		power_on: {
			name: 'Power On',
			options: [],
			callback: async (event) => {
				try {
					const success = await self.protocol.setStandbyStatus(true)
					if (success) {
						self.log('info', 'Amplifier powered on')
						self.checkPowerStatus()
					} else {
						self.log('warn', 'Failed to power on amplifier')
					}
				} catch (error) {
					self.log('error', `Power on error: ${error.message}`)
				}
			},
		},
		power_off: {
			name: 'Power Off (Standby)',
			options: [],
			callback: async (event) => {
				try {
					const success = await self.protocol.setStandbyStatus(false)
					if (success) {
						self.log('info', 'Amplifier put into standby')
						self.checkPowerStatus()
					} else {
						self.log('warn', 'Failed to put amplifier into standby')
					}
				} catch (error) {
					self.log('error', `Power off error: ${error.message}`)
				}
			},
		},
		power_toggle: {
			name: 'Toggle Power',
			options: [],
			callback: async (event) => {
				try {
					const status = await self.protocol.getStandbyStatus()
					if (status) {
						// Toggle: if online, go to standby; if standby, go online
						const newState = !status.online
						const success = await self.protocol.setStandbyStatus(newState)
						if (success) {
							self.log('info', `Amplifier power toggled to ${newState ? 'on' : 'standby'}`)
							self.checkPowerStatus()
						} else {
							self.log('warn', 'Failed to toggle amplifier power')
						}
					} else {
						self.log('warn', 'Could not determine current power status for toggle')
					}
				} catch (error) {
					self.log('error', `Power toggle error: ${error.message}`)
				}
			},
		},
		ping: {
			name: 'Ping Amplifier',
			options: [],
			callback: async (event) => {
				try {
					const success = await self.protocol.ping()
					if (success) {
						self.log('info', 'Ping successful')
					} else {
						self.log('warn', 'Ping failed')
					}
				} catch (error) {
					self.log('error', `Ping error: ${error.message}`)
				}
			},
		},
	})
}
