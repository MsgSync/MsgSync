package main

import (
	"os"
	"strconv"
)

type Config struct {
	LocalSPC       uint32
	RemoteSPC      uint32
	LocalAddress   string
	RemoteAddress  string
	NetworkInd     uint8
	RoutingContext uint32
	KafkaBrokers   string
}

func LoadConfig() *Config {
	return &Config{
		LocalSPC:       uint32(getEnvInt("SS7_LOCAL_SPC", 100)),
		RemoteSPC:      uint32(getEnvInt("SS7_REMOTE_SPC", 200)),
		LocalAddress:   getEnv("SS7_LOCAL_ADDR", "127.0.0.1:2905"),
		RemoteAddress:  getEnv("SS7_REMOTE_ADDR", "127.0.0.1:2905"),
		NetworkInd:     uint8(getEnvInt("SS7_NETWORK_IND", 2)), // 2 = National
		RoutingContext: uint32(getEnvInt("SS7_ROUTING_CONTEXT", 1)),
		KafkaBrokers:   getEnv("KAFKA_BROKERS", "localhost:9092"),
	}
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}
