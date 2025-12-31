package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/MsgSync/MsgSync/services/common"
	"github.com/MsgSync/MsgSync/services/common/kafka"
)

const (
	ReceivedTopic = "sms.received"
	RoutedTopic   = "sms.routed"
)

type SS7Gateway struct {
	producer *kafka.Producer
	consumer *kafka.Consumer
}

func NewSS7Gateway(brokers []string) (*SS7Gateway, error) {
	return &SS7Gateway{
		producer: kafka.NewProducer(brokers, ReceivedTopic),
		consumer: kafka.NewConsumer(brokers, RoutedTopic, "ss7-gateway-group"),
	}, nil
}

func (g *SS7Gateway) Start(ctx context.Context) error {
	// Start Kafka consumer for outgoing messages
	go g.consumeOutgoing(ctx)

	log.Println("SS7 Gateway Skeleton started (SIGTRAN stack mocked due to environment limitations).")
	log.Println("Waiting for messages from Routing Engine...")

	<-ctx.Done()
	return nil
}

func (g *SS7Gateway) consumeOutgoing(ctx context.Context) {
	err := g.consumer.Consume(ctx, func(key, value []byte) error {
		var event common.ProviderRequestEvent
		if err := json.Unmarshal(value, &event); err != nil {
			return err
		}

		if event.ProviderType != "ss7" {
			return nil
		}

		log.Printf("[SS7 MOCK] Processing outgoing message: %s to %s | Content: %s",
			event.MessageID, event.Recipient, event.Content)

		// In a real implementation with working SCTP/M3UA, we would:
		// 1. Encode MAP-ForwardShortMessage
		// 2. Wrap in TCAP/SCCP
		// 3. Send over M3UA AS/ASP

		return nil
	})
	if err != nil {
		log.Printf("Consumer error: %v", err)
	}
}

func main() {
	brokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")

	gateway, err := NewSS7Gateway(brokers)
	if err != nil {
		log.Fatalf("Failed to initialize SS7 Gateway: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := gateway.Start(ctx); err != nil {
		log.Fatalf("Gateway failure: %v", err)
	}

	log.Println("SS7 Gateway shutting down.")
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
