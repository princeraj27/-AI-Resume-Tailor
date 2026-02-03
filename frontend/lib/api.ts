import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
    baseURL: API_URL,
});


export interface GenericAnalysis {
    score: number;
    matching_skills: string[];
    missing_skills: string[];
    resume_skills: string[];
    section_scores?: Record<string, number>;
    score_breakdown?: {
        skills_match: number;
        content_impact: number;
        formatting_score: number;
    };
    bullet_analysis?: {
        text: string;
        score: number;
        suggestion: string;
    }[];
}

export interface FeedbackResponse {
    score: number;
    star_breakdown: {
        situation: number;
        task: number;
        action: number;
        result: number;
    };
    feedback: string[];
    improved_answer: string;
}

export interface AnalysisResponse {
    full_text: string;
    analysis: GenericAnalysis;
}

export const uploadResume = async (file: File, jobDescription?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
        formData.append('job_description', jobDescription);
    }

    const response = await api.post<AnalysisResponse>('/analyze', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const generateQuestions = async (resumeText: string, jobDescription?: string) => {
    const payload = {
        resume_text: resumeText,
        job_description: jobDescription
    };

    const response = await api.post<{ questions: string[] }>('/interview-questions', payload);
    return response.data;
};

export const interviewFeedback = async (question: string, answer: string) => {
    const payload = {
        question: question,
        answer: answer
    };

    const response = await api.post<FeedbackResponse>('/interview-feedback', payload);
    return response.data;
};
