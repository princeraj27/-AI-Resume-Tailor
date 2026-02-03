from .parser import ResumeParser
from .embedding import EmbeddingService
from .llm import LLMService
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json

class AnalysisService:
    def __init__(self, embedding_service: EmbeddingService, llm_service: LLMService):
        self.embedding_service = embedding_service
        self.llm_service = llm_service

    def analyze_resume(self, resume_text: str, job_description: str = None):
        # 1. Parse Sections
        sections = ResumeParser.parse_sections(resume_text)
        
        # 2. Base Score (Content Quality) - Semantic + Rules
        # Check for numeric metrics in experience (Simple heuristic first)
        exp_text = sections.get('experience', '')
        metric_count = sum(c.isdigit() for c in exp_text)
        metric_score = min(metric_count * 2, 20) 
        
        # 3. Job Description Semantic Matching
        jd_match_score = 0
        semantic_breakdown = {}
        
        if job_description:
            # Embed JD
            jd_embedding = self.embedding_service.embed_text(job_description)
            jd_embedding = jd_embedding.reshape(1, -1)
            
            # Embed Sections
            section_scores = {}
            for section, text in sections.items():
                if not text.strip():
                    section_scores[section] = 0
                    continue
                
                text_embedding = self.embedding_service.embed_text(text)
                text_embedding = text_embedding.reshape(1, -1)
                
                similarity = cosine_similarity(text_embedding, jd_embedding)[0][0]
                section_scores[section] = float(round(similarity * 100, 2))
            
            semantic_breakdown = section_scores
            
            # Weighted Average for JD Match
            jd_match_score = (
                section_scores.get('experience', 0) * 0.4 +
                section_scores.get('skills', 0) * 0.4 +
                section_scores.get('projects', 0) * 0.1 +
                section_scores.get('education', 0) * 0.1
            )
        else:
            jd_match_score = 50 

        # 4. Explainable Scoring (Metrics, Formatting, Skills)
        formatting_score = self.calculate_formatting_score(resume_text, sections)
        
        # Breakdown
        score_breakdown = {
            "skills_match": float(round(jd_match_score, 2)),
            "content_impact": float(metric_score * 5), # Normalize to 100-ish
            "formatting_score": float(formatting_score)
        }
        
        # Final Score
        total_score = int((score_breakdown["skills_match"] * 0.5) + (score_breakdown["content_impact"] * 0.3) + (score_breakdown["formatting_score"] * 0.2))

        # 5. Bullet-Level Analysis (LLM)
        bullet_analysis = []
        insights = []
        
        if self.llm_service.client:
            # Analyze bullets
            bullet_prompt = f"""
            Analyze the following resume bullet points.
            For each bullet, provide:
            1. Impact Score (0-100) based on action verbs, numbers, and result clarity.
            2. A very brief specific improvement suggestion.
            
            Return STRICT JSON: {{ "bullets": [ {{ "text": "original text...", "score": 85, "suggestion": "..." }}, ... ] }}

            Bullets:
            {exp_text[:2000]}
            """
            
            llm_result = self.llm_service.generate_json(bullet_prompt)
            if 'bullets' in llm_result:
                bullet_analysis = llm_result.get('bullets', [])
                # Derive general insights from weak bullets
                weak_bullets = [b for b in bullet_analysis if b.get('score', 0) < 60]
                if weak_bullets:
                     insights.append(f"Found {len(weak_bullets)} weak bullet points. See detailed analysis for fixes.")
            
            if not insights:
                 insights = [f"Improvement Idea: {b.get('suggestion')}" for b in bullet_analysis[:2]]

        # Fallback insights
        if not insights:
            if metric_count < 3:
                insights.append("Your 'Experience' section lacks quantifiable metrics. Recruiters love data!")
            if formatting_score < 70:
                insights.append("Formatting check: Ensure clear section headers and consistent spacing.")
 
        return {
            "total_score": total_score,
            "section_scores": semantic_breakdown,
            "score_breakdown": score_breakdown,
            "bullet_analysis": bullet_analysis,
            "insights": insights,
            "sections": sections
        }

    def calculate_formatting_score(self, text: str, sections: dict) -> int:
        score = 100
        # Penalize missing critical sections
        if not sections.get('experience'): score -= 20
        if not sections.get('education'): score -= 15
        if not sections.get('skills'): score -= 15
        
        # Penalize very short content
        if len(text) < 500: score -= 30
        
        # Check for bullet points (simple heuristic)
        if "-" not in text and "•" not in text and "*" not in text:
            score -= 20
            
        return max(0, score)
