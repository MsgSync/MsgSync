# 🛣️ Intelligent Routing & Failover

MsgSync's routing engine ensures maximum delivery reliability at the lowest possible cost. This module implements dynamic Least-Cost Routing (LCR) and automated provider failover.

---

## 🌟 Key Features

- **Least-Cost Routing (LCR)**: Automatically select the cheapest carrier based on the recipient's phone prefix.
- **Dynamic Failover**: If the primary provider fails, the system instantly retries through the next best provider in the priority list.
- **Prefix-Specific Rules**: Set custom routing logic for specific countries or mobile network codes (MNC).
- **Organization Overrides**: Resellers can set specific routing rules for their sub-accounts.
- **Carrier Health Monitoring**: Real-time tracking of provider latency and success rates.

---

## 🏗️ Routing Logic

When a message is placed in the queue, the `RoutingService` executes the following decision tree:

1.  **Prefix Match**: Checks for custom `RoutingRule` entries matching the longest prefix of the recipient's phone number.
2.  **Organization Level**: Prioritizes rules set specifically for the sender's organization over global system rules.
3.  **Priority Sorting**: Sorts matching providers by pre-assigned `priority` (P1, P2, etc.).
4.  **Capability Check**: Verifies that the provider supports the specific network prefix.

---

## 🔄 Failover Mechanism

The `ProviderService` implements a recursive retry loop:

- **Attempt 1**: Primary provider (Lowest priority number).
- **Failure**: If a timeout or carrier error occurs, the provider status is logged.
- **Attempt 2**: Secondary provider (Next in priority).
- **Resolution**: Continues until success or all matching providers are exhausted.

---

## 🚀 API Management

Routing rules can be managed via the REST API:

| Endpoint           | Method | Description                       |
| ------------------ | ------ | --------------------------------- |
| `/api/routing`     | GET    | List all active routing rules     |
| `/api/routing`     | POST   | Create a new prefix-specific rule |
| `/api/routing/:id` | DELETE | Remove a routing rule             |

---

## 🛠️ Management Console

Navigate to `/routing` to:

- **Analyze Rules**: View the active hierarchy of carrier priority.
- **Monitor Health**: See live uptime and latency stats for all integrated carriers (SMPP, Twilio, SS7, etc.).
- **Global Priority**: Adjust the default system priority for world-wide traffic.
