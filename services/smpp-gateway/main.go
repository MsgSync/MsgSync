package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/linxGnu/gosmpp"
	"github.com/linxGnu/gosmpp/pdu"
)

func main() {
	fmt.Println("Starting MsgSync SMPP Gateway...")

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
		OnPDU: func(p pdu.PDU, responded bool) {
			switch pd := p.(type) {
			case *pdu.SubmitSMResp:
				log.Printf("SubmitSMResp received: ID=%s, Status=%d", pd.MessageID, pd.CommandStatus)
			case *pdu.DeliverSM:
				msg, _ := pd.Message.GetMessage()
				log.Printf("DeliverSM received: Source=%s, Content=%s", pd.SourceAddr.String(), msg)
			}
		},
		OnClosed: func(state gosmpp.State) {
			log.Printf("Connection closed: %v", state)
		},
	}, 5*time.Second)

	if err != nil {
		log.Fatalf("Failed to create session: %v", err)
	}
	defer session.Close()

	log.Printf("Bound to SMSC at %s", smscAddr)

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
