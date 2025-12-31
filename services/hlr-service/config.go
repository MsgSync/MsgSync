package main

import (
	"os"
)

type Config struct {
	DatabaseURL   string
	KafkaBrokers  string
	RedisURL      string
	Port          string
	SS7GatewayURL string // If we use direct RPC/HTTP
}

func LoadConfig() *Config {
	return &Config{
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/msgsync"),
		KafkaBrokers:  getEnv("KAFKA_BROKERS", "localhost:9092"),
		RedisURL:      getEnv("REDIS_URL", "localhost:6379"),
		Port:          getEnv("PORT", "3003"),
		SS7GatewayURL: getEnv("SS7_GATEWAY_URL", "http://localhost:3004"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
