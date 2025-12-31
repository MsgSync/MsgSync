package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"io"

	"github.com/MsgSync/MsgSync/services/common"
	"github.com/MsgSync/MsgSync/services/common/kafka"
	"github.com/MsgSync/MsgSync/services/common/monitoring"
	"github.com/prometheus/client_golang/prometheus"
)

const (
	ReceivedTopic = "sms.received"
	RoutedTopic   = "sms.routed"
)

type SS7Gateway struct {
	producer  *kafka.Producer
	consumer  *kafka.Consumer
	conn      io.WriteCloser
	config    *Config
	transport SigtranTransport
}

func NewSS7Gateway(brokers []string, cfg *Config, transport SigtranTransport) (*SS7Gateway, error) {
	return &SS7Gateway{
		producer:  kafka.NewProducer(brokers, ReceivedTopic),
		consumer:  kafka.NewConsumer(brokers, RoutedTopic, "ss7-gateway-group"),
		config:    cfg,
		transport: transport,
	}, nil
}

func (g *SS7Gateway) Start(ctx context.Context) error {
	log.Printf("Initializing SS7 Service (Local SPC: %d, Remote SPC: %d)", g.config.LocalSPC, g.config.RemoteSPC)

	// Attempt Connection via platform-specific transport bridge
	conn, err := g.transport.Establish(ctx)
	if err != nil {
		log.Printf("SIGTRAN Connectivity Note: %v", err)
	} else {
		g.conn = conn
		defer g.conn.Close()
	}

	// Start Kafka consumer for outgoing messages
	go g.consumeOutgoing(ctx)

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

		timer := monitoring.ProcessingDuration.WithLabelValues("ss7-gateway", "map-forward")
		obs := prometheus.NewTimer(timer)
		defer obs.ObserveDuration()

		// In a real implementation with working SCTP/M3UA, we would:
		// 1. Encode MAP-ForwardShortMessage
		// 2. Wrap in TCAP/SCCP
		// 3. Send over M3UA AS/ASP

		if g.conn != nil {
			// Mock SCCP payload wrap
			payload := []byte(event.Content)
			if _, err := g.conn.Write(payload); err != nil {
				log.Printf("Failed to write to SS7 connection: %v", err)
				monitoring.MessagesProcessed.WithLabelValues("ss7-gateway", "failed").Inc()
				return err
			}
		} else {
			log.Printf("[SS7 MOCK] SS7 connection unavailable, simulating success.")
		}

		monitoring.MessagesProcessed.WithLabelValues("ss7-gateway", "success").Inc()

		return nil
	})
	if err != nil {
		log.Printf("Consumer error: %v", err)
	}
}

func main() {
	brokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")

	monitoring.StartMetricsServer(":8084")

	cfg := LoadConfig()

	// Select transport based on environment (handled by build tags, but we also initialize here)
	var transport SigtranTransport
	// This is a simple logic for the entry point
	transport = &FallbackTransport{config: cfg}

	gateway, err := NewSS7Gateway(brokers, cfg, transport)
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
