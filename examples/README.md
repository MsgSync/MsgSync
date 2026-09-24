# MsgSync Examples

Sample integrations and use cases for MsgSync.

## Available Examples

### Basic Examples

- [**Simple Send**](./simple-send/) - Send a basic SMS message
- [**Batch Send**](./batch-send/) - Send messages to multiple recipients
- [**Scheduled Messages**](./scheduled-messages/) - Schedule messages for later delivery

### Integration Examples

- [**Express Integration**](./express-integration/) - Integrate with Express.js
- [**React App**](./react-app/) - Build a React messaging app
- [**Python Flask**](./python-flask/) - Use MsgSync with Flask
- [**Next.js**](./nextjs-app/) - Full-stack Next.js example

### Advanced Examples

- [**Webhook Handler**](./webhook-handler/) - Handle delivery status webhooks
- [**Two-way Messaging**](./two-way-messaging/) - Implement two-way SMS conversations
- [**Message Templates**](./message-templates/) - Use dynamic message templates
- [**Analytics Dashboard**](./analytics-dashboard/) - Build an analytics dashboard

### Provider Examples

- [**Multi-provider Setup**](./multi-provider/) - Configure multiple SMS providers
- [**Provider Fallback**](./provider-fallback/) - Implement automatic failover

## Quick Start

Each example includes:

- `README.md` - Detailed instructions
- `package.json` or equivalent - Dependencies
- `.env.example` - Environment variables template
- Complete source code

### Running an Example

1. Navigate to the example directory:

```bash
cd examples/simple-send
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy and configure environment variables:

```bash
cp .env.example .env
# Edit .env with your API credentials
```

4. Run the example:

```bash
pnpm start
```

## Example Structure

Each example follows this structure:

```
example-name/
├── src/              # Source code
├── README.md         # Example documentation
├── package.json      # Dependencies
├── .env.example      # Environment template
└── tests/            # Example tests (if applicable)
```

## Contributing Examples

Have a great use case? Contribute an example!

1. Create a new directory with a descriptive name
2. Include all necessary files and documentation
3. Test your example thoroughly
4. Add it to the list above
5. Submit a pull request

See [Contributing Guidelines](../CONTRIBUTING.md) for details.

## Getting Help

- 📚 [Documentation](../docs/)
- 💬 [Discussions](https://github.com/MsgSync/MsgSync/discussions)
- 🐛 [Report Issues](https://github.com/MsgSync/MsgSync/issues)

## License

All examples are provided under the MIT License, same as the main project.
