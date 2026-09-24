# MsgSync Go SDK Documentation

The official MsgSync Go SDK allows you to easily integrate enterprise messaging into your Go applications.

## Installation

```bash
go get github.com/msgsync/go-sdk/msgsync
```

## Initialization

Import the package and initialize the client using your API key.

```go
package main

import (
    "github.com/msgsync/go-sdk/msgsync"
    "fmt"
)

func main() {
    apiKey := "your-api-key"
    client := msgsync.NewClient(apiKey, "http://localhost:3001/api")
}
```

---

## 📨 Sending Messages

### Single SMS

Queue a single message for delivery.

```go
msg, err := client.SendMessage("+15550001122", "Hello from Go!", nil)
if err != nil {
    panic(err)
}
fmt.Printf("Message ID: %s, Status: %s\n", msg.ID, msg.Status)
```

### Get Status

Check the status of a specific message.

```go
status, err := client.GetMessageStatus("msg_8f39b2")
if err != nil {
    panic(err)
}
fmt.Printf("Current Status: %s\n", status.Status)
```

### List Recent Messages

Retrieve a list of your most recent transmissions.

```go
messages, err := client.ListMessages()
if err != nil {
    panic(err)
}
for _, msg := range messages {
    fmt.Printf("- %s: %s (%s)\n", msg.ID, msg.Recipient, msg.Status)
}
```

---

## 🔐 OTP (Verification)

### Send OTP

Trigger a 6-digit verification code.

```go
resp, err := client.SendOTP("+15550001122", 6, 300)
if err != nil {
    panic(err)
}
fmt.Println("OTP Sent successfully")
```

### Verify Code

Verify the code entered by the user.

```go
resp, err := client.VerifyOTP("+15550001122", "123456")
if err != nil {
    panic(err)
}
fmt.Println("Verification Result:", resp["status"])
```

---

## 🚀 Bulk Campaigns

### 1. Create a Contact List

```go
list, err := client.CreateList("January Newsletter")
listID := list["data"].(map[string]interface{})["id"].(string)
```

### 2. Add Contacts

```go
contacts := []map[string]interface{}{
    {"phone": "+15550001122", "firstName": "John"},
    {"phone": "+15550003344", "firstName": "Jane"},
}
client.AddContacts(listID, contacts)
```

### 3. Create & Start Campaign

```go
campaign, _ := client.CreateCampaign("Summer Sale", "Hi {{firstName}}! Use code HOT20", listID)
campaignID := campaign["data"].(map[string]interface{})["id"].(string)

client.StartCampaign(campaignID)
```

---

## Configuration Options

The `Client` struct allows for customization of the timeout and base URL:

```go
client := msgsync.NewClient(apiKey, "https://api.msgsync.io")
client.HTTPClient.Timeout = 30 * time.Second
```

## Error Handling

The SDK returns errors that include the platform's error message when available:

```go
msg, err := client.SendMessage("", "", nil)
if err != nil {
    // Output: MsgSync API Error (400): Recipient is required
    fmt.Println(err)
}
```
