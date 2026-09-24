import { MsgSyncClient } from '../internal/client';
import { generateText } from 'ai';

export interface AiMessageConfig {
  prompt: string;
  recipient: string;
  model: any; // Using any for now to align with AI SDK types
}

export class AiSdkService {
  constructor(private client: MsgSyncClient) {}

  async generateAndSend(config: AiMessageConfig) {
    const { text } = await generateText({
      model: config.model,
      prompt: config.prompt,
    });

    return await this.client.messages.send({
      recipient: config.recipient,
      content: text,
    });
  }
}
