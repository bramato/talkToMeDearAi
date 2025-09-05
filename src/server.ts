import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TTSClient } from './tts/client.js';
import { CacheManager } from './tts/cache.js';
import { ConfigManager } from './config/setup.js';
import { TTSRequest, MCPTool, AudioNotificationRequest, AudioNotificationType } from './types/index.js';
import { Logger } from './utils/logger.js';

export class TalkToMeServer {
  private server: Server;
  private ttsClient: TTSClient;
  private cacheManager: CacheManager;
  private configManager: ConfigManager;
  private logger: Logger;

  constructor() {
    this.server = new Server(
      {
        name: 'talktomedeara',
        version: '0.1.0-alpha',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.logger = new Logger();
    this.configManager = new ConfigManager();
    this.cacheManager = new CacheManager();
    this.ttsClient = new TTSClient(this.configManager, this.logger);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          this.getSpeakTextTool(),
          this.getStartNotificationTool(),
          this.getAlertNotificationTool(),
          this.getFinishNotificationTool(),
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'speak_text') {
        return await this.handleSpeakText(args as unknown as TTSRequest);
      }

      if (name === 'start_notification') {
        return await this.handleAudioNotification('start', args as unknown as AudioNotificationRequest);
      }

      if (name === 'alert_notification') {
        return await this.handleAudioNotification('alert', args as unknown as AudioNotificationRequest);
      }

      if (name === 'finish_notification') {
        return await this.handleAudioNotification('finish', args as unknown as AudioNotificationRequest);
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool '${name}' not found`
      );
    });

    process.on('SIGINT', async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  private getSpeakTextTool(): MCPTool {
    return {
      name: 'speak_text',
      description: 'Convert text to speech using OpenAI TTS with intelligent MP3 caching',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'The text to convert to speech',
            minLength: 1,
            maxLength: 4096,
          },
          voice: {
            type: 'string',
            description: 'Voice to use for speech synthesis',
            enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
            default: 'alloy',
          },
          model: {
            type: 'string',
            description: 'OpenAI TTS model to use',
            enum: ['tts-1', 'tts-1-hd'],
            default: 'tts-1',
          },
          saveOnly: {
            type: 'boolean',
            description: 'If true, only save the audio file without playing it',
            default: false,
          },
          outputPath: {
            type: 'string',
            description: 'Custom path to save the audio file',
          },
        },
        required: ['text'],
      },
    };
  }

  private getStartNotificationTool(): MCPTool {
    return {
      name: 'start_notification',
      description: 'Play a predefined energetic audio notification to indicate the start of a process or task. Uses sounds/start.mp3 file.',
      inputSchema: {
        type: 'object',
        properties: {
          saveOnly: {
            type: 'boolean',
            description: 'If true, only save the audio file without playing it',
            default: false,
          },
        },
        required: [],
      },
    };
  }

  private getAlertNotificationTool(): MCPTool {
    return {
      name: 'alert_notification',
      description: 'Play a predefined attention-grabbing audio notification to indicate an alert or important warning. Uses sounds/alert.mp3 file.',
      inputSchema: {
        type: 'object',
        properties: {
          saveOnly: {
            type: 'boolean',
            description: 'If true, only save the audio file without playing it',
            default: false,
          },
        },
        required: [],
      },
    };
  }

  private getFinishNotificationTool(): MCPTool {
    return {
      name: 'finish_notification',
      description: 'Play a predefined satisfying audio notification to indicate successful completion of a process or task. Uses sounds/finish.mp3 file.',
      inputSchema: {
        type: 'object',
        properties: {
          saveOnly: {
            type: 'boolean',
            description: 'If true, only save the audio file without playing it',
            default: false,
          },
        },
        required: [],
      },
    };
  }

  private async handleAudioNotification(type: AudioNotificationType, args: AudioNotificationRequest) {
    try {
      this.logger.info(`Processing ${type} notification`);

      const saveOnly = args.saveOnly || false;
      
      // Use predefined sound files instead of TTS
      const soundFilePath = await this.getNotificationSoundPath(type);
      
      if (!soundFilePath) {
        throw new Error(`Sound file not found for ${type} notification`);
      }

      this.logger.info(`Using predefined sound file`, { 
        type,
        audioPath: soundFilePath 
      });

      if (!saveOnly) {
        await this.playAudio(soundFilePath);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              type,
              audioPath: soundFilePath,
              predefined: true,
              message: `${type} notification played using predefined sound`,
            }),
          },
        ],
      };
    } catch (error) {
      this.logger.error(`Error processing ${type} notification`, { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              type,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            }),
          },
        ],
      };
    }
  }

  private async getNotificationSoundPath(type: AudioNotificationType): Promise<string | null> {
    const { promises: fs } = await import('fs');
    const path = await import('path');
    
    // Check in project sounds directory first
    const projectSoundsDir = path.join(process.cwd(), 'sounds');
    const projectSoundFile = path.join(projectSoundsDir, `${type}.mp3`);
    
    try {
      await fs.access(projectSoundFile);
      return projectSoundFile;
    } catch {
      // If not found in project, check in package installation directory
      const packageDir = path.dirname(require.resolve('../package.json'));
      const packageSoundFile = path.join(packageDir, 'sounds', `${type}.mp3`);
      
      try {
        await fs.access(packageSoundFile);
        return packageSoundFile;
      } catch {
        this.logger.warn(`Sound file not found for ${type} notification`, {
          checkedPaths: [projectSoundFile, packageSoundFile]
        });
        return null;
      }
    }
  }

  private async handleSpeakText(args: TTSRequest) {
    try {
      this.logger.info('Processing TTS request', {
        textLength: args.text.length,
        voice: args.voice || 'alloy',
        model: args.model || 'tts-1',
      });

      // Check cache first
      const cacheKey = this.cacheManager.generateCacheKey(
        args.text,
        args.voice || 'alloy',
        args.model || 'tts-1'
      );

      const cachedPath = await this.cacheManager.get(cacheKey);
      if (cachedPath) {
        this.logger.info('Cache hit for TTS request', { cacheKey });
        
        if (!args.saveOnly) {
          await this.playAudio(cachedPath);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                audioPath: cachedPath,
                cached: true,
                message: `Text converted to speech using cached audio (${args.voice || 'alloy'} voice)`,
              }),
            },
          ],
        };
      }

      // Generate new audio
      const audioBuffer = await this.ttsClient.generateSpeech({
        text: args.text,
        voice: args.voice || 'alloy',
        model: args.model || 'tts-1',
      });

      // Save to cache
      const audioPath = await this.cacheManager.set(
        cacheKey,
        audioBuffer,
        {
          text: args.text,
          voice: args.voice || 'alloy',
          model: args.model || 'tts-1',
        },
        args.outputPath
      );

      this.logger.info('Generated new TTS audio', { 
        audioPath,
        size: audioBuffer.length 
      });

      if (!args.saveOnly) {
        await this.playAudio(audioPath);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              audioPath,
              cached: false,
              message: `Text converted to speech and cached (${args.voice || 'alloy'} voice)`,
            }),
          },
        ],
      };
    } catch (error) {
      this.logger.error('Error processing TTS request', { error });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            }),
          },
        ],
      };
    }
  }

  private async playAudio(audioPath: string): Promise<void> {
    try {
      const { exec } = await import('child_process');

      // Determine audio player based on platform
      let command = '';
      const platform = process.platform;

      if (platform === 'darwin') {
        command = `afplay "${audioPath}"`;
      } else if (platform === 'linux') {
        command = `aplay "${audioPath}" || paplay "${audioPath}" || sox "${audioPath}" -d`;
      } else if (platform === 'win32') {
        command = `powershell -c "(New-Object Media.SoundPlayer '${audioPath}').PlaySync();"`;
      } else {
        this.logger.warn('Unsupported platform for audio playback', { platform });
        return;
      }

      // Start audio playback without waiting for completion
      const childProcess = exec(command, (error) => {
        if (error) {
          this.logger.warn('Failed to play audio', { error, audioPath });
        } else {
          this.logger.info('Audio playback completed', { audioPath });
        }
      });

      // Log immediately that playback has started
      this.logger.info('Audio playback started', { audioPath, pid: childProcess.pid });
      
      // Return immediately without waiting for completion
    } catch (error) {
      this.logger.warn('Failed to start audio playback', { error, audioPath });
      // Don't throw error, just log it - the audio file is still saved
    }
  }

  private async cleanup() {
    this.logger.info('Shutting down TalkToMe MCP server');
    await this.cacheManager.cleanup();
    await this.server.close();
  }

  public async start() {
    const apiKey = await this.configManager.getOpenAIApiKey();
    if (!apiKey) {
      this.logger.error('OpenAI API key not configured. Run "talktomedeara setup" first.');
      process.exit(1);
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    const config = await this.configManager.getConfig();
    this.logger.info('TalkToMe MCP server started successfully', {
      version: '0.1.0-alpha',
      defaultVoice: config.defaultVoice,
      defaultModel: config.defaultModel,
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new TalkToMeServer();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}