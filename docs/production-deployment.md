# 🚀 MsgSync Production Deployment Guide

This comprehensive guide will walk you through deploying MsgSync to production with best practices for security, scalability, and reliability.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [Platform Deployment](#platform-deployment)
6. [Aggregator Deployment](#aggregator-deployment)
7. [Security Hardening](#security-hardening)
8. [Monitoring & Observability](#monitoring--observability)
9. [Scaling Strategies](#scaling-strategies)
10. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Required Services

- **PostgreSQL 14+** (Managed service recommended: AWS RDS, Google Cloud SQL, or DigitalOcean)
- **Redis 6+** (Managed service recommended: AWS ElastiCache, Redis Cloud, or Upstash)
- **Node.js 18+**
- **Docker & Docker Compose** (for containerized deployment)

### Domain & SSL

- Registered domain name
- SSL certificate (Let's Encrypt recommended)
- DNS configured to point to your server

---

## Environment Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/your-org/MsgSync.git
cd MsgSync

# Install platform dependencies
cd platform
pnpm install
pnpm run prisma:generate

# Install aggregator dependencies
cd ../aggregator
pnpm install
pnpm run prisma:generate
```

### 2. Configure Environment Variables

Create production environment files:

**`packages/platform/.env.production`**

```env
# Database
DATABASE_URL="postgresql://user:password@your-db-host:5432/msgsync_production?schema=public"

# Redis
REDIS_URL="redis://your-redis-host:6379"

# Server
NODE_ENV=production
PORT=3001

# SMS Providers
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Security
API_KEY_SECRET=your-super-secret-key-min-32-chars
WEBHOOK_SECRET=your-webhook-signing-secret

# Optional: Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**`packages/aggregator/.env.production`**

```env
DATABASE_URL="postgresql://user:password@your-db-host:5432/msgsync_aggregator?schema=public"
REDIS_URL="redis://your-redis-host:6379"
NODE_ENV=production
PORT=3000
MSGSYNC_PLATFORM_API_KEY=your-platform-api-key
MSGSYNC_PLATFORM_URL=https://api.yourdomain.com/api
```

---

## Database Configuration

### 1. Run Migrations

```bash
cd platform
npx prisma migrate deploy

cd ../aggregator
npx prisma migrate deploy
```

### 2. Seed Initial Data

```bash
cd platform
pnpm run prisma:seed
```

### 3. Create Production API Keys

```bash
# Connect to your database
psql $DATABASE_URL

# Create a secure API key
INSERT INTO "ApiKey" (id, key, name, active, "organizationId")
VALUES (
  gen_random_uuid(),
  'prod_' || encode(gen_random_bytes(32), 'hex'),
  'Production Key',
  true,
  'default-org-id'
);
```

---

## Redis Configuration

### Recommended Settings for Production

```redis
# Memory Management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence (for job queue reliability)
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-strong-redis-password
```

---

## Platform Deployment

### Option 1: Docker Compose (Recommended)

**`docker-compose.production.yml`**

```yaml
version: "3.8"

services:
  platform:
    build:
      context: ./packages/platform
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    env_file:
      - ./packages/platform/.env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: "1"
          memory: 1G

  aggregator:
    build:
      context: ./packages/aggregator
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${AGGREGATOR_DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    env_file:
      - ./packages/aggregator/.env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - platform
      - aggregator
    restart: unless-stopped
```

**Deploy:**

```bash
docker-compose -f docker-compose.production.yml up -d
```

### Option 2: PM2 (Process Manager)

```bash
# Install PM2 globally
pnpm add -g pm2

# Start Platform
cd platform
pm2 start src/index.js --name msgsync-platform -i 2 --env production

# Start Aggregator
cd ../aggregator
pm2 start src/index.js --name msgsync-aggregator --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

---

## Security Hardening

### 1. Nginx Reverse Proxy Configuration

**`nginx.conf`**

```nginx
upstream platform {
    least_conn;
    server platform:3001;
}

upstream aggregator {
    server aggregator:3000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api {
        proxy_pass http://platform;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /dashboard {
        proxy_pass http://platform;
        proxy_set_header Host $host;
    }

    location /docs {
        proxy_pass http://platform;
        proxy_set_header Host $host;
    }
}
```

### 2. Environment Variable Security

```bash
# Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
# Never commit .env files to version control
# Rotate API keys regularly
# Use different keys for each environment
```

### 3. Database Security

```sql
-- Create read-only user for analytics
CREATE USER msgsync_readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE msgsync_production TO msgsync_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO msgsync_readonly;

-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
```

---

## Monitoring & Observability

### 1. Health Checks

```bash
# Platform health
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","component":"platform"}
```

### 2. Logging Strategy

**Install Winston for structured logging:**

```bash
pnpm add winston
```

**`packages/platform/src/utils/logger.js`**

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

module.exports = logger;
```

### 3. Metrics & Alerting

**Recommended Tools:**

- **Prometheus + Grafana**: For metrics visualization
- **Sentry**: For error tracking
- **DataDog / New Relic**: For APM
- **PagerDuty**: For on-call alerting

---

## Scaling Strategies

### Horizontal Scaling

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: msgsync-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: msgsync-platform
  template:
    metadata:
      labels:
        app: msgsync-platform
    spec:
      containers:
        - name: platform
          image: your-registry/msgsync-platform:latest
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: msgsync-secrets
                  key: database-url
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_messages_status ON "Message"(status);
CREATE INDEX idx_messages_created_at ON "Message"("createdAt" DESC);
CREATE INDEX idx_messages_api_key ON "Message"("apiKeyId");
CREATE INDEX idx_messages_org ON "Message"("organizationId");

-- Enable query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Redis Optimization

```bash
# Use Redis Cluster for high availability
# Separate queues by priority
# Monitor queue depth and processing time
```

---

## Backup & Recovery

### 1. Database Backups

```bash
# Automated daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/msgsync_$(date +\%Y\%m\%d).sql.gz

# Retention: Keep 30 days
find /backups -name "msgsync_*.sql.gz" -mtime +30 -delete
```

### 2. Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 1 hour
2. **RPO (Recovery Point Objective)**: 15 minutes
3. **Backup Strategy**:
   - Continuous WAL archiving for PostgreSQL
   - Redis AOF persistence enabled
   - Daily full backups to S3/GCS

### 3. Testing Recovery

```bash
# Test restore procedure monthly
pg_restore -d msgsync_test /backups/latest.sql.gz
```

---

## Post-Deployment Checklist

- [ ] SSL certificates configured and auto-renewing
- [ ] Environment variables secured
- [ ] Database migrations applied
- [ ] API keys generated and distributed
- [ ] Health checks passing
- [ ] Monitoring dashboards configured
- [ ] Backup automation verified
- [ ] Load testing completed
- [ ] Documentation updated
- [ ] Team trained on incident response

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**

- Review error logs
- Check queue depths
- Monitor API response times

**Monthly:**

- Update dependencies (`pnpm audit`)
- Review and rotate API keys
- Test disaster recovery
- Analyze usage patterns

**Quarterly:**

- Security audit
- Performance optimization
- Capacity planning review

---

## 🎉 You're Ready for Production!

Your MsgSync platform is now deployed and ready to handle millions of messages. For additional support:

- 📚 **API Docs**: https://api.yourdomain.com/docs
- 📊 **Dashboard**: https://api.yourdomain.com/dashboard
- 💬 **Support**: support@yourdomain.com

**Built with ❤️ by the MsgSync Team**
