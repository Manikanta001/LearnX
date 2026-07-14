import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import InterviewTimer from '@/components/InterviewTimer';
import DifficultyBadge from '@/components/DifficultyBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Play, Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function InterviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [problems, setProblems] = useState<any[]>([]);
  const [duration, setDuration] = useState(2700);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusByProblem, setStatusByProblem] = useState<Record<string, 'not_started' | 'attempted' | 'solved'>>({});
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [updating, setUpdating] = useState(false);

  const startInterview = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/interview/start');
      setProblems(res.data.problems);
      setDuration(res.data.duration);

      const initialStatus: Record<string, 'not_started' | 'attempted' | 'solved'> = {};
      res.data.problems.forEach((p: any) => {
        initialStatus[p.id] = 'not_started';
      });
      setStatusByProblem(initialStatus);
      setStarted(true);
    } catch (err) {
      console.error('Failed to start interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    setFinished(true);
  }, []);

  const handleMarkProgress = async (problemId: string, status: 'attempted' | 'solved') => {
    setUpdating(true);
    try {
      await api.post(`/problems/${problemId}/progress`, { status });
      setStatusByProblem((prev) => ({ ...prev, [problemId]: status }));
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mb-8">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Timer className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Mock Interview Mode</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Simulate a real coding interview with 3 problems and a 45-minute timer.
            Hints are disabled during the interview.
          </p>
        </div>

        <Card className="mb-8 text-left">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm">3 problems: Easy, Medium, Hard</span>
            </div>
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 text-primary" />
              <span className="text-sm">45-minute countdown timer</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm">Hints are disabled</span>
            </div>
          </CardContent>
        </Card>

        <Button size="lg" onClick={startInterview} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
          Start Interview
        </Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Interview Complete!</h1>
        <p className="text-muted-foreground mb-8">Great job! Your interview progress is saved.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/dashboard')}>View Dashboard</Button>
          <Button variant="outline" onClick={() => { setStarted(false); setFinished(false); }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentIndex];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">Mock Interview</h2>
          <div className="flex gap-1">
            {problems.map((_, i) => (
              <Button
                key={i}
                variant={currentIndex === i ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentIndex(i)}
              >
                Q{i + 1}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <InterviewTimer duration={duration} onTimeUp={handleTimeUp} />
          <Button size="sm" onClick={() => setFinished(true)} className="gap-2">
            Finish Interview
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold">{currentProblem.title}</h2>
            <DifficultyBadge difficulty={currentProblem.difficulty} />
          </div>
          <p className="text-xs text-muted-foreground mb-4">Status: {statusByProblem[currentProblem.id] || 'not_started'}</p>
          <div className="prose prose-sm dark:prose-invert">
            <p className="whitespace-pre-wrap text-sm">{currentProblem.description}</p>
          </div>
          {currentProblem.examples?.map((ex: any, i: number) => (
            <Card key={i} className="mt-4 bg-muted/30">
              <CardContent className="p-3 text-sm space-y-1">
                <div><strong>Input:</strong> <code>{ex.input}</code></div>
                <div><strong>Output:</strong> <code>{ex.output}</code></div>
              </CardContent>
            </Card>
          ))}
          <div className="mt-6 flex flex-wrap gap-2">
            {(currentProblem.sourceUrl || currentProblem.leetcodeUrl || currentProblem.gfgUrl) && (
              <a href={currentProblem.sourceUrl || currentProblem.leetcodeUrl || currentProblem.gfgUrl} target="_blank" rel="noreferrer">
                <Button className="gap-2"><ExternalLink className="h-4 w-4" />Open External Problem</Button>
              </a>
            )}
            <Button variant="outline" disabled={updating} onClick={() => handleMarkProgress(currentProblem.id, 'attempted')}>
              Mark Attempted
            </Button>
            <Button disabled={updating} onClick={() => handleMarkProgress(currentProblem.id, 'solved')}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mark Solved
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
