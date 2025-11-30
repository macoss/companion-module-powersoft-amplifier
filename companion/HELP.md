# Powersoft Quattrocanali Module Help

This module provides control for Powersoft X Series amplifiers including Duecanali (2 channels), Quattrocanali (4 channels), and Ottocanali (8 channels).

## Quick Setup

1. **Enter the amplifier's IP address** in the module configuration
2. The UDP port defaults to 1234 (standard for Powersoft amplifiers)
3. Click "Save" - the module will automatically connect and detect the number of channels
4. Create actions and feedbacks as needed

## Configuration Options

### Amplifier IP Address (Required)
The IP address of your Powersoft amplifier. You can find this in the amplifier's network settings menu.

### UDP Port
The UDP port for communication with the amplifier. Default is 1234, which is the standard Powersoft protocol port. Only change this if you've configured a custom port on your amplifier.

### Status Poll Interval
How often (in seconds) the module checks the amplifier's power status. Default is 30 seconds. Lower values provide more frequent updates but generate more network traffic.
- Minimum: 5 seconds
- Maximum: 300 seconds (5 minutes)
- Recommended: 30 seconds

## Available Actions

### Power On
Brings the amplifier out of standby mode, making it operative. The amplifier will begin amplifying audio signals.

### Power Off (Standby)
Puts the amplifier into standby mode (not operative). Audio amplification is disabled but the amplifier remains powered and responsive to commands.

### Toggle Power
Toggles between operative and standby modes. If currently on, it will go to standby. If currently in standby, it will power on.

### Ping Amplifier
Tests communication with the amplifier. Useful for troubleshooting network connectivity issues.

### Mute Channel
Mutes a specific output channel. Select the channel number from the dropdown. The available channels are automatically detected from your amplifier.

### Unmute Channel
Unmutes a specific output channel. Select the channel number from the dropdown.

### Toggle Mute Channel
Toggles the mute state of a channel. Note: This action requires state tracking and is currently a placeholder for future implementation.

## Available Feedbacks

### Power Status
Changes the button appearance based on the amplifier's power state:
- **Green background** when power is on (operative)
- **Default appearance** when in standby

You can customize the colors and choose whether to trigger on "Power On" or "Standby" state.

### Connection Status
Changes the button appearance based on connection to the amplifier:
- **Default appearance** when connected
- **Red background** when disconnected

Useful for monitoring network connectivity to the amplifier.

## Available Variables

The module provides the following variables that can be used in button text or other locations:

- `$(powersoft-quattrocanali:connection_status)` - Connection status (Connected/Disconnected)
- `$(powersoft-quattrocanali:power_status)` - Power status (Online/Standby/Unknown)
- `$(powersoft-quattrocanali:manufacturer)` - Manufacturer name
- `$(powersoft-quattrocanali:family)` - Product family
- `$(powersoft-quattrocanali:model)` - Amplifier model
- `$(powersoft-quattrocanali:serial)` - Serial number
- `$(powersoft-quattrocanali:last_error)` - Last error message

## Automatic Channel Detection

When the module connects to an amplifier, it automatically queries the device to determine how many channels it has. This means:

- **Duecanali** users will see 2 channels in mute actions
- **Quattrocanali** users will see 4 channels in mute actions
- **Ottocanali** users will see 8 channels in mute actions

No manual configuration is needed - just connect and the module adapts to your amplifier model.

## Troubleshooting

### Module shows "Connection Failure"
1. Verify the amplifier is powered on and connected to the network
2. Check that the IP address is correct
3. Ensure the amplifier and Companion are on the same network or have a route between them
4. Verify no firewall is blocking UDP port 1234
5. Try pinging the amplifier IP address from the Companion computer

### Power/Mute commands not working
1. Check that the amplifier is not locked or in a protected mode
2. Verify the connection status shows "Connected"
3. Enable debug logging in Companion to see protocol communication details
4. Check for error messages in the module log

### Channel count not detected
1. Ensure the amplifier has fully booted and is responding to network commands
2. Check the module log for any error messages about channel detection
3. Disconnect and reconnect the module to retry detection

### Variables showing "Unknown"
Wait a few seconds after connection - the module polls the amplifier for information. If variables remain unknown after 30 seconds, check the connection and review the module log.

## Network Requirements

- UDP communication on port 1234 (or custom port if configured)
- Bi-directional communication required (amplifier must be able to send responses back)
- Typical latency: < 100ms on local network
- Bandwidth usage: Minimal (< 1 kbps with default polling)

## Advanced: Debug Logging

To see detailed protocol communication:

1. Enable debug logging in Companion (Log level: Debug)
2. Check the Companion log for messages from this module
3. You'll see:
   - All UDP packets sent/received in hexadecimal format
   - CRC calculation details
   - Protocol parsing information
   - Any errors or warnings

This is helpful when troubleshooting communication issues or working with Powersoft support.

## Protocol Information

This module implements the Powersoft X-DSP protocol:
- Protocol: UDP
- Default Port: 1234
- CRC: CRC-16 with polynomial 0xA001 (reflected)
- Byte order: Little-endian for multi-byte fields
- Response timeout: 5 seconds

For more technical details, refer to the Powersoft X-DSP Protocol Documentation.

## Support

For questions or issues:
- GitHub Issues: https://github.com/bitfocus/companion-module-powersoft-quattrocanali/issues
- Companion Forum: https://github.com/bitfocus/companion/discussions
- Bitfocus Slack: https://bitfocus.io/slack
