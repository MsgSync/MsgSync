# MsgSync JavaScript SDK Documentation

The MsgSync JavaScript SDK is a lightweight, promise-based library for integrating messaging into Node.js applications and frontend environments.

## Installation

Install the package via pnpm:

```bash
pnpm add @msgsync/sdk
```

## Initialization

Initialize the `MsgSyncClient` by providing your API key.

```javascript
const MsgSyncClient = require("@msgsync/sdk");

const client = new MsgSyncClient({
  apiKey: "your_api_key",
});

// For custom deployments or local testing:
// const client = new MsgSyncClient({
//     apiKey: 'your_api_key',
//     baseUrl: 'http://localhost:3001/api'
// });
```

---

## 📨 Sending Messages

### Single SMS

Send a message to a mobile recipient.

```javascript
async function sendAlert() {
  try {
    const response = await client.sendMessage({
      recipient: "+15550001122",
      content: "Hello from MsgSync JS SDK!",
      metadata: { type: "alert" },
    });
    console.log("Message ID:", response.data.id);
  } catch (error) {
    console.error(error.message);
  }
}
```

### Check Message Status

Get the real-time status of a transmitted message.

```javascript
const status = await client.getMessageStatus("msg_8f3d2e1a");
console.log("Current Status:", status.data.status);
```

### List Recent Activity

Retrieve a history of recent messages.

```javascript
const activity = await client.listMessages();
activity.data.forEach((msg) => {
  console.log(`${msg.id}: ${msg.status}`);
});
```

---

## 🔐 OTP (One-Time Passwords)

### Send Verification Code

Trigger a 2FA verification code delivery.

```javascript
await client.sendOTP({
  recipient: "+15550001122",
  length: 6,
  ttl: 300, // 5 minutes
});
```

### Verify Code

Validate the code provided by your user.

```javascript
const result = await client.verifyOTP("+15550001122", "123456");

if (result.status === "success") {
  console.log("Login verified!");
} else {
  console.log("Invalid code.");
}
```

---

## Error Handling

The SDK throws descriptive errors for API failures (e.g., 401 Unauthorized, 429 Rate Limit).

```javascript
try {
  await client.sendMessage({ recipient: "" });
} catch (error) {
  // Output: MsgSync API Error (400): Recipient is required
  console.error(error.message);
}
```

---

## Integration with Express.js

```javascript
const express = require("express");
const app = express();
const client = new MsgSyncClient({ apiKey: process.env.MSGSYNC_API_KEY });

app.post("/notify", async (req, res) => {
  const result = await client.sendMessage({
    recipient: req.body.phone,
    content: "Your notification content here",
  });
  res.json(result);
});
```
