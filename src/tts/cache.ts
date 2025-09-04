import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { CacheEntry, OpenAIVoice, OpenAIModel } from '../types/index.js';
import { Logger } from '../utils/logger.js';

export class CacheManager {
  private cacheDir: string;
  private metadataFile: string;
  private metadata: Map<string, CacheEntry> = new Map();
  private logger: Logger;
  private maxCacheSize: number = 500 * 1024 * 1024; // 500MB default
  private maxCacheAge: number = 30 * 24 * 60 * 60 * 1000; // 30 days default

  constructor(cacheDir?: string, logger?: Logger) {
    this.cacheDir = cacheDir || path.join(process.cwd(), 'cache');
    this.metadataFile = path.join(this.cacheDir, 'metadata.json');
    this.logger = logger || new Logger();
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.ensureDir(this.cacheDir);
      await this.loadMetadata();
      await this.cleanupExpired();
      this.logger.info('Cache manager initialized', {
        cacheDir: this.cacheDir,
        entries: this.metadata.size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize cache', { error });
    }
  }

  private async loadMetadata(): Promise<void> {
    try {
      if (await fs.pathExists(this.metadataFile)) {
        const data = await fs.readJSON(this.metadataFile);
        this.metadata = new Map(
          Object.entries(data).map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              createdAt: new Date(value.createdAt),
              lastAccessed: new Date(value.lastAccessed),
            },
          ])
        );
        this.logger.debug('Cache metadata loaded', { entries: this.metadata.size });
      }
    } catch (error) {
      this.logger.warn('Failed to load cache metadata', { error });
      this.metadata = new Map();
    }
  }

  private async saveMetadata(): Promise<void> {
    try {
      const data = Object.fromEntries(
        Array.from(this.metadata.entries()).map(([key, value]) => [
          key,
          {
            ...value,
            createdAt: value.createdAt.toISOString(),
            lastAccessed: value.lastAccessed.toISOString(),
          },
        ])
      );
      await fs.writeJSON(this.metadataFile, data, { spaces: 2 });
      this.logger.debug('Cache metadata saved');
    } catch (error) {
      this.logger.error('Failed to save cache metadata', { error });
    }
  }

  generateCacheKey(text: string, voice: OpenAIVoice, model: OpenAIModel): string {
    const content = `${text}:${voice}:${model}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async get(cacheKey: string): Promise<string | null> {
    const entry = this.metadata.get(cacheKey);
    if (!entry) {
      this.logger.debug('Cache miss', { cacheKey });
      return null;
    }

    const filePath = entry.filePath;
    if (!(await fs.pathExists(filePath))) {
      this.logger.warn('Cache entry file missing', { cacheKey, filePath });
      this.metadata.delete(cacheKey);
      await this.saveMetadata();
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = new Date();
    this.metadata.set(cacheKey, entry);
    await this.saveMetadata();

    this.logger.debug('Cache hit', { cacheKey, filePath });
    return filePath;
  }

  async set(
    cacheKey: string,
    audioBuffer: Buffer,
    metadata: {
      text: string;
      voice: OpenAIVoice;
      model: OpenAIModel;
    },
    customPath?: string
  ): Promise<string> {
    const fileName = `${cacheKey}.mp3`;
    const filePath = customPath || path.join(this.cacheDir, fileName);

    // Ensure directory exists for custom paths
    if (customPath) {
      await fs.ensureDir(path.dirname(customPath));
    }

    try {
      await fs.writeFile(filePath, audioBuffer);

      const entry: CacheEntry = {
        hash: cacheKey,
        filePath,
        createdAt: new Date(),
        lastAccessed: new Date(),
        size: audioBuffer.length,
        text: metadata.text,
        voice: metadata.voice,
        model: metadata.model,
      };

      this.metadata.set(cacheKey, entry);
      await this.saveMetadata();

      this.logger.info('Audio cached', {
        cacheKey,
        filePath,
        size: audioBuffer.length,
        voice: metadata.voice,
        model: metadata.model,
      });

      // Check if we need to clean up space
      await this.enforceStorageLimit();

      return filePath;
    } catch (error) {
      this.logger.error('Failed to cache audio', { error, cacheKey });
      throw error;
    }
  }

  async delete(cacheKey: string): Promise<boolean> {
    const entry = this.metadata.get(cacheKey);
    if (!entry) {
      return false;
    }

    try {
      if (await fs.pathExists(entry.filePath)) {
        await fs.unlink(entry.filePath);
      }
      this.metadata.delete(cacheKey);
      await this.saveMetadata();
      
      this.logger.debug('Cache entry deleted', { cacheKey });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete cache entry', { error, cacheKey });
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.mp3')) {
          await fs.unlink(path.join(this.cacheDir, file));
        }
      }
      
      this.metadata.clear();
      await this.saveMetadata();
      
      this.logger.info('Cache cleared');
    } catch (error) {
      this.logger.error('Failed to clear cache', { error });
    }
  }

  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    hitRate: number;
  }> {
    const entries = Array.from(this.metadata.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const dates = entries.map(entry => entry.createdAt);
    
    return {
      totalEntries: entries.length,
      totalSize,
      oldestEntry: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null,
      newestEntry: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null,
      hitRate: 0, // This would require additional tracking
    };
  }

  private async cleanupExpired(): Promise<void> {
    const now = new Date().getTime();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.metadata.entries()) {
      if (now - entry.createdAt.getTime() > this.maxCacheAge) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.info('Cleaned up expired cache entries', { count: expiredKeys.length });
    }
  }

  private async enforceStorageLimit(): Promise<void> {
    const stats = await this.getStats();
    
    if (stats.totalSize <= this.maxCacheSize) {
      return;
    }

    // Sort entries by last accessed time (oldest first)
    const sortedEntries = Array.from(this.metadata.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    let currentSize = stats.totalSize;
    let deletedCount = 0;

    for (const [key, entry] of sortedEntries) {
      if (currentSize <= this.maxCacheSize * 0.8) { // Target 80% of max size
        break;
      }

      await this.delete(key);
      currentSize -= entry.size;
      deletedCount++;
    }

    if (deletedCount > 0) {
      this.logger.info('Enforced storage limit', { 
        deletedEntries: deletedCount,
        newSize: currentSize,
      });
    }
  }

  async findByText(text: string): Promise<CacheEntry[]> {
    return Array.from(this.metadata.values()).filter(entry => 
      entry.text.includes(text)
    );
  }

  async findByVoice(voice: OpenAIVoice): Promise<CacheEntry[]> {
    return Array.from(this.metadata.values()).filter(entry => 
      entry.voice === voice
    );
  }

  async cleanup(): Promise<void> {
    await this.saveMetadata();
    this.logger.info('Cache cleanup completed');
  }

  setMaxCacheSize(sizeInMB: number): void {
    this.maxCacheSize = sizeInMB * 1024 * 1024;
    this.logger.info('Cache size limit updated', { maxSizeMB: sizeInMB });
  }

  setMaxCacheAge(days: number): void {
    this.maxCacheAge = days * 24 * 60 * 60 * 1000;
    this.logger.info('Cache age limit updated', { maxAgeDays: days });
  }
}