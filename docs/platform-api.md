# MsgSync Platform API Reference

The MsgSync Platform API provides programmatic access to the core messaging engine. It enables sending messages, managing campaigns, tracking delivery, and accessing real-time analytics.

## Base URL

All API requests should be made to:
`http://localhost:3001/api`

## Authentication

MsgSync uses API keys to authenticate requests. You can find your API key in the MsgSync Console under Security settings.

Include your API key in all requests as a header:
`X-API-Key: YOUR_API_KEY`

---

## 1. Messages

### Send Message

`POST /messages`

Queues a single SMS for delivery.

**Request Body:**

```json
{
  "recipient": "+15550001122",
  "content": "Your appointment is confirmed for tomorrow at 2 PM.",
  "scheduledAt": "2024-01-01T10:00:00Z" (optional)
}
```

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "id": "msg_8f3d2e1a",
    "status": "queued"
  }
}
```

### Get Message Status

`GET /messages/:id`

Retrieves the current status of a specific message.

**Response (200 OK):**

```json
{
  "status": "success",
  "data": {
    "id": "msg_8f3d2e1a",
    "recipient": "+15550001122",
    "content": "Your appointment is confirmed...",
    "status": "delivered",
    "provider": "twilio",
    "createdAt": "2024-01-01T09:00:00Z"
  }
}
```

### List Messages

`GET /messages`

Retrieves a list of recent messages. Supports pagination and filtering.

---

## 2. OTP (One-Time Passwords)

### Send OTP

`POST /otp/send`

Generates and sends a verification code to a recipient.

**Request Body:**

```json
{
  "recipient": "+15550001122",
  "length": 6, (default: 6)
  "ttl": 300 (default: 300 seconds)
}
```

### Verify OTP

`POST /otp/verify`

Verifies a previously sent OTP code.

**Request Body:**

```json
{
  "recipient": "+15550001122",
  "code": "123456"
}
```

---

## 3. Campaigns & Bulk Messaging

### Create Campaign

`POST /bulk/campaigns`

Creates a new bulk messaging campaign linked to a contact list.

**Request Body:**

```json
{
  "name": "January Promo",
  "content": "Flash Sale! Get 20% off with code FLASH20",
  "listId": "list_928374",
  "senderId": "MsgSync",
  "enableTracking": true
}
```

### Campaign Controls

- `POST /bulk/campaigns/:id/start` - Resume/Start processing
- `POST /bulk/campaigns/:id/pause` - Temporarily halt delivery
- `DELETE /bulk/campaigns/:id` - Cancel and delete campaign

---

## 4. Analytics & Monitoring

### Get Stats

`GET /analytics/stats`

Returns high-level statistics for the dashboard (volume, delivery rate, failures).

### Get Trends

`GET /analytics/trends`

Returns hourly message volume and status distribution for charting.

---

## 5. Security & Auditing

### Audit Logs

`GET /audit`

Retrieves a history of actions taken on the platform. Accessible only by administrative keys.

---

## Error Codes

| Code | Description                               |
| ---- | ----------------------------------------- |
| 400  | Bad Request - Invalid parameters          |
| 401  | Unauthorized - Invalid or missing API Key |
| 403  | Forbidden - Insufficient permissions      |
| 404  | Not Found - Resource does not exist       |
| 429  | Too Many Requests - Rate limit exceeded   |
| 500  | Internal Server Error                     |
