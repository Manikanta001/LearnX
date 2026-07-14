import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Timer, AlertTriangle, CheckCircle, XCircle, Award, HelpCircle, ArrowRight } from 'lucide-react';

export default function QuizAttemptPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string[]>>({}); // questionId -> selected options
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null); // graded submission details
  const [attemptNumber, setAttemptNumber] = useState(1);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quizzes/${quizId}`);
        setQuiz(res.data.quiz);
        setAttemptNumber(res.data.currentAttempt);
        setTimeLeft((res.data.quiz.duration || 15) * 60);
      } catch (err: any) {
        console.error('Fetch quiz error:', err);
        alert(err.response?.data?.error || 'Failed to fetch quiz');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    if (quizId && user) {
      fetchQuiz();
    }
  }, [quizId, user]);

  // Countdown clock timer
  useEffect(() => {
    if (loading || result || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, result]);

  const handleSelectOption = (questionId: string, option: string, type: string) => {
    if (result) return; // disable editing after submit

    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === 'SingleCorrect' || type === 'TrueFalse') {
        return { ...prev, [questionId]: [option] };
      } else if (type === 'MultipleCorrect') {
        const next = current.includes(option)
          ? current.filter((opt) => opt !== option)
          : [...current, option];
        return { ...prev, [questionId]: next };
      }
      return prev;
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: [text] }));
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (submitting || result) return;

    try {
      setSubmitting(true);
      if (autoSubmit) {
        alert('Time is up! Your quiz is being submitted automatically.');
      }

      // Map answers to backend submission format
      const formattedAnswers = Object.entries(answers).map(([qId, opts]) => ({
        questionId: qId,
        selectedAnswers: opts,
      }));

      // Calculate time spent
      const durationSeconds = (quiz.duration || 15) * 60;
      const timeTaken = durationSeconds - timeLeft;

      const res = await api.post(`/quizzes/${quizId}/submit`, {
        answersSubmitted: formattedAnswers,
        timeTaken,
      });

      setResult(res.data.submission);
    } catch (err) {
      console.error('Submit quiz error:', err);
      alert('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Quiz Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{quiz.title}</h1>
          <p className="text-muted-foreground mt-1">{quiz.description || 'Assessed testing module.'}</p>
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs font-semibold text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">Attempt {attemptNumber} of {quiz.maxAttempts}</span>
            <span className="px-2 py-1 rounded bg-muted">{quiz.questions?.length || 0} Questions</span>
            <span className="px-2 py-1 rounded bg-muted">{quiz.pointsPerQuestion || 10} Points each</span>
            {quiz.negativeMarking && (
              <span className="px-2 py-1 rounded bg-rose-50 text-rose-600 border border-rose-100 font-bold">
                -{quiz.negativeMarkValue * 100}% Negative Marking
              </span>
            )}
          </div>
        </div>

        {/* Timer countdown floating card */}
        {!result && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/20 bg-primary/5 text-primary shadow-sm font-bold tracking-wider animate-pulse shrink-0">
            <Timer className="h-4.5 w-4.5" />
            <span>Time Left: {formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Quiz Attempt Mode */}
      {!result ? (
        <div className="space-y-6">
          {quiz.questions?.map((q: any, qIdx: number) => {
            const selected = answers[q._id] || [];

            return (
              <Card key={q._id} className="border hover:border-primary/10 transition-colors">
                <CardHeader>
                  <CardTitle className="text-base flex items-start gap-2 text-foreground font-bold">
                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    {q.questionText}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pl-10">
                  {/* Select types: SingleCorrect / MultipleCorrect / TrueFalse */}
                  {(q.type === 'SingleCorrect' || q.type === 'MultipleCorrect' || q.type === 'TrueFalse') && (
                    <div className="grid grid-cols-1 gap-2">
                      {q.options?.map((opt: string) => {
                        const isChosen = selected.includes(opt);
                        const multiSelect = q.type === 'MultipleCorrect';

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectOption(q._id, opt, q.type)}
                            className={classNameMap(
                              'flex items-center justify-between p-3.5 rounded-xl border text-left text-sm transition-all outline-none',
                              isChosen
                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span>{opt}</span>
                            <div
                              className={classNameMap(
                                'h-5 w-5 shrink-0 flex items-center justify-center border',
                                multiSelect ? 'rounded' : 'rounded-full',
                                isChosen ? 'border-primary bg-primary text-white' : 'border-border bg-card'
                              )}
                            >
                              {isChosen && <div className={classNameMap('h-2 w-2 bg-white', multiSelect ? 'rounded-xs' : 'rounded-full')} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Input Type: FillInBlank */}
                  {q.type === 'FillInBlank' && (
                    <input
                      type="text"
                      placeholder="Type your exact answer here..."
                      value={selected[0] || ''}
                      onChange={(e) => handleTextChange(q._id, e.target.value)}
                      className="w-full max-w-md px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="pt-4 flex justify-end gap-2">
            <Button
              onClick={() => handleSubmitQuiz(false)}
              disabled={submitting}
              className="rounded-full shadow-md bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white px-8 gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz Attempts'}
            </Button>
          </div>
        </div>
      ) : (
        // Quiz Results Graded view
        <div className="space-y-8">
          {/* Results Summary Card */}
          <Card className={classNameMap('border-2 shadow-lg overflow-hidden', result.passed ? 'border-emerald-200 bg-emerald-50/5' : 'border-rose-200 bg-rose-50/5')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto h-14 w-14 bg-card rounded-full flex items-center justify-center shadow-inner mb-2">
                <Award className={classNameMap('h-8 w-8', result.passed ? 'text-emerald-500' : 'text-rose-500')} />
              </div>
              <CardTitle className="text-2xl font-extrabold text-foreground">
                {result.passed ? 'Pass Status: Passed!' : 'Pass Status: Failed'}
              </CardTitle>
              <CardDescription className="text-sm">
                Your score: <strong>{result.score}</strong> / {result.maxScore} (Min Passing: {result.maxScore * 0.5})
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground text-xs pb-6 border-t pt-4">
              Attempted under {formatTime(result.timeTaken)} seconds. Completion records saved.
            </CardContent>
          </Card>

          {/* Graded Question Review */}
          <h2 className="text-xl font-bold text-foreground">Submission Review</h2>
          <div className="space-y-6">
            {result.evaluationDetails?.map((eq: any, idx: number) => {
              return (
                <Card key={eq.questionId} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-start gap-2 text-foreground font-semibold">
                      {eq.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span>Question {idx + 1}: {eq.questionText}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pl-10 text-sm">
                    {/* User Selection */}
                    <div>
                      <span className="text-muted-foreground font-medium">Your answer: </span>
                      <span className={classNameMap('font-semibold', eq.isCorrect ? 'text-emerald-600' : 'text-rose-600')}>
                        {eq.selected.join(', ') || '(No Option Selected)'}
                      </span>
                    </div>

                    {/* Correct answers */}
                    {!eq.isCorrect && (
                      <div>
                        <span className="text-muted-foreground font-medium">Correct answer: </span>
                        <span className="font-semibold text-emerald-600">
                          {eq.correct.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Explanation */}
                    {eq.explanation && (
                      <div className="p-3 bg-muted/40 border-l-2 border-primary rounded text-xs text-muted-foreground space-y-1">
                        <p className="font-bold flex items-center gap-1 text-foreground">
                          <HelpCircle className="h-3.5 w-3.5 text-primary" /> Explanation:
                        </p>
                        <p className="leading-relaxed">{eq.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={() => navigate(-1)} className="rounded-full shadow-sm px-6 gap-1.5">
              Return to course learning portal <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
