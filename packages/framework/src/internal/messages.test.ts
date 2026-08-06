import { describe, it, expect, vi } from 'vitest';
import { MessagesService } from './messages';
import { MsgSyncClient } from './client';

describe('MessagesService', () => {
  it('should send a message successfully', async () => {
    // Mock the client
    const mockClient = {
      request: vi.fn().mockResolvedValue({
        status: 'success',
        data: { id: 'msg-123', status: 'queued' }
      })
    } as unknown as MsgSyncClient;

    const service = new MessagesService(mockClient);
    
    const response = await service.send({
      recipient: '+1234567890',
      content: 'Hello!'
    });

    expect(response.status).toBe('success');
    expect(response.data.id).toBe('msg-123');
    // @ts-ignore
    expect(mockClient.request).toHaveBeenCalledWith('/messages', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ recipient: '+1234567890', content: 'Hello!' })
    }));
  });
});
