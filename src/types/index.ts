export interface TTSRequest {
  text: string;
  voice?: OpenAIVoice;
  model?: OpenAIModel;
  saveOnly?: boolean;
  outputPath?: string;
}

export interface TTSResponse {
  success: boolean;
  audioPath?: string;
  cached?: boolean;
  error?: string;
  audioUrl?: string;
}

export interface CacheEntry {
  hash: string;
  filePath: string;
  createdAt: Date;
  lastAccessed: Date;
  size: number;
  text: string;
  voice: OpenAIVoice;
  model: OpenAIModel;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface Config {
  openaiApiKey?: string;
  cacheMaxSize: number; // MB
  cacheDuration: number; // days
  defaultVoice: OpenAIVoice;
  defaultModel: OpenAIModel;
  audioPlayer?: string;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type OpenAIModel = 'tts-1' | 'tts-1-hd';

export interface SetupQuestions {
  openaiApiKey: string;
  defaultVoice: OpenAIVoice;
  defaultModel: OpenAIModel;
  cacheMaxSize: number;
  cacheDuration: number;
}

export interface AudioNotificationRequest {
  message?: string;
  voice?: OpenAIVoice;
  model?: OpenAIModel;
  saveOnly?: boolean;
}

export type AudioNotificationType = 'start' | 'alert' | 'finish';