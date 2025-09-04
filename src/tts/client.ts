import OpenAI from 'openai';
import { ConfigManager } from '../config/setup.js';
import { Logger } from '../utils/logger.js';
import { OpenAIVoice, OpenAIModel } from '../types/index.js';

export interface GenerateSpeechRequest {
  text: string;
  voice: OpenAIVoice;
  model: OpenAIModel;
}

export class TTSClient {
  private openai: OpenAI | null = null;
  private configManager: ConfigManager;
  private logger: Logger;

  constructor(configManager: ConfigManager, logger: Logger) {
    this.configManager = configManager;
    this.logger = logger;
  }

  private async initializeClient(): Promise<void> {
    if (this.openai) return;

    const apiKey = await this.configManager.getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Run "talktomedeara setup" first.');
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.info('OpenAI TTS client initialized');
  }

  async generateSpeech(request: GenerateSpeechRequest): Promise<Buffer> {
    await this.initializeClient();

    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      this.logger.info('Generating speech with OpenAI TTS', {
        model: request.model,
        voice: request.voice,
        textLength: request.text.length,
      });

      const response = await this.openai.audio.speech.create({
        model: request.model,
        voice: request.voice,
        input: request.text,
        response_format: 'mp3',
        speed: 1.0,
      });

      if (!response.body) {
        throw new Error('Empty response from OpenAI TTS API');
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      this.logger.info('Speech generation completed', {
        model: request.model,
        voice: request.voice,
        audioSize: buffer.length,
        textLength: request.text.length,
      });

      return buffer;
    } catch (error) {
      this.logger.error('Failed to generate speech', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model: request.model,
        voice: request.voice,
        textLength: request.text.length,
      });

      if (error instanceof Error) {
        // Handle specific OpenAI errors
        if (error.message.includes('rate_limit_exceeded')) {
          throw new Error('OpenAI API rate limit exceeded. Please wait and try again.');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing.');
        }
        if (error.message.includes('invalid_api_key')) {
          throw new Error('Invalid OpenAI API key. Please run "talktomedeara setup" to reconfigure.');
        }
        if (error.message.includes('model_not_found')) {
          throw new Error(`TTS model "${request.model}" not available. Try "tts-1" or "tts-1-hd".`);
        }
      }

      throw new Error(`TTS generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const tempClient = new OpenAI({ apiKey });
      
      // Test with a minimal request
      const response = await tempClient.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: 'test',
        response_format: 'mp3',
      });

      return response.body !== null;
    } catch (error) {
      this.logger.warn('API key validation failed', { error });
      return false;
    }
  }

  async getAvailableVoices(): Promise<OpenAIVoice[]> {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  async getAvailableModels(): Promise<OpenAIModel[]> {
    return ['tts-1', 'tts-1-hd'];
  }

  async estimateAudioDuration(text: string): Promise<number> {
    // Rough estimation: ~150 words per minute, ~5 characters per word
    const estimatedWords = text.length / 5;
    const estimatedMinutes = estimatedWords / 150;
    const estimatedSeconds = estimatedMinutes * 60;
    
    return Math.max(1, Math.round(estimatedSeconds));
  }

  async getUsageStats(): Promise<{
    totalRequests: number;
    totalCharacters: number;
    estimatedCost: number;
  }> {
    // This would typically come from a usage tracking system
    // For now, return placeholder values
    return {
      totalRequests: 0,
      totalCharacters: 0,
      estimatedCost: 0.0,
    };
  }
}