import { TTSClient } from '../tts/client.js';
import { CacheManager } from '../tts/cache.js';
import { ConfigManager } from '../config/setup.js';
import { Logger } from '../utils/logger.js';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('TTSClient', () => {
  let ttsClient: TTSClient;
  let configManager: ConfigManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    configManager = new ConfigManager(logger);
    ttsClient = new TTSClient(configManager, logger);
  });

  test('should get available voices', async () => {
    const voices = await ttsClient.getAvailableVoices();
    expect(voices).toEqual(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
  });

  test('should get available models', async () => {
    const models = await ttsClient.getAvailableModels();
    expect(models).toEqual(['tts-1', 'tts-1-hd']);
  });

  test('should estimate audio duration', async () => {
    const text = 'Hello world';
    const duration = await ttsClient.estimateAudioDuration(text);
    expect(duration).toBeGreaterThan(0);
    expect(typeof duration).toBe('number');
  });
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let tempDir: string;
  let logger: Logger;

  beforeEach(async () => {
    logger = new Logger();
    tempDir = path.join(__dirname, 'temp-cache');
    await fs.ensureDir(tempDir);
    cacheManager = new CacheManager(tempDir, logger);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  test('should generate consistent cache keys', () => {
    const key1 = cacheManager.generateCacheKey('hello', 'alloy', 'tts-1');
    const key2 = cacheManager.generateCacheKey('hello', 'alloy', 'tts-1');
    const key3 = cacheManager.generateCacheKey('hello', 'nova', 'tts-1');
    
    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
  });

  test('should cache and retrieve audio data', async () => {
    const cacheKey = cacheManager.generateCacheKey('test', 'alloy', 'tts-1');
    const audioBuffer = Buffer.from('fake audio data');
    const metadata = { text: 'test', voice: 'alloy' as const, model: 'tts-1' as const };

    const filePath = await cacheManager.set(cacheKey, audioBuffer, metadata);
    expect(await fs.pathExists(filePath)).toBe(true);

    const retrievedPath = await cacheManager.get(cacheKey);
    expect(retrievedPath).toBe(filePath);
  });

  test('should return null for non-existent cache key', async () => {
    const result = await cacheManager.get('nonexistent-key');
    expect(result).toBeNull();
  });

  test('should provide cache statistics', async () => {
    const stats = await cacheManager.getStats();
    expect(stats).toHaveProperty('totalEntries');
    expect(stats).toHaveProperty('totalSize');
    expect(stats).toHaveProperty('oldestEntry');
    expect(stats).toHaveProperty('newestEntry');
    expect(stats).toHaveProperty('hitRate');
  });

  test('should find entries by text', async () => {
    const cacheKey = cacheManager.generateCacheKey('hello world', 'alloy', 'tts-1');
    const audioBuffer = Buffer.from('fake audio data');
    const metadata = { text: 'hello world', voice: 'alloy' as const, model: 'tts-1' as const };

    await cacheManager.set(cacheKey, audioBuffer, metadata);
    
    const entries = await cacheManager.findByText('hello');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].text).toBe('hello world');
  });

  test('should find entries by voice', async () => {
    const cacheKey = cacheManager.generateCacheKey('test', 'nova', 'tts-1');
    const audioBuffer = Buffer.from('fake audio data');
    const metadata = { text: 'test', voice: 'nova' as const, model: 'tts-1' as const };

    await cacheManager.set(cacheKey, audioBuffer, metadata);
    
    const entries = await cacheManager.findByVoice('nova');
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].voice).toBe('nova');
  });

  test('should clear all cache entries', async () => {
    const cacheKey = cacheManager.generateCacheKey('test', 'alloy', 'tts-1');
    const audioBuffer = Buffer.from('fake audio data');
    const metadata = { text: 'test', voice: 'alloy' as const, model: 'tts-1' as const };

    await cacheManager.set(cacheKey, audioBuffer, metadata);
    
    let stats = await cacheManager.getStats();
    expect(stats.totalEntries).toBeGreaterThan(0);

    await cacheManager.clear();
    
    stats = await cacheManager.getStats();
    expect(stats.totalEntries).toBe(0);
  });
});

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    configManager = new ConfigManager(logger);
  });

  test('should have default configuration', async () => {
    const config = await configManager.getConfig();
    expect(config.defaultVoice).toBe('alloy');
    expect(config.defaultModel).toBe('tts-1');
    expect(config.cacheMaxSize).toBeGreaterThan(0);
    expect(config.cacheDuration).toBeGreaterThan(0);
    expect(config.logLevel).toBe('info');
  });

  test('should update configuration', async () => {
    await configManager.updateConfig({ defaultVoice: 'nova' });
    const config = await configManager.getConfig();
    expect(config.defaultVoice).toBe('nova');
  });

  test('should provide config summary', async () => {
    const summary = await configManager.getConfigSummary();
    expect(summary).toHaveProperty('hasApiKey');
    expect(summary).toHaveProperty('defaultVoice');
    expect(summary).toHaveProperty('defaultModel');
    expect(summary).toHaveProperty('cacheMaxSize');
    expect(summary).toHaveProperty('cacheDuration');
    expect(summary).toHaveProperty('configPath');
  });

  test('should export configuration', async () => {
    const exported = await configManager.exportConfig();
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('defaultVoice');
    expect(parsed).toHaveProperty('defaultModel');
    expect(parsed).toHaveProperty('hasApiKey');
  });
});