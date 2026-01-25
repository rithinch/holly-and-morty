from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ConversationTurnMetrics(BaseModel):
    convai_llm_service_ttfb: Optional[Dict[str, float]] = None
    convai_llm_service_ttf_sentence: Optional[Dict[str, float]] = None


class TranscriptItem(BaseModel):
    role: str
    message: str
    tool_calls: Optional[Any] = None
    tool_results: Optional[Any] = None
    feedback: Optional[Any] = None
    time_in_call_secs: int
    conversation_turn_metrics: Optional[ConversationTurnMetrics] = None


class DeletionSettings(BaseModel):
    deletion_time_unix_secs: Optional[int] = None
    deleted_logs_at_time_unix_secs: Optional[int] = None
    deleted_audio_at_time_unix_secs: Optional[int] = None
    deleted_transcript_at_time_unix_secs: Optional[int] = None
    delete_transcript_and_pii: bool
    delete_audio: bool


class Feedback(BaseModel):
    overall_score: Optional[float] = None
    likes: int
    dislikes: int


class Charging(BaseModel):
    dev_discount: bool


class Metadata(BaseModel):
    start_time_unix_secs: int
    call_duration_secs: int
    cost: int
    deletion_settings: DeletionSettings
    feedback: Feedback
    authorization_method: str
    charging: Charging
    termination_reason: str


class Analysis(BaseModel):
    evaluation_criteria_results: Dict[str, Any]
    data_collection_results: Dict[str, Any]
    call_successful: str
    transcript_summary: str


class AgentConfig(BaseModel):
    prompt: Optional[str] = None
    first_message: Optional[str] = None
    language: str


class TTSConfig(BaseModel):
    voice_id: Optional[str] = None


class ConversationConfigOverride(BaseModel):
    agent: AgentConfig
    tts: TTSConfig


class ConversationInitiationClientData(BaseModel):
    conversation_config_override: ConversationConfigOverride
    custom_llm_extra_body: Dict[str, Any]
    dynamic_variables: Dict[str, Any]


class WebhookData(BaseModel):
    agent_id: str
    conversation_id: str
    status: str
    transcript: List[TranscriptItem]
    metadata: Metadata
    analysis: Analysis
    conversation_initiation_client_data: ConversationInitiationClientData


class ElevenLabsWebhook(BaseModel):
    type: str
    event_timestamp: int
    data: WebhookData
