# 🔧 Claude Code Integration Guide

This guide explains how to integrate TalkToMeDearAi with Claude Code to receive audio notifications from your AI agents.

## 🚀 Quick Installation

### 1. Install TalkToMeDearAi

```bash
# Global installation
npm install -g talktomedearai

# Initial configuration
talktomedearai setup
```

During setup you will be asked:
- **OpenAI API Key**: Your API key (stored securely)
- **Default Voice**: Choose from alloy, echo, fable, onyx, nova, shimmer
- **TTS Model**: tts-1 (fast) or tts-1-hd (high quality)
- **Cache Size**: Disk space for MP3 files (recommended: 500MB)
- **Cache Duration**: File retention days (recommended: 30 days)

### 2. Configure Claude Code

Add TalkToMeDearAi to your Claude Code MCP configuration.

**Configuration path:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "talktomedearai": {
      "command": "talktomedearai",
      "args": ["serve"],
      "env": {}
    }
  }
}
```

### 3. Restart Claude Code

Completely close Claude Code and reopen it to load the new MCP configuration.

## 🎤 Usage in Agents

### Available Tool: `speak_text`

Once configured, your agents will have access to the `speak_text` tool:

```javascript
// Basic example
await mcp.callTool("speak_text", {
  text: "Process completed successfully!"
});

// Complete example with options
await mcp.callTool("speak_text", {
  text: "Data analysis completed. Found 42 critical errors.",
  voice: "nova",           // Energetic voice for alarms
  model: "tts-1-hd",      // High quality
  saveOnly: false,         // Play immediately
  outputPath: "./alerts/critical.mp3" // Also save here
});
```

### Tool Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | ✅ | - | Text to convert to audio (max 4096 characters) |
| `voice` | string | ❌ | "alloy" | Voice: alloy, echo, fable, onyx, nova, shimmer |
| `model` | string | ❌ | "tts-1" | Model: tts-1 (fast), tts-1-hd (quality) |
| `saveOnly` | boolean | ❌ | false | If true, save without playing |
| `outputPath` | string | ❌ | auto | Custom path to save |

## 🎯 Practical Examples for Agents

### 1. Completion Notifications

```javascript
// At the end of a long analysis
await mcp.callTool("speak_text", {
  text: `Analysis completed in ${duration} seconds. Found ${results.length} results.`,
  voice: "alloy"
});
```

### 2. Critical Alerts

```javascript
// For critical errors
await mcp.callTool("speak_text", {
  text: "Attention! Critical system error detected. Intervention required.",
  voice: "onyx",      // Authoritative voice
  model: "tts-1-hd"   // High quality for importance
});
```

### 3. Periodic Reminders

```javascript
// For reminders or timers
await mcp.callTool("speak_text", {
  text: "Reminder: Meeting in 5 minutes in the conference room.",
  voice: "shimmer"    // Sweet voice for reminders
});
```

### 4. Progress Updates

```javascript
// During long processes
await mcp.callTool("speak_text", {
  text: `Progress: ${Math.round(progress * 100)}% completed. Estimated remaining: ${eta} minutes.`,
  voice: "nova"       // Energetic voice for updates
});
```

## 🎨 Voice Selection for Context

### **Alloy** (Neutral and balanced)
- ✅ General notifications
- ✅ Status updates
- ✅ Operation confirmations

### **Echo** (Male and clear)
- ✅ Important announcements
- ✅ Operational instructions
- ✅ Final reports

### **Fable** (Expressive and dramatic)
- ✅ Success celebrations
- ✅ Significant announcements
- ✅ Results storytelling

### **Onyx** (Deep and authoritative)
- ✅ Critical alarms
- ✅ Serious errors
- ✅ Security warnings

### **Nova** (Young and energetic)
- ✅ Progress updates
- ✅ Positive notifications
- ✅ Encouragements

### **Shimmer** (Sweet and melodious)
- ✅ Gentle reminders
- ✅ Delicate confirmations
- ✅ Welcome messages

## ⚙️ Advanced Configuration

### Environment Variables

You can customize behavior through environment variables:

```bash
# Log level
export LOG_LEVEL=debug

# Custom cache path
export TALKTOMEDEARA_CACHE_DIR=/path/to/cache

# Disable audio (save only)
export TALKTOMEDEARA_AUDIO_DISABLED=true
```

### Team Configuration

For teams sharing the same configuration:

```json
{
  "mcpServers": {
    "talktomedearai": {
      "command": "talktomedearai",
      "args": ["serve"],
      "env": {
        "TALKTOMEDEARA_DEFAULT_VOICE": "alloy",
        "TALKTOMEDEARA_DEFAULT_MODEL": "tts-1",
        "TALKTOMEDEARA_CACHE_SIZE": "1000"
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Tool 'speak_text' not found"
```bash
# Verify configuration
talktomedearai config show

# Test MCP server
talktomedearai doctor

# Restart Claude Code completely
```

#### 2. "API Key not configured"
```bash
# Reconfigure
talktomedearai setup

# Or configure manually
talktomedearai config show
```

#### 3. "Audio not playing"
```bash
# On macOS - should work automatically with afplay
# On Linux - install audio player
sudo apt install sox alsa-utils pulseaudio

# On Windows - use PowerShell (pre-installed)
# Test with
talktomedearai test "Test audio"
```

#### 4. "Cache full"
```bash
# Clear cache
talktomedearai cache clear

# Increase cache size
talktomedearai config show
# Modify cacheMaxSize in config file
```

### Advanced Debug

Enable detailed logging:

```bash
# Export detailed logs
export LOG_LEVEL=debug

# Then start Claude Code from terminal to see logs
/Applications/Claude.app/Contents/MacOS/Claude
```

### Connectivity Tests

```bash
# Complete system test
talktomedearai doctor

# Specific TTS test
talktomedearai test "This is a connectivity test"

# Cache statistics
talktomedearai cache stats
```

## 📊 Monitoring and Analytics

### Usage Statistics

```bash
# Cache statistics
talktomedearai cache stats

# Find audio by content
talktomedearai cache find --text "error"

# Find audio by voice
talktomedearai cache find --voice nova
```

### Cache Management

```bash
# Clean files older than 7 days
talktomedearai cache clean --older-than 7d

# Configure size
talktomedearai config --cache-size 1000

# Configure duration
talktomedearai config --cache-duration 60
```

## 🚀 Best Practices for Agents

1. **Use cache intelligently**: Similar texts will be automatically reused
2. **Choose appropriate voices**: Match voice to message type
3. **Limit length**: Max 4096 characters per message
4. **Handle errors**: Always check tool results
5. **Don't abuse**: Avoid too frequent notifications to avoid disturbance

## 💡 Advanced Integration Examples

### Observer Pattern for Agents

```javascript
class AgentNotifier {
  async notifySuccess(message, details = {}) {
    await mcp.callTool("speak_text", {
      text: message,
      voice: "fable",
      model: "tts-1"
    });
  }

  async notifyError(error, severity = "medium") {
    const voice = severity === "critical" ? "onyx" : "echo";
    await mcp.callTool("speak_text", {
      text: `${severity} error: ${error.message}`,
      voice: voice,
      model: "tts-1-hd"
    });
  }

  async notifyProgress(percentage, eta) {
    if (percentage % 25 === 0) { // Only every 25%
      await mcp.callTool("speak_text", {
        text: `Progress: ${percentage}% - ETA: ${eta}`,
        voice: "nova"
      });
    }
  }
}
```

---

**🎉 Congratulations!** You have successfully configured TalkToMeDearAi with Claude Code. Your agents can now communicate vocally with you!

For technical support: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues)