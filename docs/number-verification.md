# 🔍 HLR & Number Verification (MNP)

MsgSync's Verification Service allows you to inspect phone numbers in real-time using global Home Location Register (HLR) and Mobile Number Portability (MNP) registries.

---

## 🌟 Key Features

- **Real-time Carrier ID**: Identify the current mobile network operator (MNO) for any number.
- **Portability Tracking**: Detect if a number has been ported from one carrier to another.
- **Line Type Detection**: Differentiate between Mobile, Landline, VoIP, and Premium rate numbers.
- **Global MCC/MNC**: Retrieve specific Mobile Country Codes and Mobile Network Codes.
- **Smart Caching**: Indexed lookup results are cached for 30 days to reduce external API costs.
- **Verification History**: Maintain a complete audit log of all number inspections.

---

## 🏗️ How it Works

When a lookup request is initiated:

1.  **Normalization**: The phone number is cleaned of any special characters or spaces.
2.  **Cache Audit**: The system checks the local `Lookup` table for a fresh record (less than 30 days old).
3.  **Registry Query**: If no cache exists, the engine queries global telecom registries (via SS7 or provider APIs).
4.  **Data Persistence**: The response is parsed, indexed, and stored in the database for future use.

---

## 🔄 Use Cases

- **Cost Optimization**: Detect landlines or invalid numbers before sending SMS to avoid carrier charges for undeliverable messages.
- **Billing Accuracy**: Use MNP data to apply the correct pricing for ported numbers in certain regions.
- **Fraud Prevention**: Identify VoIP and high-risk numbers commonly used for bot registrations.
- **Campaign Cleanup**: Periodically scrub contact lists to remove deactivated numbers.

---

## 🚀 API Management

| Endpoint                      | Method | Description                        |
| ----------------------------- | ------ | ---------------------------------- |
| `/api/lookups/info?phone=XYZ` | GET    | Perform a real-time HLR/MNP lookup |
| `/api/lookups/recent`         | GET    | List the 100 most recent lookups   |

---

## 🛠️ Verification Console

Navigate to `/lookups` to:

- **Instant Inspection**: Manually verify any phone number using the interactive tool.
- **Detailed Insights**: View carrier names, line types, and ported status in a clean glassmorphism UI.
- **Recent Activity**: Track all verification tasks performed by your team or via API.
