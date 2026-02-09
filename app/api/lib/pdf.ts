/**
 * PDF Service - Extract text from PDF buffers
 * Uses pdf2json which is a pure Node.js PDF parser
 */

import PDFParser from 'pdf2json';

interface PDFPage {
    Texts: Array<{
        R: Array<{
            T: string;
        }>;
    }>;
}

interface PDFData {
    Pages: PDFPage[];
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (errData: Error | { parserError: Error }) => {
            const errorMsg = 'parserError' in errData ? errData.parserError.message : errData.message;
            console.error('PDF parse error:', errorMsg);
            reject(new Error(`Failed to extract text from PDF: ${errorMsg}`));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData: PDFData) => {
            try {
                // Extract text from all pages
                const textParts: string[] = [];

                for (const page of pdfData.Pages) {
                    for (const textItem of page.Texts) {
                        for (const run of textItem.R) {
                            // Safely decode URI-encoded text with fallback
                            let decodedText: string;
                            try {
                                decodedText = decodeURIComponent(run.T);
                            } catch {
                                // If decoding fails, use the raw text
                                decodedText = run.T;
                            }
                            textParts.push(decodedText);
                        }
                    }
                    textParts.push('\n'); // Page break
                }

                const fullText = textParts.join(' ');
                resolve(fullText);
            } catch (error) {
                console.error('PDF text extraction error:', error);
                reject(new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });

        // Parse the buffer
        pdfParser.parseBuffer(buffer);
    });
}
