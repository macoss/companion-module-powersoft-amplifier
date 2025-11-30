# companion-module-powersoft-amplifier

This module provides control for Powersoft amplifiers via the UDP protocol.

## Tested Models

- **Quattrocanali** (4 channels)

## Features

### Power Control
- Power On (bring amplifier out of standby)
- Power Off (put amplifier into standby)
- Toggle Power

### Channel Muting
- Mute individual channels
- Unmute individual channels
- Toggle mute per channel
- Automatic channel count detection

### Status Monitoring
- Connection status tracking
- Power status monitoring
- Configurable status polling interval
- Automatic reconnection on connection loss

### Device Information
- Manufacturer
- Product family
- Model
- Serial number
- Channel count (auto-detected)

## Configuration

1. **Amplifier IP Address** - The IP address of your Powersoft amplifier (required)
2. **UDP Port** - The UDP port for communication (default: 1234)
3. **Status Poll Interval** - How often to poll for status updates in seconds (default: 30, range: 5-300)

The module automatically detects the number of channels from the amplifier, so it works with any Powersoft X Series model without additional configuration.

## Actions

### Power Control
- **Power On** - Brings the amplifier out of standby mode (operative)
- **Power Off (Standby)** - Puts the amplifier into standby mode (not operative)
- **Toggle Power** - Toggles between on and standby states
- **Ping Amplifier** - Tests communication with the amplifier

### Channel Control
- **Mute Channel** - Mutes a specific output channel
- **Unmute Channel** - Unmutes a specific output channel
- **Toggle Mute Channel** - Toggles mute state for a channel (requires state tracking)

## Feedbacks

- **Power Status** - Changes button appearance based on amplifier power state (Online/Standby)
- **Connection Status** - Shows connection state (Connected/Disconnected)

## Variables

- `connection_status` - Current connection status
- `power_status` - Current power status (Online/Standby/Unknown)
- `manufacturer` - Amplifier manufacturer name
- `family` - Product family name
- `model` - Amplifier model
- `serial` - Serial number
- `last_error` - Last error message

## Protocol

This module implements the Powersoft X-DSP UDP protocol:
- Uses UDP communication on port 1234 (configurable)
- Implements CRC-16 error checking
- Supports automatic response port detection
- Includes comprehensive debug logging for troubleshooting

## Debugging

The module includes extensive debug logging for UDP communication:
- All sent and received UDP packets are logged in hexadecimal format
- CRC calculation details are logged
- Protocol parsing information is available in debug logs

Enable debug logging in Companion to see detailed protocol communication.

## Requirements

- Companion v3.0 or higher
- Network connectivity to Powersoft amplifier
- Powersoft X Series amplifier (Duecanali, Quattrocanali, or Ottocanali)

## Installation

This module can be installed from the Companion module manager.

## Support

For issues, feature requests, or questions:
- GitHub: https://github.com/bitfocus/companion-module-powersoft-amplifier
- Companion Slack: https://bitfocus.io/slack

## License

MIT License - See [LICENSE](./LICENSE)

## Credits

Developed for Bitfocus Companion by Rick Russell

Protocol implementation based on Powersoft X-DSP Protocol Documentation
