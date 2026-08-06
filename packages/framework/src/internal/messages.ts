import { MsgSyncClient } from './client';

export interface SendMessageRequest {
  recipient: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  status: string;
  data: {
    id: string;
    status: string;
  };
}

export class MessagesService {
  constructor(private client: MsgSyncClient) {}

  async send(request: SendMessageRequest): Promise<SendMessageResponse> {
    // @ts-ignore - Accessing protected request method
    return this.client.request<SendMessageResponse>('/messages', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}
