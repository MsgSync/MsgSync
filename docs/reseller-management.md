# 🏢 Multi-Level Client & Reseller Management

MsgSync provides a powerful hierarchical organization management system designed for SaaS providers, resellers, and enterprise environments. This module enables you to manage complex business relationships, distribute credits, and track performance across multiple tiers.

---

## 🌟 Key Features

- **Multi-Tier Hierarchy**: Support for `ADMIN`, `RESELLER`, and `CLIENT` account types.
- **Credit Distribution**: Manage balances and distribute credits from parent to child organizations.
- **Transaction Ledger**: Complete audit trail of all financial movements (Credits, Debits).
- **Interactive Console**: Breadcrumb-based navigation to explore your reseller tree.
- **Reporting Portal**: Dedicated dashboards for each organization to track their consumption and delivery rates.

* **Online Payment Integration**: Mocked support for Stripe, PayPal, and Crypto payments for client self-service.

---

## 🏗️ Hierarchical Structure

MsgSync supports an N-tier hierarchy, allowing for any number of reseller levels.

1.  **Admin (Root)**: Full control over the platform, system-wide analytics, and global provider management.
2.  **Reseller**: Can create and manage their own sub-resellers and clients. Resellers purchase bulk credits from the Admin and distribute them to their own sub-accounts.
3.  **Client**: The end-user of the messaging services. Clients use credits for sending messages, running campaigns, and OTP verification.

### Data Isolation

All messages, campaigns, and contact lists are isolated at the organization level. Parents can view aggregated reports for their children but cannot see sensitive message content or private contact details unless permissions are explicitly granted.

---

## 📈 Billing & Credits

### Balance Management

Every organization has a `balance` field (Decimal). When a message is sent, the platform checks for sufficient balance before placing the job in the queue.

### Transaction Types

- **CREDIT**: Adding funds to an organization (e.g., via top-up or parent distribution).
- **DEBIT**: Consumption of funds (e.g., sending messages or recurring platform fees).

### Payment Gateway

The billing portal supports several simulated payment methods:

- **Stripe**: Credit/Debit card processing.
- **PayPal**: Digital wallet payments.
- **Crypto**: Secure, decentralized payments via Bitcoin/Lightning.

---

## 📊 Reporting & Analytics

Each level in the hierarchy has access to a **Client-Specific Reporting Portal** which includes:

- **Volume Statistics**: Total messages sent vs. failed.
- **Status Distribution**: Real-time breakdown of message states (Delivered, Pending, Error).
- **Financial History**: A searchable ledger of all credits and payments.
- **Efficiency Trends**: Delivery success rate visualization over time.

---

## 🚀 Getting Started

### 1. Seeding the Hierarchy

Use the provided seed script to create a sample hierarchy:

```bash
cd platform
node seed-clients.js
```

### 2. Accessing the Console

Navigate to `/clients` on your local instance to start managing your organization tree.

### 3. API Integration

Organizations can be managed via the REST API:

| Endpoint                           | Method | Description                   |
| ---------------------------------- | ------ | ----------------------------- |
| `/api/organizations`               | POST   | Create a new sub-organization |
| `/api/organizations/:id`           | GET    | Get organization details      |
| `/api/organizations/:id/sub-orgs`  | GET    | List child organizations      |
| `/api/organizations/:id/balance`   | POST   | Add credits to an account     |
| `/api/organizations/:id/reporting` | GET    | Get consumption analytics     |

---

## 🛠️ Configuration

The organization system is governed by settings in `platform/prisma/schema.prisma`. Ensure you run `npx prisma generate` after any changes to the organization models.
