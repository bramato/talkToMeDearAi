import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { Config, SetupQuestions, OpenAIVoice, OpenAIModel } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class ConfigManager {
  private configDir: string;
  private configFile: string;
  private config: Config | null = null;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
    this.configDir = path.join(os.homedir(), '.talktomedeara');
    this.configFile = path.join(this.configDir, 'config.json');
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      await fs.ensureDir(this.configDir);
      await this.loadConfig();
    } catch (error) {
      this.logger.error('Failed to initialize config', { error });
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.configFile)) {
        this.config = await fs.readJSON(this.configFile);
        this.logger.debug('Configuration loaded', { configFile: this.configFile });
      } else {
        this.config = this.getDefaultConfig();
        await this.saveConfig();
        this.logger.info('Default configuration created', { configFile: this.configFile });
      }
    } catch (error) {
      this.logger.warn('Failed to load configuration, using defaults', { error });
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): Config {
    return {
      cacheMaxSize: 500, // MB
      cacheDuration: 30, // days
      defaultVoice: 'alloy',
      defaultModel: 'tts-1',
      logLevel: 'info',
    };
  }

  private async saveConfig(): Promise<void> {
    try {
      await fs.writeJSON(this.configFile, this.config, { spaces: 2 });
      this.logger.debug('Configuration saved', { configFile: this.configFile });
    } catch (error) {
      this.logger.error('Failed to save configuration', { error });
      throw error;
    }
  }

  async getConfig(): Promise<Config> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config!;
  }

  async updateConfig(updates: Partial<Config>): Promise<void> {
    const currentConfig = await this.getConfig();
    this.config = { ...currentConfig, ...updates };
    await this.saveConfig();
    this.logger.info('Configuration updated', { updates });
  }

  async setOpenAIApiKey(apiKey: string): Promise<void> {
    try {
      // Try to use keychain/credential store if available
      if (await this.hasKeychainSupport()) {
        await this.setSecureCredential('openai-api-key', apiKey);
        this.logger.info('API key stored securely in keychain');
      } else {
        // Fallback to config file (with warning)
        await this.updateConfig({ openaiApiKey: apiKey });
        this.logger.warn('API key stored in config file (consider using keychain for better security)');
      }
    } catch (error) {
      this.logger.error('Failed to store API key', { error });
      throw error;
    }
  }

  async getOpenAIApiKey(): Promise<string | undefined> {
    try {
      // Try keychain first
      if (await this.hasKeychainSupport()) {
        const key = await this.getSecureCredential('openai-api-key');
        if (key) return key;
      }

      // Fallback to config file
      const config = await this.getConfig();
      return config.openaiApiKey;
    } catch (error) {
      this.logger.error('Failed to retrieve API key', { error });
      return undefined;
    }
  }

  private async hasKeychainSupport(): Promise<boolean> {
    try {
      // Try to import keytar (optional dependency)
      const keytar = await import('keytar');
      return !!keytar;
    } catch {
      return false;
    }
  }

  private async setSecureCredential(key: string, value: string): Promise<void> {
    try {
      const keytar = await import('keytar');
      await keytar.setPassword('talktomedeara', key, value);
    } catch (error) {
      throw new Error(`Failed to store credential securely: ${error}`);
    }
  }

  private async getSecureCredential(key: string): Promise<string | null> {
    try {
      const keytar = await import('keytar');
      return await keytar.getPassword('talktomedeara', key);
    } catch (error) {
      this.logger.debug('Failed to retrieve secure credential', { error });
      return null;
    }
  }

  async deleteSecureCredential(key: string): Promise<boolean> {
    try {
      const keytar = await import('keytar');
      return await keytar.deletePassword('talktomedeara', key);
    } catch (error) {
      this.logger.debug('Failed to delete secure credential', { error });
      return false;
    }
  }

  async runSetup(): Promise<void> {
    try {
      const inquirer = await import('inquirer');
      
      console.log('\n🎤 TalkToMeDearAi Setup\n');
      console.log('This will configure your OpenAI TTS settings for the MCP server.\n');

      const questions: any[] = [
        {
          type: 'input',
          name: 'openaiApiKey',
          message: 'Enter your OpenAI API key:',
          validate: (input: string) => {
            if (!input.trim()) return 'API key is required';
            if (!input.startsWith('sk-')) return 'API key should start with "sk-"';
            if (input.length < 20) return 'API key seems too short';
            return true;
          },
        },
        {
          type: 'list',
          name: 'defaultVoice',
          message: 'Choose default voice:',
          choices: [
            { name: 'Alloy (Neutral, balanced)', value: 'alloy' },
            { name: 'Echo (Male, clear)', value: 'echo' },
            { name: 'Fable (Expressive, dramatic)', value: 'fable' },
            { name: 'Onyx (Deep, authoritative)', value: 'onyx' },
            { name: 'Nova (Young, energetic)', value: 'nova' },
            { name: 'Shimmer (Sweet, melodious)', value: 'shimmer' },
          ],
          default: 'alloy',
        },
        {
          type: 'list',
          name: 'defaultModel',
          message: 'Choose default TTS model:',
          choices: [
            { name: 'tts-1 (Fast, standard quality)', value: 'tts-1' },
            { name: 'tts-1-hd (Slower, high quality)', value: 'tts-1-hd' },
          ],
          default: 'tts-1',
        },
        {
          type: 'number',
          name: 'cacheMaxSize',
          message: 'Maximum cache size (MB):',
          default: 500,
          validate: (input: number) => {
            if (input < 10) return 'Cache size should be at least 10MB';
            if (input > 10000) return 'Cache size should not exceed 10GB';
            return true;
          },
        },
        {
          type: 'number',
          name: 'cacheDuration',
          message: 'Cache duration (days):',
          default: 30,
          validate: (input: number) => {
            if (input < 1) return 'Cache duration should be at least 1 day';
            if (input > 365) return 'Cache duration should not exceed 365 days';
            return true;
          },
        },
      ];

      const answers: SetupQuestions = await inquirer.default.prompt(questions);

      // Validate API key
      console.log('\n⏳ Validating API key...');
      const { TTSClient } = await import('../tts/client.js');
      const ttsClient = new TTSClient(this, this.logger);
      const isValid = await ttsClient.validateApiKey(answers.openaiApiKey);

      if (!isValid) {
        console.error('❌ Invalid API key. Please check your OpenAI API key and try again.');
        process.exit(1);
      }

      console.log('✅ API key validated successfully!');

      // Save configuration
      await this.setOpenAIApiKey(answers.openaiApiKey);
      await this.updateConfig({
        defaultVoice: answers.defaultVoice,
        defaultModel: answers.defaultModel,
        cacheMaxSize: answers.cacheMaxSize,
        cacheDuration: answers.cacheDuration,
      });

      console.log('\n🎉 Setup completed successfully!');
      console.log('\nYou can now use TalkToMeDearAi as an MCP server.');
      console.log('\nTo test the setup, run:');
      console.log('  talktomedeara test "Hello, this is a test message"');
      console.log('\nTo reconfigure at any time, run:');
      console.log('  talktomedeara setup');

    } catch (error) {
      this.logger.error('Setup failed', { error });
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    }
  }

  async resetConfig(): Promise<void> {
    try {
      // Remove API key from keychain
      await this.deleteSecureCredential('openai-api-key');
      
      // Reset config to defaults
      this.config = this.getDefaultConfig();
      await this.saveConfig();
      
      this.logger.info('Configuration reset to defaults');
      console.log('✅ Configuration reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset configuration', { error });
      throw error;
    }
  }

  async getConfigSummary(): Promise<{
    hasApiKey: boolean;
    defaultVoice: OpenAIVoice;
    defaultModel: OpenAIModel;
    cacheMaxSize: number;
    cacheDuration: number;
    configPath: string;
  }> {
    const config = await this.getConfig();
    const apiKey = await this.getOpenAIApiKey();
    
    return {
      hasApiKey: !!apiKey,
      defaultVoice: config.defaultVoice,
      defaultModel: config.defaultModel,
      cacheMaxSize: config.cacheMaxSize,
      cacheDuration: config.cacheDuration,
      configPath: this.configFile,
    };
  }

  async exportConfig(): Promise<string> {
    const summary = await this.getConfigSummary();
    return JSON.stringify({
      ...summary,
      hasApiKey: summary.hasApiKey, // Don't export actual key
    }, null, 2);
  }
}