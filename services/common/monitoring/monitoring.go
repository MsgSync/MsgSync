package monitoring

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// MessagesProcessed counts the number of messages processed by a service
	MessagesProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "msgsync_messages_processed_total",
			Help: "Total number of messages processed.",
		},
		[]string{"service", "status"},
	)

	// ProcessingDuration tracks the time taken to process a message
	ProcessingDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "msgsync_processing_duration_seconds",
			Help:    "Time taken to process a message.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"service", "operation"},
	)
)

func init() {
	// Register metrics with Prometheus
	prometheus.MustRegister(MessagesProcessed)
	prometheus.MustRegister(ProcessingDuration)
}

// StartMetricsServer starts an HTTP server to expose Prometheus metrics
func StartMetricsServer(addr string) {
	http.Handle("/metrics", promhttp.Handler())
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})
	go http.ListenAndServe(addr, nil)
}
