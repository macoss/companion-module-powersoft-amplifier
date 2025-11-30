module.exports = function (self) {
	// Get channel count from amplifier, default to 4 if not yet detected
	const channelCount = self.channelCount || 4

	// Build channel choices dynamically based on channel count
	const channelChoices = []
	for (let i = 0; i < channelCount; i++) {
		channelChoices.push({ id: i, label: `Channel ${i + 1}` })
	}

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
		mute_channel: {
			name: 'Mute Channel',
			options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
			],
			callback: async (event) => {
				try {
					const success = await self.protocol.setOutputMute(event.options.channel, true)
					if (success) {
						self.log('info', `Channel ${event.options.channel + 1} muted`)
					} else {
						self.log('warn', `Failed to mute channel ${event.options.channel + 1}`)
					}
				} catch (error) {
					self.log('error', `Mute channel error: ${error.message}`)
				}
			},
		},
		unmute_channel: {
			name: 'Unmute Channel',
			options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
			],
			callback: async (event) => {
				try {
					const success = await self.protocol.setOutputMute(event.options.channel, false)
					if (success) {
						self.log('info', `Channel ${event.options.channel + 1} unmuted`)
					} else {
						self.log('warn', `Failed to unmute channel ${event.options.channel + 1}`)
					}
				} catch (error) {
					self.log('error', `Unmute channel error: ${error.message}`)
				}
			},
		},
		toggle_mute_channel: {
			name: 'Toggle Mute Channel',
			options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: 0,
					choices: channelChoices,
				},
			],
			callback: async (event) => {
				try {
					// Note: To implement toggle properly, we would need to track mute state
					// For now, this is a placeholder that could be enhanced with state tracking
					self.log('warn', 'Toggle mute requires state tracking - not yet implemented')
				} catch (error) {
					self.log('error', `Toggle mute error: ${error.message}`)
				}
			},
		},
	})
}
