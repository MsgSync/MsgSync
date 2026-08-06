import { describe, it, expect, vi } from 'vitest';
import { AiSdkService } from './index';
import { MsgSyncClient } from '../internal/client';
import * as ai from 'ai';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: 'Hello from AI!' })
}));

describe('AiSdkService', () => {
  it('should generate text and send a message', async () => {
    // Mock the client
    const mockMessagesSend = vi.fn().mockResolvedValue({ status: 'success', data: { id: 'msg-123', status: 'queued' } });
    const mockClient = {
      messages: {
        send: mockMessagesSend
      }
    } as unknown as MsgSyncClient;

    const service = new AiSdkService(mockClient);
    
    const response = await service.generateAndSend({
      prompt: 'Say hello',
      recipient: '+1234567890',
      model: {}
    });

    expect(ai.generateText).toHaveBeenCalledWith({
      model: {},
      prompt: 'Say hello'
    });
    
    expect(mockMessagesSend).toHaveBeenCalledWith({
      recipient: '+1234567890',
      content: 'Hello from AI!'
    });
    
    expect(response.status).toBe('success');
  });
});
