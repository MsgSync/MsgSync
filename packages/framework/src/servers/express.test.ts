import { describe, it, expect, vi } from 'vitest';
import { createExpressMiddleware } from './express';
import { MsgSyncClient } from '../internal/client';
import { Request, Response, NextFunction } from 'express';

describe('ExpressAdapter', () => {
  it('should attach the client to the request object', () => {
    const mockClient = {} as MsgSyncClient;
    const middleware = createExpressMiddleware({ client: mockClient });
    
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect((req as any).msgsync).toBe(mockClient);
    expect(next).toHaveBeenCalled();
  });
});
