# 🚩 Feature Flag Service

<p>
  <img src="https://img.shields.io/badge/NestJS-10-red?&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7-red?&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-brightgreen?&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue?&logo=docker&logoColor=white" />
</p>

---

## 📌 Overview

#### **Feature Flag Service** is a backend API for **deterministic feature flag evaluation**.
It supports **percentage rollouts**, **segments**, **variants**, and **schedules** —
with **fast cache**, **audit logs**, and **prometheus metrics**.<br>
Built as an externalized platform service to decouple rollout logic from application code.

---

## 🎯 Use Cases

- Progressive rollout of new features
- Multi-tenant segmentation (plan/country/attributes)
- A/B testing with weighted variants
- Safe rollouts with scheduling windows
- Centralized auditing & metrics

---

## 🧾 Notes

- Evaluation order: enabled rules sorted by `priority desc`, then `updatedAt desc`, then `id desc`.
- Redis cache is best-effort. If Redis is down, evaluation continues without cache.
- `x-request-id` is returned on every response for tracing.

---

## ✨ Features

| Feature | Description |
|------|------------|
| Deterministic rollout | Stable hashing (no `Math.random` in decision path) |
| Rule types | `global`, `percentage`, `segment`, `variant` |
| Weighted variants | Deterministic bucket selection |
| Scheduling | `startAt` / `endAt` windows |
| Caching | Redis short TTL with rulesVersion invalidation |
| Optimistic concurrency | `ETag` / `If-Match` for updates |
| API keys | Create / list / rotate / revoke |
| Audit log | Immutable admin actions in PostgreSQL |
| Metrics | Prometheus text format at `/v1/metrics` |
| Request ID | `x-request-id` propagation |
| Rate limiting | Separate limits for evaluate vs admin APIs |
| Docker-first | One-command startup with Docker Compose |

---

## 🧰 Tech Stack

| Component | Tech |
|---------|------|
| API | NestJS 10 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| ORM | Prisma |
| Runtime | Node.js 20 |
| Deployment | Docker & Docker Compose |

---

## 🧠 Architecture Highlights

### Evaluation flow

```
Client
  ↓
POST /v1/evaluate
  ↓
PostgreSQL (features + rules, cached)
  ↓
Rule matching (deterministic)
  ↓
Redis cache (short TTL)
  ↓
PostgreSQL (evaluation log)
```

### Design principles

- Deterministic decisions per subject
- Minimal latency for hot-path evaluation
- Safe updates using ETags
- Auditable changes and metrics
- Predictable error responses

---

## 🔐 Authentication

All protected endpoints require:

```
X-API-Key: <API_KEY>
```

Bootstrap key for initial setup is defined in `.env`:

```env
ROOT_API_KEY=change-me
```

---

## 🗺️ API Endpoints

### Health & Metrics
- `GET /v1/health`
- `GET /v1/metrics`

### Evaluate
- `POST /v1/evaluate`
- `POST /v1/preview`

### Features
- `POST /v1/features`
- `GET /v1/features`
- `GET /v1/features/{id}` (returns `ETag`)
- `PATCH /v1/features/{id}` (`If-Match` required)
- `POST /v1/features/{id}/archive`

### Rules
- `POST /v1/features/{id}/rules`
- `GET /v1/features/{id}/rules`
- `GET /v1/features/{id}/rules/{ruleId}` (returns `ETag`)
- `PATCH /v1/features/{id}/rules/{ruleId}` (`If-Match` required)
- `POST /v1/features/{id}/rules/{ruleId}/disable`
- `DELETE /v1/features/{id}/rules/{ruleId}`

### API Keys
- `POST /v1/api-keys`
- `GET /v1/api-keys`
- `POST /v1/api-keys/{id}/rotate`
- `POST /v1/api-keys/{id}/revoke`

### Audit
- `GET /v1/audit`

---

## 🧪 Jest Tests

```bash
npm test
npm run test:e2e
```

---

## ⚡ Quick Tests

### Create API key
```bash
curl -X POST http://localhost:3000/v1/api-keys \
  -H "Content-Type: application/json" \
  -H "X-API-Key: change-me" \
  -d '{"name":"primary"}'
```

### Create feature
```bash
curl -X POST http://localhost:3000/v1/features \
  -H "Content-Type: application/json" \
  -H "X-API-Key: change-me" \
  -d '{"key":"checkout_new_ui","environment":"dev","description":"New checkout experience"}'
```

### Create rule (percentage)
```bash
curl -X POST http://localhost:3000/v1/features/{FEATURE_ID}/rules \
  -H "Content-Type: application/json" \
  -H "X-API-Key: change-me" \
  -d '{"priority":100,"ruleType":"percentage","rolloutPercent":25,"enabled":true}'
```

### Evaluate
```bash
curl -X POST http://localhost:3000/v1/evaluate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: change-me" \
  -d '{"featureKey":"checkout_new_ui","environment":"dev","subject":{"key":"user-42","attributes":{"country":"US","plan":"pro"}}}'
```

---

## 🧷 Rule Examples

### Conditions
```json
{
  "userId": "u123",
  "tenantId": ["t1", "t2"],
  "country": "US",
  "plan": ["pro", "enterprise"],
  "attrs": {
    "region": "na",
    "role": ["admin", "owner"]
  }
}
```

### Variants
```json
[
  { "key": "A", "weight": 70 },
  { "key": "B", "weight": 30 }
]
```

### Schedule
```json
{ "startAt": "2026-02-01T00:00:00Z", "endAt": "2026-02-20T00:00:00Z" }
```

---

## 🚀 Quick Start

### 1. Clone repository
```bash
git clone https://github.com/cresterienvogel/node-feature-flag-service.git
cd node-feature-flag-service
```

### 2. Create `.env`
```bash
cp .env.example .env
```

### 3. Run with Docker
```bash
docker compose up --build
```

Service will be available at:
```
http://localhost:3000
```

Swagger:
```
http://localhost:3000/docs
```
