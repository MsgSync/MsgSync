# MsgSync PHP SDK Documentation

The MsgSync PHP SDK allows for seamless integration of messaging capabilities into any Modern PHP application (Laravel, Symfony, etc.).

## Installation

Install the library using Composer:

```bash
composer require msgsync/sdk
```

## Initialization

Create an instance of the `MsgSyncClient` using your platform API key.

```php
use MsgSync\MsgSyncClient;

$apiKey = 'your_api_key';
$client = new MsgSyncClient($apiKey);

// For local testing or custom enterprise deployments:
// $client = new MsgSyncClient($apiKey, 'http://localhost:3001/api');
```

---

## 📨 Sending Messages

### Single SMS Delivery

Send a basic message to a recipient.

```php
$response = $client->sendMessage([
    'recipient' => '+15550001122',
    'content' => 'Hello from the PHP SDK!',
    'metadata' => [
        'order_id' => '98765'
    ]
]);

echo "Message ID: " . $response['data']['id'];
```

### Track Message Status

Retrieve the current delivery status of a message.

```php
$status = $client->getMessageStatus('msg_8f3d2e1a');
echo "Current Status: " . $status['data']['status'];
```

### List Recent Activity

Get a list of the most recent message transmissions.

```php
$activity = $client->listMessages();
foreach ($activity['data'] as $message) {
    echo "ID: {$message['id']} | Status: {$message['status']}\n";
}
```

---

## 🔐 OTP (One-Time Passwords)

### Send Verification Code

Trigger an OTP delivery.

```php
// Send a 6-digit code with a 5-minute (300s) TTL
$client->sendOTP([
    'recipient' => '+15550001122',
    'length' => 6,
    'ttl' => 300
]);
```

### Verify User Code

Validate the code submitted by your user.

```php
$result = $client->verifyOTP('+15550001122', '123456');

if ($result['status'] === 'success') {
    echo "Verification successful!";
} else {
    echo "Invalid or expired code.";
}
```

---

## Error Handling

The SDK throws exceptions for API failures and platform errors.

```php
use MsgSync\Exceptions\MsgSyncAPIException;

try {
    $client->sendMessage(['recipient' => 'invalid']);
} catch (MsgSyncAPIException $e) {
    echo "API Error ({$e->getCode()}): " . $e->getMessage();
} catch (\Exception $e) {
    echo "General Error: " . $e->getMessage();
}
```

---

## Framework Integration

### Laravel Example

You can wrap the client in a Service Provider or simply use it in your controllers:

```php
public function notifyUser(User $user) {
    $client = new MsgSyncClient(config('services.msgsync.key'));
    $client->sendMessage([
        'recipient' => $user->phone,
        'content' => 'Your order has shipped!'
    ]);
}
```
