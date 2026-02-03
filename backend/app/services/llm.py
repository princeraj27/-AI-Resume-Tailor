import os
from openai import OpenAI
import json

class LLMService:
    def __init__(self):
        # Initialize Groq client
        # User must set GROQ_API_KEY env variable
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
             # Fallback or stub for development if key is missing
             print("WARNING: GROQ_API_KEY not found. LLM features will be disabled/mocked.")
             self.client = None
        else:
             self.client = OpenAI(
                 base_url="https://api.groq.com/openai/v1",
                 api_key=api_key
             )
        
        self.model = "llama-3.3-70b-versatile"

    def generate_text(self, prompt: str, system_prompt: str = "You are a helpful AI career coach.") -> str:
        if not self.client:
            return "LLM Service Unavailable (Missing API Key)"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1024
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Error: {e}")
            return "Error generating content."

    def generate_json(self, prompt: str, system_prompt: str = "You are an AI that outputs JSON.") -> dict:
        """
        Forces JSON output from the LLM.
        """
        if not self.client:
            return {}
            
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt + " Output valid JSON only. Do not wrap in markdown code blocks."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            content = response.choices[0].message.content
            # Clean possible markdown
            content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"LLM JSON Error: {e}")
            print(f"Raw Content causing error: {content if 'content' in locals() else 'No content'}")
            return {}
