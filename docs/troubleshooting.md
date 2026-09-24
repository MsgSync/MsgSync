# Troubleshooting Guide

This guide covers common issues encountered when setting up or using MsgSync, along with their solutions.

## Common Issues

### 1. API Authentication Failure (401 Unauthorized)

**Symptoms:** Requests return a 401 status code even after providing an API Key.

- **Check Header Name**: Ensure you are using `X-API-Key` and not `Authorization: Bearer`.
- **Key Validity**: Double-check the key in the MsgSync Console.
- **Environment Variables**: If running locally, ensure `.env` is loaded correctly.

### 2. Message "Queued" but never "Delivered"

**Symptoms:** Messages appear in the dashboard as `queued` but status never updates.

- **Worker Status**: Check if the processing workers are running (`pnpm run worker`).
- **Redis Connection**: Ensure the platform can connect to Redis.
- **Provider Balance**: Verify that your upstream provider (e.g., Twilio) has sufficient balance.

### 3. Rate Limit Exceeded (429 Too Many Requests)

**Symptoms:** Requests are rejected with a 429 status code.

- **Burst Limits**: Reduce the rate of requests or implement exponential backoff in your client.
- **Account Tier**: Check if your account limits need to be increased for higher throughput.

### 4. Database Connection Errors

**Symptoms:** "PrismaClientInitializationError" or "Connection refused".

- **PostgreSQL Service**: Ensure PostgreSQL is running.
- **DATABASE_URL**: Verify the connection string in `.env`.
- **Migrations**: Run `npx prisma migrate deploy` to ensure the schema is up to date.

---

## Logging & Debugging

### Platform Logs

View live logs from the core platform:

```bash
cd platform
pnpm run logs
```

### Worker Logs

Check worker processing logs:

```bash
tail -f logs/worker.log
```

---

## Getting More Help

If you cannot find a solution here:

1. Search the [GitHub Issues](https://github.com/MsgSync/MsgSync/issues).
2. Start a discussion on [GitHub Discussions](https://github.com/MsgSync/MsgSync/discussions).
3. Contact support at `support@khulnasoft.com`.
