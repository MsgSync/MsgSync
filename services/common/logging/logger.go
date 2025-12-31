package logging

import (
	"log/slog"
	"os"
)

// NewLogger creates a new JSON logger that writes to stdout.
func NewLogger() *slog.Logger {
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
}
