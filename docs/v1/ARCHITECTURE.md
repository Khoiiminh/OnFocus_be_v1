# OnFocus
**OnFocus** is a cross-platform web application that centralizes user communications from external services such as **Gmail** and **LinkedIn** into a single, unified inbox experience.

OnFocus listens for **near-real-time mailbox and notification changes** from connected platforms and incrementally synchronizes new items into its own system. When a new email or notification arrives, OnFocus promptly detects the change, retrieves the necessary metadata (such as sender, subject, timestamp, and preview), and updates the user’s inbox view without requiring manual refresh.

Full message or notification content is fetched **on demand** when the user selects an item, ensuring fast inbox updates, efficient API usage, and scalable synchronization. 



    - users
    - external services ( service-based source in OnFocus - e.g., Gmail, LinkedIn )
    - sessions auth-based
    - connected accounts ( users' Gmail accounts, users' LinkedIn accounts )
    - inbox 
    - inbox content


## **Stacks:**
### Frontend:
    - React Vite, JavaScript, CSS
    - React-router-dom for navigation
    - Storybook for developing components
    - Redux toolkit for data fetching and state management
### Backend:
    - node.js express.js
    - Session id for authorization and authentication
    - **MAYBE** axios (LinkedIn fetch due to its lack of pubsub support)
    - dotenvx 
    - joi ( request validation )  
    - express-rate-limit ( Rate Limiting )
### Database:
    - MySQL ( hosted on Aiven )
    - Flyway for database migrations
### External services:
    - Gmail
    - LinkedIn's notifications and the full context in each notification
### Query:                                                  ******
    - PLain SQL query 
    - mysql2/promise                                        ******
    - small database wrapper                                ******
    - transaction helper                                    ******
### Background Worker Runtime: (run in same repo but separate process)
    - Gmail webhook endpoint (Pub/Sub push)
    - LinkedIn polling worker
    - Token refresh scheduler
### Logging:
    - Wiston


## Architecture:
    - Event-Driven architecture
    - Gmail ( Google Pub/Sub )
    - LinkedIn ( don't know yet )

## Structural Organization:
- Feature-based / vertical slice
Structure by domain:

```
src/
modules/
  auth/
    auth.controller.ts
    auth.service.ts
    auth.routes.ts
  connected-accounts/
  inbox/
  sessions/
  oauth/
```
Each feature owns:

    - Routes
    - Business logic
    - DB logic
    - Events
  
### Recommanded:

src/
├── app/                      # Application bootstrap & global wiring
│   ├── app.js                # Express app (middlewares, routes mounting)
│   ├── server.js             # HTTP server startup
│   └── config/               # Centralized configuration layer
│       ├── env.js            # Environment variable validation (zod/joi)
│       ├── app.config.js     # App-level settings (port, cors, rate limits)
│       ├── db.config.js      # Database configuration
│       └── logger.config.js  # Winston configuration
│
├── infrastructure/           # External systems & technical adapters
│   ├── database/             # MySQL connection & transaction helpers
│   │   ├── connection.js
│   │   └── transaction.js    # MORE DETAILS BELOW
│   │
│   ├── logger/               # Winston logger wrapper
│   │   └── logger.js
│   │
│   ├── pubsub/               # Gmail Pub/Sub handling (webhook verification, decoding)
│   │   └── gmail.js
│   │
│   ├── http/                 # Outbound HTTP clients (Axios instance)
│   │   └── axios.js
│   │
│   └── sync/                 # Ingestion layer (event-driven sync mechanics)
│       ├── gmail/            # Gmail history sync logic
│       └── linkedin/         # LinkedIn polling logic
│
├── modules/                  # Business domains (core application logic)
│   │
│   ├── auth/                 # Login / register / credential validation
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js      # SQL queries, data persistent logic, row mapping, transaction (sometimes delegated)
│   │   ├── auth.routes.js
│   │   └── auth.validator.js       # joi stays here
│   │
│   ├── users/                # User profile & management logic
│   │
│   ├── sessions/             # Session creation, validation, revocation
│   │
│   ├── external-services/    # Supported providers (Gmail, LinkedIn metadata)
│   │
│   ├── connected-accounts/   # OAuth tokens + sync state boundary
│   │
│   ├── inbox/                # Inbox list (metadata, unread, archive, delete)
│   │
│   ├── inbox-content/        # Lazy-loaded full content
│   │
│   └── oauth/                # OAuth flows (provider-specific)
│       ├── google/
│       └── linkedin/
│
├── shared/                   # Cross-cutting utilities & contracts
│   ├── constants/            # Enums (sync_status, roles, error codes)
│   ├── errors/               # Custom error classes
│   ├── events/               # Domain event names & simple emitter
│   ├── middleware/           # Auth middleware, error handler, rate limit
│   ├── types/                # Shared TypeScript types (if TS later)
│   └── utils/                # Pure utility helpers
│
└── worker/                   # Background process runtime (separate process)
    ├── index.js              # Worker bootstrap
    └── jobs/                 # Scheduled / polling jobs
        ├── linkedin-poll.job.js
        └── token-refresh.job.js

### transaction.js ( infrastructure/database/ )

#### What Problem Does It Solve?

Imagine this flow in OnFocus:

Insert new inbox item

Insert inbox metadata

Update sync cursor

Log sync event

If step 3 fails…

Without a transaction:

Step 1 and 2 are already committed

Database is now inconsistent

You have partial state

Your sync logic breaks

With a transaction:

Either ALL steps succeed

Or EVERYTHING rolls back

That’s atomicity (ACID principle).

#### What transaction.js Should Handle

It should:

Open DB connection

Begin transaction

Commit if success

Rollback if error

Release connection

Bubble error upward

It should NOT:

Contain business logic

Contain SQL

Know about inbox/users/etc

It is purely infrastructure.

Clean Implementation (mysql2/promise)
const pool = require('./connection');

async function withTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { withTransaction };

How You Use It (Service Layer)

Example: Gmail sync ingestion

const { withTransaction } = require('../../infrastructure/database/transaction');
const inboxRepo = require('./inbox.repository');
const syncRepo = require('../sync/sync.repository');

exports.ingestMessage = async (data) => {
  return withTransaction(async (conn) => {
    await inboxRepo.insertMessage(conn, data.message);
    await inboxRepo.insertMetadata(conn, data.metadata);
    await syncRepo.updateCursor(conn, data.cursor);
  });
};


Notice:

Repository methods receive conn

All queries use same connection

If anything fails → everything rolls back

## Production goal:
>  “When Gmail or LinkedIn receives something, it appears immediately in my app’s inbox, and the user can open it to read.” 

That **forces** a separation of concerns:

| Concern                         | Why must it exist                  |
| ------------------------------- | ---------------------------------- |
| Account connection & sync state | Tokens, cursors, errors, resync    |
| Inbox list (fast)               | The left panel must load instantly |
| Full content (heavy)            | Only load when the user clicks     |

## _**connected_accounts**_ - Integration boundary
"A user has granted OnFocus permission to access this specific external account."

### Ex:
    - User A -> Gmail account johndoe@gmail.com
    - User A -> LinkedIn account john-doe
**This table is not about messages       ==>      It is about permission + sync state.**

 

**Without it:**

    - Mix OAuth tokens with messages ❌
    - Lose sync position (historyId / cursor) ❌
    - Be unable to pause / resume / revoke ❌
    - Be unable to support multiple services cleanly ❌
This table is the **source of truth for ingestion**.



| Field               | Why it exist                                  |
| ------------------- | --------------------------------------------- |
| external_account_id | Stable ID from provider (email, LinkedIn URN) |
| access_token        | Required to call Gmail / LinkedIn APIs        |
| refresh_token       | Required for long-lived access                |
| token_expires_at    | Avoids failed API calls                       |
| last_history_id     | Gmail: "What changed since X?"                |
| last_polled_at      | LinkedIn: polling-based sync                  |
| poll_cursor         | LinkedIn: pagination/continuation             |
| sync_status         | active, error, revoked                        |
| user_id             | Ownership                                     |
| service_id          | Gmail vs LinkedIn                             |

## _**inbox_items**__** -  **_The left panel
"One row = one line in the inbox list."

=> **UI-driven **data, intentionally

    - Who sent it?
    - What's the subject?
    - When did it arrive?
    - Is it unread?
### Why inbox metadata must be separate
If content is mixed here:

    - The left panel becomes slow
    - Queries become huge
    - Mobile becomes painful
    - Indexing becomes worse
This table is **optimized for scrolling**.

| Field                | Why it exists                    |
| -------------------- | -------------------------------- |
| external_id          | Message ID from Gmail / LinkedIn |
| thread_id            | Gmail conversations              |
| title                | Subject / notification title     |
| snippet              | Preview text                     |
| sender_name          | Display name                     |
| sender_identifier    | Email / LinkedIn ID              |
| sender_avatar_url    | UX (optional)                    |
| received_at          | Sort order                       |
| unread               | Badge counts                     |
| archived             | Inbox behavior                   |
| user_id              | Ownership                        |
| connected_account_id | Source account                   |


## _**inbox_item_content**_ - The right panel
"Everything expensive that you only load on demand."

**Ex:**

    - Email body
    - HTML rendering
    - Attachments
    - Provider-specific raw data


### Why this MUST be separate
Reasons:

    - Emails can be huge
    - Attachments are heavy
    - JSON payloads are massive
    - Most inbox items are **never opened**
This is classic **lazy loading**.



| Field       | Why it exists                   |
| ----------- | ------------------------------- |
| body_html   | Rich rendering                  |
| body_text   | Plain text fallback             |
| attachments | Metadata only (files elsewhere) |
| raw_payload | Debugging / future features     |
| fetched_at  | Cache control / refetch logic   |


## Redirect URL
http://localhost:3000/api/v1/oauth/google/callback

http://localhost:3000/api/v1/oauth/linkedin/callback


## So what must you do for LinkedIn?
LinkedIn is not similar to Google Gmail

You must implement **polling**.

Example strategy:

```
Every 60 seconds:
For each active LinkedIn connected_account:
  - Call LinkedIn API
  - Compare with poll_cursor
  - Insert new items
  - Update poll_cursor
```


## Important Reality Check
Even with Gmail push:

It is **near real-time**, not instant.

    - Delay: 1–10 seconds typical
    - Watch must be renewed every ~7 days
So you need:

    - Background job to renew `users.watch` 
    - Recovery logic if Pub/Sub fails


## **a clean backend-only LinkedIn OAuth 2.0 example **(Node.js + Express).
No SDK. Just standard OAuth 2.0 + axios.

---

## 1️⃣ Install dependencies
```bash
npm install axios express dotenv uuid
```
---

## 2️⃣ Environment variables
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/v1/oauth/linkedin/callback
```
---

## 3️⃣ OAuth Flow Overview
```text
1. User clicks "Connect LinkedIn"
2. Redirect to LinkedIn authorization URL
3. LinkedIn redirects back with ?code=
4. Backend exchanges code → access_token
5. Save token in connected_accounts
```
---

## 4️⃣ Step 1 — Redirect user to LinkedIn
```js
// routes/oauth.routes.js
const express = require("express");
const router = express.Router();

router.get("/linkedin", (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  const scope = "openid profile email"; 
  const state = "random_csrf_token"; // generate properly in production

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization
    ?response_type=code
    &client_id=${clientId}
    &redirect_uri=${encodeURIComponent(redirectUri)}
    &scope=${encodeURIComponent(scope)}
    &state=${state}`;

  res.redirect(authUrl.replace(/\s/g, ""));
});

module.exports = router;
```
---

## 5️⃣ Step 2 — Callback endpoint
```js
// routes/oauth.routes.js
const axios = require("axios");

router.get("/linkedin/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "No authorization code" });
  }

  try {
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // OPTIONAL: Get LinkedIn user profile
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const linkedinUser = profileResponse.data;

    /*
      Save into your connected_accounts table:

      external_account_id = linkedinUser.sub
      access_token
      refresh_token (if provided)
      token_expires_at = NOW + expires_in
      service_id = LinkedIn service ID
      user_id = current logged in user
    */

    res.json({
      message: "LinkedIn connected successfully",
      linkedinUser,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});
```
---

## 6️⃣ What LinkedIn Actually Returns
Typical token response:

```json
{
  "access_token": "AQXxxxxxxxxxxxx",
  "expires_in": 5184000
}
```
⚠️ Important:

      - LinkedIn **does NOT give refresh_token** for most standard apps.
      - Access token is long-lived (~60 days).
      - After expiry → user reconnect required (unless using specific partner APIs).
---

## 7️⃣ How This Fits Into Your OnFocus Design
This maps cleanly to your:

### `connected_accounts` 
| Column              | Value               |
| ------------------- | ------------------- |
| external_account_id | linkedinUser.sub    |
| access_token        | from token endpoint |
| token_expires_at    | now + expires_in    |
| sync_status         | 'active'            |
| user_id             | logged-in user      |
| service_id          | LinkedIn            |

Then your LinkedIn poll worker uses this token.

---

## 8️⃣ Security Improvements (Important for Production)
You must:

      - Generate random `state`  (UUID)
      - Store state in session
      - Validate state in callback
      - Use HTTPS in production
      - Encrypt tokens at rest (recommended)

