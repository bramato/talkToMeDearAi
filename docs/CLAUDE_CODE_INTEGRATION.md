# 🔧 Claude Code Integration Guide

Questa guida spiega come integrare TalkToMeDearAi con Claude Code per ricevere notifiche audio dai tuoi agenti AI.

## 🚀 Installazione Rapida

### 1. Installa TalkToMeDearAi

```bash
# Installazione globale
npm install -g talktomedeara

# Configurazione iniziale
talktomedeara setup
```

Durante il setup ti verrà chiesto:
- **Chiave API OpenAI**: La tua chiave API (memorizzata in modo sicuro)
- **Voce predefinita**: Scegli tra alloy, echo, fable, onyx, nova, shimmer
- **Modello TTS**: tts-1 (veloce) o tts-1-hd (alta qualità)
- **Dimensioni cache**: Spazio disco per file MP3 (consigliato: 500MB)
- **Durata cache**: Giorni di conservazione file (consigliato: 30 giorni)

### 2. Configura Claude Code

Aggiungi TalkToMeDearAi alla tua configurazione MCP di Claude Code.

**Percorso configurazione:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Configurazione:**
```json
{
  "mcpServers": {
    "talktomedeara": {
      "command": "talktomedeara",
      "args": ["serve"],
      "env": {}
    }
  }
}
```

### 3. Riavvia Claude Code

Chiudi completamente Claude Code e riaprilo per caricare la nuova configurazione MCP.

## 🎤 Utilizzo negli Agenti

### Tool Disponibile: `speak_text`

Una volta configurato, i tuoi agenti avranno accesso al tool `speak_text`:

```javascript
// Esempio base
await mcp.callTool("speak_text", {
  text: "Processo completato con successo!"
});

// Esempio completo con opzioni
await mcp.callTool("speak_text", {
  text: "Analisi dei dati completata. Trovati 42 errori critici.",
  voice: "nova",           // Voce energica per allarmi
  model: "tts-1-hd",      // Alta qualità
  saveOnly: false,         // Riproduci immediatamente
  outputPath: "./alerts/critical.mp3" // Salva anche qui
});
```

### Parametri del Tool

| Parametro | Tipo | Obbligatorio | Default | Descrizione |
|-----------|------|--------------|---------|-------------|
| `text` | string | ✅ | - | Testo da convertire in audio (max 4096 caratteri) |
| `voice` | string | ❌ | "alloy" | Voce: alloy, echo, fable, onyx, nova, shimmer |
| `model` | string | ❌ | "tts-1" | Modello: tts-1 (veloce), tts-1-hd (qualità) |
| `saveOnly` | boolean | ❌ | false | Se true, salva senza riprodurre |
| `outputPath` | string | ❌ | auto | Percorso personalizzato per salvare |

## 🎯 Esempi Pratici per Agenti

### 1. Notifiche di Completamento

```javascript
// Al termine di un'analisi lunga
await mcp.callTool("speak_text", {
  text: `Analisi completata in ${duration} secondi. Trovati ${results.length} risultati.`,
  voice: "alloy"
});
```

### 2. Allarmi Critici

```javascript
// Per errori critici
await mcp.callTool("speak_text", {
  text: "Attenzione! Rilevato errore critico nel sistema. Intervento richiesto.",
  voice: "onyx",      // Voce autoritaria
  model: "tts-1-hd"   // Alta qualità per importanza
});
```

### 3. Promemoria Periodici

```javascript
// Per promemoria o timer
await mcp.callTool("speak_text", {
  text: "Reminder: Meeting tra 5 minuti nella sala conferenze.",
  voice: "shimmer"    // Voce dolce per promemoria
});
```

### 4. Aggiornamenti di Progresso

```javascript
// Durante processi lunghi
await mcp.callTool("speak_text", {
  text: `Progresso: ${Math.round(progress * 100)}% completato. Stima rimanente: ${eta} minuti.`,
  voice: "nova"       // Voce energica per aggiornamenti
});
```

## 🎨 Selezione delle Voci per Contesto

### **Alloy** (Neutrale e bilanciata)
- ✅ Notifiche generali
- ✅ Aggiornamenti di stato
- ✅ Conferme di operazioni

### **Echo** (Maschile e chiara)
- ✅ Annunci importanti
- ✅ Istruzioni operative
- ✅ Report finali

### **Fable** (Espressiva e drammatica)
- ✅ Celebrazioni di successo
- ✅ Annunci significativi
- ✅ Storytelling sui risultati

### **Onyx** (Profonda e autoritaria)
- ✅ Allarmi critici
- ✅ Errori gravi
- ✅ Avvisi di sicurezza

### **Nova** (Giovane e energica)
- ✅ Aggiornamenti di progresso
- ✅ Notifiche positive
- ✅ Incoraggiamenti

### **Shimmer** (Dolce e melodiosa)
- ✅ Promemoria gentili
- ✅ Conferme delicate
- ✅ Messaggi di benvenuto

## ⚙️ Configurazione Avanzata

### Variabili d'Ambiente

Puoi personalizzare il comportamento tramite variabili d'ambiente:

```bash
# Livello di log
export LOG_LEVEL=debug

# Percorso cache personalizzato
export TALKTOMEDEARA_CACHE_DIR=/path/to/cache

# Disabilita audio (solo salvataggio)
export TALKTOMEDEARA_AUDIO_DISABLED=true
```

### Configurazione per Team

Per team che condividono la stessa configurazione:

```json
{
  "mcpServers": {
    "talktomedeara": {
      "command": "talktomedeara",
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

### Problemi Comuni

#### 1. "Tool 'speak_text' non trovato"
```bash
# Verifica configurazione
talktomedeara config show

# Test del server MCP
talktomedeara doctor

# Riavvia Claude Code completamente
```

#### 2. "API Key non configurata"
```bash
# Riconfigura
talktomedeara setup

# Oppure configura manualmente
talktomedeara config show
```

#### 3. "Audio non riprodotto"
```bash
# Su macOS - dovrebbe funzionare automaticamente con afplay
# Su Linux - installa player audio
sudo apt install sox alsa-utils pulseaudio

# Su Windows - usa PowerShell (preinstallato)
# Testa con
talktomedeara test "Audio di prova"
```

#### 4. "Cache piena"
```bash
# Pulisci cache
talktomedeara cache clear

# Aumenta dimensioni cache
talktomedeara config show
# Modifica cacheMaxSize nel file config
```

### Debug Avanzato

Abilita logging dettagliato:

```bash
# Esporta log dettagliati
export LOG_LEVEL=debug

# Poi avvia Claude Code da terminale per vedere i log
/Applications/Claude.app/Contents/MacOS/Claude
```

### Test di Connettività

```bash
# Test completo del sistema
talktomedeara doctor

# Test specifico TTS
talktomedeara test "Questo è un test di connettività"

# Statistiche cache
talktomedeara cache stats
```

## 📊 Monitoraggio e Analytics

### Statistiche Utilizzo

```bash
# Statistiche cache
talktomedeara cache stats

# Trova audio per contenuto
talktomedeara cache find --text "errore"

# Trova audio per voce
talktomedeara cache find --voice nova
```

### Gestione Cache

```bash
# Pulisci file più vecchi di 7 giorni
talktomedeara cache clean --older-than 7d

# Configura dimensioni
talktomedeara config --cache-size 1000

# Configura durata
talktomedeara config --cache-duration 60
```

## 🚀 Best Practices per Agenti

1. **Usa cache intelligentemente**: Testi simili verranno riutilizzati automaticamente
2. **Scegli voci appropriate**: Abbina la voce al tipo di messaggio
3. **Limita la lunghezza**: Max 4096 caratteri per messaggio
4. **Gestisci gli errori**: Sempre controllare il risultato del tool
5. **Non abusare**: Evita notifiche troppo frequenti per non disturbare

## 💡 Esempi di Integrazione Avanzata

### Pattern Observer per Agenti

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
      text: `Errore ${severity}: ${error.message}`,
      voice: voice,
      model: "tts-1-hd"
    });
  }

  async notifyProgress(percentage, eta) {
    if (percentage % 25 === 0) { // Solo ogni 25%
      await mcp.callTool("speak_text", {
        text: `Progresso: ${percentage}% - ETA: ${eta}`,
        voice: "nova"
      });
    }
  }
}
```

---

**🎉 Congratulazioni!** Hai configurato con successo TalkToMeDearAi con Claude Code. I tuoi agenti ora possono comunicare vocalmente con te!

Per supporto tecnico: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues)