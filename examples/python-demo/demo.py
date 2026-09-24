import sys
import os

# Add the SDK path to sys.path so we can import it without installing
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../sdk/python')))

from msgsync import MsgSyncClient, MsgSyncError

def run_demo():
    print("--- MsgSync Python SDK Demo ---")

    # Initialize client
    client = MsgSyncClient(
        api_key="demo-api-key",
        base_url="http://localhost:3001/api"
    )

    try:
        # 1. Send a message
        print("\n1. Sending a new message...")
        send_response = client.send_message(
            recipient="+15559876543",
            content="Hello from the Python SDK demo!",
            metadata={"source": "python_script"}
        )
        
        message_id = send_response['data']['id']
        print(f"Success! Message ID: {message_id}")

        # 2. Check status
        print("\n2. Checking message status...")
        status_response = client.get_message_status(message_id)
        print(f"Current status: {status_response['data']['status']}")

        # 3. List messages
        print("\n3. Fetching recent messages...")
        messages = client.list_messages()
        print(f"Total messages in list: {len(messages)}")

    except MsgSyncError as e:
        print(f"SDK Error: {e}")
    except Exception as e:
        print(f"Unexpected Error: {e}")
        print("\nTip: Make sure the MsgSync Platform is running at http://localhost:3001")

if __name__ == "__main__":
    run_demo()
