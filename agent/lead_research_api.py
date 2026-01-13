"""
Lead Research Agent - Using raw Anthropic API
Alternative version that doesn't require the Agent SDK.
Uses Claude + web search tool for research.
"""

import os
from pathlib import Path

# Load .env file (check current dir, then parent dir)
for env_path in [Path(__file__).parent / ".env", Path(__file__).parent.parent / ".env"]:
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key] = value
        break

import anthropic
import json
import time
from datetime import datetime

client = anthropic.Anthropic()  # Uses ANTHROPIC_API_KEY env var

MAX_RETRIES = 3
INITIAL_BACKOFF = 5  # seconds

LEAD_SCHEMA = {
    "name": "string - Official company/person name",
    "type": "string - 'company' or 'person'",
    "website": "string - Primary website URL",
    "description": "string - 2-3 sentence description",
    "industry": "string - Primary industry/sector",
    "size": "string - 'startup', 'smb', or 'enterprise'",
    "location": "string - HQ city, country",
    "linkedin": "string | null",
    "twitter": "string | null",
    "key_people": "array of strings with names and titles",
    "recent_news": "array of 2-3 recent headlines",
    "tech_stack": "array of known technologies",
    "funding": "string | null - funding stage/amount",
    "employee_count": "string - estimated range",
    "founded": "string | null - year",
    "confidence_score": "number 0-1",
    "sources": "array of source URLs"
}


def research_lead(name: str) -> dict:
    """
    Research a company or person using Claude with web search.
    """

    system_prompt = f"""You are a Lead Research Agent. Research companies and people
to gather actionable intelligence for sales and business development.

When researching, look for:
- Official website and social profiles
- Company description and industry
- Size, location, key people
- Recent news and funding
- Tech stack (from job postings, etc.)

Return ONLY valid JSON matching this schema:
{json.dumps(LEAD_SCHEMA, indent=2)}

Your response must be ONLY the JSON object, nothing else."""

    response = None
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                system=system_prompt,
                tools=[{
                    "type": "web_search_20250305",
                    "name": "web_search",
                    "max_uses": 10
                }],
                messages=[{
                    "role": "user",
                    "content": f"Research this lead thoroughly and return structured JSON: {name}"
                }]
            )
            break  # Success, exit retry loop
        except anthropic.RateLimitError as e:
            last_error = e
            if attempt < MAX_RETRIES - 1:
                backoff = INITIAL_BACKOFF * (2 ** attempt)
                print(f"Rate limited. Retrying in {backoff}s (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(backoff)
            else:
                return {
                    "error": f"Rate limit exceeded after {MAX_RETRIES} retries. Please try again later.",
                    "error_type": "rate_limit"
                }
        except anthropic.APIError as e:
            return {
                "error": f"API error: {str(e)}",
                "error_type": "api_error"
            }

    if response is None:
        return {
            "error": "Failed to get response after retries",
            "error_type": "retry_exhausted"
        }

    # Extract text from response
    result_text = ""
    for block in response.content:
        if hasattr(block, "text"):
            result_text += block.text

    # Parse JSON
    try:
        json_str = result_text
        if "```json" in result_text:
            json_str = result_text.split("```json")[1].split("```")[0]
        elif "```" in result_text:
            json_str = result_text.split("```")[1].split("```")[0]

        lead_data = json.loads(json_str.strip())
        lead_data["researched_at"] = datetime.now().isoformat()
        return lead_data

    except json.JSONDecodeError:
        return {
            "error": "Failed to parse",
            "raw": result_text[:500]
        }


# ============================================
# FLASK WEBHOOK SERVER (for n8n integration)
# ============================================

def create_webhook_server():
    """
    Creates a Flask server that n8n can call via HTTP Request node.
    """
    from flask import Flask, request, jsonify

    app = Flask(__name__)

    # Enable CORS for frontend
    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        return response

    @app.route("/research", methods=["POST", "OPTIONS"])
    def research_endpoint():
        """
        POST /research
        Body: {"name": "Company Name"} or {"names": ["Company 1", "Company 2"]}
        """
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return "", 200

        data = request.json

        if "name" in data:
            result = research_lead(data["name"])
            return jsonify(result)

        elif "names" in data:
            results = [research_lead(name) for name in data["names"]]
            return jsonify({"leads": results})

        else:
            return jsonify({"error": "Provide 'name' or 'names' in request body"}), 400

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "lead-research-agent"})

    return app


# ============================================
# FASTAPI VERSION (alternative)
# ============================================

def create_fastapi_server():
    """
    FastAPI version - better for async and automatic docs.
    """
    from fastapi import FastAPI
    from pydantic import BaseModel

    app = FastAPI(title="Lead Research Agent API")

    class LeadRequest(BaseModel):
        name: str

    class BatchRequest(BaseModel):
        names: list[str]

    @app.post("/research")
    async def research(req: LeadRequest):
        return research_lead(req.name)

    @app.post("/research/batch")
    async def research_batch(req: BatchRequest):
        return {"leads": [research_lead(n) for n in req.names]}

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--server":
        # Run as webhook server
        print("Starting Lead Research webhook server...")
        print("Endpoints:")
        print("  POST /research - Research single lead")
        print("  GET /health - Health check")
        app = create_webhook_server()
        app.run(host="0.0.0.0", port=5000, debug=True)

    elif len(sys.argv) > 1 and sys.argv[1] == "--fastapi":
        import uvicorn
        print("Starting FastAPI server...")
        print("Docs available at http://localhost:8000/docs")
        app = create_fastapi_server()
        uvicorn.run(app, host="0.0.0.0", port=8000)

    elif len(sys.argv) > 1:
        # CLI mode
        name = " ".join(sys.argv[1:])
        print(f"Researching: {name}")
        result = research_lead(name)
        print(json.dumps(result, indent=2))

    else:
        print("Usage:")
        print("  python lead_research_api.py 'Company Name'  # Research single lead")
        print("  python lead_research_api.py --server        # Run Flask webhook server")
        print("  python lead_research_api.py --fastapi       # Run FastAPI server")
