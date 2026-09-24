import { Request, Response, NextFunction } from 'express';
import { MsgSyncClient } from '../internal/client';

export interface ExpressAdapterConfig {
  client: MsgSyncClient;
}

export function createExpressMiddleware(config: ExpressAdapterConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic middleware to attach the client to the request
    (req as any).msgsync = config.client;
    next();
  };
}
