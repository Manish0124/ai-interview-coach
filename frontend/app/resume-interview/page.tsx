'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResumeInterview() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [resumeId, setResumeId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (validTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only PDF, TXT, and DOCX files are allowed');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload resume');
      }

      const uploadData = await uploadRes.json();
      setResumeId(uploadData.resumeId);

      // Generate questions based on resume
      const questionsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions/generate-from-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: uploadData.resumeId }),
      });

      if (!questionsRes.ok) {
        throw new Error('Failed to generate questions');
      }

      const questionsData = await questionsRes.json();
      setQuestions(questionsData.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleStartInterview = async () => {
    if (selectedQuestions.length === 0) {
      setError('Please select at least one question');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Resume-Based',
          questionIds: selectedQuestions,
        }),
      });

      if (!res.ok) throw new Error('Failed to start interview');

      const data = await res.json();
      router.push(`/interview/${data.interviewId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interview');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">Resume-Based Interview</h1>
          <p className="text-slate-400 mb-8">Upload your resume and get AI-generated interview questions tailored to your experience</p>

          {!questions.length ? (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.docx"
                  className="hidden"
                  id="resume-input"
                />
                <label htmlFor="resume-input" className="cursor-pointer">
                  <div className="text-slate-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-white font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-slate-500">PDF, TXT, or DOCX (max 10MB)</p>
                </label>
              </div>

              {file && (
                <div className="bg-slate-700 rounded p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 16.5a.5.5 0 01-.5-.5v-5.19l-1.841 1.841a.75.75 0 101.06-1.06L8 9.881l2.22 2.22a.75.75 0 101.06-1.06l-1.841-1.841V16a.5.5 0 01-.5.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
              >
                {loading ? 'Processing...' : 'Upload & Generate Questions'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-700 text-green-400 p-4 rounded">
                ✓ Resume processed successfully! Select questions to practice.
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white">Generated Questions</h2>
                {questions.map((q) => (
                  <div
                    key={q._id}
                    className="bg-slate-700 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition cursor-pointer"
                    onClick={() => handleSelectQuestion(q._id)}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(q._id)}
                        onChange={() => handleSelectQuestion(q._id)}
                        className="mt-1 w-5 h-5 rounded border-slate-500 text-blue-600 cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{q.question}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                            {q.difficulty}
                          </span>
                          <span className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                            {q.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 text-red-400 p-4 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setQuestions([]);
                    setFile(null);
                    setSelectedQuestions([]);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Upload Different Resume
                </button>
                <button
                  onClick={handleStartInterview}
                  disabled={selectedQuestions.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
                >
                  Start Interview ({selectedQuestions.length} selected)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
