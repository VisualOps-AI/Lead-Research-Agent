# Lead Research Agent

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Claude API](https://img.shields.io/badge/Claude-API-orange.svg)](https://anthropic.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> AI-powered lead research agent that automatically gathers structured intelligence on companies and people.

![Demo](docs/demo.gif)

## Features

- **Instant Research** - Get comprehensive company data in seconds
- **Structured Output** - Clean JSON with 15+ data fields
- **Web Search Integration** - Uses Claude's native web search for real-time data
- **Multiple Interfaces** - CLI, REST API, or n8n webhook
- **High Accuracy** - Confidence scoring and source attribution

## Sample Output

```json
{
  "name": "Stripe, Inc.",
  "industry": "Fintech/Financial Services",
  "description": "Financial infrastructure platform for the internet...",
  "funding": "$106.7 billion valuation",
  "key_people": ["Patrick Collison - CEO", "John Collison - President"],
  "tech_stack": ["Ruby", "JavaScript", "Go", "Python"],
  "confidence_score": 0.95,
  "sources": ["https://stripe.com", "..."]
}
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/lead-research-agent.git
cd lead-research-agent
pip install -r requirements.txt
```

### 2. Configure

```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

### 3. Run

**CLI Mode:**
```bash
python agent/lead_research_api.py "Anthropic"
```

**API Server:**
```bash
python agent/lead_research_api.py --server
# Server runs at http://localhost:5000
```

**Make a request:**
```bash
curl -X POST http://localhost:5000/research \
  -H "Content-Type: application/json" \
  -d '{"name": "Vercel"}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/research` | POST | Research a single lead |
| `/health` | GET | Health check |

### Request Body

```json
{
  "name": "Company or Person Name"
}
```

### Response Fields

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

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Flask API  │────▶│  Claude AI  │
│ (curl/n8n)  │◀────│   Server    │◀────│ + Web Search│
└─────────────┘     └─────────────┘     └─────────────┘
```

See [docs/architecture.md](docs/architecture.md) for detailed system design.

## n8n Integration

This agent can be triggered from n8n workflows:

1. Import the workflow from `n8n/lead-research-workflow.json`
2. Configure the HTTP Request node with your server URL
3. Trigger via webhook or schedule

See [n8n/README.md](n8n/README.md) for setup instructions.

## Project Structure

```
lead-research-agent/
├── agent/
│   └── lead_research_api.py    # Main agent code
├── frontend/                    # Web UI (coming soon)
├── n8n/                         # n8n workflow exports
├── tests/                       # Test suite
├── docs/                        # Documentation
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
└── README.md
```

## Tech Stack

- **Runtime:** Python 3.10+
- **AI:** Claude API (Anthropic)
- **Framework:** Flask
- **Search:** Claude native web search
- **Automation:** n8n (optional)

## Roadmap

- [x] Core research agent
- [x] REST API server
- [x] n8n integration
- [ ] Web UI dashboard
- [ ] Batch processing (CSV import)
- [ ] Database storage
- [ ] Export to CSV/Excel
- [ ] Caching layer
- [ ] Rate limiting
- [ ] Docker deployment

## Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**Anthony Lee**

- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/YOUR_PROFILE)

---

Built with [Claude API](https://anthropic.com) | Powered by AI
