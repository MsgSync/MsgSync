<?php

require_once __DIR__ . '/../../sdk/php/src/MsgSyncClient.php';
require_once __DIR__ . '/../../sdk/php/src/Exceptions/MsgSyncException.php';
require_once __DIR__ . '/../../sdk/php/src/Exceptions/MsgSyncAPIException.php';

// In a real app, you would use composer autoload:
// require_once 'vendor/autoload.php';

use MsgSync\MsgSyncClient;
use MsgSync\Exceptions\MsgSyncException;

echo "--- MsgSync PHP SDK Demo ---\n\n";

$client = new MsgSyncClient('demo-api-key', 'http://localhost:3001/api');

try {
    // 1. Send a message
    echo "1. Sending a new message...\n";
    $result = $client->sendMessage([
        'recipient' => '+12223334444',
        'content' => 'Hello from PHP SDK!',
        'metadata' => ['env' => 'demo']
    ]);
    echo "Message Sent! ID: " . $result['data']['id'] . "\n\n";

    // 2. Get status
    $messageId = $result['data']['id'];
    echo "2. Checking status for ID: $messageId...\n";
    $status = $client->getMessageStatus($messageId);
    echo "Current Status: " . $status['data']['status'] . "\n\n";

    // 3. OTP Flow
    echo "3. Testing OTP Flow...\n";
    $otpResponse = $client->sendOTP([
        'recipient' => '+15554443322',
        'length' => 4,
        'ttl' => 120
    ]);
    echo "OTP Status: " . $otpResponse['status'] . "\n";
    echo "Message: " . $otpResponse['message'] . "\n\n";

    echo "--- Demo Complete ---\n";

} catch (MsgSyncException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    if (method_exists($e, 'getErrorResponse')) {
        print_r($e->getErrorResponse());
    }
}
