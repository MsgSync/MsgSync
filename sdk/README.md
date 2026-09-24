# MsgSync SDKs

Official SDKs for integrating MsgSync into your applications.

## Available SDKs

### JavaScript/TypeScript

```bash
pnpm add @msgsync/sdk
```

See [JavaScript SDK](./javascript/) for documentation.

### Python

```bash
pip install msgsync
```

See [Python SDK](./python/) for documentation.

### Java

```xml
<dependency>
    <groupId>com.msgsync</groupId>
    <artifactId>msgsync-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

See [Java SDK](./java/) for documentation.

### Go

```bash
go get github.com/msgsync/go-sdk
```

See [Go SDK](./go/) for documentation.

## Quick Start Example (JavaScript)

```javascript
const MsgSync = require("@msgsync/sdk");

// Initialize the client
const client = new MsgSync({
  apiKey: "your-api-key",
  endpoint: "https://api.msgsync.io",
});

// Send a message
async function sendMessage() {
  const result = await client.messages.send({
    to: "+1234567890",
    body: "Hello from MsgSync!",
    from: "+0987654321",
  });

  console.log("Message sent:", result.id);
}

// Get message status
async function getStatus(messageId) {
  const status = await client.messages.get(messageId);
  console.log("Status:", status.delivery_status);
}
```

## Features

All SDKs provide:

- ✅ Full API coverage
- ✅ Type safety (where applicable)
- ✅ Async/await support
- ✅ Error handling
- ✅ Webhook validation
- ✅ Retry logic
- ✅ Comprehensive tests

## Directory Structure

```
sdk/
├── javascript/       # JavaScript/TypeScript SDK
├── python/          # Python SDK
├── java/            # Java SDK
├── go/              # Go SDK
└── README.md        # This file
```

## Documentation

For detailed SDK documentation, see:

- [SDK Reference](../docs/sdk-reference.md)
- Individual SDK directories for language-specific docs

## Contributing

We welcome SDK contributions! To add a new SDK:

1. Create a new directory for your language
2. Follow the SDK design guidelines
3. Include comprehensive tests
4. Add documentation
5. Submit a pull request

See [Contributing Guidelines](../CONTRIBUTING.md) for details.

## Support

- 📚 [Documentation](../docs/)
- 💬 [Discussions](https://github.com/MsgSync/MsgSync/discussions)
- 🐛 [Report Issues](https://github.com/MsgSync/MsgSync/issues)
