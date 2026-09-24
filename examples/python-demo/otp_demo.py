import os
import sys
from msgsync import MsgSyncClient

def run_otp_demo():
    print("--- MsgSync Python OTP Demo ---")
    
    # Initialize client
    client = MsgSyncClient(api_key="demo-api-key")
    recipient = "+15550001122"

    try:
        # 1. Send OTP
        print(f"\n1. Requesting 4-digit OTP for {recipient}...")
        resp = client.send_otp(recipient=recipient, length=4, ttl=60)
        print(f"Status: {resp['status']}")
        print(f"Server Message: {resp['message']}")

        # 2. Verify Wrong Code
        print("\n2. Verifying a WRONG code ('0000')...")
        try:
            client.verify_otp(recipient=recipient, code="0000")
        except Exception as e:
            print(f"Verification failed as expected: {str(e)}")

        print("\n--- Python OTP Demo Complete ---")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    run_otp_demo()
