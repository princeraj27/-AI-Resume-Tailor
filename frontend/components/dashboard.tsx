"use client"

import { useState } from 'react'
import { GenericAnalysis, generateQuestions, interviewFeedback } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Brain, CheckCircle2, XCircle, AlertCircle, RefreshCw, FileText, Loader2, MessageSquare, Lightbulb, BarChart } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DashboardProps {
    analysis: GenericAnalysis
    fullText: string
    jobDescription?: string
    onReset: () => void
}

interface FeedbackResult {
    score: number;
    feedback: string[];
    improved_answer: string;
}

export function Dashboard({ analysis, fullText, jobDescription, onReset }: DashboardProps) {
    const [questions, setQuestions] = useState<string[]>([])
    const [loadingQuestions, setLoadingQuestions] = useState(false)

    // Interview State
    const [activeQuestion, setActiveQuestion] = useState<string | null>(null)
    const [userAnswer, setUserAnswer] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<FeedbackResult | null>(null)

    const handleGenerateQuestions = async () => {
        setLoadingQuestions(true)
        try {
            const res = await generateQuestions(fullText, jobDescription)
            setQuestions(res.questions)
            setActiveQuestion(null)
            setUserAnswer("")
            setFeedback(null)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingQuestions(false)
        }
    }

    const handleSubmitAnswer = async () => {
        if (!activeQuestion || !userAnswer) return

        setIsSubmitting(true)
        try {
            const res = await interviewFeedback(activeQuestion, userAnswer)
            setFeedback(res)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600"
        if (score >= 60) return "text-yellow-600"
        return "text-red-600"
    }

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Analysis Dashboard</h2>
                <Button variant="outline" onClick={onReset}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Upload New
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Card - Enhanced with Section Breakdown */}
                <Card className="md:col-span-1 shadow-md border-t-4 border-t-blue-500 flex flex-col">
                    <CardHeader>
                        <CardTitle>ATS Compatibility</CardTitle>
                        <CardDescription>Based on skills, metrics, and relevance</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="relative flex items-center justify-center w-32 h-32">
                                <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 128 128">
                                    <circle cx="64" cy="64" r="58" stroke="#e5e7eb" strokeWidth="12" fill="transparent" />
                                    <circle
                                        cx="64" cy="64" r="58"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={365}
                                        strokeDashoffset={365 - (365 * analysis.score) / 100}
                                        className={`transition-all duration-1000 ease-out ${getScoreColor(analysis.score)}`}
                                    />
                                </svg>
                                <span className={`absolute text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                                    {analysis.score}%
                                </span>
                            </div>
                        </div>

                        {/* Section Scores */}
                        {analysis.section_scores && (
                            <div className="space-y-3 mt-4">
                                <h4 className="text-sm font-semibold flex items-center text-gray-700"><BarChart className="w-4 h-4 mr-2" /> Detailed Breakdown</h4>
                                {Object.entries(analysis.section_scores).map(([section, score]) => (
                                    <div key={section} className="space-y-1">
                                        <div className="flex justify-between text-xs uppercase text-gray-500 font-medium">
                                            <span>{section}</span>
                                            <span>{Number(score).toFixed(2)}%</span>
                                        </div>
                                        <Progress value={score} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="insights" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="insights">Insights</TabsTrigger>
                            <TabsTrigger value="interview">Interview Prep</TabsTrigger>
                            <TabsTrigger value="preview">Resume Preview</TabsTrigger>
                        </TabsList>

                        <TabsContent value="insights" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Analysis & Insights</CardTitle>
                                    <CardDescription>Actionable feedback to improve your resume score.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* High Priority Insights (from LLM) */}
                                    {analysis.missing_skills.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-medium mb-2 flex items-center text-purple-700">
                                                <Lightbulb className="mr-2 h-4 w-4" /> Recommended Improvements
                                            </h4>
                                            {analysis.missing_skills.map((insight, i) => (
                                                <Alert key={i} className="bg-purple-50 border-purple-100">
                                                    <AlertTitle className="text-sm font-semibold text-purple-800">Insight #{i + 1}</AlertTitle>
                                                    <AlertDescription className="text-sm text-purple-700">
                                                        {insight.replace("Improvement Idea: ", "")}
                                                    </AlertDescription>
                                                </Alert>
                                            ))}
                                        </div>
                                    )}

                                    {/* Matched Skills */}
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 flex items-center text-green-700">
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Detected Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.matching_skills && analysis.matching_skills.length > 0 ? (
                                                analysis.matching_skills.map(skill => (
                                                    <Badge key={skill} variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                                                        {skill}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No direct matches found or no JD provided.</p>
                                            )}

                                            {!jobDescription && analysis.resume_skills.map(skill => (
                                                <Badge key={skill} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="interview" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Interactive Interview Coach</CardTitle>
                                    <CardDescription>Practice answering questions generated specifically for your profile.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {questions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                            <Brain className="w-12 h-12 text-gray-300" />
                                            <p className="text-gray-500">Ready to prepare? Generate questions based on this resume.</p>
                                            <Button onClick={handleGenerateQuestions} disabled={loadingQuestions}>
                                                {loadingQuestions ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                                    </>
                                                ) : (
                                                    "Generate Questions"
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                    {questions.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm text-gray-500">Questions</h4>
                                                <ScrollArea className="h-[400px] w-full rounded-md border p-2">
                                                    <div className="space-y-2">
                                                        {questions.map((q, i) => (
                                                            <div
                                                                key={i}
                                                                onClick={() => { setActiveQuestion(q); setFeedback(null); setUserAnswer(""); }}
                                                                className={cn(
                                                                    "p-3 rounded-lg border cursor-pointer hover:bg-blue-50 transition-colors text-sm",
                                                                    activeQuestion === q ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-gray-50"
                                                                )}
                                                            >
                                                                <span className="font-bold text-blue-500 mr-2">Q{i + 1}</span>
                                                                {q}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="font-medium text-sm text-gray-500">Your Answer (STAR Method)</h4>
                                                {activeQuestion ? (
                                                    <div className="flex flex-col h-full space-y-4">
                                                        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 text-sm italic text-blue-800">
                                                            {activeQuestion}
                                                        </div>
                                                        <Textarea
                                                            placeholder="Type your answer here..."
                                                              className="max-h-[250px] "
                                                            value={userAnswer}
                                                            onChange={(e) => setUserAnswer(e.target.value)}
                                                        />
                                                        <Button onClick={handleSubmitAnswer} disabled={!userAnswer || isSubmitting}>
                                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                                            Get Feedback
                                                        </Button>

                                                        {feedback && (
                                                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-3 mt-4 border-t pt-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h5 className="font-semibold text-gray-800">Coach Feedback</h5>
                                                                    <Badge variant={feedback.score > 70 ? "default" : "destructive"} className="text-sm px-3 py-1">{feedback.score}/100</Badge>
                                                                </div>

                                                                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                                                                    <strong>Key Takeaways:</strong>
                                                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                                                        {feedback.feedback.map((point, i) => (
                                                                            <li key={i}>{point}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>

                                                                {feedback.improved_answer && (
                                                                    <div className="bg-green-50 p-3 rounded border border-green-100">
                                                                        <strong className="text-green-800 text-sm block mb-1">Improved Answer Suggestion:</strong>
                                                                        <p className="text-green-700 text-xs italic">{feedback.improved_answer}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-md p-8 text-center text-gray-400 text-sm">
                                                        Select a question from the left to start practicing.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Resume Content & Insights</CardTitle>
                                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                                            <Lightbulb className="w-3 h-3 mr-1" /> Enhanced View
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <ScrollArea className="md:col-span-2 h-[500px] w-full rounded-md border p-4 bg-gray-50">
                                            <pre className="whitespace-pre-wrap text-sm font-mono text-gray-700 leading-relaxed">
                                                {fullText}
                                            </pre>
                                        </ScrollArea>

                                        <div className="space-y-4">
                                            <h4 className="font-semibold text-sm flex items-center">
                                                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                                                Automated Insights
                                            </h4>
                                            <div className="space-y-3">
                                                <Alert className="bg-blue-50 border-blue-100">
                                                    <AlertTitle className="text-xs font-bold text-blue-700">Formatting</AlertTitle>
                                                    <AlertDescription className="text-xs text-blue-600">
                                                        Ensure distinct section headers for "Experience" and "Skills" for better ATS parsing.
                                                    </AlertDescription>
                                                </Alert>

                                                <Alert className="bg-yellow-50 border-yellow-100">
                                                    <AlertTitle className="text-xs font-bold text-yellow-700">Content Impact</AlertTitle>
                                                    <AlertDescription className="text-xs text-yellow-600">
                                                        Use numbers (e.g., "Increased revenue by 20%") to quantify your achievements.
                                                    </AlertDescription>
                                                </Alert>

                                                {analysis.missing_skills.length > 0 && (
                                                    <Alert className="bg-red-50 border-red-100">
                                                        <AlertTitle className="text-xs font-bold text-red-700">Keywords</AlertTitle>
                                                        <AlertDescription className="text-xs text-red-600">
                                                            Consider adding: {analysis.missing_skills.slice(0, 3).join(", ")}.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
