FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/campaign-engine ./services/campaign-engine

# Set workdir to the service directory
WORKDIR /app/services/campaign-engine

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o campaign-engine .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/campaign-engine/campaign-engine .

CMD ["./campaign-engine"]
