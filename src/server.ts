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
import { TTSRequest, MCPTool } from './types/index.js';
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
        tools: [this.getSpeakTextTool()],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'speak_text') {
        return await this.handleSpeakText(args as unknown as TTSRequest);
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
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

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

      await execAsync(command);
      this.logger.info('Audio playback completed', { audioPath });
    } catch (error) {
      this.logger.warn('Failed to play audio', { error, audioPath });
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