/**
 * Skills Service - Extract and match technical skills
 * Ported from Python backend
 */

// Common tech skills list for matching
const COMMON_SKILLS = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular',
    'Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Spring Boot',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Scikit-learn',
    'Data Science', 'Pandas', 'NumPy', 'Matplotlib',
    'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Agile', 'Scrum',
];

/**
 * Extract skills from text using keyword matching
 */
export function extractSkills(text: string): string[] {
    const textLower = text.toLowerCase();
    const foundSkills: Set<string> = new Set();

    for (const skill of COMMON_SKILLS) {
        if (textLower.includes(skill.toLowerCase())) {
            foundSkills.add(skill);
        }
    }

    return Array.from(foundSkills);
}

export interface SkillGapAnalysis {
    score: number;
    matching_skills: string[];
    missing_skills: string[];
    resume_skills: string[];
}

/**
 * Analyze skill gap between resume and job description
 */
export function analyzeGap(resumeText: string, jobDescription: string): SkillGapAnalysis {
    const resumeSkills = new Set(extractSkills(resumeText));
    const jdSkills = new Set(extractSkills(jobDescription));

    const matchingSkills = [...jdSkills].filter((skill) => resumeSkills.has(skill));
    const missingSkills = [...jdSkills].filter((skill) => !resumeSkills.has(skill));

    // Calculate score
    let score: number;
    if (jdSkills.size === 0) {
        score = 80; // Generic good score if no JD skills detected
    } else {
        score = Math.round((matchingSkills.length / jdSkills.size) * 100);
    }

    return {
        score,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        resume_skills: Array.from(resumeSkills),
    };
}
