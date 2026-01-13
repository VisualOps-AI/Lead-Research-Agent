# Lead Research Agent

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Claude API](https://img.shields.io/badge/Claude-API-orange.svg)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> AI-powered lead research agent that automatically gathers structured intelligence on companies and people using Claude's web search capabilities.

![Demo](docs/demo.gif)

## How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LEAD RESEARCH AGENT                            │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
     │  Web UI  │      │   CLI    │      │   n8n    │      │   API    │
     │ :8080    │      │ Terminal │      │ Webhook  │      │  Client  │
     └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
          │                 │                 │                 │
          └────────────────┬┴─────────────────┴─────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────┐
          │         Flask API Server           │
          │           localhost:5000           │
          │                                    │
          │  POST /research  - Research lead   │
          │  GET  /health    - Health check    │
          │                                    │
          │  Features:                         │
          │  • Auto-retry on rate limits       │
          │  • Exponential backoff (5s→10s→20s)│
          │  • CORS enabled for frontend       │
          └────────────────┬───────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────┐
          │           Claude API               │
          │      claude-sonnet-4-20250514      │
          │                                    │
          │  ┌─────────────────────────────┐   │
          │  │    Web Search Tool          │   │
          │  │    (up to 10 searches)      │   │
          │  │                             │   │
          │  │  • Company websites         │   │
          │  │  • News articles            │   │
          │  │  • LinkedIn/Twitter         │   │
          │  │  • Funding data             │   │
          │  │  • Tech stack info          │   │
          │  └─────────────────────────────┘   │
          └────────────────┬───────────────────┘
                           │
                           ▼
          ┌────────────────────────────────────┐
          │        Structured JSON Output      │
          │                                    │
          │  {                                 │
          │    "name": "Anthropic",            │
          │    "industry": "AI/ML",            │
          │    "description": "...",           │
          │    "funding": "$7.3B",             │
          │    "key_people": [...],            │
          │    "tech_stack": [...],            │
          │    "confidence_score": 0.95        │
          │  }                                 │
          └────────────────────────────────────┘
```

## Features

- **Instant Research** - Get comprehensive company data in seconds
- **Structured Output** - Clean JSON with 15+ data fields
- **Web Search Integration** - Real-time data via Claude's native web search
- **Multiple Interfaces** - Web UI, CLI, REST API, or n8n webhook
- **Auto-Retry** - Handles rate limits with exponential backoff
- **High Accuracy** - Confidence scoring and source attribution

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/anthropics/lead-research-agent.git
cd lead-research-agent
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

### 3. Run

**Start the API server:**
```bash
python agent/lead_research_api.py --server
# Server runs at http://localhost:5000
```

**Start the Web UI (separate terminal):**
```bash
cd frontend
python -m http.server 8080
# Open http://localhost:8080
```

**Or use CLI mode:**
```bash
python agent/lead_research_api.py "Anthropic"
```

## API Reference

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/research` | POST | Research a single lead |
| `/health` | GET | Health check |

### Request

```bash
curl -X POST http://localhost:5000/research \
  -H "Content-Type: application/json" \
  -d '{"name": "Vercel"}'
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Official name |
| `type` | string | "company" or "person" |
| `website` | string | Primary website URL |
| `description` | string | 2-3 sentence description |
| `industry` | string | Primary industry/sector |
| `size` | string | startup/smb/enterprise |
| `location` | string | HQ city, country |
| `linkedin` | string | LinkedIn URL |
| `twitter` | string | Twitter/X URL |
| `key_people` | array | Executives with titles |
| `recent_news` | array | 2-3 recent headlines |
| `tech_stack` | array | Known technologies |
| `funding` | string | Funding stage/amount |
| `employee_count` | string | Estimated range |
| `founded` | string | Year founded |
| `confidence_score` | number | 0-1 data quality score |
| `sources` | array | Source URLs |
| `researched_at` | string | ISO timestamp |

## Project Structure

```
lead-research-agent/
├── agent/
│   └── lead_research_api.py    # Main API server + research logic
├── frontend/
│   ├── index.html              # Web UI
│   ├── app.js                  # Frontend logic
│   └── styles.css              # Styling
├── n8n/
│   ├── lead-research-workflow.json
│   └── README.md               # n8n setup instructions
├── docs/
│   └── architecture.md         # System design docs
├── .env.example                # Environment template
├── requirements.txt            # Python dependencies
└── README.md
```

## Tech Stack

- **Runtime:** Python 3.10+
- **AI:** Claude API (Anthropic) with web search
- **API Framework:** Flask
- **Frontend:** Vanilla JS + CSS
- **Automation:** n8n (optional)

## Rate Limits

The agent includes automatic retry logic for Anthropic API rate limits:
- 3 retries with exponential backoff (5s → 10s → 20s)
- Web search uses more quota than standard API calls
- Check your usage at https://console.anthropic.com

## Roadmap

- [x] Core research agent
- [x] REST API server
- [x] Web UI dashboard
- [x] n8n integration
- [x] Rate limit handling with retries
- [ ] Batch processing (CSV import)
- [ ] Database storage
- [ ] Export to CSV/Excel
- [ ] Caching layer
- [ ] Docker deployment

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Anthony Lee**

---

Built with [Claude API](https://anthropic.com) | Powered by AI
