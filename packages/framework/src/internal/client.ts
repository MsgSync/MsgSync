import { MessagesService } from './messages';
import { AiSdkService } from '../ai-sdk';
import { LangchainService } from '../langchain';

export interface MsgSyncConfig {
  apiKey: string;
  baseUrl?: string;
}

export class MsgSyncClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  public readonly messages: MessagesService;
  public readonly ai: AiSdkService;
  public readonly langchain: LangchainService;

  constructor(config: MsgSyncConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.msgsync.com/v1';
    this.messages = new MessagesService(this);
    this.ai = new AiSdkService(this);
    this.langchain = new LangchainService(this);
  }

  protected async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`MsgSync API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }
}
