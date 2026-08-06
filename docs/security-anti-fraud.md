# 🛡️ Anti-Fraud & Carrier Security

MsgSync's security layer protects your platform from API abuse, financial fraud, and carrier-level spam rejections.

---

## 🌟 Key Features

- **IP Whitelisting**: Restrict API access to specific trusted servers per API Key.
- **Daily Spend Limits**: Set hard caps on daily consumption to prevent "runaway" costs from compromised keys.
- **Content Filtering**: Automated spam detection using keyword blacklists and frequency analysis.
- **Rate Limiting**: Configurable messages-per-second (MPS) limits to prevent engine flooding.
- **Real-time Monitoring**: Dedicated security dashboard to track rejected attempts and fraud events.

---

## 🔒 Security Tiers

### 1. Network Level (IP Whitelisting)

By default, MsgSync allows traffic from any IP if a valid API key is provided. For production environments, you can define an array of `allowedIps` in the `ApiKey` settings. Any request originating from an unauthorized IP will receive a `403 Forbidden` response with code `IP_NOT_ALLOWED`.

### 2. Financial Level (Daily Spend Limit)

To protect organizations from unexpected bulk sending costs, each account has a `maxDailySpend` attribute.

- **Check**: Before a message is queued, the system calculates the total `DEBIT` transactions for the current UTC day.
- **Rejection**: If the sum exceeds the limit, further messages are rejected with `DAILY_SPEND_LIMIT_REACHED`.

### 3. Content Level (Anti-Spam)

The `SecurityService` inspects the `content` of every message for known phishing and spam keywords (e.g., "bank account suspended", "claim lottery"). Messages matching these patterns are discarded immediately to protect your carrier reputation.

---

## 🚀 Configuration

Security settings can be updated via the API or the **Security Console**.

| Parameter       | Scope        | Description                           |
| --------------- | ------------ | ------------------------------------- |
| `maxDailySpend` | Organization | Maximum dollar amount allowed per 24h |
| `allowedIps`    | API Key      | List of authorized CIDRs/IPs          |
| `rateLimit`     | API Key      | Maximum messages allowed per second   |

---

## 🛠️ Security Console

Navigate to `/security` to:

- **Analyze rejections**: See a live feed of blocked traffic and why it was stopped.
- **Adjust Policies**: Set global default limits for new resellers and clients.
- **Monitor Fraud Trends**: Identify spike patterns that may indicate a credential leak.
