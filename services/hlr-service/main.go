package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/MsgSync/MsgSync/services/common"
	"github.com/MsgSync/MsgSync/services/common/monitoring"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/segmentio/kafka-go"
)

// Simplified: using common monitoring package

// No local init needed

type HLRService struct {
	config     *Config
	writer     *kafka.Writer
	reader     *kafka.Reader
	pending    map[string]chan *LookupResponse
	pendingMux sync.Mutex
}

func NewHLRService(cfg *Config) *HLRService {
	w := &kafka.Writer{
		Addr:     kafka.TCP(strings.Split(cfg.KafkaBrokers, ",")...),
		Topic:    "ss7.map.request",
		Balancer: &kafka.LeastBytes{},
	}

	r := kafka.NewReader(kafka.ReaderConfig{
		Brokers: strings.Split(cfg.KafkaBrokers, ","),
		Topic:   "ss7.map.response",
		GroupID: "hlr-service-group",
	})

	return &HLRService{
		config:  cfg,
		writer:  w,
		reader:  r,
		pending: make(map[string]chan *LookupResponse),
	}
}

func (s *HLRService) RunResponseConsumer(ctx context.Context) {
	for {
		m, err := s.reader.ReadMessage(ctx)
		if err != nil {
			log.Printf("Error reading response: %v", err)
			continue
		}

		var mapResp common.MapMessage
		if err := json.Unmarshal(m.Value, &mapResp); err != nil {
			log.Printf("Error unmarshaling response: %v", err)
			continue
		}

		s.pendingMux.Lock()
		ch, ok := s.pending[mapResp.CorrelationID]
		if ok {
			delete(s.pending, mapResp.CorrelationID)
			s.pendingMux.Unlock()

			// Convert MAP response to LookupResponse
			resp := &LookupResponse{
				Phone:         mapResp.MSISDN,
				IsValid:       mapResp.Error == "",
				Carrier:       "Network Verified",
				MCC:           "Unknown",
				MNC:           "Unknown",
				Type:          "mobile",
				LastCheckedAt: time.Now(),
			monitoring.MessagesProcessed.WithLabelValues("hlr-service", "active").Inc()
			ch <- resp
		} else {
			s.pendingMux.Unlock()
		}
	}
}

func (s *HLRService) HandleLookup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LookupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	resp, err := s.doExternalLookup(ctx, req.Phone)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (s *HLRService) doExternalLookup(ctx context.Context, phone string) (*LookupResponse, error) {
	correlationID := uuid.New().String()
	ch := make(chan *LookupResponse, 1)

	s.pendingMux.Lock()
	s.pending[correlationID] = ch
	s.pendingMux.Unlock()

	defer func() {
		s.pendingMux.Lock()
		delete(s.pending, correlationID)
		s.pendingMux.Unlock()
	}()

	msg := common.MapMessage{
		CorrelationID: correlationID,
		Type:          "SRI_SM",
		MSISDN:        phone,
	}

	val, _ := json.Marshal(msg)
	if err := s.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(phone),
		Value: val,
	}); err != nil {
		lookupsTotal.WithLabelValues("failed").Inc()
		return nil, fmt.Errorf("failed to send request to SS7 gateway: %v", err)
	}

	select {
	case resp := <-ch:
		monitoring.MessagesProcessed.WithLabelValues("hlr-service", "success").Inc()
		return resp, nil
	case <-ctx.Done():
		monitoring.MessagesProcessed.WithLabelValues("hlr-service", "timeout").Inc()
		return nil, ctx.Err()
	}
}

func main() {
	cfg := LoadConfig()
	svc := NewHLRService(cfg)

	monitoring.StartMetricsServer(":8085")

	ctx := context.Background()
	go svc.RunResponseConsumer(ctx)

	http.HandleFunc("/lookup", svc.HandleLookup)

	fmt.Printf("HLR/MNP Service starting on port %s (Metrics: :8085)...\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, nil); err != nil {
		log.Fatal(err)
	}
}
