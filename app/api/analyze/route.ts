import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '../lib/pdf';
import { analyzeResume } from '../lib/analysis';
import { extractSkills } from '../lib/skills';

// Next.js App Router handles body parsing automatically for FormData

// Helper to convert Web ReadableStream to Node Readable
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
    }

    return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Content-Type must be multipart/form-data' },
                { status: 400 }
            );
        }

        // Parse form data using native FormData API
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const jobDescription = formData.get('job_description') as string | null;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from PDF
        const fullText = await extractTextFromPDF(buffer);

        // Debug: Log first 500 chars of extracted text
        console.log('=== Extracted PDF Text (first 500 chars) ===');
        console.log(fullText.slice(0, 500));
        console.log('=== End of sample ===');
        console.log('Total text length:', fullText.length);

        // Run analysis
        const analysisResult = await analyzeResume(fullText, jobDescription || undefined);

        console.log('=== Analysis Result ===');
        console.log('Total score:', analysisResult.total_score);
        console.log('Section scores:', analysisResult.section_scores);

        // Extract skills for legacy frontend support
        const skills = extractSkills(fullText);

        // Return response matching Python backend structure
        return NextResponse.json({
            full_text: fullText,
            analysis: {
                score: analysisResult.total_score,
                matching_skills: skills,
                missing_skills: analysisResult.insights,
                resume_skills: skills,
                section_scores: analysisResult.section_scores,
                score_breakdown: analysisResult.score_breakdown,
                bullet_analysis: analysisResult.bullet_analysis,
            },
        });
    } catch (error) {
        console.error('Analyze error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to analyze resume: ${errorMessage}` },
            { status: 500 }
        );
    }
}
