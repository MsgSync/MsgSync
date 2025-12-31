package main

import (
	"os"
	"time"

	"github.com/MsgSync/MsgSync/services/common/logging"
	"github.com/MsgSync/MsgSync/services/common/monitoring"
	"github.com/linxGnu/gosmpp"
	"github.com/linxGnu/gosmpp/pdu"
)

func main() {
	logger := logging.NewLogger()
	logger.Info("Starting MsgSync SMPP Gateway...")

	monitoring.StartMetricsServer(":8081")

	// Configuration from environment
	smscAddr := getEnv("SMSC_ADDR", "localhost:2775")
	systemID := getEnv("SMSC_SYSTEM_ID", "msgsync")
	password := getEnv("SMSC_PASSWORD", "secret")

	// Create Auth
	auth := gosmpp.Auth{
		SMSC:       smscAddr,
		SystemID:   systemID,
		Password:   password,
		SystemType: "",
	}

	// Create Connector (Transceiver)
	connector := gosmpp.TRXConnector(gosmpp.NonTLSDialer, auth)

	// Create Session
	session, err := gosmpp.NewSession(connector, gosmpp.Settings{
		EnquireLink: 20 * time.Second,
		ReadTimeout: 60 * time.Second,
		OnPDU: func(p pdu.PDU, responded bool) {
			switch pd := p.(type) {
			case *pdu.SubmitSMResp:
				logger.Info("SubmitSMResp received", "id", pd.MessageID, "status", pd.CommandStatus)
				if pd.CommandStatus == 0 {
					monitoring.MessagesProcessed.WithLabelValues("smpp-gateway", "success").Inc()
				} else {
					monitoring.MessagesProcessed.WithLabelValues("smpp-gateway", "failed").Inc()
				}
			case *pdu.DeliverSM:
				msg, _ := pd.Message.GetMessage()
				logger.Info("DeliverSM received", "source", pd.SourceAddr.String(), "content", msg)
			}
		},
		OnClosed: func(state gosmpp.State) {
			logger.Info("Connection closed", "state", state)
		},
	}, 5*time.Second)

	if err != nil {
		logger.Error("Failed to create session", "error", err)
		os.Exit(1)
	}
	defer session.Close()

	logger.Info("Bound to SMSC", "addr", smscAddr)

	// Keep alive
	for {
		time.Sleep(1 * time.Minute)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
