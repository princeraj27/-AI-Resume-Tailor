"use client"

import { useState } from 'react'
import { UploadArea } from '@/components/upload-area'
import { Dashboard } from '@/components/dashboard'
import { uploadResume, AnalysisResponse } from '@/lib/api'
// import { Toaster } from 'sonner' // Removed unused import
// Shadcn usually adds sonner if asked. I didn't add it. I'll skip toast or use Alert.

export default function Home() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [jobDescription, setJobDescription] = useState("")

  const handleAnalyze = async (file: File, jd: string) => {
    setLoading(true)
    setJobDescription(jd)
    try {
      const data = await uploadResume(file, jd)
      setAnalysisData(data)
    } catch (error) {
      console.error("Analysis failed", error)
      alert("Analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setAnalysisData(null)
    setJobDescription("")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-7xl">
        {!analysisData ? (
          <UploadArea onAnalyze={handleAnalyze} isAnalyzing={loading} />
        ) : (
          <Dashboard
            analysis={analysisData.analysis}
            fullText={analysisData.full_text}
            jobDescription={jobDescription}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  )
}
