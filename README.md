# TalkToMeDearAi

An MCP (Model Context Protocol) server for text-to-speech synthesis using the OpenAI TTS API, designed to provide audio notifications for AI agents.

> **📦 Package Available:** This package is available on npm as `talktomedearai` - an MCP server for text-to-speech synthesis with intelligent caching.

## 🎯 Overview

TalkToMeDearAi is a specialized MCP server that allows AI agents to convert text to audio using OpenAI's text-to-speech models. The system includes an intelligent cache system to avoid duplicate API calls and reduce costs.

## ✨ Key Features

- **OpenAI Voice Synthesis**: Uses OpenAI's best TTS models for superior audio quality
- **Intelligent MP3 Cache**: Automatically saves generated audio for future reuse
- **Global Installation**: Can be installed globally and used by multiple projects
- **MCP Integration**: Compatible with Claude Code, Cursor, and other MCP clients
- **Agent Notifications**: Perfect for audio notifications on process completion
- **Simple Configuration**: Guided setup for OpenAI API keys

## 🚀 Quick Installation

```bash
# Global installation
npm install -g talktomedearai

# OpenAI API keys configuration
talktomedearai setup
```

## 📋 Requirements

- Node.js >= 18.0.0
- OpenAI API key with access to TTS models
- Operating system: macOS, Linux, Windows

## 🛠️ Usage

### As MCP Server

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "talktomedearai": {
      "command": "talktomedearai",
      "args": ["serve"]
    }
  }
}
```

### Available Tools

#### `speak_text`
Converts text to audio and plays or saves it

**Parameters:**
- `text` (string, required): The text to convert to audio
- `voice` (string, optional): Voice to use (alloy, echo, fable, onyx, nova, shimmer)
- `model` (string, optional): TTS model (tts-1, tts-1-hd)
- `save_only` (boolean, optional): If true, only saves without playing
- `output_path` (string, optional): Custom path to save the file

**Example:**
```javascript
await mcp.callTool("speak_text", {
  text: "Process completed successfully!",
  voice: "alloy",
  model: "tts-1-hd"
});
```

#### `start_notification`
Plays a predefined energetic audio notification to indicate the start of a process

**Uses file:** `sounds/start.mp3` (customizable by replacing the file)

**Parameters:**
- `save_only` (boolean, optional): If true, only saves without playing

**Example:**
```javascript
await mcp.callTool("start_notification", {});
```

#### `alert_notification`
Plays a predefined attention-grabbing audio notification to signal important warnings

**Uses file:** `sounds/alert.mp3` (customizable by replacing the file)

**Parameters:**
- `save_only` (boolean, optional): If true, only saves without playing

**Example:**
```javascript
await mcp.callTool("alert_notification", {});
```

#### `finish_notification`
Plays a predefined satisfying audio notification to indicate process completion

**Uses file:** `sounds/finish.mp3` (customizable by replacing the file)

**Parameters:**
- `save_only` (boolean, optional): If true, only saves without playing

**Example:**
```javascript
await mcp.callTool("finish_notification", {});
```

### 🔊 Sound Customization

To customize notification sounds, simply replace the files in the `sounds/` directory:

```bash
# In project directory or global package
sounds/
├── start.mp3   # Start sound
├── alert.mp3   # Alert sound
└── finish.mp3  # Completion sound
```

The tools search first in the local project directory, then in the global package installation directory.

## 📁 Project Structure

```
talktomedearai/
├── src/
│   ├── server.ts          # Main MCP server
│   ├── tts/
│   │   ├── client.ts      # OpenAI TTS client
│   │   └── cache.ts       # MP3 cache system
│   ├── config/
│   │   └── setup.ts       # API keys configuration
│   └── tools/
│       └── speak.ts       # Speech synthesis tool
├── dist/                  # Build output
├── cache/                 # MP3 cache files
├── package.json
├── tsconfig.json
└── README.md
```

## 🗺️ Roadmap

For detailed information on upcoming developments, see the [ROADMAP](./ROADMAP.md).

## 🤝 IDE Integration

### Claude Code
Complete guide: [📘 Claude Code Integration](./docs/CLAUDE_CODE_INTEGRATION.md)

1. `npm install -g talktomedearai && talktomedearai setup`
2. Add MCP configuration
3. Restart Claude Code
4. Use the `speak_text` tool in your agents

### Cursor  
Complete guide: [📘 Cursor Integration](./docs/CURSOR_INTEGRATION.md)

1. `npm install -g talktomedearai && talktomedearai setup`
2. Configure MCP settings
3. Integrate with build scripts and development workflow
4. Receive voice notifications during development

## 🔧 Advanced Configuration

### Cache Settings
```bash
# Set maximum cache size (MB)
talktomedearai config --cache-size 500

# Set cache duration (days)
talktomedearai config --cache-duration 30

# Clear cache
talktomedearai cache clear
```

### Voice Models
The system supports all OpenAI TTS models:
- `tts-1`: Fast and efficient
- `tts-1-hd`: High audio quality

### Available Voices
- `alloy`: Neutral and balanced
- `echo`: Male and clear
- `fable`: Expressive and dramatic
- `onyx`: Deep and authoritative
- `nova`: Young and energetic
- `shimmer`: Sweet and melodious

## 📊 Cache Management

The cache system automatically saves all generated audio files with hash based on:
- Text content
- Selected voice
- Used model

This ensures immediate reuse for identical texts and drastically reduces API costs.

## 🐛 Troubleshooting

### Common Issues

1. **"API Key not configured"**
   ```bash
   talktomedearai setup
   ```

2. **"Cannot play audio"**
   - Verify that the system has an audio player configured
   - On Linux you might need to install `sox` or `aplay`

3. **"Cache full"**
   ```bash
   talktomedearai cache clean --older-than 7d
   ```

## 🔐 Security

- API keys are stored securely in the system keychain
- Cache files are stored locally and not shared
- All audio data is processed locally after download

## 📈 Performance

- Typical cache hit rate: 85-95%
- API cost reduction: up to 90%
- Cache response time: <50ms
- OpenAI API latency: 1-3 seconds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bramato/talkToMeDearAi/discussions)
- **Email**: support@talktomedearai.dev

## 📧 Contact

- **Author**: Marco Bramato
- **Email**: marco@bramato.com

---

## 🎵 Support the Developer

**Love coding with chill vibes?** Support this project by listening to my developer album:

### **"Code Chill: Loops of Relaxation"** 🎧

*Perfect background music for your coding sessions*

<div align="center">

[![Listen on Apple Music](https://img.shields.io/badge/Apple_Music-000000?style=for-the-badge&logo=apple-music&logoColor=white)](https://music.apple.com/it/album/code-chill-loops-of-relaxation/1815061487)
[![Listen on Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](http://open.spotify.com/intl-it/album/0hBmSuyrMWpdazYTMCV0fp?go=1&nd=1&dlsi=ce8dfc8f237340e7)
[![Listen on YouTube Music](https://img.shields.io/badge/YouTube_Music-FF0000?style=for-the-badge&logo=youtube-music&logoColor=white)](https://music.youtube.com/playlist?list=OLAK5uy_lHyFL4eHr1FAikCrvsQrPYkU3AAX4DM6k)

</div>

*Every stream helps support the development of free tools like this one! 🙏*

</div>

**Note**: This project is optimized for use with AI agents and automation systems. For general TTS use, consider simpler alternatives.