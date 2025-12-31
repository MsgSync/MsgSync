package common

import (
	"encoding/json"

	"github.com/shopspring/decimal"
)

type MessageSubmittedEvent struct {
	MessageID      string `json:"message_id"`
	OrganizationID string `json:"organization_id"`
	Recipient      string `json:"recipient"`
	Content        string `json:"content"`
	Profile        string `json:"profile"`
	MCC            string `json:"mcc"`
	MNC            string `json:"mnc"`
}

type ProviderRequestEvent struct {
	MessageID    string          `json:"message_id"`
	ProviderID   string          `json:"provider_id"`
	ProviderType string          `json:"provider_type"`
	Recipient    string          `json:"recipient"`
	Content      string          `json:"content"`
	Config       json.RawMessage `json:"config"`
	Cost         decimal.Decimal `json:"cost"`
}

// MapMessage represents a MAP (Mobile Application Part) request/response
// that will be sent via Kafka between HLR service and SS7 gateway.
type MapMessage struct {
	CorrelationID string `json:"correlationId"`
	Type          string `json:"type"` // SRI_SM, ATI
	MSISDN        string `json:"msisdn"`
	IMSI          string `json:"imsi,omitempty"`
	VLR           string `json:"vlr,omitempty"`
	Error         string `json:"error,omitempty"`
}
