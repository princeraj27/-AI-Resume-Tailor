/**
 * PDF Service - Extract text from PDF buffers
 * Uses pdf2json with improved text layout detection
 */

import PDFParser from 'pdf2json';

interface TextRun {
    T: string;
    S?: number; // style
}

interface TextItem {
    x: number;
    y: number;
    R: TextRun[];
    sw?: number; // space width
}

interface PDFPage {
    Texts: TextItem[];
    Height?: number;
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
                const lines: string[] = [];

                for (const page of pdfData.Pages) {
                    // Sort text items by Y position (top to bottom), then X (left to right)
                    const sortedTexts = [...page.Texts].sort((a, b) => {
                        const yDiff = (a.y || 0) - (b.y || 0);
                        if (Math.abs(yDiff) > 0.3) return yDiff; // Different lines
                        return (a.x || 0) - (b.x || 0); // Same line, sort by X
                    });

                    let currentLine = '';
                    let lastY = -1;
                    let lastX = -1;

                    for (const textItem of sortedTexts) {
                        const y = textItem.y || 0;
                        const x = textItem.x || 0;

                        // Check if we're on a new line (Y changed significantly)
                        if (lastY >= 0 && Math.abs(y - lastY) > 0.3) {
                            // New line detected
                            if (currentLine.trim()) {
                                lines.push(currentLine.trim());
                            }
                            currentLine = '';
                            lastX = -1;
                        }

                        // Extract text from runs
                        for (const run of textItem.R) {
                            let decodedText: string;
                            try {
                                decodedText = decodeURIComponent(run.T);
                            } catch {
                                decodedText = run.T;
                            }

                            // Add space before text if there's a gap
                            if (lastX >= 0 && x - lastX > 0.5 && currentLine && !currentLine.endsWith(' ')) {
                                currentLine += ' ';
                            }

                            currentLine += decodedText;
                        }

                        lastY = y;
                        lastX = x + (textItem.sw || 0.5); // Approximate end position
                    }

                    // Don't forget the last line
                    if (currentLine.trim()) {
                        lines.push(currentLine.trim());
                    }

                    lines.push(''); // Page break
                }

                const fullText = lines.join('\n');
                console.log('First 10 lines:', lines.slice(0, 10));
                resolve(fullText);
            } catch (error) {
                console.error('PDF text extraction error:', error);
                reject(new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });

        pdfParser.parseBuffer(buffer);
    });
}
