package main

import (
	"time"
)

type LookupRequest struct {
	Phone string `json:"phone"`
}

type LookupResponse struct {
	Phone         string    `json:"phone"`
	IsValid       bool      `json:"isValid"`
	Carrier       string    `json:"carrier"`
	MCC           string    `json:"mcc"`
	MNC           string    `json:"mnc"`
	Type          string    `json:"type"` // mobile, landline, etc.
	IsPorted      bool      `json:"isPorted"`
	LastCheckedAt time.Time `json:"lastCheckedAt"`
	Status        string    `json:"status"` // delivered, absent, unknown
}
