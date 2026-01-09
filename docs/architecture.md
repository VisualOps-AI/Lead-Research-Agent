# Architecture

## System Overview

The Lead Research Agent is designed as a modular, API-first system that can be deployed standalone or integrated into larger workflows.

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                   │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│     CLI      │   Web UI     │    n8n       │   External Apps    │
│  (Terminal)  │  (Browser)   │  (Webhook)   │   (API Calls)      │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       └──────────────┴──────────────┴────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FLASK API SERVER                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      Endpoints                              │  │
│  │  POST /research  - Research single lead                     │  │
│  │  GET  /health    - Health check                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Research Function                         │  │
│  │  1. Build system prompt with schema                         │  │
│  │  2. Call Claude API with web search tool                    │  │
│  │  3. Parse and validate JSON response                        │  │
│  │  4. Add metadata (timestamp, etc.)                          │  │
│  │  5. Return structured result                                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CLAUDE API                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Model: claude-sonnet-4-20250514                            │  │
│  │  Tools: web_search_20250305                                 │  │
│  │  Max tokens: 4096                                           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Web Search                               │  │
│  │  - Searches multiple sources                                │  │
│  │  - Returns real-time data                                   │  │
│  │  - Cross-references information                             │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Request Flow

```
Client Request
     │
     ▼
┌─────────────┐
│ Validation  │  → Check required fields
└─────────────┘
     │
     ▼
┌─────────────┐
│ Build       │  → Create system prompt
│ Prompt      │  → Include JSON schema
└─────────────┘
     │
     ▼
┌─────────────┐
│ Claude API  │  → Send request with web_search tool
│ Call        │  → Wait for response (may take 10-30s)
└─────────────┘
     │
     ▼
┌─────────────┐
│ Parse       │  → Extract JSON from response
│ Response    │  → Handle markdown code blocks
└─────────────┘
     │
     ▼
┌─────────────┐
│ Add         │  → Add timestamp
│ Metadata    │  → Calculate confidence
└─────────────┘
     │
     ▼
Client Response
```

### 2. Response Schema

```json
{
  "name": "string",
  "type": "company | person",
  "website": "string",
  "description": "string",
  "industry": "string",
  "size": "startup | smb | enterprise",
  "location": "string",
  "linkedin": "string | null",
  "twitter": "string | null",
  "key_people": ["string"],
  "recent_news": ["string"],
  "tech_stack": ["string"],
  "funding": "string | null",
  "employee_count": "string",
  "founded": "string | null",
  "confidence_score": "number (0-1)",
  "sources": ["string"],
  "researched_at": "ISO 8601 timestamp"
}
```

## Components

### 1. Flask API Server (`agent/lead_research_api.py`)

**Responsibilities:**
- HTTP request handling
- Input validation
- Response formatting
- Health monitoring

**Configuration:**
- Host: `0.0.0.0` (all interfaces)
- Port: `5000`
- Debug: `true` (development)

### 2. Research Function

**Responsibilities:**
- Prompt engineering
- Claude API communication
- JSON parsing and validation
- Error handling

**Key Features:**
- Structured output enforcement via system prompt
- Web search integration for real-time data
- Confidence scoring based on data completeness

### 3. Claude API Integration

**Model:** `claude-sonnet-4-20250514`
**Tools:** `web_search_20250305` (up to 10 searches per request)

**Why Claude?**
- Native web search capability
- Strong structured output following
- High accuracy on business data

## Deployment Options

### Option 1: Local Development
```bash
python agent/lead_research_api.py --server
```

### Option 2: With Tunnel (for n8n Cloud)
```bash
ngrok http 5000
```

### Option 3: Docker (Coming Soon)
```bash
docker-compose up
```

### Option 4: Cloud Deployment
- Render
- Railway
- Fly.io
- AWS Lambda (with modifications)

## Security Considerations

1. **API Key Protection**
   - Never commit `.env` file
   - Use environment variables in production

2. **Rate Limiting** (Planned)
   - Prevent abuse
   - Control costs

3. **Input Validation**
   - Sanitize company names
   - Limit request size

## Future Architecture

```
                    ┌─────────────┐
                    │   Web UI    │
                    └──────┬──────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│                          ▼                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Cache     │  │   API       │  │   Queue     │ │
│  │   (Redis)   │◀─│   Server    │──▶│  (Celery)   │ │
│  └─────────────┘  └──────┬──────┘  └──────┬──────┘ │
│                          │                │        │
│                          ▼                ▼        │
│                   ┌─────────────┐  ┌─────────────┐ │
│                   │  Database   │  │   Claude    │ │
│                   │  (Postgres) │  │    API      │ │
│                   └─────────────┘  └─────────────┘ │
└────────────────────────────────────────────────────┘
```

**Planned Additions:**
- Redis caching (avoid re-researching)
- PostgreSQL storage (persist leads)
- Celery queue (batch processing)
- Authentication (API keys for users)
