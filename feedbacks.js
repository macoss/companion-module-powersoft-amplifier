const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		power_status: {
			name: 'Power Status',
			type: 'boolean',
			label: 'Amplifier Power Status',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0), // Green when on
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Power State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'Power On (Operative)' },
						{ id: 'standby', label: 'Standby (Not Operative)' },
					],
				},
			],
			callback: (feedback) => {
				const currentState = self.getVariableValue('power_status')
				
				if (feedback.options.state === 'on') {
					return currentState === 'Online'
				} else {
					return currentState === 'Standby'
				}
			},
		},
		connection_status: {
			name: 'Connection Status',
			type: 'boolean',
			label: 'Amplifier Connection Status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Red when disconnected
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'state',
					type: 'dropdown',
					label: 'Connection State',
					default: 'connected',
					choices: [
						{ id: 'connected', label: 'Connected' },
						{ id: 'disconnected', label: 'Disconnected' },
					],
				},
			],
			callback: (feedback) => {
				const connected = self.getVariableValue('connection_status') === 'Connected'
				
				if (feedback.options.state === 'connected') {
					return connected
				} else {
					return !connected
				}
			},
		},
	})
}
