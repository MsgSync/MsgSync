# MsgSync Aggregator

The aggregator module consolidates messages from multiple sources and platforms.

## Features

- **Multi-source Aggregation** - Collect messages from various providers
- **Data Normalization** - Standardize message formats across sources
- **Real-time Processing** - Process messages as they arrive
- **Analytics** - Generate insights from aggregated data
- **Storage Management** - Efficient storage and retrieval

## Directory Structure

```
aggregator/
├── src/              # Source code
├── tests/            # Unit and integration tests
├── config/           # Configuration files
└── README.md         # This file
```

## Getting Started

### Installation

```bash
cd aggregator
pnpm install
```

### Configuration

Create a `.env` file in the aggregator directory:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/msgsync
REDIS_URL=redis://localhost:6379
AGGREGATION_INTERVAL=5000
```

### Running the Aggregator

```bash
# Development mode
pnpm run dev

# Production mode
pnpm start

# Run tests
pnpm test
```

## How It Works

The aggregator:

1. Listens for messages from configured sources
2. Normalizes message data to a standard format
3. Stores messages in the central database
4. Triggers webhooks and notifications
5. Generates analytics and insights

## Supported Sources

- SMS providers (Twilio, Nexmo, etc.)
- Email gateways
- Push notification services
- Custom webhooks

## API Overview

- `POST /api/aggregate` - Manually trigger aggregation
- `GET /api/sources` - List configured sources
- `POST /api/sources` - Add a new source
- `GET /api/analytics` - View aggregation analytics

For detailed documentation, see [Aggregator Guide](../docs/aggregator-guide.md).

## Contributing

See the main [Contributing Guidelines](../CONTRIBUTING.md) for information on contributing to this module.
