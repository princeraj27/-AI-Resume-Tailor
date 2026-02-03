from fastapi import APIRouter, UploadFile, File, Form, Depends
from pypdf import PdfReader
import io
from ..services.pdf import PDFService
from ..services.embedding import EmbeddingService
from ..services.skills import SkillService
from ..services.llm import LLMService
from ..services.analysis import AnalysisService

router = APIRouter()

# Singletons (dependency injection could be cleaner but this works for simple app)
embedding_service = EmbeddingService()
llm_service = LLMService()
skill_service = SkillService(embedding_service)
analysis_service = AnalysisService(embedding_service, llm_service)

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(None)
):
    # 1. Extract Text
    text = await PDFService.extract_text(file)
    
    # 2. Extract Skills & Gap Analysis
    # We now stick to the new AnalysisService which orchestrates everything
    analysis_result = analysis_service.analyze_resume(text, job_description)
    
    # Old skill service for legacy support or specific extraction if needed
    # for now we map the new result structure to what frontend expects or update frontend
    # Frontend expects: score, matching_skills, missing_skills, resume_skills
    # Our new analysis returns: total_score, section_scores, insights
    
    # Let's try to merge/adapt for now until we update frontend
    skills = skill_service.extract_skills(text)
    
    return {
        "full_text": text,
        "analysis": {
            "score": analysis_result["total_score"],
            "matching_skills": skills, 
            "missing_skills": analysis_result["insights"], 
            "resume_skills": skills,
            "section_scores": analysis_result["section_scores"],
            "score_breakdown": analysis_result.get("score_breakdown"),
            "bullet_analysis": analysis_result.get("bullet_analysis")
        }
    }

from pydantic import BaseModel
from typing import List, Optional

# Requests Models
class InterviewRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None

class FeedbackRequest(BaseModel):
    question: str
    answer: str

@router.post("/interview-questions")
async def generate_questions(request: InterviewRequest):
    # Use LLM for questions
    if llm_service.client:
        prompt = f"""
        Generate 5 interview questions based on the following resume. 
        If a Job Description is provided, tailor them to the role.
        
        Resume Content:
        {request.resume_text[:2000]}
        
        Job Description:
        {request.job_description if request.job_description else "N/A"}
        
        Output strictly JSON object: {{ "questions": ["question 1", "question 2", ...] }}
        """
        response = llm_service.generate_json(prompt)
        
        # Robust parsing
        if isinstance(response, list):
            questions = response
        elif isinstance(response, dict):
            questions = response.get("questions", [])
        else:
            questions = []
            
    else:
        # Fallback
        questions = [
            "Tell me about a time you used Python to solve a difficult problem.",
            "How do you handle conflict in a team setting?",
            "Describe your experience with React and state management.",
            "What is your approach to testing and ensuring code quality?",
            "Where do you see yourself in 5 years?"
        ]
        
    # Fallback if LLM failed or returned empty
    if not questions:
        print("LLM returned 0 questions, using fallback.")
        questions = [
            "Tell me about a time you used Python to solve a difficult problem.",
            "How do you handle conflict in a team setting?",
            "Describe your experience with React and state management.",
            "What is your approach to testing and ensuring code quality?",
            "Where do you see yourself in 5 years?"
        ]

    return {"questions": questions}

@router.post("/interview-feedback")
async def interview_feedback(request: FeedbackRequest):
    # Use LLM for feedback
    feedback_points = []
    score = 0
    improved_answer = ""
    
    if llm_service.client:
        prompt = f"""
        Evaluate the following interview answer using the STRICT STAR method.
        Question: {request.question}
        Answer: {request.answer}
        
        Provide:
        1. A breakdown score for each component (Situation, Task, Action, Result) out of 10.
        2. An overall score (0-100).
        3. A list of 3 specific feedback points.
        4. An improved version of the answer.
        
        Output Strictly JSON: 
        {{ 
            "score": int, 
            "star_breakdown": {{ "situation": int, "task": int, "action": int, "result": int }},
            "feedback": [str], 
            "improved_answer": str 
        }}
        """
        result = llm_service.generate_json(prompt)
        
        score = result.get("score", 0)
        star_breakdown = result.get("star_breakdown", {"situation": 0, "task": 0, "action": 0, "result": 0})
        feedback_points = result.get("feedback", ["Could not generate feedback."])
        improved_answer = result.get("improved_answer", "Could not generate improvement.")
    else:
        # Fallback simulation
        score = 50
        star_breakdown = {"situation": 5, "task": 5, "action": 5, "result": 5}
        word_count = len(request.answer.split())
        if word_count < 20:
            feedback_points.append("Your answer is a bit too short. Try to elaborate more using the STAR method.")
        else:
            feedback_points.append("Good length! You provided enough detail.")
            score = 80
            star_breakdown = {"situation": 8, "task": 8, "action": 8, "result": 8}
            
    return {
        "score": score,
        "star_breakdown": star_breakdown,
        "feedback": feedback_points,
        "improved_answer": improved_answer
    }
