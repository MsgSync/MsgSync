# Aggregator Guide

The MsgSync Aggregator is a robust service designed to collect, normalize, and store messages from multiple external sources in real-time.

## Overview

The aggregator module acts as the ingestion engine for the MsgSync platform. it periodically polls or listens to various messaging platforms (SMS providers, Email gateways, etc.), standardizes the incoming data, and persists it for further processing.

## Architecture

The aggregator is built with:

- **Express.js**: API layer for manual triggers and source management.
- **Prisma**: ORM for database interactions.
- **PostgreSQL**: Central storage for messages and source configurations.

## Core Components

### 1. Data Normalization

All incoming messages are converted to a standard schema:

- `id`: Unique internal ID
- `externalId`: ID from the original provider
- `source`: Name of the provider (e.g., Twilio)
- `sourceType`: Category (sms, email, webhook)
- `content`: Text body of the message
- `originalPayload`: Full raw data for debugging/future-proofing

### 2. Source Management

Sources are configured in the database with specific connection parameters (URLs, API keys, headers) stored in a `config` JSON field.

## API Reference

### Trigger Aggregation

`POST /api/aggregate`
Triggers an immediate polling cycle across all active sources.

### Source Management

- `GET /api/sources`: List all configured sources.
- `POST /api/sources`: Add a new source configuration.

### Analytics

`GET /api/analytics`
Returns a summary of total messages aggregated, grouped by source and type.

## Setup and Configuration

### Requirements

- Node.js >= 16.0.0
- PostgreSQL database

### Installation

```bash
cd aggregator
pnpm install
```

### Environment Variables

Configure these in a `.env` file:

- `DATABASE_URL`: Connection string for PostgreSQL.
- `PORT`: Service port (default: 3000).
- `AGGREGATION_INTERVAL`: Default polling interval in milliseconds.

### Database Setup

```bash
npx prisma migrate dev
```

## Running the Service

```bash
# Development
pnpm run dev

# Production
pnpm start
```

## Testing

```bash
pnpm test
```
