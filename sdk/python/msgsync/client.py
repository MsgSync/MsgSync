import requests
from typing import Dict, Any, List, Optional
from .exceptions import MsgSyncAPIError

class MsgSyncClient:
    """
    MsgSync API Client for Python.
    """
    
    def __init__(self, api_key: str, base_url: str = "http://localhost:3001/api"):
        """
        Initialize the MsgSync client.
        
        :param api_key: Your MsgSync API key
        :param base_url: The base URL of the MsgSync platform
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        })

    def send_message(self, recipient: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send an SMS message.
        
        :param recipient: Destination phone number
        :param content: Message body
        :param metadata: Optional metadata
        :return: API response as a dictionary
        """
        payload = {
            "recipient": recipient,
            "content": content
        }
        if metadata:
            payload["metadata"] = metadata
            
        return self._request("POST", "/messages", json=payload)

    def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """
        Get the status of a specific message.
        
        :param message_id: The unique ID of the message
        :return: API response as a dictionary
        """
        return self._request("GET", f"/messages/{message_id}")

    def list_messages(self) -> List[Dict[str, Any]]:
        """
        List recent messages.
        """
        response = self._request("GET", "/messages")
        return response.get("data", [])

    def send_otp(self, recipient: str, length: int = 6, ttl: int = 300) -> Dict[str, Any]:
        """
        Send an OTP code.
        """
        payload = {
            "recipient": recipient,
            "length": length,
            "ttl": ttl
        }
        return self._request("POST", "/otp/send", json=payload)

    def verify_otp(self, recipient: str, code: str) -> Dict[str, Any]:
        """
        Verify an OTP code.
        """
        payload = {
            "recipient": recipient,
            "code": code
        }
        return self._request("POST", "/otp/verify", json=payload)

    def create_list(self, name: str) -> Dict[str, Any]:
        """
        Create a new contact list.
        """
        return self._request("POST", "/bulk/lists", json={"name": name})

    def add_contacts(self, list_id: str, contacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Import contacts into a list.
        """
        return self._request("POST", f"/bulk/lists/{list_id}/contacts", json={"contacts": contacts})

    def create_campaign(self, name: str, template: str, contact_list_id: str, scheduled_at: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a communication campaign.
        """
        payload = {
            "name": name,
            "template": template,
            "contactListId": contact_list_id
        }
        if scheduled_at:
            payload["scheduledAt"] = scheduled_at
        return self._request("POST", "/bulk/campaigns", json=payload)

    def start_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """
        Trigger a campaign.
        """
        return self._request("POST", f"/bulk/campaigns/{campaign_id}/start")

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        """
        Internal helper for making HTTP requests.
        """
        url = f"{self.base_url}{path}"
        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self._handle_error(e)

    def _handle_error(self, e: requests.exceptions.RequestException):
        """
        Handle and normalize API errors.
        """
        if e.response is not None:
            try:
                data = e.response.json()
                message = data.get("message", str(e))
                status_code = e.response.status_code
            except Exception:
                message = str(e)
                status_code = e.response.status_code
            raise MsgSyncAPIError(f"MsgSync API Error ({status_code}): {message}", status_code=status_code)
        raise e
