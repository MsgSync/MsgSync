package main

import (
	"os"
	"testing"
)

func TestLoadConfig(t *testing.T) {
	// Set environment variables for testing
	os.Setenv("DATABASE_URL", "postgres://test:test@localhost:5432/testdb")
	os.Setenv("KAFKA_BROKERS", "kafka:9092")
	os.Setenv("REDIS_URL", "redis:6379")
	os.Setenv("PORT", "8080")
	os.Setenv("SS7_GATEWAY_URL", "http://ss7:8080")

	// Clean up environment variables after test
	defer func() {
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("KAFKA_BROKERS")
		os.Unsetenv("REDIS_URL")
		os.Unsetenv("PORT")
		os.Unsetenv("SS7_GATEWAY_URL")
	}()

	config := LoadConfig()

	if config.DatabaseURL != "postgres://test:test@localhost:5432/testdb" {
		t.Errorf("Expected DatabaseURL to be 'postgres://test:test@localhost:5432/testdb', got '%s'", config.DatabaseURL)
	}
	if config.KafkaBrokers != "kafka:9092" {
		t.Errorf("Expected KafkaBrokers to be 'kafka:9092', got '%s'", config.KafkaBrokers)
	}
	if config.RedisURL != "redis:6379" {
		t.Errorf("Expected RedisURL to be 'redis:6379', got '%s'", config.RedisURL)
	}
	if config.Port != "8080" {
		t.Errorf("Expected Port to be '8080', got '%s'", config.Port)
	}
	if config.SS7GatewayURL != "http://ss7:8080" {
		t.Errorf("Expected SS7GatewayURL to be 'http://ss7:8080', got '%s'", config.SS7GatewayURL)
	}
}

func TestGetEnv(t *testing.T) {
	os.Setenv("TEST_KEY", "test_value")
	defer os.Unsetenv("TEST_KEY")

	// Test existing key
	val := getEnv("TEST_KEY", "default")
	if val != "test_value" {
		t.Errorf("Expected 'test_value', got '%s'", val)
	}

	// Test non-existing key
	val = getEnv("NON_EXISTING_KEY", "default")
	if val != "default" {
		t.Errorf("Expected 'default', got '%s'", val)
	}
}
