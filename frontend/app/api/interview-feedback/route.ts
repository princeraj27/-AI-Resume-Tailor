import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '../lib/llm';

interface FeedbackRequest {
    question: string;
    answer: string;
}

interface StarBreakdown {
    situation: number;
    task: number;
    action: number;
    result: number;
}

interface FeedbackResponse {
    score: number;
    star_breakdown: StarBreakdown;
    feedback: string[];
    improved_answer: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: FeedbackRequest = await request.json();
        const { question, answer } = body;

        if (!question || !answer) {
            return NextResponse.json(
                { error: 'Both question and answer are required' },
                { status: 400 }
            );
        }

        let score = 0;
        let starBreakdown: StarBreakdown = { situation: 0, task: 0, action: 0, result: 0 };
        let feedbackPoints: string[] = [];
        let improvedAnswer = '';

        if (llmService.isAvailable()) {
            const prompt = `
Evaluate the following interview answer using the STRICT STAR method.
Question: ${question}
Answer: ${answer}

Provide:
1. A breakdown score for each component (Situation, Task, Action, Result) out of 10.
2. An overall score (0-100).
3. A list of 3 specific feedback points.
4. An improved version of the answer.

Output Strictly JSON: 
{ 
  "score": int, 
  "star_breakdown": { "situation": int, "task": int, "action": int, "result": int },
  "feedback": [str], 
  "improved_answer": str 
}
      `.trim();

            const result = await llmService.generateJSON<{
                score?: number;
                star_breakdown?: StarBreakdown;
                feedback?: string[];
                improved_answer?: string;
            }>(prompt);

            score = result.score || 0;
            starBreakdown = result.star_breakdown || { situation: 0, task: 0, action: 0, result: 0 };
            feedbackPoints = result.feedback || ['Could not generate feedback.'];
            improvedAnswer = result.improved_answer || 'Could not generate improvement.';
        } else {
            // Fallback simulation
            score = 50;
            starBreakdown = { situation: 5, task: 5, action: 5, result: 5 };

            const wordCount = answer.split(/\s+/).length;
            if (wordCount < 20) {
                feedbackPoints.push('Your answer is a bit too short. Try to elaborate more using the STAR method.');
            } else {
                feedbackPoints.push('Good length! You provided enough detail.');
                score = 80;
                starBreakdown = { situation: 8, task: 8, action: 8, result: 8 };
            }

            improvedAnswer = 'LLM service unavailable for improved answer generation.';
        }

        const response: FeedbackResponse = {
            score,
            star_breakdown: starBreakdown,
            feedback: feedbackPoints,
            improved_answer: improvedAnswer,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Interview feedback error:', error);
        return NextResponse.json(
            { error: 'Failed to generate feedback' },
            { status: 500 }
        );
    }
}
