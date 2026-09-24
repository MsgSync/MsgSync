# 📧 Campaign Management - User Guide

## Overview

The MsgSync Campaign Management system provides an intuitive, web-based interface for creating, scheduling, and managing dynamic SMS campaigns. With support for custom sender IDs, virtual numbers, and advanced scheduling, you can effortlessly engage with your audience at scale.

## Features

### 🎯 Core Capabilities

- **Dynamic Campaign Creation**: Build campaigns with personalized message templates
- **Custom Sender IDs**: Use branded alphanumeric sender IDs or virtual phone numbers
- **Smart Scheduling**: Send immediately or schedule for specific dates and times
- **Contact List Management**: Import and organize contacts with custom attributes
- **Real-time Analytics**: Track delivery status, success rates, and engagement
- **Campaign Lifecycle**: Draft, schedule, pause, resume, and complete campaigns
- **Template Variables**: Personalize messages with `{{firstName}}`, `{{lastName}}`, and custom fields

### 🔧 Advanced Features

- **Delivery Tracking**: Monitor message delivery in real-time
- **Webhook Notifications**: Receive status updates via webhooks
- **Bulk Import**: CSV and JSON support for contact lists
- **Campaign Duplication**: Clone successful campaigns quickly
- **Status Filtering**: Filter campaigns by status (draft, scheduled, running, completed, paused)
- **Search**: Find campaigns by name or content

## Getting Started

### Accessing the Campaign Manager

1. Navigate to `http://localhost:3001/campaigns.html` in your browser
2. The dashboard displays all your campaigns with key metrics

### Creating Your First Campaign

#### Step 1: Create a Contact List

1. Click **"Create New List"** in the campaign creation modal
2. Enter a list name (e.g., "VIP Customers")
3. Import contacts using CSV or JSON format:

**CSV Format:**

```csv
phone,firstName,lastName,email,tier
+1234567890,John,Doe,john@example.com,gold
+1987654321,Jane,Smith,jane@example.com,silver
```

**JSON Format:**

```json
[
  {
    "phone": "+1234567890",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "attributes": {
      "tier": "gold",
      "discount": "20"
    }
  }
]
```

4. Click **"Create List"**

#### Step 2: Create a Campaign

1. Click **"New Campaign"** button
2. Fill in campaign details:
   - **Campaign Name**: e.g., "Summer Sale 2025"
   - **Sender ID**: Optional - Use "BRAND" or "+1234567890"
   - **Message Template**: Use variables like `{{firstName}}`, `{{discount}}`
   - **Contact List**: Select your created list
   - **Scheduling**: Choose immediate or scheduled delivery
   - **Settings**: Enable tracking and webhooks as needed

3. Preview your message with sample data
4. Click **"Launch Campaign"** or **"Save Draft"**

### Message Template Variables

Use double curly braces to insert dynamic content:

```
Hi {{firstName}}!

Use code {{code}} for {{discount}}% off your next purchase.
Valid until {{expiryDate}}.

- {{brandName}}
```

**Available Variables:**

- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{phone}}` - Contact's phone number
- `{{email}}` - Contact's email
- Any custom attribute from contact data

### Sender ID Configuration

#### Alphanumeric Sender ID

- Format: 1-11 alphanumeric characters
- Example: `BRAND`, `ACME`, `SALE2025`
- Best for: Brand recognition
- Note: Not all carriers support alphanumeric sender IDs

#### Virtual Number

- Format: E.164 phone number format
- Example: `+1234567890`
- Best for: Two-way messaging, compliance
- Note: Requires number provisioning

## Campaign Lifecycle

### Campaign Statuses

1. **Draft**: Campaign created but not launched
2. **Scheduled**: Campaign set to launch at a future time
3. **Running**: Campaign actively sending messages
4. **Paused**: Campaign temporarily stopped
5. **Completed**: All messages sent

### Managing Campaigns

#### Launch a Campaign

- Click the **Play** icon on a draft campaign
- Or use **"Launch Campaign"** in the creation modal
- Confirms before sending to all recipients

#### Pause a Campaign

- Click the **Pause** icon on a running campaign
- Messages in queue will be held
- Can be resumed later

#### Resume a Campaign

- Click the **Play** icon on a paused campaign
- Queued messages will continue sending

#### Delete a Campaign

- Click the **Trash** icon
- Only draft, scheduled, or completed campaigns can be deleted
- Running campaigns must be paused first

#### Duplicate a Campaign

- Click the **Copy** icon
- Creates a draft copy with "(Copy)" suffix
- Useful for recurring campaigns

## API Integration

### Create Campaign via API

```bash
curl -X POST http://localhost:3001/api/bulk/campaigns \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flash Sale",
    "template": "Hi {{firstName}}! Flash sale: {{discount}}% off!",
    "contactListId": "list-id-here",
    "senderId": "BRAND",
    "scheduledAt": "2025-12-31T10:00:00Z",
    "enableTracking": true,
    "enableWebhooks": true
  }'
```

### Get All Campaigns

```bash
curl -X GET http://localhost:3001/api/bulk/campaigns \
  -H "X-API-Key: your-api-key"
```

### Launch Campaign

```bash
curl -X POST http://localhost:3001/api/bulk/campaigns/{id}/start \
  -H "X-API-Key: your-api-key"
```

### Pause Campaign

```bash
curl -X POST http://localhost:3001/api/bulk/campaigns/{id}/pause \
  -H "X-API-Key: your-api-key"
```

### Resume Campaign

```bash
curl -X POST http://localhost:3001/api/bulk/campaigns/{id}/resume \
  -H "X-API-Key: your-api-key"
```

### Delete Campaign

```bash
curl -X DELETE http://localhost:3001/api/bulk/campaigns/{id} \
  -H "X-API-Key: your-api-key"
```

## Best Practices

### Message Content

1. **Keep it concise**: SMS has 160 character limit (or 70 for Unicode)
2. **Clear call-to-action**: Tell recipients what to do next
3. **Include opt-out**: Add "Reply STOP to unsubscribe" for marketing
4. **Test templates**: Use preview to verify variable substitution
5. **Avoid spam triggers**: Don't use excessive caps or special characters

### Sender ID Selection

1. **Brand consistency**: Use the same sender ID across campaigns
2. **Compliance**: Check local regulations for sender ID requirements
3. **Two-way messaging**: Use virtual numbers if replies are expected
4. **Testing**: Test sender ID display on different carriers

### Scheduling

1. **Time zones**: Consider recipient time zones
2. **Business hours**: Schedule during appropriate hours (9 AM - 8 PM)
3. **Avoid weekends**: Unless appropriate for your audience
4. **Peak times**: Avoid sending during known low-engagement periods

### Contact Management

1. **Segmentation**: Create targeted lists for better engagement
2. **Data quality**: Validate phone numbers before import
3. **Opt-in compliance**: Only message contacts who opted in
4. **Regular cleanup**: Remove bounced or opted-out contacts

## Troubleshooting

### Campaign Not Sending

**Issue**: Campaign stuck in "running" status but no messages sent

**Solutions**:

- Check if contact list has valid phone numbers
- Verify API key has sufficient permissions
- Check message queue is running: `docker-compose ps`
- Review logs: `docker-compose logs platform`

### Sender ID Not Displaying

**Issue**: Messages show a number instead of sender ID

**Solutions**:

- Verify sender ID format (alphanumeric 1-11 chars)
- Check carrier support for alphanumeric sender IDs
- Try using a virtual number instead
- Contact your SMS provider for sender ID registration

### Template Variables Not Replacing

**Issue**: Messages show `{{firstName}}` instead of actual names

**Solutions**:

- Verify contact data includes the field
- Check spelling matches exactly (case-sensitive)
- Ensure contact import was successful
- Review campaign template syntax

### High Failure Rate

**Issue**: Many messages showing "failed" status

**Solutions**:

- Validate phone number format (E.164 recommended)
- Check provider configuration and credentials
- Review error messages in message details
- Verify sufficient provider credits/balance

## Analytics & Reporting

### Campaign Metrics

The dashboard displays:

- **Total Messages**: Number of messages created
- **Delivered**: Successfully delivered messages
- **Pending**: Messages in queue or sending
- **Failed**: Messages that failed to deliver

### Viewing Campaign Details

1. Click on any campaign card
2. View detailed metrics:
   - Campaign information
   - Message template
   - Recipient count
   - Performance breakdown

### Export Data

Use the API to fetch campaign data for external analysis:

```bash
curl -X GET http://localhost:3001/api/bulk/campaigns/{id} \
  -H "X-API-Key: your-api-key" > campaign-data.json
```

## Security & Compliance

### Data Protection

- All campaign data is encrypted at rest
- API keys required for all operations
- Organization-level data isolation
- GDPR-compliant data handling

### Compliance Features

- **Opt-out management**: Track and respect opt-outs
- **Consent tracking**: Store consent timestamps
- **Data retention**: Configure retention policies
- **Audit logs**: Track all campaign operations

### Rate Limiting

- API endpoints are rate-limited
- Prevents abuse and ensures fair usage
- Contact support for rate limit increases

## Support

### Getting Help

- **Documentation**: [Full API Docs](http://localhost:3001/docs)
- **GitHub Issues**: [Report bugs](https://github.com/MsgSync/MsgSync/issues)
- **Email**: support@khulnasoft.com
- **Discord**: [Join community](https://discord.gg/msgsync)

### Feature Requests

Submit feature requests via GitHub Issues with the `enhancement` label.

---

**Built with ❤️ by the MsgSync Team**

_Effortless Campaign Management for Modern Businesses_
