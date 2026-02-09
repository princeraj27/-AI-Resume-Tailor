import OpenAI from 'openai';

// LLM Service using Groq API (OpenAI-compatible)
class LLMService {
    private client: OpenAI | null = null;
    private model = 'llama-3.3-70b-versatile';

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn('WARNING: GROQ_API_KEY not found. LLM features will be disabled/mocked.');
        } else {
            this.client = new OpenAI({
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: apiKey,
            });
        }
    }

    isAvailable(): boolean {
        return this.client !== null;
    }

    async generateText(
        prompt: string,
        systemPrompt: string = 'You are a helpful AI career coach.'
    ): Promise<string> {
        if (!this.client) {
            return 'LLM Service Unavailable (Missing API Key)';
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            });
            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('LLM Error:', error);
            return 'Error generating content.';
        }
    }

    async generateJSON<T = Record<string, unknown>>(
        prompt: string,
        systemPrompt: string = 'You are an AI that outputs JSON.'
    ): Promise<T> {
        if (!this.client) {
            return {} as T;
        }

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt + ' Output valid JSON only. Do not wrap in markdown code blocks.',
                    },
                    { role: 'user', content: prompt },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
            });

            let content = response.choices[0]?.message?.content || '{}';
            // Clean possible markdown
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(content) as T;
        } catch (error) {
            console.error('LLM JSON Error:', error);
            return {} as T;
        }
    }
}

// Export singleton instance
export const llmService = new LLMService();
