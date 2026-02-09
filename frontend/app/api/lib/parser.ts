/**
 * Resume Parser - Heuristic-based section detection
 * Ported from Python backend
 */

export interface ResumeSections {
    experience: string;
    education: string;
    skills: string;
    projects: string;
    other: string;
}

const SECTION_HEADERS: Record<string, string[]> = {
    experience: ['experience', 'work experience', 'employment', 'work history', 'professional experience'],
    education: ['education', 'academic background', 'qualifications', 'education & certifications'],
    skills: ['skills', 'technical skills', 'competencies', 'technologies', 'core competencies'],
    projects: ['projects', 'personal projects', 'academic projects', 'key projects'],
    certifications: ['certifications', 'courses', 'licenses'],
};

/**
 * Split resume text into sections based on headers
 */
export function parseSections(text: string): ResumeSections {
    const lines = text.split('\n');
    const sections: ResumeSections = {
        experience: '',
        education: '',
        skills: '',
        projects: '',
        other: '',
    };

    let currentSection: keyof ResumeSections = 'other';

    for (const line of lines) {
        const lineClean = line.trim().toLowerCase();

        // Check if line matches a known header
        let isHeader = false;

        for (const [section, keywords] of Object.entries(SECTION_HEADERS)) {
            // Specific check: lines that are short and contain keywords
            if (lineClean.length < 50 && keywords.some((k) => k === lineClean)) {
                // Map certifications to other, otherwise use the section name
                currentSection = section === 'certifications' ? 'other' : (section as keyof ResumeSections);
                isHeader = true;
                break;
            }

            // Fuzzy check for headers like "Professional Experience"
            if (
                lineClean.length < 50 &&
                keywords.some((k) => lineClean.includes(k)) &&
                lineClean.split(/\s+/).length < 4
            ) {
                // Map certifications to other, otherwise use the section name
                currentSection = section === 'certifications' ? 'other' : (section as keyof ResumeSections);
                isHeader = true;
                break;
            }
        }

        if (!isHeader) {
            sections[currentSection] += line + '\n';
        }
    }

    return sections;
}
