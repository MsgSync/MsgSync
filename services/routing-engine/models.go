package main

import (
	"time"

	"github.com/shopspring/decimal"
)

type Provider struct {
	ID                string `gorm:"primaryKey"`
	Name              string `gorm:"unique"`
	Type              string
	Config            []byte          `gorm:"type:jsonb"`
	Active            bool            `gorm:"default:true"`
	Priority          int             `gorm:"default:1"`
	Weight            int             `gorm:"default:100"`
	CostPerSms        decimal.Decimal `gorm:"type:decimal(10,3)"`
	SupportedPrefixes []string        `gorm:"type:text[]"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

type RoutingRule struct {
	ID             string `gorm:"primaryKey"`
	Name           string
	Prefix         *string
	MCC            *string         `gorm:"column:mcc"`
	MNC            *string         `gorm:"column:mnc"`
	OrganizationID *string         `gorm:"column:organizationId"`
	ProviderID     string          `gorm:"column:providerId"`
	Provider       Provider        `gorm:"foreignKey:ProviderID"`
	Priority       int             `gorm:"default:1"`
	LLRScore       float64         `gorm:"column:llrScore;default:0"`
	LCRRate        decimal.Decimal `gorm:"column:lcrRate;type:decimal(10,3)"`
	Active         bool            `gorm:"default:true"`
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

func (RoutingRule) TableName() string {
	return "RoutingRule"
}

func (Provider) TableName() string {
	return "Provider"
}
