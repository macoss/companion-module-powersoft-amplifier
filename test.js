const PowersoftProtocol = require('./protocol')

// Mock instance for testing
const mockInstance = {
	log: (level, message) => console.log(`[${level.toUpperCase()}] ${message}`),
	updateStatus: (status, message) => console.log(`Status: ${status}${message ? ' - ' + message : ''}`),
}

async function testProtocol() {
	const protocol = new PowersoftProtocol(mockInstance)
	
	try {
		console.log('Testing Powersoft protocol...')
		
		// Test message building
		const pingMessage = protocol.buildMessage(0, 1, 0) // PING command
		console.log('Ping message built:', pingMessage.length, 'bytes')
		
		// Test CRC calculation
		const testData = Buffer.from('123456789')
		const crc = protocol.calculateCRC16(testData)
		console.log('CRC16 test (should be 0xBB3D):', '0x' + crc.toString(16).toUpperCase())
		
		// Test message parsing
		const testMessage = protocol.buildMessage(0, 123, 0, Buffer.from('test'))
		const parsed = protocol.parseMessage(testMessage)
		console.log('Message parse test:', parsed ? 'PASS' : 'FAIL')
		
		console.log('Protocol tests completed successfully!')
		
	} catch (error) {
		console.error('Protocol test failed:', error.message)
	}
}

if (require.main === module) {
	testProtocol()
}

module.exports = { testProtocol }