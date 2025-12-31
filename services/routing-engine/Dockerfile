FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/routing-engine ./services/routing-engine

# Set workdir to the service directory
WORKDIR /app/services/routing-engine

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o routing-engine .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/routing-engine/routing-engine .

CMD ["./routing-engine"]
