import { NextRequest, NextResponse } from 'next/server';
import { MsgSyncClient } from '../internal/client';

export interface NextAdapterConfig {
  client: MsgSyncClient;
}

export function createNextHandler(config: NextAdapterConfig) {
  return async (req: NextRequest) => {
    // Basic handler that could be used in API routes
    // Returning a simple response indicating the client is available
    return NextResponse.json({ 
        status: 'ok', 
        message: 'MsgSync Next.js handler active' 
    });
  };
}
