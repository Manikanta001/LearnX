import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/api';
import { aiService } from '@/services/api';
import DifficultyBadge from '@/components/DifficultyBadge';
import CodeEditor from '@/components/CodeEditor';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, Loader2, CheckCircle, CircleDashed, ExternalLink, ChevronRight, Sparkles, BookOpen, Wand2, Code2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { defaultProblems } from '@/data/defaultProblems';

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile, refreshProfile } = useAuth();
  const [problem, setProblem] = useState<any>(null);
  const [hint, setHint] = useState('');
  const [loading, setLoading] = useState(true);
  const [hintLoading, setHintLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userCode, setUserCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [assistantOutput, setAssistantOutput] = useState('');
  const [assistantTitle, setAssistantTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [runOutput, setRunOutput] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await api.get(`/problems/${id}`);
        setProblem(res.data);
      } catch (err) {
        console.error('Failed to fetch problem:', err);
        const fallbackProblem = defaultProblems.find((problem) => problem.id === id);
        setProblem(fallbackProblem || null);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  // Initialize code with starter code when problem loads
  useEffect(() => {
    if (problem && problem.starterCode) {
      const starterCode = problem.starterCode[codeLanguage] || '';
      setUserCode(starterCode);
    }
  }, [problem, codeLanguage]);

  const sourceUrl = useMemo(() => {
    if (!problem) return '';
    return problem.sourceUrl || problem.leetcodeUrl || problem.gfgUrl || '';
  }, [problem]);

  const isSolved = !!(id && profile?.solvedProblems?.includes(id));
  const isAttempted = !!(id && profile?.attemptedProblems?.includes(id));

  const handleHint = async () => {
    setHintLoading(true);
    try {
      const res = await api.post('/hint', { problemId: id });
      setHint(res.data.hint);
    } catch {
      setHint('Unable to generate hint. Please try again.');
    } finally {
      setHintLoading(false);
    }
  };

  const handleProgress = async (status: 'attempted' | 'solved' | 'reset') => {
    setProgressLoading(true);
    setMessage('');
    try {
      await api.post(`/problems/${id}/progress`, { status });
      await refreshProfile();
      if (status === 'attempted') setMessage('Marked as attempted.');
      if (status === 'solved') setMessage('Marked as solved. Great work!');
      if (status === 'reset') setMessage('Progress reset for this problem.');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to update progress.');
    } finally {
      setProgressLoading(false);
    }
  };

  const handleAssist = async (action: 'hint-steps' | 'explain' | 'optimize') => {
    setAssistantLoading(true);
    setAssistantOutput('');
    setAssistantTitle('');
    try {
      const res = await aiService.assist({ problemId: id!, action, userCode });
      if (action === 'hint-steps') setAssistantTitle('Step-by-Step Hint');
      if (action === 'explain') setAssistantTitle('Solution Explanation');
      if (action === 'optimize') setAssistantTitle('Code Optimization Suggestions');
      setAssistantOutput(res.content);
    } catch (err: any) {
      setAssistantTitle('AI Assistant');
      setAssistantOutput(err.response?.data?.error || 'Unable to generate AI response right now.');
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!userCode.trim()) {
      setRunOutput('Please write some code first');
      return;
    }
    
    setRunning(true);
    setRunOutput('');
    try {
      const res = await api.post(`/submissions/run`, {
        problemId: id,
        code: userCode,
        language: codeLanguage,
        input: '' // Empty input for running with first test case example
      });
      
      // Handle both successful execution and errors
      if (res.data && res.data.output !== undefined) {
        setRunOutput(res.data.output || 'Code executed with no output');
      } else if (res.data && res.data.error) {
        setRunOutput(`Error: ${res.data.error}`);
      } else {
        setRunOutput('Code executed with no output');
      }
    } catch (err: any) {
      // Better error handling with network diagnostics
      let errorMessage = 'Failed to run code. Please try again.';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = '❌ Cannot connect to backend server.\n\nMake sure:\n1. Backend is running (npm start)\n2. Port 5000 is available\n3. Check firewall settings';
      } else if (err.message?.includes('Network Error')) {
        errorMessage = '❌ Network Error - Backend server is not accessible.\n\nRun "npm start" in the backend folder first.';
      } else if (err.response?.status === 0) {
        errorMessage = '❌ Backend server not running.\n\nStart backend with: npm start';
      } else if (err.response?.data?.message) {
        errorMessage = `Error: ${err.response.data.message}`;
      } else if (err.response?.data?.error) {
        errorMessage = `Error: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      console.error('Run code error:', err);
      setRunOutput(`Error: ${errorMessage}`);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!userCode.trim()) {
      setSubmissionResult({ error: 'Please write some code first', status: 'error' });
      return;
    }
    
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const res = await api.post(`/submissions/submit`, {
        problemId: id,
        code: userCode,
        language: codeLanguage
      });
      
      const submission = res.data.submission;
      setSubmissionResult({
        success: submission.result === 'Accepted',
        status: submission.result,
        message: submission.result === 'Accepted' ? '✅ All Test Cases Passed!' : '❌ Submission Failed',
        output: submission.output,
        testCaseResults: submission.testCaseResults || []
      });
      
      if (submission.result === 'Accepted') {
        await handleProgress('solved');
      } else {
        await handleProgress('attempted');
      }
    } catch (err: any) {
      // Better error handling with network diagnostics
      let errorMessage = 'Submission failed. Please try again.';
      
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorMessage = '❌ Cannot connect to backend server.\n\nMake sure:\n1. Backend is running (npm start)\n2. Port 5000 is available\n3. Check firewall settings';
      } else if (err.message?.includes('Network Error')) {
        errorMessage = '❌ Network Error - Backend server is not accessible.\n\nRun "npm start" in the backend folder first.';
      } else if (err.response?.status === 0) {
        errorMessage = '❌ Backend server not running.\n\nStart backend with: npm start';
      } else if (err.response?.data?.message) {
        errorMessage = `Error: ${err.response.data.message}`;
      } else if (err.response?.data?.error) {
        errorMessage = `Error: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      console.error('Submit code error:', err);
      setSubmissionResult({
        success: false,
        error: errorMessage,
        status: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Problem not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Problem Header */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-2xl font-bold">{problem.title}</h1>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs">
              {problem.topic}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Problem Link
                </Button>
              </a>
            ) : (
              <Button variant="outline" disabled>
                No external link available
              </Button>
            )}
            <Button variant="outline" disabled={progressLoading} onClick={() => handleProgress('attempted')}>
              Mark Attempted
            </Button>
            <Button disabled={progressLoading} onClick={() => handleProgress('solved')}>
              Mark Solved
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CircleDashed className="h-4 w-4" />
            Attempted: {isAttempted ? 'Yes' : 'No'}
          </div>
          <div className="flex items-center gap-1 text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            Solved: {isSolved ? 'Yes' : 'No'}
          </div>
        </div>
        {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem Details */}
        <div className="lg:col-span-1 space-y-4">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description" className="text-xs sm:text-sm">Description</TabsTrigger>
              <TabsTrigger value="testcases" className="text-xs sm:text-sm">Test Cases</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div 
                  className="text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: problem.description }}
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Examples</h3>
                {problem.examples?.map((ex: any, i: number) => (
                  <Card key={i} className="bg-muted/50">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div className="space-y-1 text-xs">
                          <div><span className="font-medium">Input:</span> <code className="bg-background px-1 py-0.5 rounded">{ex.input}</code></div>
                          <div><span className="font-medium">Output:</span> <code className="bg-background px-1 py-0.5 rounded">{ex.output}</code></div>
                          {ex.explanation && <div className="text-muted-foreground italic">{ex.explanation}</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">Constraints</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {problem.constraints?.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleHint} 
                  disabled={hintLoading} 
                  className="w-full gap-2"
                >
                  {hintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                  Get Hint
                </Button>
                {hint && (
                  <Card className="border-amber-500/20 bg-amber-500/5">
                    <CardContent className="p-3 text-xs">
                      <p className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{hint}</span>
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="testcases" className="space-y-3 mt-4">
              <div className="space-y-3">
                {(problem.testCases || []).map((tc: any, index: number) => (
                  <div key={index} className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Test Case {index + 1}</p>
                    <p className="text-xs mt-1"><span className="font-medium">Input:</span> <code className="text-xs break-all">{tc.input}</code></p>
                    <p className="text-xs"><span className="font-medium">Output:</span> <code className="text-xs break-all">{tc.expectedOutput}</code></p>
                  </div>
                ))}
                {(!problem.testCases || problem.testCases.length === 0) && (
                  <p className="text-xs text-muted-foreground">No test cases configured.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Code Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Code Editor */}
          <div className="h-[600px] border rounded-lg overflow-hidden">
            <CodeEditor
              language={codeLanguage}
              value={userCode}
              onChange={setUserCode}
              onLanguageChange={setCodeLanguage}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              isRunning={running}
              isSubmitting={submitting}
            />
          </div>

          {/* Run Output */}
          {runOutput && !submissionResult && (
            <Card className='border-blue-500/20 bg-blue-500/5'>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-blue-700 text-sm">Run Output</p>
                </div>
                <pre className="text-xs bg-background/80 rounded p-2 overflow-auto max-h-32 border">
                  {runOutput}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Submission Result with Test Cases */}
          {submissionResult && (
            <Card className={submissionResult.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {submissionResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <p className="font-semibold text-emerald-700 text-sm">{submissionResult.message}</p>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="h-5 w-5 text-red-600" />
                      <p className="font-semibold text-red-700 text-sm">{submissionResult.message}</p>
                    </>
                  )}
                </div>
                
                {submissionResult.output && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Output:</p>
                    <pre className="text-xs bg-background/80 rounded p-2 overflow-auto max-h-24 border">
                      {submissionResult.output}
                    </pre>
                  </div>
                )}

                {submissionResult.testCaseResults && submissionResult.testCaseResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Test Case Results:</p>
                    {submissionResult.testCaseResults.map((tc: any, idx: number) => (
                      <div key={idx} className="rounded-md border p-2 bg-background/40">
                        <div className="flex items-center gap-2 mb-1">
                          {tc.status === 'Passed' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertOctagon className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-xs font-semibold">Test Case {tc.index}</span>
                          <span className={`text-xs font-medium ${tc.status === 'Passed' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {tc.status}
                          </span>
                        </div>
                        {tc.status !== 'Passed' && (
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">Input:</span> <code className="bg-background px-1 rounded">{tc.input}</code></div>
                            <div><span className="font-medium">Expected:</span> <code className="bg-background px-1 rounded">{tc.expectedOutput}</code></div>
                            <div><span className="font-medium">Got:</span> <code className="bg-background px-1 rounded">{tc.actualOutput}</code></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Assistant */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Assistant
            </h3>
            <p className="text-xs text-muted-foreground">
              Get help with step-by-step hints, explanations, or code optimization.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAssist('hint-steps')} 
                disabled={assistantLoading} 
                className="gap-1"
              >
                {assistantLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                <span className="hidden sm:inline">Hint Steps</span>
                <span className="sm:hidden">Hint</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleAssist('explain')} 
                disabled={assistantLoading} 
                className="gap-1"
              >
                <BookOpen className="h-3 w-3" />
                <span className="hidden sm:inline">Explain</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleAssist('optimize')} 
                disabled={assistantLoading || !userCode.trim()} 
                className="gap-1"
              >
                <Wand2 className="h-3 w-3" />
                <span className="hidden sm:inline">Optimize</span>
              </Button>
            </div>
            {assistantOutput && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3 space-y-2">
                  <p className="font-medium text-xs text-primary">{assistantTitle}</p>
                  <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {assistantOutput}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
