/**
 * Analysis Service - Main resume analysis orchestration
 * Ported from Python backend
 */

import { parseSections, ResumeSections } from './parser';
import { extractSkills } from './skills';
import { llmService } from './llm';

export interface BulletAnalysis {
    text: string;
    score: number;
    suggestion: string;
}

export interface ScoreBreakdown {
    skills_match: number;
    content_impact: number;
    formatting_score: number;
}

export interface AnalysisResult {
    total_score: number;
    section_scores: Record<string, number>;
    score_breakdown: ScoreBreakdown;
    bullet_analysis: BulletAnalysis[];
    insights: string[];
    sections: ResumeSections;
}

/**
 * Calculate formatting score based on resume structure
 */
function calculateFormattingScore(text: string, sections: ResumeSections): number {
    let score = 100;

    // Penalize missing critical sections (but less harshly)
    if (!sections.experience.trim()) score -= 15;
    if (!sections.education.trim()) score -= 10;
    if (!sections.skills.trim()) score -= 10;

    // Penalize very short content
    if (text.length < 300) score -= 25;
    else if (text.length < 500) score -= 15;
    else if (text.length < 800) score -= 5;

    // Check for bullet points
    if (!text.includes('-') && !text.includes('•') && !text.includes('*') && !text.includes('●')) {
        score -= 10;
    }

    // Bonus for having good structure
    if (sections.experience.trim() && sections.skills.trim()) {
        score += 10;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Simple keyword-based section relevance scoring
 * (Replaces ML embedding similarity from Python)
 */
function calculateSectionRelevance(
    sections: ResumeSections,
    jobDescription: string
): Record<string, number> {
    const sectionScores: Record<string, number> = {};
    const jdWords = new Set(jobDescription.toLowerCase().split(/\W+/).filter((w: string) => w.length > 2));

    for (const [section, text] of Object.entries(sections)) {
        if (!text.trim()) {
            sectionScores[section] = 0;
            continue;
        }

        const sectionWords = text.toLowerCase().split(/\W+/).filter((w: string) => w.length > 2);
        const matchingWords = sectionWords.filter((w: string) => jdWords.has(w));

        // Calculate overlap percentage (scaled to 0-100)
        const overlap = sectionWords.length > 0
            ? (matchingWords.length / Math.min(sectionWords.length, jdWords.size)) * 100
            : 0;

        sectionScores[section] = Math.min(100, Math.round(overlap));
    }

    return sectionScores;
}

/**
 * Main resume analysis function
 */
export async function analyzeResume(
    resumeText: string,
    jobDescription?: string
): Promise<AnalysisResult> {
    // 1. Parse sections
    const sections = parseSections(resumeText);

    // 2. Base score (Content Quality) - check for metrics/numbers in experience
    const expText = sections.experience || resumeText; // fallback to full text if no experience section
    const metricMatches = expText.match(/\d+/g) || [];
    const metricCount = metricMatches.length;
    // More generous metric scoring
    const metricScore = Math.min(metricCount * 3, 30);

    // 3. Job description matching
    let jdMatchScore = 70; // Default reasonable score if no JD provided
    let semanticBreakdown: Record<string, number> = {};

    if (jobDescription && jobDescription.trim().length > 0) {
        semanticBreakdown = calculateSectionRelevance(sections, jobDescription);

        // Weighted average for JD match
        jdMatchScore =
            (semanticBreakdown.experience || 0) * 0.4 +
            (semanticBreakdown.skills || 0) * 0.4 +
            (semanticBreakdown.projects || 0) * 0.1 +
            (semanticBreakdown.education || 0) * 0.1;

        // Ensure minimum score if there's content
        if (resumeText.length > 500 && jdMatchScore < 30) {
            jdMatchScore = 30;
        }
    }

    // 4. Formatting score
    const formattingScore = calculateFormattingScore(resumeText, sections);

    // Score breakdown (all scores normalized to 0-100)
    const scoreBreakdown: ScoreBreakdown = {
        skills_match: Math.round(jdMatchScore),
        content_impact: Math.round(metricScore * (100 / 30)), // Normalize to 0-100
        formatting_score: formattingScore,
    };

    // Final score - weighted average
    const totalScore = Math.round(
        scoreBreakdown.skills_match * 0.4 +
        scoreBreakdown.content_impact * 0.25 +
        scoreBreakdown.formatting_score * 0.35
    );

    // 5. Bullet-Level Analysis (LLM)
    let bulletAnalysis: BulletAnalysis[] = [];
    let insights: string[] = [];

    if (llmService.isAvailable() && expText.trim()) {
        try {
            const bulletPrompt = `
Analyze the following resume bullet points.
For each bullet, provide:
1. Impact Score (0-100) based on action verbs, numbers, and result clarity.
2. A very brief specific improvement suggestion.

Return STRICT JSON: { "bullets": [ { "text": "original text...", "score": 85, "suggestion": "..." }, ... ] }

Bullets:
${expText.slice(0, 2000)}
      `.trim();

            const llmResult = await llmService.generateJSON<{ bullets?: BulletAnalysis[] }>(bulletPrompt);

            if (llmResult.bullets && Array.isArray(llmResult.bullets)) {
                bulletAnalysis = llmResult.bullets;

                // Derive insights from weak bullets
                const weakBullets = bulletAnalysis.filter((b) => (b.score || 0) < 60);
                if (weakBullets.length > 0) {
                    insights.push(`Found ${weakBullets.length} weak bullet points. See detailed analysis for fixes.`);
                }

                if (insights.length === 0 && bulletAnalysis.length > 0) {
                    insights = bulletAnalysis
                        .slice(0, 2)
                        .map((b) => `Improvement Idea: ${b.suggestion}`)
                        .filter(Boolean);
                }
            }
        } catch (error) {
            console.error('Bullet analysis error:', error);
        }
    }

    // Fallback insights
    if (insights.length === 0) {
        if (metricCount < 3) {
            insights.push("Your 'Experience' section lacks quantifiable metrics. Recruiters love data!");
        }
        if (formattingScore < 70) {
            insights.push('Formatting check: Ensure clear section headers and consistent spacing.');
        }
    }

    return {
        total_score: totalScore,
        section_scores: semanticBreakdown,
        score_breakdown: scoreBreakdown,
        bullet_analysis: bulletAnalysis,
        insights,
        sections,
    };
}
