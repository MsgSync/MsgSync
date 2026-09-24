# MsgSync Python SDK Documentation

The MsgSync Python SDK provides a simple and powerful way to integrate enterprise messaging into your Python applications.

## Installation

Install the SDK using pip:

```bash
pip install msgsync
```

## Initialization

Initialize the `MsgSyncClient` with your API key.

```python
from msgsync import MsgSyncClient

# Initialize with your API key
client = MsgSyncClient(api_key="your_api_key")

# Optional: Specify a custom base URL for local development or enterprise instances
# client = MsgSyncClient(api_key="your_api_key", base_url="http://localhost:3001/api")
```

---

## 📨 Message Management

### Send a Single SMS

Queue a message for immediate or future delivery.

```python
response = client.send_message(
    recipient="+15550001122",
    content="Hello from the MsgSync Python SDK!",
    metadata={"customer_id": "12345"}
)

print(f"Message ID: {response['data']['id']}")
```

### Get Message Status

Retrieve real-time status updates for a specific message.

```python
status = client.get_message_status("msg_8f3d2e1a")
print(f"Status: {status['data']['status']}")
```

### List Recent Messages

Fetch a list of recent transmissions.

```python
messages = client.list_messages()
for msg in messages:
    print(f"{msg['id']}: {msg['status']} to {msg['recipient']}")
```

---

## 🔐 OTP Verification

### Send an OTP

Generate and send a secure verification code.

```python
# Send a 6-digit code valid for 5 minutes
client.send_otp(recipient="+15550001122", length=6, ttl=300)
```

### Verify a Code

Verify the code provided by the user.

```python
verification = client.verify_otp(recipient="+15550001122", code="123456")

if verification.get("status") == "success":
    print("User verified successfully!")
else:
    print("Invalid or expired code.")
```

---

## 🚀 Bulk Campaigns & Lists

### Create a Contact List

```python
list_res = client.create_list(name="Winter Sale Prospects")
list_id = list_res["data"]["id"]
```

### Import Contacts

```python
contacts = [
    {"phone": "+15550001122", "firstName": "Alice"},
    {"phone": "+15550003344", "firstName": "Bob"}
]
client.add_contacts(list_id=list_id, contacts=contacts)
```

### Launch a Campaign

```python
campaign = client.create_campaign(
    name="Holiday Promotion",
    template="Hi {{firstName}}! Use code XMAS25 for 25% off.",
    contact_list_id=list_id
)

client.start_campaign(campaign_id=campaign["data"]["id"])
```

---

## Error Handling

The SDK raises a `MsgSyncAPIError` for any non-2xx API responses.

```python
from msgsync.exceptions import MsgSyncAPIError

try:
    client.send_message(recipient="", content="")
except MsgSyncAPIError as e:
    print(f"Error ({e.status_code}): {e.message}")
```
