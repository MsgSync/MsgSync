package main

import (
	"fmt"
	"log"
	
	"github.com/MsgSync/msgsync-sdk-go"
)

func main() {
	fmt.Println("--- MsgSync Go SDK Demo ---")

	// Initialize the client
	client := msgsync.NewClient("demo-api-key", "http://localhost:3001/api")

	// 1. Send a message
	fmt.Println("\n1. Sending a new message...")
	msg, err := client.SendMessage("+12223334444", "Hello from the Go SDK demo!", map[string]interface{}{
		"language": "go",
		"env":      "demo",
	})
	if err != nil {
		log.Fatalf("Failed to send message: %v", err)
	}
	fmt.Printf("Success! Message ID: %s\n", msg.ID)

	// 2. Check status
	fmt.Println("\n2. Checking message status...")
	status, err := client.GetMessageStatus(msg.ID)
	if err != nil {
		log.Fatalf("Failed to get status: %v", err)
	}
	fmt.Printf("Current status: %s\n", status.Status)

	// 3. List messages
	fmt.Println("\n3. Fetching recent messages...")
	messages, err := client.ListMessages()
	if err != nil {
		log.Fatalf("Failed to list messages: %v", err)
	}
	fmt.Printf("Total messages in list: %d\n", len(messages))
}
