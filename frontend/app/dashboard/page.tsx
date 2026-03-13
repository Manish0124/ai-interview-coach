'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getInterviewHistory } from '@/lib/api';
import { Interview } from '@/lib/types';

export default function DashboardPage(): JSX.Element {
  const { data: session } = useSession();
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      if (!session?.user) return;
      try {
        const token = (session.user as any).token;
        const res = await getInterviewHistory(token);
        setInterviews(res.data.interviews);
      } catch (error) {
        console.error('Error fetching interviews:', error);
      }
      setLoading(false);
    };
    fetchInterviews();
  }, [session]);

  // Calculate statistics
  const totalInterviews = interviews.length;
  const avgScore = interviews.length > 0
    ? Math.round(interviews.reduce((sum, i) => sum + (i.score || 0), 0) / interviews.length)
    : 0;

  const scoresByType = {
    Frontend: interviews.filter(i => i.type === 'Frontend'),
    Backend: interviews.filter(i => i.type === 'Backend'),
    HR: interviews.filter(i => i.type === 'HR')
  };

  const avgByType = {
    Frontend: scoresByType.Frontend.length > 0
      ? Math.round(scoresByType.Frontend.reduce((sum, i) => sum + (i.score || 0), 0) / scoresByType.Frontend.length)
      : 0,
    Backend: scoresByType.Backend.length > 0
      ? Math.round(scoresByType.Backend.reduce((sum, i) => sum + (i.score || 0), 0) / scoresByType.Backend.length)
      : 0,
    HR: scoresByType.HR.length > 0
      ? Math.round(scoresByType.HR.reduce((sum, i) => sum + (i.score || 0), 0) / scoresByType.HR.length)
      : 0
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50';
    if (score >= 60) return 'bg-blue-50';
    if (score >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="bg-slate-800 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Interview Coach</h1>
            <p className="text-slate-400 text-sm">Performance Dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-white font-semibold">{session?.user?.name || 'User'}</p>
              <p className="text-slate-400 text-sm">{session?.user?.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/resume-interview')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                📄 Resume Interview
              </button>
              <button
                onClick={() => router.push('/interview/select')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                + New Interview
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Interviews */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold">Total Interviews</p>
                <p className="text-4xl font-bold mt-2">{totalInterviews}</p>
              </div>
              <div className="text-5xl opacity-20">📊</div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-semibold">Average Score</p>
                <p className="text-4xl font-bold mt-2">{avgScore}%</p>
              </div>
              <div className="text-5xl opacity-20">⭐</div>
            </div>
          </div>

          {/* Best Score */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-semibold">Best Score</p>
                <p className="text-4xl font-bold mt-2">
                  {interviews.length > 0 ? Math.max(...interviews.map(i => i.score || 0)) : 0}%
                </p>
              </div>
              <div className="text-5xl opacity-20">🏆</div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-semibold">Completion Rate</p>
                <p className="text-4xl font-bold mt-2">{totalInterviews > 0 ? '100' : '0'}%</p>
              </div>
              <div className="text-5xl opacity-20">✅</div>
            </div>
          </div>
        </div>

        {/* Performance by Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Frontend */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Frontend</h3>
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                {scoresByType.Frontend.length} interviews
              </span>
            </div>
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Average Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgByType.Frontend)}`}>
                {avgByType.Frontend}%
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`${getProgressBarColor(avgByType.Frontend)} h-3 rounded-full transition-all`}
                style={{ width: `${avgByType.Frontend}%` }}
              />
            </div>
          </div>

          {/* Backend */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Backend</h3>
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                {scoresByType.Backend.length} interviews
              </span>
            </div>
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Average Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgByType.Backend)}`}>
                {avgByType.Backend}%
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`${getProgressBarColor(avgByType.Backend)} h-3 rounded-full transition-all`}
                style={{ width: `${avgByType.Backend}%` }}
              />
            </div>
          </div>

          {/* HR */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">HR</h3>
              <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm">
                {scoresByType.HR.length} interviews
              </span>
            </div>
            <div className="mb-4">
              <p className="text-slate-400 text-sm mb-2">Average Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(avgByType.HR)}`}>
                {avgByType.HR}%
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`${getProgressBarColor(avgByType.HR)} h-3 rounded-full transition-all`}
                style={{ width: `${avgByType.HR}%` }}
              />
            </div>
          </div>
        </div>

        {/* Interview History */}
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Interview History</h2>
            <p className="text-slate-400 text-sm mt-1">Your recent interview attempts</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading interviews...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-lg mb-4">No interviews yet</p>
              <button
                onClick={() => router.push('/interview/select')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Start Your First Interview
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700 border-b border-slate-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Progress</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview, index) => (
                    <tr key={interview._id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                      <td className="px-6 py-4">
                        <span className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {interview.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${getScoreColor(interview.score || 0)}`}>
                            {interview.score || 'N/A'}%
                          </span>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(interview.score || 0)}`}>
                            <span className={`text-sm font-bold ${getScoreColor(interview.score || 0)}`}>
                              {interview.score || 0}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32 bg-slate-700 rounded-full h-2">
                          <div
                            className={`${getProgressBarColor(interview.score || 0)} h-2 rounded-full transition-all`}
                            style={{ width: `${interview.score || 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(interview.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/interview/${interview._id}`)}
                          className="text-blue-400 hover:text-blue-300 font-semibold transition"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        {interviews.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Lowest Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(Math.min(...interviews.map(i => i.score || 0)))}`}>
                {Math.min(...interviews.map(i => i.score || 0))}%
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Total Questions Answered</p>
              <p className="text-3xl font-bold text-white">
                {interviews.reduce((sum, i) => sum + (i.answers?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Improvement</p>
              <p className="text-3xl font-bold text-green-500">
                {interviews.length > 1
                  ? `+${Math.round(((interviews[0].score || 0) - (interviews[interviews.length - 1].score || 0)))}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
