import re
from typing import Dict, List, Optional

class ResumeParser:
    """
    Heuristic-based parser to split resume text into sections.
    """
    
    SECTION_HEADERS = {
        "experience": ["experience", "work experience", "employment", "work history", "professional experience"],
        "education": ["education", "academic background", "qualifications", "education & certifications"],
        "skills": ["skills", "technical skills", "competencies", "technologies", "core competencies"],
        "projects": ["projects", "personal projects", "academic projects", "key projects"],
        "certifications": ["certifications", "courses", "licenses"]
    }

    @staticmethod
    def parse_sections(text: str) -> Dict[str, str]:
        """
        Splits raw text into sections based on headers.
        """
        lines = text.split('\n')
        sections = {
            "experience": "",
            "education": "",
            "skills": "",
            "projects": "",
            "other": ""
        }
        
        current_section = "other"
        
        for line in lines:
            line_clean = line.strip().lower()
            
            # Check if line matches a known header
            is_header = False
            for section, keywords in ResumeParser.SECTION_HEADERS.items():
                # specific check: lines that are short and contain keywords
                if len(line_clean) < 50 and any(k == line_clean for k in keywords):
                    current_section = section
                    is_header = True
                    break
                # fuzzy check for headers like "Professional Experience"
                elif len(line_clean) < 50 and any(k in line_clean for k in keywords) and len(line_clean.split()) < 4:
                     # Be careful not to trigger on "I have experience in..."
                     # A header usually doesn't have verbs or full sentences.
                     # This is a basic heuristic.
                     current_section = section
                     is_header = True
                     break
            
            if not is_header:
                if current_section in sections:
                    sections[current_section] += line + "\n"
        
        return sections
