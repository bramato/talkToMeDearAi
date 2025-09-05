#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager } from './config/setup.js';
import { TalkToMeServer } from './server.js';
import { TTSClient } from './tts/client.js';
import { CacheManager } from './tts/cache.js';
import { Logger } from './utils/logger.js';
import * as fs from 'fs-extra';
import * as path from 'path';

const program = new Command();
const logger = new Logger();

// ASCII Art Banner
const ASCII_ART = `
┏┳┓  ┓┓ ┏┳┓  ┳┳┓  ┳┓      ┏┓•
 ┃ ┏┓┃┃┏ ┃ ┏┓┃┃┃┏┓┃┃┏┓┏┓┏┓┣┫┓
 ┻ ┗┻┗┛┗ ┻ ┗┛┛ ┗┗ ┻┛┗ ┗┻┛ ┛┗┗
                             
`;

// Function to display ASCII art banner
function showBanner() {
  console.log(ASCII_ART);
}

// Audio playback function
async function playAudio(audioPath: string): Promise<void> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    console.log(`🔊 Playing audio...`);

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
      console.warn('⚠️ Unsupported platform for audio playback:', platform);
      return;
    }

    await execAsync(command);
    console.log('✅ Audio playback completed');
  } catch (error) {
    console.warn('⚠️ Failed to play audio:', error);
    // Don't throw error, just log it - the audio file is still saved
  }
}

program
  .name('talktomedearai')
  .description('TalkToMeDearAi - MCP server for OpenAI text-to-speech')
  .version('0.1.0-alpha')
  .addHelpText('before', ASCII_ART);

// Setup command
program
  .command('setup')
  .description('Configure OpenAI API key and preferences')
  .action(async () => {
    showBanner();
    try {
      const configManager = new ConfigManager(logger);
      await configManager.runSetup();
    } catch (error) {
      console.error('Setup failed:', error);
      process.exit(1);
    }
  });

// Serve command (MCP server)
program
  .command('serve')
  .description('Start the MCP server')
  .action(async () => {
    try {
      const server = new TalkToMeServer();
      await server.start();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test TTS functionality with a sample text')
  .argument('<text>', 'Text to convert to speech')
  .option('-v, --voice <voice>', 'Voice to use', 'alloy')
  .option('-m, --model <model>', 'Model to use', 'tts-1')
  .option('--save-only', 'Only save audio file, do not play')
  .option('-o, --output <path>', 'Output file path')
  .action(async (text: string, options: any) => {
    showBanner();
    try {
      const configManager = new ConfigManager(logger);
      const config = await configManager.getConfig();
      
      if (!config.openaiApiKey && !(await configManager.getOpenAIApiKey())) {
        console.error('❌ API key not configured. Run "talktomedearai setup" first.');
        process.exit(1);
      }

      const ttsClient = new TTSClient(configManager, logger);
      const cacheManager = new CacheManager();

      console.log(`🎤 Converting text to speech...`);
      console.log(`   Text: "${text}"`);
      console.log(`   Voice: ${options.voice}`);
      console.log(`   Model: ${options.model}`);

      const cacheKey = cacheManager.generateCacheKey(text, options.voice, options.model);
      const cachedPath = await cacheManager.get(cacheKey);

      if (cachedPath && await fs.pathExists(cachedPath)) {
        console.log(`✅ Found cached audio: ${cachedPath}`);
        if (!options.saveOnly) {
          await playAudio(cachedPath);
        }
      } else {
        const audioBuffer = await ttsClient.generateSpeech({
          text,
          voice: options.voice,
          model: options.model,
        });

        const audioPath = await cacheManager.set(
          cacheKey,
          audioBuffer,
          { text, voice: options.voice, model: options.model },
          options.output
        );

        console.log(`✅ Audio generated and cached: ${audioPath}`);
        console.log(`   Size: ${(audioBuffer.length / 1024).toFixed(1)} KB`);
        
        if (!options.saveOnly) {
          await playAudio(audioPath);
        }
      }

      console.log(`🎉 Test completed successfully!`);
    } catch (error) {
      console.error('❌ Test failed:', error);
      process.exit(1);
    }
  });

// Config commands
const configCmd = program
  .command('config')
  .description('Configuration management');

configCmd
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      const configManager = new ConfigManager(logger);
      const summary = await configManager.getConfigSummary();
      
      console.log('📋 Current Configuration:');
      console.log(`   API Key: ${summary.hasApiKey ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`   Default Voice: ${summary.defaultVoice}`);
      console.log(`   Default Model: ${summary.defaultModel}`);
      console.log(`   Cache Max Size: ${summary.cacheMaxSize} MB`);
      console.log(`   Cache Duration: ${summary.cacheDuration} days`);
      console.log(`   Config Path: ${summary.configPath}`);
    } catch (error) {
      console.error('Failed to show configuration:', error);
      process.exit(1);
    }
  });

configCmd
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    try {
      const configManager = new ConfigManager(logger);
      await configManager.resetConfig();
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      process.exit(1);
    }
  });

configCmd
  .command('export')
  .description('Export configuration to JSON')
  .action(async () => {
    try {
      const configManager = new ConfigManager(logger);
      const config = await configManager.exportConfig();
      console.log(config);
    } catch (error) {
      console.error('Failed to export configuration:', error);
      process.exit(1);
    }
  });

// Cache commands
const cacheCmd = program
  .command('cache')
  .description('Cache management');

cacheCmd
  .command('stats')
  .description('Show cache statistics')
  .action(async () => {
    try {
      const cacheManager = new CacheManager();
      const stats = await cacheManager.getStats();
      
      console.log('📊 Cache Statistics:');
      console.log(`   Total Entries: ${stats.totalEntries}`);
      console.log(`   Total Size: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`   Oldest Entry: ${stats.oldestEntry?.toLocaleDateString() || 'N/A'}`);
      console.log(`   Newest Entry: ${stats.newestEntry?.toLocaleDateString() || 'N/A'}`);
      console.log(`   Hit Rate: ${stats.hitRate.toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to show cache stats:', error);
      process.exit(1);
    }
  });

cacheCmd
  .command('clear')
  .description('Clear all cached audio files')
  .option('--force', 'Skip confirmation prompt')
  .action(async (options: any) => {
    try {
      if (!options.force) {
        const inquirer = await import('inquirer');
        const { confirm } = await inquirer.default.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to clear all cached audio files?',
          default: false,
        }]);
        
        if (!confirm) {
          console.log('Cache clear cancelled.');
          return;
        }
      }

      const cacheManager = new CacheManager();
      await cacheManager.clear();
      console.log('✅ Cache cleared successfully.');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      process.exit(1);
    }
  });

cacheCmd
  .command('find')
  .description('Find cached entries')
  .option('-t, --text <text>', 'Search by text content')
  .option('-v, --voice <voice>', 'Filter by voice')
  .action(async (options: any) => {
    try {
      const cacheManager = new CacheManager();
      let entries;

      if (options.text) {
        entries = await cacheManager.findByText(options.text);
      } else if (options.voice) {
        entries = await cacheManager.findByVoice(options.voice);
      } else {
        console.error('Please specify either --text or --voice option');
        process.exit(1);
      }

      if (entries.length === 0) {
        console.log('No matching entries found.');
        return;
      }

      console.log(`📁 Found ${entries.length} matching entries:`);
      entries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${path.basename(entry.filePath)}`);
        console.log(`      Text: "${entry.text.substring(0, 50)}${entry.text.length > 50 ? '...' : ''}"`);
        console.log(`      Voice: ${entry.voice}, Model: ${entry.model}`);
        console.log(`      Size: ${(entry.size / 1024).toFixed(1)} KB`);
        console.log(`      Created: ${entry.createdAt.toLocaleDateString()}`);
        console.log();
      });
    } catch (error) {
      console.error('Failed to search cache:', error);
      process.exit(1);
    }
  });

// Doctor command
program
  .command('doctor')
  .description('Diagnose common issues')
  .action(async () => {
    showBanner();
    console.log('🔍 TalkToMeDearAi System Diagnosis\n');

    try {
      const configManager = new ConfigManager(logger);
      const cacheManager = new CacheManager();

      // Check configuration
      console.log('📋 Configuration Check:');
      const summary = await configManager.getConfigSummary();
      console.log(`   ✅ Config file exists: ${await fs.pathExists(summary.configPath)}`);
      console.log(`   ${summary.hasApiKey ? '✅' : '❌'} OpenAI API key: ${summary.hasApiKey ? 'Configured' : 'Not configured'}`);
      
      if (summary.hasApiKey) {
        console.log('   ⏳ Testing API key...');
        try {
          const ttsClient = new TTSClient(configManager, logger);
          const isValid = await ttsClient.validateApiKey(await configManager.getOpenAIApiKey() || '');
          console.log(`   ${isValid ? '✅' : '❌'} API key validation: ${isValid ? 'Valid' : 'Invalid'}`);
        } catch (error) {
          console.log(`   ❌ API key validation failed: ${error}`);
        }
      }

      // Check cache
      console.log('\n💾 Cache System Check:');
      const cacheStats = await cacheManager.getStats();
      console.log(`   ✅ Cache entries: ${cacheStats.totalEntries}`);
      console.log(`   ✅ Cache size: ${(cacheStats.totalSize / (1024 * 1024)).toFixed(2)} MB`);

      // Check platform audio support
      console.log('\n🔊 Audio System Check:');
      const platform = process.platform;
      console.log(`   Platform: ${platform}`);
      switch (platform) {
        case 'darwin':
          console.log('   ✅ Audio support: afplay (macOS)');
          break;
        case 'linux':
          console.log('   ⚠️  Audio support: aplay/paplay/sox (check installation)');
          break;
        case 'win32':
          console.log('   ✅ Audio support: PowerShell Media.SoundPlayer');
          break;
        default:
          console.log('   ❌ Audio support: Unsupported platform');
      }

      console.log('\n🎉 Diagnosis completed!');
      
      if (!summary.hasApiKey) {
        console.log('\n💡 Recommendation: Run "talktomedearai setup" to configure your API key.');
      }

    } catch (error) {
      console.error('Diagnosis failed:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  showBanner();
  program.outputHelp();
}