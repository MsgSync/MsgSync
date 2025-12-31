package main

import (
	"time"

	"gorm.io/datatypes"
)

type Campaign struct {
	ID              string `gorm:"primaryKey"`
	Name            string
	Content         string
	Template        string
	SenderID        *string `gorm:"column:senderId"`
	Status          string  `gorm:"default:draft"`
	OrganizationID  *string `gorm:"column:organizationId"`
	ContactListID   string  `gorm:"column:contactListId"`
	TotalRecipients int     `gorm:"column:totalRecipients;default:0"`
	SentCount       int     `gorm:"column:sentCount;default:0"`
	FailedCount     int     `gorm:"column:failedCount;default:0"`
	ScheduledAt     *time.Time
	StartedAt       *time.Time
	CompletedAt     *time.Time
	Metadata        datatypes.JSON
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

type CampaignRecipient struct {
	ID         string `gorm:"primaryKey"`
	CampaignID string `gorm:"column:campaignId"`
	Phone      string
	Variables  datatypes.JSON
	Status     string  `gorm:"default:PENDING"`
	MessageID  *string `gorm:"column:messageId"`
	Error      *string
}

func (Campaign) TableName() string {
	return "Campaign"
}

func (CampaignRecipient) TableName() string {
	return "CampaignRecipient"
}
