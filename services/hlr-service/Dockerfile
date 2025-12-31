FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/hlr-service ./services/hlr-service

# Set workdir to the service directory
WORKDIR /app/services/hlr-service

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o hlr-service .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/hlr-service/hlr-service .

CMD ["./hlr-service"]
