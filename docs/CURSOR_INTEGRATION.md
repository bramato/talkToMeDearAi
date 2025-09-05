# 🎯 Cursor Integration Guide  

This guide explains how to integrate TalkToMeDearAi with Cursor to receive audio notifications from your AI agents during development.

## 🚀 Installation for Cursor

### 1. Install TalkToMeDearAi Globally

```bash
# Installation via npm
npm install -g talktomedeara

# Interactive configuration
talktomedeara setup
```

The setup will guide you through:
- **OpenAI API Key**: Enter your key (saved in secure keychain)
- **Default Voice**: Choose voice for notifications (alloy recommended for coding)
- **TTS Model**: tts-1 for speed, tts-1-hd for quality
- **Cache**: Automatic configuration (500MB, 30 days)

### 2. Configure Cursor for MCP

Cursor supports MCP through JSON configuration. Create or modify:

**Configuration file:**
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`  
- **Windows**: `%APPDATA%/Cursor/User/globalStorage/cursor.mcp/config.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/cursor.mcp/config.json`

**Configuration content:**
```json
{
  "mcpServers": {
    "talktomedeara": {
      "command": "talktomedeara",
      "args": ["serve"],
      "description": "Text-to-speech notifications for AI agents",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Restart Cursor

Completely close Cursor and restart it to load the MCP configuration.

## 🔧 Usage with Cursor AI

### In Chat with Cursor

Once configured, you can ask Cursor to use voice notifications:

```
@talktomedeara Tell me when you finish refactoring this code
```

### In Your Scripts

If you have scripts that Cursor executes, you can add notifications:

```javascript
// In a Node.js script
const { spawn } = require('child_process');

function notifyComplete(message) {
  const process = spawn('talktomedeara', ['test', message]);
  process.on('close', (code) => {
    console.log(`Notification sent: ${code === 0 ? 'success' : 'failed'}`);
  });
}

// Usage
async function buildProject() {
  console.log('Building project...');
  // ... build logic
  notifyComplete('Build completed successfully!');
}
```

### With Custom Extensions

If you develop extensions for Cursor, you can integrate directly:

```typescript
// Extension for Cursor
import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  
  // Command for voice notification
  let disposable = vscode.commands.registerCommand('extension.speakText', (text: string) => {
    exec(`talktomedeara test "${text}"`, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`TTS Error: ${error.message}`);
        return;
      }
      console.log('TTS notification sent');
    });
  });

  context.subscriptions.push(disposable);
}
```

## 🎨 Practical Examples for Development

### 1. Build/Test Notifications

```bash
# In your package.json
{
  "scripts": {
    "build": "webpack && talktomedeara test 'Build completed'",
    "test": "jest && talktomedeara test 'Tests passed successfully' || talktomedeara test 'Tests failed, check results' --voice onyx",
    "deploy": "npm run build && docker deploy && talktomedeara test 'Deploy completed' --voice fable"
  }
}
```

### 2. Git Hooks with Notifications

```bash
#!/bin/sh
# .git/hooks/post-commit

COMMIT_MSG=$(git log -1 --pretty=%B)
talktomedeara test "Commit made: $COMMIT_MSG" --voice nova
```

### 3. Long Process Monitoring

```javascript
// watcher.js
const chokidar = require('chokidar');
const { exec } = require('child_process');

chokidar.watch('./src').on('change', (path) => {
  console.log(`File changed: ${path}`);
  
  // Automatic rebuild
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      exec('talktomedeara test "Build error" --voice onyx');
    } else {
      exec('talktomedeara test "Automatic build completed" --voice shimmer');
    }
  });
});
```

### 4. Code Review Automation

```python
# review_notifier.py
import subprocess
import json

def notify_review_complete(pr_number, status):
    voices = {
        'approved': 'fable',
        'changes_requested': 'onyx', 
        'pending': 'alloy'
    }
    
    message = f"Code review for PR {pr_number}: {status}"
    voice = voices.get(status, 'alloy')
    
    subprocess.run([
        'talktomedeara', 'test', message, 
        '--voice', voice
    ])

# Usage with GitHub webhooks
notify_review_complete(123, 'approved')
```

## 🎤 Recommended Voices for Development

### **Alloy** (Universal default)
- ✅ Build success notifications
- ✅ Test passing
- ✅ Commit notifications

### **Nova** (Energetic - for progress)
- ✅ Hot reload completed
- ✅ Server started
- ✅ Development updates

### **Echo** (Clear - for important info)
- ✅ Deploy completed
- ✅ Database migrated
- ✅ Release published

### **Onyx** (Authoritative - for errors)
- ✅ Build failed
- ✅ Test failures
- ✅ Security alerts

### **Fable** (Dramatic - for celebrations)
- ✅ Major release
- ✅ Milestone reached
- ✅ Feature completed

### **Shimmer** (Sweet - for reminders)
- ✅ Break time reminders
- ✅ Meeting notifications
- ✅ Gentle updates

## 🔍 Debug and Troubleshooting

### Verify Cursor Configuration

```bash
# Test if Cursor recognizes the MCP server
curl -X POST http://localhost:3000/mcp/servers

# Or direct test
talktomedeara doctor
```

### Log Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug

# Start Cursor from terminal to see logs
/Applications/Cursor.app/Contents/MacOS/Cursor
```

### Test MCP Connection

```javascript
// test-mcp.js
const { McpClient } = require('@modelcontextprotocol/sdk');

async function testConnection() {
  try {
    const client = new McpClient();
    await client.connect('talktomedeara');
    
    const result = await client.callTool('speak_text', {
      text: 'MCP connection test successful!'
    });
    
    console.log('MCP connection success:', result);
  } catch (error) {
    console.error('MCP connection failed:', error);
  }
}

testConnection();
```

## ⚡ Performance Tips

### 1. Cache Optimization

```bash
# For development, use smaller but faster cache
talktomedeara config --cache-size 100 --cache-duration 7
```

### 2. Voice Preloading

```bash
# Pre-generate common messages for cache
talktomedeara test "Build completed" --save-only
talktomedeara test "Tests passed" --save-only  
talktomedeara test "Deploy done" --save-only
```

### 3. Batch Notifications

```javascript
// Avoid notification spam
let lastNotification = 0;
const NOTIFICATION_COOLDOWN = 5000; // 5 seconds

function throttledNotify(message) {
  const now = Date.now();
  if (now - lastNotification > NOTIFICATION_COOLDOWN) {
    exec(`talktomedeara test "${message}"`);
    lastNotification = now;
  }
}
```

## 🔧 Advanced Integrations

### With Docker

```dockerfile
# Dockerfile for dev container with TTS
FROM node:18

RUN npm install -g talktomedeara
# API key via secret mount
RUN mkdir -p /root/.talktomedeara

# Build script with notifications
COPY build-with-notify.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/build-with-notify.sh
```

### With VS Code Tasks (for comparison)

If you also use VS Code, you can use the same pattern:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build with notification",
      "type": "shell",
      "command": "npm run build && talktomedeara test 'VS Code build completed'",
      "group": "build"
    }
  ]
}
```

### With GitHub Actions

```yaml
# .github/workflows/notify-on-deploy.yml
name: Deploy with Voice Notification

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Install TalkToMeDearAi
      run: npm install -g talktomedeara
      
    - name: Configure TTS
      run: |
        echo "$OPENAI_API_KEY" | talktomedeara setup --api-key-stdin
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    
    - name: Deploy
      run: npm run deploy
      
    - name: Notify Success
      if: success()
      run: talktomedeara test "GitHub Actions deploy completed successfully!"
      
    - name: Notify Failure  
      if: failure()
      run: talktomedeara test "GitHub Actions deploy failed!" --voice onyx
```

## 📱 Mobile Development

### React Native

```javascript
// For React Native with Cursor
import { exec } from 'child_process';

export class DevNotifications {
  static notify(message, voice = 'alloy') {
    if (__DEV__) {
      exec(`talktomedeara test "${message}" --voice ${voice}`);
    }
  }
  
  static onBuildComplete() {
    this.notify('React Native build completed', 'nova');
  }
  
  static onTestsPass() {
    this.notify('All tests passed', 'fable');
  }
  
  static onHotReload() {
    this.notify('Hot reload completed', 'shimmer');
  }
}
```

### Flutter

```dart
// flutter_tts_notify.dart
import 'dart:io';

class TtsNotify {
  static Future<void> notify(String message, {String voice = 'alloy'}) async {
    if (Platform.environment['FLUTTER_ENV'] == 'development') {
      await Process.run('talktomedeara', [
        'test', 
        message, 
        '--voice', 
        voice
      ]);
    }
  }
  
  static Future<void> onHotReload() async {
    await notify('Flutter hot reload completed', voice: 'nova');
  }
  
  static Future<void> onBuildComplete() async {
    await notify('Flutter build completed', voice: 'fable');
  }
}
```

---

**🎉 Perfect!** Now Cursor can communicate vocally with you during development. 

**Pro tip**: Start with simple notifications (build success/fail) and add complexity gradually.

For support: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues) | [Discussions](https://github.com/bramato/talkToMeDearAi/discussions)