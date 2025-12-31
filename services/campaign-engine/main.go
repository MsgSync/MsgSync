package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/MsgSync/MsgSync/services/common"
	"github.com/MsgSync/MsgSync/services/common/kafka"
	"gorm.io/datatypes"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	SubmittedTopic = "sms.submitted"
	BatchSize      = 500
)

type CampaignEngine struct {
	db       *gorm.DB
	producer *kafka.Producer
}

func NewCampaignEngine(dsn string, brokers []string) (*CampaignEngine, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return &CampaignEngine{
		db:       db,
		producer: kafka.NewProducer(brokers, SubmittedTopic),
	}, nil
}

// ProcessCSV parses a CSV file and creates campaign recipients
func (ce *CampaignEngine) ProcessCSV(ctx context.Context, campaignID string, reader io.Reader) error {
	csvReader := csv.NewReader(reader)

	// Read header
	header, err := csvReader.Read()
	if err != nil {
		return err
	}

	phoneIdx := -1
	for i, col := range header {
		if strings.ToLower(col) == "phone" || strings.ToLower(col) == "recipient" {
			phoneIdx = i
			break
		}
	}

	if phoneIdx == -1 {
		return fmt.Errorf("phone column not found in CSV")
	}

	var recipients []CampaignRecipient
	count := 0

	for {
		record, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Printf("Error reading CSV record: %v", err)
			continue
		}

		vars := make(map[string]string)
		for i, val := range record {
			vars[header[i]] = val
		}

		varJSON, _ := json.Marshal(vars)

		recipients = append(recipients, CampaignRecipient{
			ID:         fmt.Sprintf("%s-%d", campaignID, count),
			CampaignID: campaignID,
			Phone:      record[phoneIdx],
			Variables:  datatypes.JSON(varJSON),
			Status:     "PENDING",
		})

		count++

		if len(recipients) >= BatchSize {
			if err := ce.db.Create(&recipients).Error; err != nil {
				return err
			}
			recipients = nil
		}
	}

	if len(recipients) > 0 {
		if err := ce.db.Create(&recipients).Error; err != nil {
			return err
		}
	}

	// Update campaign total
	return ce.db.Model(&Campaign{}).Where("id = ?", campaignID).Update("totalRecipients", count).Error
}

// StartCampaign enqueues all pending recipients for a campaign to Kafka
func (ce *CampaignEngine) StartCampaign(ctx context.Context, campaignID string) error {
	var campaign Campaign
	if err := ce.db.First(&campaign, "id = ?", campaignID).Error; err != nil {
		return err
	}

	ce.db.Model(&campaign).Update("status", "RUNNING").Update("startedAt", time.Now())

	var recipients []CampaignRecipient
	offset := 0

	for {
		if err := ce.db.Where("campaignId = ? AND status = ?", campaignID, "PENDING").
			Limit(BatchSize).Offset(offset).Find(&recipients).Error; err != nil {
			return err
		}

		if len(recipients) == 0 {
			break
		}

		var wg sync.WaitGroup
		for _, r := range recipients {
			wg.Add(1)
			go func(recp CampaignRecipient) {
				defer wg.Done()

				// Basic variable substitution
				content := campaign.Content
				if content == "" {
					content = campaign.Template
				}

				var vars map[string]string
				json.Unmarshal(recp.Variables, &vars)
				for k, v := range vars {
					content = strings.ReplaceAll(content, "{{"+k+"}}", v)
				}

				event := common.MessageSubmittedEvent{
					MessageID:      recp.ID,
					OrganizationID: *campaign.OrganizationID,
					Recipient:      recp.Phone,
					Content:        content,
					Profile:        "PROMOTIONAL",
				}

				val, _ := json.Marshal(event)
				if err := ce.producer.Publish(ctx, []byte(recp.ID), val); err != nil {
					log.Printf("Failed to publish campaign message %s: %v", recp.ID, err)
				} else {
					ce.db.Model(&recp).Update("status", "SENT")
				}
			}(r)
		}
		wg.Wait()

		offset += len(recipients)
	}

	ce.db.Model(&campaign).Update("status", "COMPLETED").Update("completedAt", time.Now())
	return nil
}

func (ce *CampaignEngine) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/upload" && r.Method == http.MethodPost {
		ce.handleUpload(w, r)
		return
	}
	if r.URL.Path == "/start" && r.Method == http.MethodPost {
		ce.handleStart(w, r)
		return
	}
	http.NotFound(w, r)
}

func (ce *CampaignEngine) handleUpload(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(50 << 20) // 50MB
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	campaignID := r.FormValue("campaignId")
	file, _, err := r.FormFile("csv")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	if err := ce.ProcessCSV(r.Context(), campaignID, file); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (ce *CampaignEngine) handleStart(w http.ResponseWriter, r *http.Request) {
	var body struct {
		CampaignID string `json:"campaignId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	go func() {
		ctx := context.Background()
		if err := ce.StartCampaign(ctx, body.CampaignID); err != nil {
			log.Printf("Error starting campaign %s: %v", body.CampaignID, err)
		}
	}()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"status": "accepted"})
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	brokers := strings.Split(getEnv("KAFKA_BROKERS", "localhost:9092"), ",")

	engine, err := NewCampaignEngine(dsn, brokers)
	if err != nil {
		log.Fatalf("Failed to initialize Campaign Engine: %v", err)
	}

	log.Printf("Campaign Engine initialized with %p", engine)

	port := getEnv("PORT", "3002")
	server := &http.Server{
		Addr:    ":" + port,
		Handler: engine,
	}

	go func() {
		log.Printf("Starting Campaign Engine HTTP server on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	// For POC, we could listen for a signal or another Kafka topic to start a campaign
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	<-ctx.Done()
	log.Println("Campaign Engine shutting down.")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("Server shutdown failed: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
