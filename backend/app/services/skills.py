from .embedding import EmbeddingService
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Common tech skills list for matching
COMMON_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform",
    "Git", "CI/CD", "Jenkins", "GitHub Actions",
    "Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Scikit-learn",
    "Data Science", "Pandas", "NumPy", "Matplotlib",
    "Communication", "Leadership", "Teamwork", "Problem Solving", "Agile", "Scrum"
]

class SkillService:
    def __init__(self, embedding_service: EmbeddingService):
        self.embedding_service = embedding_service
        # Pre-compute skill embeddings
        self.skill_embeddings = self.embedding_service.model.encode(COMMON_SKILLS)

    def extract_skills(self, text: str):
        # Split text into chunks (e.g., lines or phrases) to find skills
        # For simplicity, we'll embed the whole text and also try to match specific keywords primarily.
        
        # A simple approach: Embed the Resume Text and find which Skills have high cosine similarity?
        # No, that would match the "Topic" of the resume to the skill.
        # We need to find if the skill exists in the text.
        # Simple string matching is faster and accurate for exact matches.
        # Embeddings are good for "Fuzzy" matching (e.g., "coding in py" -> "Python").
        
        found_skills = []
        text_lower = text.lower()
        
        # Hybrid approach: Direct match + Semantic match (optional, skipping complex semantic for now for speed)
        for skill in COMMON_SKILLS:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return list(set(found_skills))

    def analyze_gap(self, resume_text: str, job_description: str):
        resume_skills = set(self.extract_skills(resume_text))
        jd_skills = set(self.extract_skills(job_description))
        
        missing_skills = list(jd_skills - resume_skills)
        matching_skills = list(jd_skills.intersection(resume_skills))
        
        # Calculate a basic score
        if not jd_skills:
            score = 80 # Generic good score if no JD provided
        else:
            score = int((len(matching_skills) / len(jd_skills)) * 100)
        
        return {
            "score": score,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "resume_skills": list(resume_skills)
        }
