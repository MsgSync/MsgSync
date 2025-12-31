FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/smpp-gateway ./services/smpp-gateway

# Set workdir to the service directory
WORKDIR /app/services/smpp-gateway

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o smpp-gateway .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/smpp-gateway/smpp-gateway .

# Expose port (assuming standard SMPP port or metrics port, but purely internal usually)
# Adjust if necessary based on config.
# EXPOSE 2775

CMD ["./smpp-gateway"]
