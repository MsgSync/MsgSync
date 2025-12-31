FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies for SCTP (needed for go-m3ua/sctp potentially)
RUN apk add --no-cache gcc musl-dev linux-headers

# Copy the common module which is a dependency
COPY services/common ./services/common

# Copy the service code
COPY services/ss7-gateway ./services/ss7-gateway

# Set workdir to the service directory
WORKDIR /app/services/ss7-gateway

# Download dependencies
RUN go mod download

# Build the binary
RUN go build -o ss7-gateway .

# Final stage
FROM alpine:latest

WORKDIR /app

# Install certificates and SCTP support libraries if needed at runtime
# (libsctp usually strictly needed only if CGO is used with a C library, but linux-headers are build time)
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/services/ss7-gateway/ss7-gateway .

CMD ["./ss7-gateway"]
