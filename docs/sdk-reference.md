# MsgSync SDK Reference

MsgSync provide official SDKs for several popular programming languages to make integration as seamless as possible.

## Supported Languages

| Language                    | Package Manager | Installation                       | Documentation           |
| --------------------------- | --------------- | ---------------------------------- | ----------------------- |
| **JavaScript / TypeScript** | pnpm            | `pnpm add @msgsync/sdk`            | [Link](./js-sdk.md)     |
| **Python**                  | pip             | `pip install msgsync`              | [Link](./python-sdk.md) |
| **Go**                      | go get          | `go get github.com/msgsync/go-sdk` | [Link](./go-sdk.md)     |
| **PHP**                     | composer        | `composer require msgsync/sdk`     | [Link](./php-sdk.md)    |

---

## Core Concepts

All SDKs follow a consistent design pattern:

### 1. Initialization

Create a client instance by providing your API key and the platform endpoint.

```javascript
const client = new MsgSync({
  apiKey: "YOUR_API_KEY",
  endpoint: "https://api.msgsync.io", // Optional
});
```

### 2. Resource Management

Access platform features through resource namespaces:

- `client.messages` - Single SMS delivery
- `client.campaigns` - Bulk messaging & scheduling
- `client.analytics` - Usage and delivery statistics
- `client.verification` - OTP and lookups

### 3. Error Handling

SDKs throw specific exception types for common API errors:

- `AuthenticationError`: Invalid API key
- `ValidationError`: Invalid input parameters
- `RateLimitError`: Too many requests (429)
- `ApiError`: Server-side processing error

---

## Example Usage (Python)

```python
from msgsync import MsgSyncClient

client = MsgSyncClient(api_key="your-api-key")

# Send a message
response = client.messages.send(
    to="+15550001122",
    content="Hello from Python SDK!"
)

print(f"Message ID: {response.id}")

# Get status
status = client.messages.get(response.id)
print(f"Current Status: {status.delivery_status}")
```

## Example Usage (PHP)

```php
use MsgSync\Client;

$client = new Client('your-api-key');

$message = $client->messages->send([
    'to' => '+15550001122',
    'content' => 'Hello from PHP SDK!'
]);

echo "Sent: " . $message->id;
```

---

## Features

- **Automatic Retries**: SDKs automatically retry idempotent requests on transient network failures.
- **Webhook Helpers**: Verify incoming webhook signatures to ensure authenticity.
- **Type Safety**: TypeScript, Go, and Python packages provide full type definitions.
- **Async Support**: Fully non-blocking I/O across all modern language versions.
