from fastapi import APIRouter, Request, HTTPException, status
import time
import hmac
from hashlib import sha256
import json

from models.elevenlabs import ElevenLabsWebhook
from core.config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_elevenlabs_signature(payload: bytes, signature_header: str, secret: str) -> bool:
    """
    Verify the ElevenLabs webhook signature.
    
    Args:
        payload: Raw request body
        signature_header: The elevenlabs-signature header value
        secret: Your ElevenLabs webhook secret
        
    Returns:
        True if signature is valid, False otherwise
    """
    if not signature_header or not secret:
        return False
    
    try:
        # Parse the signature header
        parts = signature_header.split(",")
        timestamp = parts[0][2:]  # Remove 't=' prefix
        hmac_signature = parts[1]  # This includes 'v0=' prefix
        
        # Validate timestamp (within 30 minutes)
        tolerance = int(time.time()) - 30 * 60
        if int(timestamp) < tolerance:
            return False
        
        # Compute expected signature
        full_payload_to_sign = f"{timestamp}.{payload.decode('utf-8')}"
        mac = hmac.new(
            key=secret.encode("utf-8"),
            msg=full_payload_to_sign.encode("utf-8"),
            digestmod=sha256,
        )
        expected_signature = 'v0=' + mac.hexdigest()
        
        # Compare signatures
        return hmac.compare_digest(hmac_signature, expected_signature)
    except Exception as e:
        print(f"Error verifying signature: {e}")
        return False


@router.post("/holly-conversation")
async def holly_conversation_webhook(request: Request):
    """
    Webhook endpoint for ElevenLabs post-call transcription events.
    
    Receives and processes conversation data from Holly (ElevenLabs AI agent).
    """
    # Get raw payload and signature header
    payload = await request.body()
    
    # signature_header = request.headers.get("elevenlabs-signature")
    
    # # Verify webhook signature if secret is configured
    # if settings.elevenlabs_webhook_secret:
    #     if not signature_header:
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Missing elevenlabs-signature header"
    #         )
        
    #     if not verify_elevenlabs_signature(
    #         payload, 
    #         signature_header, 
    #         settings.elevenlabs_webhook_secret
    #     ):
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Invalid webhook signature"
    #         )
    
    # Parse the webhook payload
    # Fix invalid escape sequences in the payload (ElevenLabs sends \' which is not valid JSON)
    try:
        payload_str = payload.decode('utf-8')
        # Replace invalid \' with just ' (single quotes don't need escaping in JSON)
        #payload_str = payload_str.replace("\\'", "'")
        webhook_data = json.loads(payload_str)
    except Exception as e:
        print(f"Error parsing webhook payload: {e}")
        print(f"Raw payload: {payload_str}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid webhook payload: {str(e)}"
        )
    
    # # Process only post_call_transcription events
    if webhook_data["type"] == "post_call_transcription":
        print(webhook_data)
    #     print("\n" + "="*80)
    #     print("📞 POST CALL TRANSCRIPTION RECEIVED")
    #     print("="*80)
    #     print(f"Agent ID: {webhook_data['data']['agent_id']}")
    #     print(f"Conversation ID: {webhook_data['data']['conversation_id']}")
    #     print(f"Status: {webhook_data['data']['status']}")
    #     print(f"Call Duration: {webhook_data['data']['metadata']['call_duration_secs']}s")
    #     print(f"Cost: {webhook_data['data']['metadata']['cost']}")
    #     print(f"\nTranscript Summary:")
    #     print(webhook_data['data']['analysis']['transcript_summary'])
    #     print(f"\n📝 Full Transcript ({len(webhook_data['data']['transcript'])} turns):")
    #     print("-"*80)
        
    #     for turn in webhook_data['data']['transcript']:
    #         speaker = "🤖 Agent" if turn['role'] == "agent" else "👤 User"
    #         print(f"\n{speaker} (at {turn['time_in_call_secs']}s):")
    #         print(f"  {turn['message']}")
        
    #     print("\n" + "="*80 + "\n")
    else:
        print(f"Received webhook event of type: {webhook_data['type']} (not processing)")
    
    return {"status": "received"}
