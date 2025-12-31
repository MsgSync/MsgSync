package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"sort"
	"strings"
	"sync"
	"syscall"

	"github.com/MsgSync/MsgSync/services/common"
	"github.com/MsgSync/MsgSync/services/common/kafka"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	SubmittedTopic = "sms.submitted"
	RoutedTopic    = "sms.routed"
	WorkerCount    = 50
)

type RoutingEngine struct {
	db       *gorm.DB
	producer *kafka.Producer
	consumer *kafka.Consumer
}

func NewRoutingEngine(dsn string, brokers []string) (*RoutingEngine, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return &RoutingEngine{
		db:       db,
		producer: kafka.NewProducer(brokers, RoutedTopic),
		consumer: kafka.NewConsumer(brokers, "routing-group", SubmittedTopic),
	}, nil
}

func (re *RoutingEngine) Start(ctx context.Context) {
	var wg sync.WaitGroup
	jobs := make(chan common.MessageSubmittedEvent, 1000)

	// Start worker pool
	for i := 0; i < WorkerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for event := range jobs {
				re.process(ctx, event)
			}
		}(i)
	}

	log.Printf("Routing Engine started with %d workers", WorkerCount)

	// Main consumption loop
	for {
		msg, err := re.consumer.Read(ctx)
		if err != nil {
			if ctx.Err() != nil {
				break
			}
			log.Printf("Consumer error: %v", err)
			continue
		}

		var event common.MessageSubmittedEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			log.Printf("Failed to unmarshal event: %v", err)
			continue
		}

		jobs <- event
	}

	close(jobs)
	wg.Wait()
}

func (re *RoutingEngine) process(ctx context.Context, event common.MessageSubmittedEvent) {
	log.Printf("Processing message %s", event.MessageID)

	provider, err := re.SelectRoute(ctx, event.OrganizationID, event.Recipient, event.MCC, event.MNC, 1)
	if err != nil {
		log.Printf("Routing failed for %s: %v", event.MessageID, err)
		// TODO: Publish routing failure event
		return
	}

	routedEvent := common.ProviderRequestEvent{
		MessageID:    event.MessageID,
		ProviderID:   provider.ID,
		ProviderType: provider.Type,
		Recipient:    event.Recipient,
		Content:      event.Content,
		Config:       provider.Config,
		Cost:         provider.CostPerSms,
	}

	val, _ := json.Marshal(routedEvent)
	if err := re.producer.Publish(ctx, []byte(event.MessageID), val); err != nil {
		log.Printf("Failed to publish routed event for %s: %v", event.MessageID, err)
	}
}

// SelectRoute implements the core LLR/LCR selection algorithm
func (re *RoutingEngine) SelectRoute(ctx context.Context, organizationID, phone, mcc, mnc string, priority int) (*Provider, error) {
	var rules []RoutingRule

	query := re.db.WithContext(ctx).Preload("Provider").Where("active = ?", true)
	if organizationID != "" {
		query = query.Where("\"organizationId\" = ? OR \"organizationId\" IS NULL", organizationID)
	} else {
		query = query.Where("\"organizationId\" IS NULL")
	}

	if err := query.Order("priority asc").Find(&rules).Error; err != nil {
		return nil, err
	}

	cleanPhone := strings.TrimPrefix(phone, "+")
	var candidates []RoutingRule

	// 1. Match MCC/MNC
	if mcc != "" && mnc != "" {
		for _, rule := range rules {
			if rule.MCC != nil && *rule.MCC == mcc && rule.MNC != nil && *rule.MNC == mnc {
				candidates = append(candidates, rule)
			}
		}
	}

	// 2. Longest Prefix Match
	if len(candidates) == 0 {
		var prefixCandidates []RoutingRule
		for _, rule := range rules {
			if rule.Prefix != nil && strings.HasPrefix(cleanPhone, *rule.Prefix) {
				prefixCandidates = append(prefixCandidates, rule)
			}
		}
		if len(prefixCandidates) > 0 {
			sort.Slice(prefixCandidates, func(i, j int) bool {
				return len(*prefixCandidates[i].Prefix) > len(*prefixCandidates[j].Prefix)
			})
			longest := len(*prefixCandidates[0].Prefix)
			for _, rule := range prefixCandidates {
				if len(*rule.Prefix) == longest {
					candidates = append(candidates, rule)
				} else {
					break
				}
			}
		}
	}

	// 3. Fallback to Global Rules
	if len(candidates) == 0 {
		for _, rule := range rules {
			if rule.Prefix == nil && rule.MCC == nil && rule.MNC == nil {
				candidates = append(candidates, rule)
			}
		}
	}

	if len(candidates) == 0 {
		return nil, fmt.Errorf("no matching route found for %s", phone)
	}

	// 4. LLR/LCR Selection
	sort.Slice(candidates, func(i, j int) bool {
		if candidates[i].Priority != candidates[j].Priority {
			return candidates[i].Priority < candidates[j].Priority
		}
		if candidates[i].LLRScore != candidates[j].LLRScore {
			return candidates[i].LLRScore < candidates[j].LLRScore
		}
		return candidates[i].LCRRate.LessThan(candidates[j].LCRRate)
	})

	return &candidates[0].Provider, nil
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	brokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")

	engine, err := NewRoutingEngine(dsn, brokers)
	if err != nil {
		log.Fatalf("Failed to initialize Routing Engine: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	engine.Start(ctx)
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
