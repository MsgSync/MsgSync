package main

import (
	"context"
	"io"
)

type SigtranTransport interface {
	Establish(ctx context.Context) (io.WriteCloser, error)
}
