package common

import (
	"encoding/json"
	"testing"
)

func TestMessageSubmittedEventMarshalling(t *testing.T) {
	event := MessageSubmittedEvent{
		MessageID:      "msg-123",
		OrganizationID: "org-456",
		Recipient:      "1234567890",
		Content:        "test message",
		Profile:        "default",
		MCC:            "123",
		MNC:            "45",
	}

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal MessageSubmittedEvent: %v", err)
	}

	var unmarshaledEvent MessageSubmittedEvent
	err = json.Unmarshal(data, &unmarshaledEvent)
	if err != nil {
		t.Fatalf("Failed to unmarshal MessageSubmittedEvent: %v", err)
	}

	if unmarshaledEvent.MessageID != event.MessageID {
		t.Errorf("Expected MessageID %s, got %s", event.MessageID, unmarshaledEvent.MessageID)
	}
	if unmarshaledEvent.OrganizationID != event.OrganizationID {
		t.Errorf("Expected OrganizationID %s, got %s", event.OrganizationID, unmarshaledEvent.OrganizationID)
	}
}

func TestProviderRequestEventMarshalling(t *testing.T) {
	event := ProviderRequestEvent{
		MessageID:    "msg-123",
		ProviderID:   "prov-001",
		ProviderType: "smpp",
		Recipient:    "1234567890",
		Content:      "test message",
	}

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal ProviderRequestEvent: %v", err)
	}

	var unmarshaledEvent ProviderRequestEvent
	err = json.Unmarshal(data, &unmarshaledEvent)
	if err != nil {
		t.Fatalf("Failed to unmarshal ProviderRequestEvent: %v", err)
	}

	if unmarshaledEvent.MessageID != event.MessageID {
		t.Errorf("Expected MessageID %s, got %s", event.MessageID, unmarshaledEvent.MessageID)
	}
	if unmarshaledEvent.ProviderID != event.ProviderID {
		t.Errorf("Expected ProviderID %s, got %s", event.ProviderID, unmarshaledEvent.ProviderID)
	}
}
