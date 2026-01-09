# n8n Integration

This folder contains n8n workflow templates for integrating with the Lead Research Agent.

## Setup

### 1. Start the Agent Server

```bash
cd ../agent
python lead_research_api.py --server
```

### 2. Expose Locally (if using n8n Cloud)

```bash
ngrok http 5000
# Note the https URL provided
```

### 3. Import Workflow

1. Open your n8n instance
2. Go to Workflows → Import
3. Select `lead-research-workflow.json`
4. Update the HTTP Request node URL to your server

### 4. Configure Webhook

The workflow uses a webhook trigger at `/research-lead`

**Production URL:** `https://YOUR-N8N-INSTANCE/webhook/research-lead`
**Test URL:** `https://YOUR-N8N-INSTANCE/webhook-test/research-lead`

## Workflow Structure

```
Webhook Trigger → HTTP Request → Respond to Webhook
     │                │                │
     │                │                │
  Receives        Calls your       Returns
  lead_name       Python agent     JSON result
```

## Request Format

```json
{
  "lead_name": "Company Name"
}
```

## Example Usage

### Via curl

```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/research-lead \
  -H "Content-Type: application/json" \
  -d '{"lead_name": "Stripe"}'
```

### Via n8n HTTP Request Node

Configure another workflow to call this webhook for batch processing.

## Extending the Workflow

Ideas for extending:
- Add Google Sheets node to save results
- Add Slack notification for completed research
- Chain with email automation
- Add to CRM (HubSpot, Salesforce, etc.)
