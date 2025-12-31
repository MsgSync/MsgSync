.PHONY: setup build test lint run-platform run-gateway

# Monorepo setup
setup:
	@echo "Setting up monorepo..."
	cd platform && npm install
	cd aggregator && npm install
	cd services/smpp-gateway && go mod tidy

# Build all services
build:
	@echo "Building services..."
	cd platform && npm run build
	cd services/smpp-gateway && go build -o smpp-gateway main.go

# Test all services
test:
	@echo "Running tests..."
	cd platform && npm test
	cd services/smpp-gateway && go test ./...

# Run the platform (Node.js)
run-platform:
	cd platform && npm start

# Run the SMPP gateway (Go)
run-gateway:
	cd services/smpp-gateway && ./smpp-gateway
