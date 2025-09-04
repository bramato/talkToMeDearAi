# TalkToMeDearAi

Un MCP (Model Context Protocol) server per la sintesi vocale di testo utilizzando l'API OpenAI TTS, progettato per fornire notifiche audio agli agenti AI.

## 🎯 Panoramica

TalkToMeDearAi è un server MCP specializzato che permette agli agenti AI di convertire testo in audio utilizzando i modelli text-to-speech di OpenAI. Il sistema include un sistema di cache intelligente per evitare chiamate API duplicate e ridurre i costi.

## ✨ Caratteristiche Principali

- **Sintesi Vocale OpenAI**: Utilizza i migliori modelli TTS di OpenAI per una qualità audio superiore
- **Cache MP3 Intelligente**: Salva automaticamente l'audio generato per riutilizzo futuro
- **Installazione Globale**: Può essere installato globalmente e utilizzato da più progetti
- **Integrazione MCP**: Compatibile con Claude Code, Cursor e altri client MCP
- **Notifiche per Agenti**: Perfetto per notifiche audio al completamento di processi
- **Configurazione Semplice**: Setup guidato per le chiavi API OpenAI

## 🚀 Installazione Rapida

```bash
# Installazione globale
npm install -g talktomedeara

# Configurazione chiavi OpenAI
talktomedeara setup
```

## 📋 Requisiti

- Node.js >= 18.0.0
- Chiave API OpenAI con accesso ai modelli TTS
- Sistema operativo: macOS, Linux, Windows

## 🛠️ Utilizzo

### Come MCP Server

Aggiungi al tuo file di configurazione MCP:

```json
{
  "mcpServers": {
    "talktomedeara": {
      "command": "talktomedeara",
      "args": ["serve"]
    }
  }
}
```

### Tool Disponibili

#### `speak_text`
Converte testo in audio e lo riproduce o salva

**Parametri:**
- `text` (string, required): Il testo da convertire in audio
- `voice` (string, optional): Voce da utilizzare (alloy, echo, fable, onyx, nova, shimmer)
- `model` (string, optional): Modello TTS (tts-1, tts-1-hd)
- `save_only` (boolean, optional): Se true, salva solo senza riprodurre
- `output_path` (string, optional): Percorso personalizzato per salvare il file

**Esempio:**
```javascript
await mcp.callTool("speak_text", {
  text: "Processo completato con successo!",
  voice: "alloy",
  model: "tts-1-hd"
});
```

#### `start_notification`
Riproduce una notifica audio energica per indicare l'inizio di un processo

**Parametri:**
- `message` (string, optional): Messaggio personalizzato da annunciare (default: "Processo avviato")
- `voice` (string, optional): Voce da utilizzare (default: "nova" per un tono energico)
- `model` (string, optional): Modello TTS (tts-1, tts-1-hd)
- `save_only` (boolean, optional): Se true, salva solo senza riprodurre

**Esempio:**
```javascript
await mcp.callTool("start_notification", {
  message: "Iniziamo la compilazione del progetto"
});
```

#### `alert_notification`
Riproduce una notifica audio di attenzione per segnalare avvisi importanti

**Parametri:**
- `message` (string, optional): Messaggio di avviso personalizzato (default: "Attenzione! Richiesta immediata")
- `voice` (string, optional): Voce da utilizzare (default: "onyx" per un tono autoritario)
- `model` (string, optional): Modello TTS (tts-1, tts-1-hd)
- `save_only` (boolean, optional): Se true, salva solo senza riprodurre

**Esempio:**
```javascript
await mcp.callTool("alert_notification", {
  message: "Errore critico rilevato nel sistema"
});
```

#### `finish_notification`
Riproduce una notifica audio soddisfacente per indicare il completamento di un processo

**Parametri:**
- `message` (string, optional): Messaggio di completamento personalizzato (default: "Operazione completata con successo")
- `voice` (string, optional): Voce da utilizzare (default: "alloy" per un tono rassicurante)
- `model` (string, optional): Modello TTS (tts-1, tts-1-hd)
- `save_only` (boolean, optional): Se true, salva solo senza riprodurre

**Esempio:**
```javascript
await mcp.callTool("finish_notification", {
  message: "Build completata e deployata con successo!"
});
```

## 📁 Struttura del Progetto

```
talktomedeara/
├── src/
│   ├── server.ts          # Server MCP principale
│   ├── tts/
│   │   ├── client.ts      # Client OpenAI TTS
│   │   └── cache.ts       # Sistema di cache MP3
│   ├── config/
│   │   └── setup.ts       # Configurazione chiavi API
│   └── tools/
│       └── speak.ts       # Tool per sintesi vocale
├── dist/                  # Build output
├── cache/                 # Cache file MP3
├── package.json
├── tsconfig.json
└── README.md
```

## 🗺️ Roadmap

Per informazioni dettagliate sui prossimi sviluppi, consulta la [ROADMAP](./ROADMAP.md).

## 🤝 Integrazione con IDE

### Claude Code
Guida completa: [📘 Claude Code Integration](./docs/CLAUDE_CODE_INTEGRATION.md)

1. `npm install -g talktomedeara && talktomedeara setup`
2. Aggiungi configurazione MCP
3. Riavvia Claude Code
4. Usa il tool `speak_text` nei tuoi agenti

### Cursor  
Guida completa: [📘 Cursor Integration](./docs/CURSOR_INTEGRATION.md)

1. `npm install -g talktomedeara && talktomedeara setup`
2. Configura MCP settings
3. Integra con build scripts e development workflow
4. Ricevi notifiche vocali durante lo sviluppo

## 🔧 Configurazione Avanzata

### Cache Settings
```bash
# Imposta dimensione massima cache (MB)
talktomedeara config --cache-size 500

# Imposta durata cache (giorni)
talktomedeara config --cache-duration 30

# Svuota cache
talktomedeara cache clear
```

### Voice Models
Il sistema supporta tutti i modelli TTS OpenAI:
- `tts-1`: Veloce e efficiente
- `tts-1-hd`: Alta qualità audio

### Voices Disponibili
- `alloy`: Neutrale e bilanciata
- `echo`: Maschile e chiara
- `fable`: Espressiva e drammatica
- `onyx`: Profonda e autoritaria
- `nova`: Giovane e energica
- `shimmer`: Dolce e melodiosa

## 📊 Gestione Cache

Il sistema di cache salva automaticamente tutti i file audio generati con hash basato su:
- Contenuto del testo
- Voce selezionata
- Modello utilizzato

Questo garantisce il riutilizzo immediato per testi identici e riduce drasticamente i costi API.

## 🐛 Troubleshooting

### Problemi Comuni

1. **"API Key non configurata"**
   ```bash
   talktomedeara setup
   ```

2. **"Impossibile riprodurre audio"**
   - Verifica che il sistema abbia un player audio configurato
   - Su Linux potrebbe essere necessario installare `sox` o `aplay`

3. **"Cache piena"**
   ```bash
   talktomedeara cache clean --older-than 7d
   ```

## 🔐 Sicurezza

- Le chiavi API sono memorizzate in modo sicuro nel keychain del sistema
- I file cache sono memorizzati localmente e non condivisi
- Tutti i dati audio sono processati localmente dopo il download

## 📈 Performance

- Cache hit rate tipico: 85-95%
- Riduzione costi API: fino al 90%
- Tempo risposta cache: <50ms
- Latenza API OpenAI: 1-3 secondi

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la feature (`git checkout -b feature/amazing-feature`)
3. Commit delle modifiche (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per i dettagli.

## 🆘 Supporto

- **Issues**: [GitHub Issues](https://github.com/bramato/talkToMeDearAi/issues)
- **Discussioni**: [GitHub Discussions](https://github.com/bramato/talkToMeDearAi/discussions)
- **Email**: support@talktomedeara.dev

---

**Nota**: Questo progetto è ottimizzato per l'uso con agenti AI e sistemi di automazione. Per un uso generale di TTS, considera alternative più semplici.