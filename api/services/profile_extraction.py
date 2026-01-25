from anthropic import Anthropic
from typing import Dict, Any, List, Optional
import json
import logging

from core.config import settings
from models.profile import FinancialProfile

logger = logging.getLogger(__name__)


class ProfileExtractor:
    """Extract financial profile information from conversation transcripts using Claude"""
    
    def __init__(self):
        if not settings.anthropic_api_key:
            logger.warning("Anthropic API key not configured")
            self.client = None
        else:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
    
    def parse_transcript_to_text(self, transcript: List[Dict[str, Any]]) -> str:
        """
        Convert transcript list to formatted text for LLM processing
        
        Args:
            transcript: List of transcript turns from ElevenLabs
            
        Returns:
            Formatted conversation text
        """
        conversation_text = []
        
        for turn in transcript:
            role = turn.get("role", "unknown")
            message = turn.get("message", "")
            
            # Format based on role
            if role == "agent":
                speaker = "Holly (Advisor)"
            elif role == "user":
                speaker = "Client"
            else:
                speaker = role.title()
            
            conversation_text.append(f"{speaker}: {message}")
        
        return "\n\n".join(conversation_text)
    
    async def extract_profile(
        self, 
        transcript: List[Dict[str, Any]], 
        user_id: str,
        conversation_id: str
    ) -> Optional[FinancialProfile]:
        """
        Extract financial profile from conversation transcript using Claude
        
        Args:
            transcript: List of conversation turns
            user_id: User identifier
            conversation_id: Conversation identifier
            
        Returns:
            Extracted FinancialProfile or None if extraction fails
        """
        if not self.client:
            logger.error("Anthropic client not initialized - cannot extract profile")
            return None
        
        # Parse transcript to readable format
        conversation_text = self.parse_transcript_to_text(transcript)
        
        # Get the JSON schema for FinancialProfile
        profile_schema = FinancialProfile.model_json_schema()
        schema_str = json.dumps(profile_schema, indent=2)
        
        # Create extraction prompt
        system_prompt = f"""You are an expert financial advisor data extractor. Your role is to analyze conversation transcripts between a financial advisor (Holly) and a client, and extract structured financial profile information.

Extract ONLY information that is explicitly stated in the conversation. Do not make assumptions or infer information that isn't clearly mentioned.

You must return a valid JSON object that EXACTLY matches this FinancialProfile schema:

{schema_str}

Key guidelines:
- Extract personal information (name, age, location, contact details)
- Identify employment status and income details
- Capture financial goals and objectives with specificity
- Note risk attitudes and investment preferences if discussed
- Record current assets, liabilities, and expenses if mentioned
- Track dependents and family situation
- Be precise with numbers - only include if explicitly stated
- Use British English spellings and UK-specific financial terms
- Format dates as YYYY-MM-DD
- Set status based on how much information was gathered
- Use null for any fields that weren't discussed or aren't clear
- Follow the exact enum values defined in the schema (e.g., for employment_status, risk_attitude, etc.)
- Ensure all nested objects match their respective schema structures"""

        user_prompt = f"""Analyze this financial advice conversation and extract a comprehensive financial profile.

Conversation:
{conversation_text}

Return ONLY a valid JSON object matching the FinancialProfile schema provided in the system message. Include all available information extracted from this conversation.

Critical requirements:
- Only include information explicitly stated in the conversation
- Use null for unknown or unmentioned fields
- Be accurate with names, numbers, and dates
- Set user_id to: "{user_id}"
- Calculate an appropriate status (incomplete/partial/complete) based on information gathered
- Ensure all enum values match exactly what's defined in the schema
- Return ONLY the JSON object, no additional text or explanation"""

        try:
            # Call Claude API
            logger.info(f"Extracting profile from conversation {conversation_id}")
            
            message = self.client.messages.create(
                model=settings.anthropic_model,
                max_tokens=4096,
                temperature=0,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ]
            )
            
            # Extract JSON from response
            response_text = message.content[0].text
            
            # Try to parse the JSON response
            # Claude might wrap it in markdown code blocks, so handle that
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_str = response_text[json_start:json_end].strip()
            else:
                json_str = response_text.strip()
            
            # Parse to dict
            profile_data = json.loads(json_str)
            
            # Validate and create FinancialProfile
            profile = FinancialProfile.model_validate(profile_data)
            
            logger.info(f"✅ Successfully extracted profile for user {user_id}: status={profile.status}")
            return profile
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON from Claude response: {e}")
            logger.error(f"Response text: {response_text[:500]}")
            return None
        except Exception as e:
            logger.error(f"Failed to extract profile: {e}")
            return None


# Global instance
profile_extractor = ProfileExtractor()
