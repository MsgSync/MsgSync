package main

import (
	"fmt"
	"msgsync"
)

func main() {
	fmt.Println("--- MsgSync Go OTP Demo ---")

	client := msgsync.NewClient("demo-api-key", "http://localhost:3001/api")
	recipient := "+15551112233"

	// 1. Send OTP
	fmt.Printf("\n1. Requesting 6-digit OTP for %s...\n", recipient)
	resp, err := client.SendOTP(recipient, 6, 300)
	if err != nil {
		fmt.Printf("Error sending OTP: %v\n", err)
		return
	}
	fmt.Printf("Status: %v\n", resp["status"])
	fmt.Printf("Message: %v\n", resp["message"])

	// 2. Verify Wrong Code
	fmt.Println("\n2. Verifying a INCORRECT code ('111111')...")
	verifyResp, err := client.VerifyOTP(recipient, "111111")
	if err != nil {
		fmt.Printf("Verification resulted in error (Expected): %v\n", err)
	} else {
		fmt.Printf("Verification Status: %v\n", verifyResp["status"])
	}

	fmt.Println("\n--- Go OTP Demo Complete ---")
}
