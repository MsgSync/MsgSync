# Multi-Protocol Support Documentation

MsgSync supports industry-standard messaging protocols for seamless integration with telecom carriers, SMS-Cs, and enterprise gateways.

---

## Supported Protocols

### 1. **SMPP (Short Message Peer-to-Peer)**

Industry-standard protocol for high-volume SMS delivery through direct carrier connections.

#### Features

- SMPP 3.4 protocol support
- Automatic delivery receipt handling
- Connection pooling and auto-reconnect
- Support for long messages (concatenated SMS)
- Configurable bind modes (transmitter, receiver, transceiver)

#### Configuration Example

```javascript
{
  "name": "Carrier SMPP Gateway",
  "type": "smpp",
  "config": {
    "host": "smpp.carrier.com",
    "port": 2775,
    "system_id": "your_system_id",
    "password": "your_password",
    "system_type": "",
    "interface_version": 52,  // 0x34 for SMPP 3.4
    "addr_ton": 1,            // Type of Number (1 = International)
    "addr_npi": 1,            // Numbering Plan Indicator (1 = ISDN)
    "address_range": ""
  }
}
```

#### Database Setup

```sql
INSERT INTO "Provider" (id, name, type, config, active, priority)
VALUES (
  gen_random_uuid(),
  'Primary SMPP Gateway',
  'smpp',
  '{
    "host": "smpp.example.com",
    "port": 2775,
    "system_id": "msgsync",
    "password": "secure_password"
  }'::jsonb,
  true,
  1
);
```

---

### 2. **SS7 (SIGTRAN M3UA/SCCP)**

Telecom-grade signaling protocol for direct SMS-C integration.

#### Features

- M3UA (MTP3 User Adaptation Layer) support
- SCCP (Signaling Connection Control Part) messaging
- Point code routing
- Global Title translation
- Delivery report handling

#### Configuration Example

```javascript
{
  "name": "SS7 SIGTRAN Gateway",
  "type": "ss7",
  "config": {
    "host": "ss7.gateway.com",
    "port": 2905,
    "pointCode": "1-2-3",
    "networkIndicator": 2,      // National
    "serviceIndicator": 3,      // SCCP
    "subsystemNumber": 6,       // HLR
    "globalTitle": "1234567890"
  }
}
```

#### Use Cases

- Direct carrier integration
- SMS-C to SMS-C routing
- International SMS delivery
- Premium messaging services

---

### 3. **HTTP/HTTPS REST API**

Standard web-based API for easy integration.

#### Features

- RESTful endpoints
- JSON request/response
- OAuth 2.0 / API Key authentication
- Webhook callbacks
- Batch messaging support

#### Already Implemented

The platform's core API (`/api/messages`) provides full HTTP/HTTPS support with:

- TLS 1.2+ encryption
- Rate limiting
- Request validation
- Comprehensive error handling

---

### 4. **Generic HTTP Provider**

Flexible adapter for third-party HTTP gateways.

#### Configuration Example

```javascript
{
  "name": "Custom SMS Gateway",
  "type": "generic-http",
  "config": {
    "url": "https://api.smsgateway.com/v1/send",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json"
    },
    "payloadTemplate": {
      "to": "{{recipient}}",
      "message": "{{content}}",
      "from": "MsgSync"
    },
    "successField": "status",
    "successValue": "sent",
    "idField": "message_id"
  }
}
```

---

## Protocol Selection Strategy

MsgSync automatically selects the best protocol based on:

1. **Provider Priority**: Configured in the database
2. **Geographic Routing**: Route-specific providers
3. **Failover**: Automatic fallback to backup providers
4. **Load Balancing**: Distribute across multiple connections

### Priority Configuration

```sql
-- Set SMPP as primary (priority 1)
UPDATE "Provider" SET priority = 1 WHERE type = 'smpp';

-- Set SS7 as backup (priority 2)
UPDATE "Provider" SET priority = 2 WHERE type = 'ss7';

-- Set HTTP as fallback (priority 3)
UPDATE "Provider" SET priority = 3 WHERE type = 'generic-http';
```

---

## Performance Benchmarks

| Protocol | Throughput     | Latency    | Use Case                     |
| -------- | -------------- | ---------- | ---------------------------- |
| **SMPP** | 100-1000 msg/s | 50-200ms   | High-volume carrier delivery |
| **SS7**  | 50-500 msg/s   | 100-500ms  | Telecom-grade routing        |
| **HTTP** | 10-100 msg/s   | 200-1000ms | Web-based integrations       |

---

## Security Considerations

### SMPP Security

- Use VPN or dedicated circuits for SMPP connections
- Implement IP whitelisting
- Rotate system_id passwords regularly
- Monitor for unauthorized bind attempts

### SS7 Security

- Deploy SS7 firewall (SS7FW)
- Implement point code filtering
- Monitor for SS7 attacks (SMS spoofing, location tracking)
- Use encrypted transport (IPsec)

### HTTP Security

- Always use HTTPS (TLS 1.2+)
- Implement API key rotation
- Use HMAC signatures for webhooks
- Rate limit per API key

---

## Monitoring & Troubleshooting

### SMPP Debugging

```bash
# Enable SMPP debug logs
export SMPP_DEBUG=true
pnpm run dev

# Monitor SMPP connections
netstat -an | grep 2775
```

### SS7 Debugging

```bash
# Capture SS7 traffic (requires root)
tcpdump -i eth0 port 2905 -w ss7_capture.pcap

# Analyze with Wireshark
wireshark ss7_capture.pcap
```

### Common Issues

**SMPP Connection Refused**

- Check firewall rules
- Verify system_id and password
- Confirm SMSC IP address

**SS7 Routing Failure**

- Verify point code configuration
- Check global title translation
- Confirm network indicator settings

**HTTP Timeout**

- Increase timeout settings
- Check gateway availability
- Verify SSL certificate validity

---

## Production Deployment

### SMPP Best Practices

1. Use connection pooling (5-10 connections per SMSC)
2. Implement automatic reconnection with exponential backoff
3. Monitor bind status and alert on failures
4. Log all PDUs for audit trail

### SS7 Best Practices

1. Deploy redundant SIGTRAN gateways
2. Use separate point codes for production/testing
3. Implement SS7 firewall rules
4. Monitor signaling link utilization

### Scaling Recommendations

- **< 10K msg/day**: Single HTTP provider
- **10K - 100K msg/day**: SMPP with 2-3 connections
- **100K - 1M msg/day**: Multiple SMPP providers + load balancing
- **> 1M msg/day**: SS7 direct carrier integration + SMPP backup

---

## License & Compliance

- SMPP protocol: Open standard (SMPP v3.4 specification)
- SS7 protocols: ITU-T standards (Q.700 series)
- Ensure compliance with local telecom regulations
- Obtain necessary carrier agreements and licenses

---

**For enterprise support and carrier integration assistance, contact: enterprise@msgsync.com**
