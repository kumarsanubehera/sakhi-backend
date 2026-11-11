# Sakhi backend
API for Sakhi, a maternal-care workflow used by ASHA workers, ANMs, and medical officers. It covers registration, antenatal visits, observations, rule-based risk screening, referrals, documents, offline sync, and a small voice assistant.
Risk results are decision support for field workers. They are not a diagnosis.
## Setup
Requires Node.js 20+ and a local MongoDB.
```bash
npm install
npm run seed
npm run dev
```
The API listens on `http://localhost:4000`. Health check: `GET /api/health`.
Copy values in `.env` before any shared deployment. Change `JWT_SECRET`. Leave `AI_API_URL` and `FCM_SERVER_KEY` empty unless you have an OpenAI-compatible chat endpoint and a legacy FCM server key.
## Seed logins
| Role | Phone | Password |
| --- | --- | --- |
| Admin | 9999999999 | Admin@123 |
| ASHA | 9876543210 | Asha@123 |
| ANM | 9898989898 | Anm@123 |
| Medical officer | 9765432109 | Doctor@123 |
| Mother | 9123456789 | Mother@123 |
The seed also creates a demo mother in Bijlon village with an ongoing pregnancy, one completed ANC visit, and moderate anemia on screening.
Send the token on later requests:
```http
Authorization: Bearer <token>
```
## API
| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Signed in |
| POST | `/api/auth/change-password` | Signed in |
| POST, GET, PATCH | `/api/users` | Admin creates and edits; a user may update their own profile |
| GET, POST, PATCH, DELETE | `/api/locations` | Any signed-in user can read; admin writes |
| GET, POST, PATCH | `/api/mothers` | Staff write; results are limited to the caller's area |
| GET, POST, PATCH | `/api/pregnancies` | Staff write. Create also schedules 8 ANC visits |
| POST | `/api/pregnancies/:id/outcome` | Staff |
| GET, POST, PATCH | `/api/visits` | Staff write. `GET /api/visits/due` lists today and overdue |
| GET, POST | `/api/observations` | Staff write. Saving an observation screens risk again |
| POST | `/api/risk/screen` | Staff |
| GET | `/api/risk/pregnancies?level=high` | Signed in, scoped |
| GET, POST, PATCH | `/api/referrals` | Staff write |
| GET, POST, DELETE | `/api/documents` | Multipart field `file` plus `motherId` and `docType`. Download with `GET /api/documents/:id/file` |
| GET, POST, DELETE | `/api/community` | Signed in |
| GET, POST, PATCH, DELETE | `/api/announcements` | Admin and medical officer write |
| GET | `/api/dashboard/summary` | Signed in, scoped |
| GET | `/api/notifications` | Signed in |
| PATCH | `/api/notifications/:id/read` | Signed in |
| POST | `/api/notifications/read-all` | Signed in |
| POST | `/api/sync/push` | Staff. Body `{ "changes": [{ "entity", "op": "upsert", "clientId", "updatedAt", "payload" }] }` |
| GET | `/api/sync/pull?since=` | Staff |
| POST | `/api/voice/interpret` | Signed in. Body `{ "text": "high risk mothers" }` |
ASHA users only see mothers assigned to them. ANMs and medical officers see mothers in their block, district, village, or facility. Mothers only see the record linked to their login. Admin sees everyone.
Sync entities are `mother`, `pregnancy`, `visit`, `observation`, and `referral`. An older client timestamp is skipped when the server row is newer.
## Screening rules
The screen raises **high** for age under 18, severe hypertension, hemoglobin below 7, fetal heart rate outside 110–160, very high glucose, absent fetal movement, heavy albumin, or danger signs such as bleeding, convulsions, leaking fluid, and breathlessness. Blood pressure with urine albumin is flagged as pre-eclampsia.
**Moderate** covers age over 35, high parity, previous cesarean, hemoglobin below 11, milder hypertension, reduced movements, and edema.
High risk stores `riskLevel` on the pregnancy and notifies the assigned ASHA when the level first becomes high.
## Jobs
- 02:15 daily: delete notifications read more than 30 days ago, and mark scheduled visits before today as missed.
- 08:15 daily: notify the assigned worker about visits due in the next 24 hours.
## Privacy
Store only the last 4 digits of Aadhaar (`aadhaarLast4`). Document files are downloaded through an authenticated route, not a public folder.