# MsgSync Python SDK

The MsgSync Python SDK provides a simple and powerful way to integrate SMS functionality into your Python applications.

## Installation

```bash
pip install msgsync-sdk
```

## Quick Start

```python
from msgsync import MsgSyncClient

# Initialize the client
client = MsgSyncClient(
    api_key="your-api-key",
    base_url="http://localhost:3001/api"
)

# Send a message
response = client.send_message(
    recipient="+1234567890",
    content="Hello from MsgSync Python SDK!",
    metadata={"user_id": "123"}
)

print(f"Message ID: {response['data']['id']}")

# Check status
status = client.get_message_status(response['data']['id'])
print(f"Status: {status['data']['status']}")
```

## Features

- **Sync/Async friendly**: Built on `requests` for simple synchronous usage.
- **Type Hinting**: Full support for Python type hints.
- **Reliable**: Automatic error handling and normalization.
