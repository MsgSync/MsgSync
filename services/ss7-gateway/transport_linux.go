//go:build linux
// +build linux

package main

import (
	"context"
	"io"
	"log"

	"github.com/ishidawataru/sctp"
	"github.com/wmnsk/go-m3ua"
)

type LinuxTransport struct {
	config *Config
}

func NewTransport(cfg *Config) SigtranTransport {
	return &LinuxTransport{config: cfg}
}

func (t *LinuxTransport) Establish(ctx context.Context) (io.WriteCloser, error) {
	m3uaCfg := m3ua.NewConfig(
		t.config.LocalSPC,
		t.config.RemoteSPC,
		t.config.NetworkInd,
		0, // Network Appearance
		uint8(t.config.RoutingContext),
		3, // Service Indicator (SCCP)
	)

	log.Printf("[SIGTRAN] Resolving SCTP addresses for peer: %s", t.config.RemoteAddress)
	raddr, err := sctp.ResolveSCTPAddr("sctp", t.config.RemoteAddress)
	if err != nil {
		return nil, err
	}

	laddr, err := sctp.ResolveSCTPAddr("sctp", t.config.LocalAddress)
	if err != nil {
		return nil, err
	}

	log.Printf("[SIGTRAN] Dialing SCTP/M3UA peer at %s", t.config.RemoteAddress)
	conn, err := m3ua.Dial(ctx, "sctp", laddr, raddr, m3uaCfg)
	if err != nil {
		return nil, err
	}

	return conn, nil
}
