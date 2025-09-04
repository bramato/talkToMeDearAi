# 🎯 Cursor Integration Guide  

Questa guida spiega come integrare TalkToMeDearAi con Cursor per ricevere notifiche audio dai tuoi agenti AI durante lo sviluppo.

## 🚀 Installazione per Cursor

### 1. Installa TalkToMeDearAi Globalmente

```bash
# Installazione via npm
npm install -g talktomedeara

# Configurazione interattiva
talktomedeara setup
```

Il setup ti guiderà attraverso:
- **Chiave API OpenAI**: Inserisci la tua chiave (salvata in keychain sicuro)
- **Voce default**: Scegli la voce per le notifiche (alloy consigliata per coding)
- **Modello TTS**: tts-1 per velocità, tts-1-hd per qualità
- **Cache**: Configurazione automatica (500MB, 30 giorni)

### 2. Configura Cursor per MCP

Cursor supporta MCP attraverso configurazione JSON. Crea o modifica:

**File di configurazione:**
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`  
- **Windows**: `%APPDATA%/Cursor/User/globalStorage/cursor.mcp/config.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/cursor.mcp/config.json`

**Contenuto configurazione:**
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

### 3. Riavvia Cursor

Chiudi completamente Cursor e riavvialo per caricare la configurazione MCP.

## 🔧 Utilizzo con Cursor AI

### In Chat con Cursor

Una volta configurato, puoi chiedere a Cursor di usare le notifiche vocali:

```
@talktomedeara Dimmi quando hai finito di refactorare questo codice
```

### Nei Tuoi Script

Se hai script che Cursor esegue, puoi aggiungere notifiche:

```javascript
// In uno script Node.js
const { spawn } = require('child_process');

function notifyComplete(message) {
  const process = spawn('talktomedeara', ['test', message]);
  process.on('close', (code) => {
    console.log(`Notification sent: ${code === 0 ? 'success' : 'failed'}`);
  });
}

// Uso
async function buildProject() {
  console.log('Building project...');
  // ... logica di build
  notifyComplete('Build completata con successo!');
}
```

### Con Extension Custom

Se sviluppi extension per Cursor, puoi integrare direttamente:

```typescript
// Extension per Cursor
import * as vscode from 'vscode';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
  
  // Comando per notifica vocale
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

## 🎨 Esempi Pratici per Development

### 1. Notifiche Build/Test

```bash
# Nel tuo package.json
{
  "scripts": {
    "build": "webpack && talktomedeara test 'Build completata'",
    "test": "jest && talktomedeara test 'Test superati con successo' || talktomedeara test 'Test falliti, controlla i risultati' --voice onyx",
    "deploy": "npm run build && docker deploy && talktomedeara test 'Deploy completato' --voice fable"
  }
}
```

### 2. Git Hooks con Notifiche

```bash
#!/bin/sh
# .git/hooks/post-commit

COMMIT_MSG=$(git log -1 --pretty=%B)
talktomedeara test "Commit effettuato: $COMMIT_MSG" --voice nova
```

### 3. Monitoring di Processi Lunghi

```javascript
// watcher.js
const chokidar = require('chokidar');
const { exec } = require('child_process');

chokidar.watch('./src').on('change', (path) => {
  console.log(`File changed: ${path}`);
  
  // Rebuild automatico
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      exec('talktomedeara test "Errore nel build" --voice onyx');
    } else {
      exec('talktomedeara test "Build automatico completato" --voice shimmer');
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
    
    message = f"Code review per PR {pr_number}: {status}"
    voice = voices.get(status, 'alloy')
    
    subprocess.run([
        'talktomedeara', 'test', message, 
        '--voice', voice
    ])

# Uso con GitHub webhooks
notify_review_complete(123, 'approved')
```

## 🎤 Voci Consigliate per Development

### **Alloy** (Default universale)
- ✅ Notifiche build success
- ✅ Test passing
- ✅ Commit notifications

### **Nova** (Energica - per progressi)
- ✅ Hot reload completato
- ✅ Server started
- ✅ Development updates

### **Echo** (Chiara - per info importanti)
- ✅ Deploy completato
- ✅ Database migrato
- ✅ Release published

### **Onyx** (Autoritaria - per errori)
- ✅ Build failed
- ✅ Test failures
- ✅ Security alerts

### **Fable** (Drammatica - per celebrazioni)
- ✅ Release major
- ✅ Milestone raggiunta
- ✅ Feature completata

### **Shimmer** (Dolce - per promemoria)
- ✅ Break time reminders
- ✅ Meeting notifications
- ✅ Gentle updates

## 🔍 Debug e Troubleshooting

### Verifica Configurazione Cursor

```bash
# Test se Cursor riconosce il server MCP
curl -X POST http://localhost:3000/mcp/servers

# Oppure test diretto
talktomedeara doctor
```

### Log Debugging

```bash
# Abilita debug logging
export LOG_LEVEL=debug

# Avvia Cursor da terminale per vedere log
/Applications/Cursor.app/Contents/MacOS/Cursor
```

### Test Connessione MCP

```javascript
// test-mcp.js
const { McpClient } = require('@modelcontextprotocol/sdk');

async function testConnection() {
  try {
    const client = new McpClient();
    await client.connect('talktomedeara');
    
    const result = await client.callTool('speak_text', {
      text: 'Test connessione MCP riuscito!'
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
# Per development, usa cache più piccola ma veloce
talktomedeara config --cache-size 100 --cache-duration 7
```

### 2. Voice Preloading

```bash
# Pre-genera messaggi comuni per cache
talktomedeara test "Build completata" --save-only
talktomedeara test "Test superati" --save-only  
talktomedeara test "Deploy effettuato" --save-only
```

### 3. Batch Notifications

```javascript
// Evita spam di notifiche
let lastNotification = 0;
const NOTIFICATION_COOLDOWN = 5000; // 5 secondi

function throttledNotify(message) {
  const now = Date.now();
  if (now - lastNotification > NOTIFICATION_COOLDOWN) {
    exec(`talktomedeara test "${message}"`);
    lastNotification = now;
  }
}
```

## 🔧 Integrazioni Avanzate

### Con Docker

```dockerfile
# Dockerfile per dev container con TTS
FROM node:18

RUN npm install -g talktomedeara
# API key tramite secret mount
RUN mkdir -p /root/.talktomedeara

# Script di build con notifiche
COPY build-with-notify.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/build-with-notify.sh
```

### Con VS Code Tasks (per confronto)

Se usi anche VS Code, puoi usare lo stesso pattern:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build with notification",
      "type": "shell",
      "command": "npm run build && talktomedeara test 'Build VS Code completata'",
      "group": "build"
    }
  ]
}
```

### Con GitHub Actions

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
      run: talktomedeara test "Deploy GitHub Actions completato con successo!"
      
    - name: Notify Failure  
      if: failure()
      run: talktomedeara test "Deploy GitHub Actions fallito!" --voice onyx
```

## 📱 Mobile Development

### React Native

```javascript
// Per React Native con Cursor
import { exec } from 'child_process';

export class DevNotifications {
  static notify(message, voice = 'alloy') {
    if (__DEV__) {
      exec(`talktomedeara test "${message}" --voice ${voice}`);
    }
  }
  
  static onBuildComplete() {
    this.notify('React Native build completata', 'nova');
  }
  
  static onTestsPass() {
    this.notify('Tutti i test superati', 'fable');
  }
  
  static onHotReload() {
    this.notify('Hot reload completato', 'shimmer');
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
    await notify('Flutter hot reload completato', voice: 'nova');
  }
  
  static Future<void> onBuildComplete() async {
    await notify('Flutter build completata', voice: 'fable');
  }
}
```

---

**🎉 Perfetto!** Ora Cursor può comunicare vocalmente con te durante lo sviluppo. 

**Pro tip**: Inizia con notifiche semplici (build success/fail) e aggiungi complessità gradualmente.

Per supporto: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues) | [Discussions](https://github.com/bramato/talkToMeDearAi/discussions)