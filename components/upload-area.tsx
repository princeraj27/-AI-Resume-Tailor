"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { Label } from '@/components/ui/label'

interface UploadAreaProps {
    onAnalyze: (file: File, jobDescription: string) => Promise<void>
    isAnalyzing: boolean
}

export function UploadArea({ onAnalyze, isAnalyzing }: UploadAreaProps) {
    const [jobDescription, setJobDescription] = useState("")
    const [file, setFile] = useState<File | null>(null)

    // ... onDrop ...
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        multiple: false
    })

    const handleAnalyze = () => {
        if (file) {
            onAnalyze(file, jobDescription)
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    AI Resume Tailor
                </h1>
                <p className="text-muted-foreground">
                    Optimize your resume for ATS and get personalized interview questions.
                </p>
            </div>

            <Card className="p-6 space-y-4 shadow-lg border-2 border-dashed border-gray-200">
                <div
                    {...getRootProps()}
                    className={cn(
                        "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer",
                        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-400 hover:bg-gray-50",
                        file && "border-green-500 bg-green-50"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        {file ? <FileText className="w-8 h-8 text-green-500" /> : <Upload className="w-8 h-8 text-blue-500" />}
                    </div>
                    {file ? (
                        <div className="text-center">
                            <p className="font-semibold text-green-700">{file.name}</p>
                            <p className="text-sm text-green-600">Click to change file</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500">PDF (Max 10MB)</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="jd">Job Description (Optional)</Label>
                    <Textarea
                        placeholder="Paste the job description here for tailored analysis..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        className="max-h-[250px] "
                    />
                </div>

                <Button
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                    className="w-full text-lg py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-md"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing Resume...
                        </>
                    ) : (
                        "Analyze Resume"
                    )}
                </Button>
            </Card>
        </div>
    )
}
