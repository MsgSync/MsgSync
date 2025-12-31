# MsgSync Deployment Guide

This guide explains how to deploy MsgSync using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- A PostgreSQL database (can be run via Docker)
- A Redis instance (can be run via Docker)

## Docker Compose Setup

Create a `docker-compose.yml` file in the root directory:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: msgsync
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: msgsync_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  kafka:
    image: bitnami/kafka:latest
    ports:
      - "9092:9092"
    environment:
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093
      - KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER

  platform:
    build: 
      context: ./platform
    environment:
      DATABASE_URL: "postgresql://msgsync:password123@postgres:5432/msgsync_platform?schema=public"
      REDIS_URL: "redis://redis:6379"
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  aggregator:
    build:
      context: ./aggregator
    environment:
      DATABASE_URL: "postgresql://msgsync:password123@postgres:5432/msgsync_platform?schema=public"
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  smpp-gateway:
    build:
      context: .
      dockerfile: services/smpp-gateway/Dockerfile
    environment:
      KAFKA_BROKERS: "kafka:9092"
    depends_on:
      - kafka

  routing-engine:
    build:
      context: .
      dockerfile: services/routing-engine/Dockerfile
    environment:
      KAFKA_BROKERS: "kafka:9092"
      DATABASE_URL: "postgresql://msgsync:password123@postgres:5432/msgsync_platform?schema=public"
    depends_on:
      - kafka
      - postgres

  campaign-engine:
    build:
      context: .
      dockerfile: services/campaign-engine/Dockerfile
    environment:
      KAFKA_BROKERS: "kafka:9092"
      DATABASE_URL: "postgresql://msgsync:password123@postgres:5432/msgsync_platform?schema=public"
    depends_on:
      - kafka
      - postgres

  ss7-gateway:
    build:
      context: .
      dockerfile: services/ss7-gateway/Dockerfile
    environment:
      KAFKA_BROKERS: "kafka:9092"
    depends_on:
      - kafka

  hlr-service:
    build:
      context: .
      dockerfile: services/hlr-service/Dockerfile
    environment:
      KAFKA_BROKERS: "kafka:9092"
      DATABASE_URL: "postgresql://msgsync:password123@postgres:5432/msgsync_platform?schema=public"
    depends_on:
      - kafka
      - postgres

volumes:
  postgres_data:
```

## Dockerfiles

### Platform Dockerfile (`platform/Dockerfile`)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "start"]
```

### Aggregator Dockerfile (`aggregator/Dockerfile`)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]
```

### Go Services Dockerfiles

All Go services (`smpp-gateway`, `routing-engine`, `campaign-engine`, `ss7-gateway`, `hlr-service`) use a multi-stage build process.
Note that the **build context must be the project root** to allow access to shared libraries (`services/common`).

**Example Template:**
```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/service-name ./services/service-name

# Set workdir to the service directory
WORKDIR /app/services/service-name

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o service-name .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/service-name/service-name .

CMD ["./service-name"]
```

## Deployment Steps

1.  **Build and Start**:
    ```bash
    docker-compose up -d --build
    ```

2.  **Initialize Database**:
    ```bash
    docker-compose exec platform npx prisma migrate deploy
    docker-compose exec platform npm run prisma:seed
    ```

3.  **Verify**:
    - Platform API: `http://localhost:3001/health`
    - Aggregator API: `http://localhost:3000/health`
```
