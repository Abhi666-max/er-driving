import os
import json
from typing import Dict, Any, Optional, Literal

class MultiLLMGateway:
    """
    Unified Multi-Provider Gateway supporting:
    - Groq: Low-latency fast classification and token parsing
    - Gemini: 1M-2M token context for massive decompiled dumps & ASTs
    - OpenAI: High-reasoning code synthesis & architecture scaffolding
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def route_task(
        self,
        prompt: str,
        system_instruction: str = "",
        tier: Literal["fast_classifier", "large_context", "synthesis"] = "synthesis"
    ) -> Dict[str, Any]:
        """
        Routes the task to the optimal model tier based on payload size and latency requirements.
        """
        # Tier 1: Fast classifier (Groq)
        if tier == "fast_classifier" and self.groq_key:
            return self._call_groq(prompt, system_instruction)

        # Tier 2: Large context ingestion (Gemini)
        if tier == "large_context" and self.gemini_key:
            return self._call_gemini(prompt, system_instruction)

        # Tier 3: High reasoning synthesis (OpenAI or Gemini fallback)
        if tier == "synthesis":
            if self.openai_key:
                return self._call_openai(prompt, system_instruction)
            elif self.gemini_key:
                return self._call_gemini(prompt, system_instruction)
            elif self.groq_key:
                return self._call_groq(prompt, system_instruction)

        # Fallback simulation if no API keys are active
        return {
            "provider": "offline_synthesizer",
            "model": "offline_ir_engine",
            "content": f"[Offline Spec Generated for Abhijeet kangane]\nPayload analyzed: {len(prompt)} characters.",
            "status": "ready"
        }

    def _call_groq(self, prompt: str, system: str) -> Dict[str, Any]:
        try:
            from groq import Groq
            client = Groq(api_key=self.groq_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            return {
                "provider": "groq",
                "model": "llama-3.3-70b-versatile",
                "content": completion.choices[0].message.content,
                "status": "success"
            }
        except Exception as e:
            return {"provider": "groq", "status": "error", "error": str(e)}

    def _call_gemini(self, prompt: str, system: str) -> Dict[str, Any]:
        try:
            from google import genai
            client = genai.Client(api_key=self.gemini_key)
            response = client.models.generate_content(
                model="gemini-2.5-pro",
                contents=prompt,
                config={"system_instruction": system} if system else None
            )
            return {
                "provider": "gemini",
                "model": "gemini-2.5-pro",
                "content": response.text,
                "status": "success"
            }
        except Exception as e:
            return {"provider": "gemini", "status": "error", "error": str(e)}

    def _call_openai(self, prompt: str, system: str) -> Dict[str, Any]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            return {
                "provider": "openai",
                "model": "gpt-4o",
                "content": response.choices[0].message.content,
                "status": "success"
            }
        except Exception as e:
            return {"provider": "openai", "status": "error", "error": str(e)}

