import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '../lib/llm';

interface InterviewRequest {
    resume_text: string;
    job_description?: string;
}

const FALLBACK_QUESTIONS = [
    'Tell me about a time you used Python to solve a difficult problem.',
    'How do you handle conflict in a team setting?',
    'Describe your experience with React and state management.',
    'What is your approach to testing and ensuring code quality?',
    'Where do you see yourself in 5 years?',
];

export async function POST(request: NextRequest) {
    try {
        const body: InterviewRequest = await request.json();
        const { resume_text, job_description } = body;

        if (!resume_text) {
            return NextResponse.json(
                { error: 'resume_text is required' },
                { status: 400 }
            );
        }

        let questions: string[] = [];

        if (llmService.isAvailable()) {
            const prompt = `
Generate 5 interview questions based on the following resume. 
If a Job Description is provided, tailor them to the role.

Resume Content:
${resume_text.slice(0, 2000)}

Job Description:
${job_description || 'N/A'}

Output strictly JSON object: { "questions": ["question 1", "question 2", ...] }
      `.trim();

            const response = await llmService.generateJSON<{ questions?: string[] } | string[]>(prompt);

            // Robust parsing
            if (Array.isArray(response)) {
                questions = response;
            } else if (typeof response === 'object' && response !== null) {
                questions = (response as { questions?: string[] }).questions || [];
            }
        }

        // Fallback if LLM failed or returned empty
        if (questions.length === 0) {
            console.log('LLM returned 0 questions, using fallback.');
            questions = FALLBACK_QUESTIONS;
        }

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Interview questions error:', error);
        return NextResponse.json(
            { error: 'Failed to generate questions' },
            { status: 500 }
        );
    }
}
