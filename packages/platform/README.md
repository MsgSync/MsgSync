# MsgSync Platform

The core SMS platform module handles message routing, delivery, and management.

## Features

- **Message Routing** - Intelligent routing based on destination, priority, and availability
- **Delivery Management** - Track and manage message delivery status
- **Queue Management** - Efficient message queuing and processing
- **Provider Integration** - Support for multiple SMS providers
- **Webhook Support** - Real-time delivery notifications

## Directory Structure

```
platform/
├── src/              # Source code
├── tests/            # Unit and integration tests
├── config/           # Configuration files
└── README.md         # This file
```

## Getting Started

### Installation

```bash
cd platform
pnpm install
```

### Configuration

Create a `.env` file in the platform directory:

```env
SMS_PROVIDER=your-provider
API_KEY=your-api-key
PORT=3000
```

### Running the Platform

```bash
# Development mode
pnpm run dev

# Production mode
pnpm start

# Run tests
pnpm test
```

## API Overview

The platform exposes a RESTful API for message operations:

- `POST /api/messages` - Send a new message
- `GET /api/messages/:id` - Get message status
- `GET /api/messages` - List messages
- `DELETE /api/messages/:id` - Cancel a message

For detailed API documentation, see [Platform API docs](../docs/platform-api.md).

## Architecture

The platform is built with:

- Node.js and Express
- Redis for queuing
- PostgreSQL for persistence
- Bull for job processing

## Contributing

See the main [Contributing Guidelines](../CONTRIBUTING.md) for information on contributing to this module.
