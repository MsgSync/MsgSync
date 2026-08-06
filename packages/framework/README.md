# MsgSync Framework

The Code-First SMS SDK.

MsgSync Framework provides a type-safe, code-first interface for integrating SMS capabilities directly into your Node.js applications, regardless of the web framework you're using.

## Features

- ✅ **Framework Agnostic**: Adapters for Express, Next.js, and more.
- ✅ **Type-Safe**: Full TypeScript support with Zod validation.
- ✅ **Code-First**: Seamlessly integrate SMS into your existing application logic.
- ✅ **AI Ready**: Built-in support for Langchain and AI SDK integrations.

## Installation

```bash
pnpm add @msgsync/framework
```

## Quick Start (Express)

```typescript
import { MsgSyncClient, createExpressMiddleware } from '@msgsync/framework/express';

const client = new MsgSyncClient({ apiKey: 'your-api-key' });

const app = express();
app.use(createExpressMiddleware({ client }));

app.post('/send', async (req, res) => {
  // Use the client attached to the request
  const result = await req.msgsync.messages.send({
    recipient: '+1234567890',
    content: 'Hello from Express!'
  });
  res.json(result);
});
```

## Supported Frameworks

- Express
- Next.js
- (More adapters coming soon)

## License

MIT
