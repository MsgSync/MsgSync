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
