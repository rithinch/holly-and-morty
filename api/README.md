# Holly and Morty API

API for processing Holly (ElevenLabs) conversation webhooks with clean, maintainable architecture.

## Project Structure

```
api/
├── main.py                 # FastAPI application entry point
├── core/
│   └── config.py          # Settings and configuration
├── models/
│   └── elevenlabs.py      # Pydantic models for ElevenLabs webhooks
├── routers/
│   └── webhooks.py        # Webhook endpoints
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
├── .env.example          # Environment variables template
└── README.md            # This file
```

## Local Development

### Prerequisites
- Python 3.11+
- pip

### Setup

1. **Clone and navigate to the API directory**
   ```bash
   cd api
   ```

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your ElevenLabs webhook secret
   ```

5. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

## Docker

### Build the Docker image
```bash
docker build -t holly-and-morty-api .
```

### Run with environment file
```bash
docker run -p 8000:8000 --env-file .env holly-and-morty-api
```

### Run with environment variables
```bash
docker run -p 8000:8000 \
  -e ELEVENLABS_WEBHOOK_SECRET=your_secret_here \
  -e COSMOS_CONNECTION_STRING=your_cosmos_connection_string \
  -e ANTHROPIC_API_KEY=your_anthropic_key \
  holly-and-morty-api
```

## Endpoints

### Core Endpoints
- **GET /** - Root endpoint with API information
- **GET /health** - Health check endpoint
- **GET /docs** - Interactive API documentation (Scalar)

### Webhook Endpoints
- **POST /webhooks/holly-conversation** - ElevenLabs post-call transcription webhook

## Webhook Configuration

### ElevenLabs Setup

1. Get your webhook secret from the [ElevenLabs dashboard](https://elevenlabs.io/app/conversational-ai)
2. Add it to your `.env` file:
   ```
   ELEVENLABS_WEBHOOK_SECRET=your_secret_here
   ```
3. Configure the webhook URL in ElevenLabs to point to:
   ```
   https://your-domain.com/webhooks/holly-conversation
   ```

### Webhook Security

The endpoint validates:
- ✅ Request signature using HMAC-SHA256
- ✅ Timestamp freshness (within 30 minutes)
- ✅ Payload structure using Pydantic models

### Testing Webhooks Locally

Use a tool like [ngrok](https://ngrok.com/) to expose your local server:

```bash
# In one terminal
uvicorn main:app --reload

# In another terminal
ngrok http 8000
```

Then use the ngrok URL in your ElevenLabs webhook configuration.

## Example Requests

### Health Check
```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "service": "holly-and-morty-api"
}
```

### Test Webhook (with signature)
The webhook endpoint expects a valid ElevenLabs signature. See the `post_call_transcription` event documentation for the full payload structure.

## Development

### Adding New Endpoints

1. Create a new router in `routers/` directory
2. Define Pydantic models in `models/` if needed
3. Include the router in `main.py`

Example:
```python
# In main.py
from routers import your_new_router
app.include_router(your_new_router.router)
```
