//go:build !linux
// +build !linux

package main

import (
	"context"
	"fmt"
	"io"
	"log"
)

type FallbackTransport struct {
	config *Config
}

func NewTransport(cfg *Config) SigtranTransport {
	return &FallbackTransport{config: cfg}
}

func (t *FallbackTransport) Establish(ctx context.Context) (io.WriteCloser, error) {
	log.Printf("[SIGTRAN] SIGTRAN Peer-to-Peer connectivity requires Linux SCTP kernel support.")
	log.Printf("[SIGTRAN] Configured Peer: %s | Local SPC: %d", t.config.RemoteAddress, t.config.LocalSPC)
	return nil, fmt.Errorf("SCTP transport unavailable on current platform")
}
