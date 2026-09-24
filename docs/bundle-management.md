# 📦 Bundle & Package Management

MsgSync offers a flexible automated subscription and bundle management system. This module allows platform administrators and resellers to define SMS packages with specific limits, fees, and rules.

---

## 🌟 Key Features

- **Automated Subscriptions**: Clients can subscribe to predefined bundles, with real-time balance checks and automated credit provisioning.
- **SMS Type Constraints**: Restrict bundles to specific traffic types like `OTP`, `PROMOTIONAL`, or `TRANSACTIONAL`.
- **Sender ID Rules**: Define which bundles allow specific sender types (e.g., Shortcodes vs. Alphanumeric IDs).
- **Validity Management**: Set periods (e.g., 30 days) after which unused credits expire.
- **Auditable History**: Full visibility into subscription trends, activation history, and consumption patterns.

---

## 🏗️ Bundle Lifecycle

### 1. Definition

Administrators define bundles with parameters:

- **Price**: Cost deducted from the organization's balance upon subscription.
- **SMS Limit**: Number of credits granted.
- **Validity**: Number of days before expiration.
- **Type Restrictions**: Filters for specific message categories.

### 2. Activation & Subscription

When an organization subscribes:

1.  **Balance Check**: Balance must be `>=` bundle price.
2.  **Ledger Entry**: A `DEBIT` transaction is recorded.
3.  **Credit Grant**: A `BundleSubscription` is created with `smsRemaining` initialized to the bundle limit.
4.  **Auto-Provisioning**: The system automatically acknowledges the new credits for message sending.

### 3. Usage & Expiration

- Every message sent via a bundle-aware route decrements the `smsRemaining` count.
- Once `smsRemaining` reaches 0 or the `expiresAt` date passes, the subscription status switches to `EXPIRED`.

---

## 📈 Performance Insights

Resellers can monitor bundle popularity and conversion rates via the **Subscription History** view, allowing for data-driven adjustments to pricing and package volume.

---

## 🚀 API Integration

Bundles can be managed and subscribed to via the following endpoints:

| Endpoint                        | Method | Description                         |
| ------------------------------- | ------ | ----------------------------------- |
| `/api/bundles`                  | GET    | List available packages             |
| `/api/bundles`                  | POST   | Create a new SMS package            |
| `/api/bundles/subscribe`        | POST   | Assign a bundle to an organization  |
| `/api/bundles/organization/:id` | GET    | Get subscription history for an org |

---

## 🛠️ Management Console

Navigate to `/bundles` in the MsgSync Console to:

- **Create Packages**: Use the interactive modal to define new offers.
- **Manage Status**: Instantly activate or deactivate bundles to respond to market trends.
- **View History**: Audit recent client subscriptions across the entire reseller tree.
