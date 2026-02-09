/**
 * Resume Parser - Heuristic-based section detection
 * Improved to handle various PDF formatting styles
 */

export interface ResumeSections {
    experience: string;
    education: string;
    skills: string;
    projects: string;
    other: string;
}

// More comprehensive header patterns
const SECTION_PATTERNS: Record<keyof ResumeSections, RegExp[]> = {
    experience: [
        /^experience$/i,
        /^work\s*experience$/i,
        /^professional\s*experience$/i,
        /^employment(\s*history)?$/i,
        /^work\s*history$/i,
        /^career\s*history$/i,
        /^relevant\s*experience$/i,
        /^workexperience$/i,
    ],
    education: [
        /^education$/i,
        /^academic\s*(background|qualifications)?$/i,
        /^qualifications?$/i,
        /^education\s*[&]\s*certifications?$/i,
        /^educational\s*background$/i,
    ],
    skills: [
        /^skills?$/i,
        /^technical\s*skills?$/i,
        /^technicalskills?$/i,
        /^core\s*competenc(ies|y)$/i,
        /^competenc(ies|y)$/i,
        /^technologies?$/i,
        /^programming\s*(languages?|skills?)?$/i,
        /^tech\s*stack$/i,
        /^expertise$/i,
        /^areas?\s*of\s*expertise$/i,
    ],
    projects: [
        /^projects?$/i,
        /^personal\s*projects?$/i,
        /^academic\s*projects?$/i,
        /^key\s*projects?$/i,
        /^side\s*projects?$/i,
        /^notable\s*projects?$/i,
    ],
    other: [
        /^certifications?$/i,
        /^courses?$/i,
        /^licenses?$/i,
        /^awards?$/i,
        /^achievements?$/i,
        /^publications?$/i,
        /^interests?$/i,
        /^hobbies?$/i,
        /^activities?$/i,
        /^summary$/i,
        /^objective$/i,
        /^about(\s*me)?$/i,
        /^profile$/i,
    ],
};

/**
 * Clean a line for header matching
 */
function cleanLineForHeader(line: string): string {
    return line
        .trim()
        .replace(/[:\-\|•●○■□▪▫→►▶]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if a line looks like a section header
 */
function detectSectionHeader(line: string): keyof ResumeSections | null {
    const cleaned = cleanLineForHeader(line);

    if (cleaned.length > 40 || cleaned.length < 2) {
        return null;
    }

    if (cleaned.split(/\s+/).length > 4) {
        return null;
    }

    for (const [section, patterns] of Object.entries(SECTION_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(cleaned)) {
                return section as keyof ResumeSections;
            }
        }
    }

    return null;
}

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
        const detectedSection = detectSectionHeader(line);

        if (detectedSection) {
            currentSection = detectedSection;
            continue;
        }

        if (line.trim()) {
            sections[currentSection] += line + '\n';
        }
    }

    console.log('Parsed sections:', {
        experience: sections.experience.length,
        education: sections.education.length,
        skills: sections.skills.length,
        projects: sections.projects.length,
        other: sections.other.length,
    });

    return sections;
}
