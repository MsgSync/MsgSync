package main

import (
	"os"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("SS7_LOCAL_SPC", "123")
	os.Setenv("SS7_REMOTE_SPC", "456")
	os.Setenv("SS7_LOCAL_ADDR", "127.0.0.1:3000")
	os.Setenv("SS7_REMOTE_ADDR", "127.0.0.1:4000")
	os.Setenv("SS7_NETWORK_IND", "5")
	os.Setenv("SS7_ROUTING_CONTEXT", "10")
	os.Setenv("KAFKA_BROKERS", "kafka:9092")

	// Clean up environment variables after test
	defer func() {
		os.Unsetenv("SS7_LOCAL_SPC")
		os.Unsetenv("SS7_REMOTE_SPC")
		os.Unsetenv("SS7_LOCAL_ADDR")
		os.Unsetenv("SS7_REMOTE_ADDR")
		os.Unsetenv("SS7_NETWORK_IND")
		os.Unsetenv("SS7_ROUTING_CONTEXT")
		os.Unsetenv("KAFKA_BROKERS")
	}()

	config := LoadConfig()

	if config.LocalSPC != 123 {
		t.Errorf("Expected LocalSPC to be 123, got %d", config.LocalSPC)
	}
	if config.RemoteSPC != 456 {
		t.Errorf("Expected RemoteSPC to be 456, got %d", config.RemoteSPC)
	}
	if config.LocalAddress != "127.0.0.1:3000" {
		t.Errorf("Expected LocalAddress to be '127.0.0.1:3000', got '%s'", config.LocalAddress)
	}
	if config.RemoteAddress != "127.0.0.1:4000" {
		t.Errorf("Expected RemoteAddress to be '127.0.0.1:4000', got '%s'", config.RemoteAddress)
	}
	if config.NetworkInd != 5 {
		t.Errorf("Expected NetworkInd to be 5, got %d", config.NetworkInd)
	}
	if config.RoutingContext != 10 {
		t.Errorf("Expected RoutingContext to be 10, got %d", config.RoutingContext)
	}
	if config.KafkaBrokers != "kafka:9092" {
		t.Errorf("Expected KafkaBrokers to be 'kafka:9092', got '%s'", config.KafkaBrokers)
	}
}

func TestGetEnvInt(t *testing.T) {
	os.Setenv("TEST_INT_KEY", "100")
	os.Setenv("TEST_INVALID_INT", "abc")
	defer func() {
		os.Unsetenv("TEST_INT_KEY")
		os.Unsetenv("TEST_INVALID_INT")
	}()

	// Test valid integer
	val := getEnvInt("TEST_INT_KEY", 0)
	if val != 100 {
		t.Errorf("Expected 100, got %d", val)
	}

	// Test invalid integer (should return fallback)
	val = getEnvInt("TEST_INVALID_INT", 50)
	if val != 50 {
		t.Errorf("Expected 50, got %d", val)
	}

	// Test non-existing key (should return fallback)
	val = getEnvInt("NON_EXISTING_KEY", 25)
	if val != 25 {
		t.Errorf("Expected 25, got %d", val)
	}
}
