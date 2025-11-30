const dgram = require('dgram')

// Protocol constants
const STX = 0x02
const ETX = 0x03
const DEFAULT_PORT = 1234

// Command codes
const COMMANDS = {
	PING: 0,
	READGM: 1,
	WRITEOUTMUTE: 3,
	STANDBY: 14,
	INFO: 11,
}

// Response command codes (request + 128)
const RESPONSES = {
	PING: 255,
	READGM: 254,
	WRITEOUTMUTE: 252,
	STANDBY: 241,
	INFO: 244,
}

class PowersoftProtocol {
	constructor(instance) {
		this.instance = instance
		this.socket = null
		this.cookieCounter = 0
		this.pendingRequests = new Map()
	}

	connect(host, port = DEFAULT_PORT) {
		this.disconnect()

		return new Promise((resolve, reject) => {
			try {
				this.socket = dgram.createSocket('udp4')
				this.host = host
				this.port = port

				this.socket.on('message', (msg, rinfo) => {
					this.handleMessage(msg, rinfo)
				})

				this.socket.on('error', (err) => {
					this.instance.log('error', `UDP socket error: ${err.message}`)
					this.instance.updateStatus('connection_failure', err.message)
				})

				this.socket.bind(() => {
					this.instance.log('info', `UDP socket bound to port ${this.socket.address().port}`)
					resolve()
				})
			} catch (error) {
				reject(error)
			}
		})
	}

	disconnect() {
		if (this.socket) {
			this.socket.close()
			this.socket = null
		}
		this.pendingRequests.clear()
	}

	// Generate next cookie value
	getNextCookie() {
		this.cookieCounter = (this.cookieCounter + 1) % 65536
		return this.cookieCounter
	}

	// CRC16 calculation (polynomial: x16 + x15 + x2 + 1) - Little Endian
	calculateCRC16(data) {
		if (!data || data.length === 0) return 0

		let crc = 0
		for (let i = 0; i < data.length; i++) {
			crc ^= data[i]  // XOR with lower byte for little endian
			for (let j = 0; j < 8; j++) {
				if (crc & 0x0001) {  // Check LSB instead of MSB
					crc = (crc >> 1) ^ 0xA001  // Reversed polynomial
				} else {
					crc = crc >> 1
				}
			}
			crc &= 0xffff
		}
		return crc
	}

	// Build protocol message
	buildMessage(cmd, cookie, answerPort, data = Buffer.alloc(0)) {
		const count = data.length
		const crcDataArray = Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
		this.instance.log('debug', `CRC calculation (build) on data: [${crcDataArray.join(', ')}]`)
		const crc16 = this.calculateCRC16(data)
		const notCmd = (~cmd) & 0xff

		const buffer = Buffer.alloc(12 + count)
		let offset = 0

		buffer[offset++] = STX
		buffer[offset++] = cmd
		buffer.writeUInt16LE(cookie, offset)
		offset += 2
		buffer.writeUInt16LE(count, offset)
		offset += 2
		buffer.writeUInt16LE(answerPort, offset)
		offset += 2

		if (count > 0) {
			data.copy(buffer, offset)
			offset += count
		}

		buffer.writeUInt16LE(crc16, offset)  // CRC stored as little-endian
		offset += 2
		buffer[offset++] = notCmd
		buffer[offset++] = ETX

		return buffer
	}

	// Parse incoming message
	parseMessage(buffer) {
		if (buffer.length < 12) {
			this.instance.log('debug', `Parse failed: buffer too short (${buffer.length} < 12)`)
			return null
		}
		if (buffer[0] !== STX) {
			this.instance.log('debug', `Parse failed: invalid STX (${buffer[0]} !== ${STX})`)
			return null
		}
		if (buffer[buffer.length - 1] !== ETX) {
			this.instance.log('debug', `Parse failed: invalid ETX (${buffer[buffer.length - 1]} !== ${ETX})`)
			return null
		}

		const cmd = buffer[1]
		const cookie = buffer.readUInt16LE(2)
		const count = buffer.readUInt16LE(4)
		const answerPort = buffer.readUInt16LE(6)

		if (buffer.length !== 12 + count) {
			this.instance.log('debug', `Parse failed: wrong length (${buffer.length} !== ${12 + count})`)
			return null
		}

		const data = count > 0 ? buffer.subarray(8, 8 + count) : Buffer.alloc(0)
		const receivedCrc = buffer.readUInt16LE(8 + count)  // CRC stored as little-endian
		const notCmd = buffer[8 + count + 2]
		const expectedNotCmd = (~cmd) & 0xff

		this.instance.log('debug', `Parsed message: cmd=${cmd}, cookie=${cookie}, data=[${Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(', ')}]`)

		if (notCmd !== expectedNotCmd) {
			this.instance.log('debug', `Parse failed: invalid notCmd (0x${notCmd.toString(16).toUpperCase()} !== 0x${expectedNotCmd.toString(16).toUpperCase()})`)
			return null
		}

		const crcDataArray = Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
		this.instance.log('debug', `CRC calculation (parse) on data: [${crcDataArray.join(', ')}]`)
		const calculatedCrc = this.calculateCRC16(data)
		if (receivedCrc !== calculatedCrc) {
			this.instance.log('debug', `Parse failed: CRC mismatch (received=0x${receivedCrc.toString(16).toUpperCase()}, calculated=0x${calculatedCrc.toString(16).toUpperCase()})`)
			return null
		}
	
		return {
			cmd,
			cookie,
			answerPort,
			data,
		}
	}

	// Handle incoming messages
	handleMessage(buffer, rinfo) {
		try {
			// Log the raw message received
			const byteArray = Array.from(buffer)
			const hexArray = byteArray.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
			this.instance.log('debug', `Received UDP message: [${hexArray.join(', ')}]`)

			const message = this.parseMessage(buffer)
			if (!message) {
				this.instance.log('warn', 'Received invalid message')
				return
			}

			// Check if this is a response to a pending request
			const request = this.pendingRequests.get(message.cookie)
			if (request) {
				clearTimeout(request.timeout)
				this.pendingRequests.delete(message.cookie)
				request.resolve(message)
			} else {
				this.instance.log('debug', `Received unsolicited message: cmd=${message.cmd}, cookie=${message.cookie}`)
			}
		} catch (error) {
			this.instance.log('error', `Error parsing message: ${error.message}`)
		}
	}

	// Send command and wait for response
	sendCommand(cmd, data = Buffer.alloc(0), timeout = 5000) {
		if (!this.socket) {
			return Promise.reject(new Error('Not connected'))
		}

		const cookie = this.getNextCookie()
		const answerPort = this.socket.address().port
		const message = this.buildMessage(cmd, cookie, answerPort, data)

		// Log the message being sent
		const byteArray = Array.from(message)
		const hexArray = byteArray.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
		this.instance.log('debug', `Sending UDP message: [${hexArray.join(', ')}]`)

		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.pendingRequests.delete(cookie)
				reject(new Error('Command timeout'))
			}, timeout)

			this.pendingRequests.set(cookie, {
				resolve,
				reject,
				timeout: timeoutId,
			})

			this.socket.send(message, this.port, this.host, (error) => {
				if (error) {
					clearTimeout(timeoutId)
					this.pendingRequests.delete(cookie)
					reject(error)
				}
			})
		})
	}

	// Send ping command
	async ping() {
		try {
			const response = await this.sendCommand(COMMANDS.PING)
			return response.cmd === RESPONSES.PING
		} catch (error) {
			this.instance.log('error', `Ping failed: ${error.message}`)
			return false
		}
	}

	// Get amplifier info
	async getInfo() {
		try {
			const response = await this.sendCommand(COMMANDS.INFO)
			if (response.cmd === RESPONSES.INFO && response.data.length >= 128) {
				// Parse manufacturer, family, model, serial (each max 31 chars + null terminator)
				const manufacturer = this.parseNullTerminatedString(response.data, 0, 32)
				const family = this.parseNullTerminatedString(response.data, 32, 32)
				const model = this.parseNullTerminatedString(response.data, 64, 32)
				const serial = this.parseNullTerminatedString(response.data, 96, 32)

				return { manufacturer, family, model, serial }
			}
		} catch (error) {
			this.instance.log('error', `Get info failed: ${error.message}`)
		}
		return null
	}

	// Get channel count from amplifier
	async getChannelCount() {
		try {
			const response = await this.sendCommand(COMMANDS.READGM)
			if (response.cmd === RESPONSES.READGM && response.data.length >= 52) {
				// answer_ok is at byte 0
				const answerOk = response.data[0]
				// num_channels is at byte 1
				const numChannels = response.data[1]

				if (answerOk === 1) {
					return numChannels
				}
			}
		} catch (error) {
			this.instance.log('error', `Get channel count failed: ${error.message}`)
		}
		return null
	}

	// Parse null-terminated string from buffer
	parseNullTerminatedString(buffer, offset, maxLength) {
		let str = ''
		for (let i = 0; i < maxLength; i++) {
			const byte = buffer[offset + i]
			if (byte === 0) break
			str += String.fromCharCode(byte)
		}
		return str
	}

	// Get standby status
	async getStandbyStatus() {
		try {
			// Send STANDBY command with ON-OFF-READ = 0 (read only)
			const data = Buffer.alloc(4)
			data[0] = 0 // ON-OFF-READ: 0 = read status
			data[1] = 0
			data[2] = 0
			data[3] = 0

			const response = await this.sendCommand(COMMANDS.STANDBY, data)
			if (response.cmd === RESPONSES.STANDBY && response.data.length >= 4) {
				const answerOk = response.data[0]
				const onOff = response.data[1]

				if (answerOk === 1) {
					// ON-OFF: 1 = standby ON (not operative), 2 = standby OFF (operative)
					return {
						online: onOff === 2,
						standby: onOff === 1,
					}
				}
			}
		} catch (error) {
			this.instance.log('error', `Get standby status failed: ${error.message}`)
		}
		return null
	}

	// Set standby status
	async setStandbyStatus(turnOn) {
		try {
			// Send STANDBY command
			const data = Buffer.alloc(4)
			data[0] = turnOn ? 1 : 2 // ON-OFF-READ: 1 = standby OFF (operative), 2 = standby ON (not operative)
			data[1] = 0
			data[2] = 0
			data[3] = 0

			const response = await this.sendCommand(COMMANDS.STANDBY, data)
			if (response.cmd === RESPONSES.STANDBY && response.data.length >= 4) {
				const answerOk = response.data[0]
				return answerOk === 1
			}
		} catch (error) {
			this.instance.log('error', `Set standby status failed: ${error.message}`)
		}
		return false
	}

	// Set output channel mute
	async setOutputMute(channel, mute) {
		try {
			// Send WRITEOUTMUTE command
			const data = Buffer.alloc(4)
			data[0] = channel // Channel 0-3
			data[1] = mute ? 1 : 0 // 0 = unmute, 1 = mute
			data[2] = 0
			data[3] = 0

			const response = await this.sendCommand(COMMANDS.WRITEOUTMUTE, data)
			if (response.cmd === RESPONSES.WRITEOUTMUTE && response.data.length >= 4) {
				const answerOk = response.data[0]
				const responseChannel = response.data[1]
				const responseMute = response.data[2]

				// Verify response matches request
				if (answerOk === 1 && responseChannel === channel && responseMute === (mute ? 1 : 0)) {
					return true
				}
			}
		} catch (error) {
			this.instance.log('error', `Set output mute failed: ${error.message}`)
		}
		return false
	}
}

module.exports = PowersoftProtocol