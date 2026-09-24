<?php

namespace MsgSync;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use MsgSync\Exceptions\MsgSyncAPIException;
use MsgSync\Exceptions\MsgSyncException;

class MsgSyncClient {
    private $client;
    private $apiKey;
    private $baseUrl;

    /**
     * MsgSyncClient constructor.
     * @param string $apiKey The API key for authentication
     * @param string $baseUrl The base URL of the MsgSync platform API
     */
    public function __construct(string $apiKey, string $baseUrl = 'http://localhost:3001/api') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
        $this->client = new Client([
            'base_uri' => rtrim($baseUrl, '/') . '/',
            'headers' => [
                'X-API-Key' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            'timeout' => 10.0,
        ]);
    }

    /**
     * Sends a new message.
     * @param array $params Message parameters (recipient, content, metadata, etc.)
     * @return array The API response
     * @throws MsgSyncException
     */
    public function sendMessage(array $params): array {
        return $this->request('POST', 'messages', ['json' => $params]);
    }

    /**
     * Gets the status of a specific message.
     * @param string $messageId The ID of the message
     * @return array The API response
     * @throws MsgSyncException
     */
    public function getMessageStatus(string $messageId): array {
        return $this->request('GET', "messages/{$messageId}");
    }

    /**
     * Lists messages with optional filtering.
     * @return array The API response
     * @throws MsgSyncException
     */
    public function listMessages(): array {
        return $this->request('GET', 'messages');
    }

    /**
     * Sends an OTP (One-Time Password) to a recipient.
     * @param array $params OTP parameters (recipient, length, ttl)
     * @return array The API response
     * @throws MsgSyncException
     */
    public function sendOTP(array $params): array {
        return $this->request('POST', 'otp/send', ['json' => $params]);
    }

    /**
     * Verifies an OTP code.
     * @param string $recipient Destination phone number
     * @param string $code The code to verify
     * @return array The API response
     * @throws MsgSyncException
     */
    public function verifyOTP(string $recipient, string $code): array {
        return $this->request('POST', 'otp/verify', ['json' => [
            'recipient' => $recipient,
            'code' => $code
        ]]);
    }

    /**
     * Internal request handler.
     */
    private function request(string $method, string $uri, array $options = []): array {
        try {
            $response = $this->client->request($method, $uri, $options);
            $body = $response->getBody()->getContents();
            return json_decode($body, true) ?? [];
        } catch (GuzzleException $e) {
            $this->handleGuzzleException($e);
        }
    }

    private function handleGuzzleException(GuzzleException $e) {
        $message = $e->getMessage();
        $code = $e->getCode();
        $response = null;

        if (method_exists($e, 'hasResponse') && $e->hasResponse()) {
            $response = $e->getResponse();
            $body = $response->getBody()->getContents();
            $data = json_decode($body, true);
            $errorMsg = $data['message'] ?? $message;
            throw new MsgSyncAPIException($errorMsg, $response->getStatusCode(), $data);
        }

        throw new MsgSyncException($message, $code);
    }
}
