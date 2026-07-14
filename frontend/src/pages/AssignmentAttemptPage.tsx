import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle, Clock, Upload, AlertCircle, ArrowRight } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';

export default function AssignmentAttemptPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // MCQ state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});
  
  // File upload state
  const [fileUrl, setFileUrl] = useState('');
  
  // Submission history state
  const [mySubmission, setMySubmission] = useState<any>(null);

  // Coding editor state
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [userCode, setUserCode] = useState('');
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState('');
  const [executionResult, setExecutionResult] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignRes, subRes] = await Promise.all([
        api.get(`/assignments/${assignmentId}`),
        api.get(`/assignments/${assignmentId}/my-submission`),
      ]);
      setAssignment(assignRes.data);
      setMySubmission(subRes.data);

      // Populate default code template if coding problem exists
      const codingProb = assignRes.data?.codingProblem;
      if (codingProb?.starterCode) {
        setUserCode(codingProb.starterCode.javascript || '');
      }
    } catch (err) {
      console.error('Fetch assignment details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId && user) {
      fetchData();
    }
  }, [assignmentId, user]);

  // Update editor value when language is toggled
  useEffect(() => {
    if (assignment?.codingProblem?.starterCode?.[codeLanguage]) {
      setUserCode(assignment.codingProblem.starterCode[codeLanguage]);
    }
  }, [codeLanguage, assignment]);

  const handleSelectMcq = (questionId: string, optionIndex: string) => {
    if (mySubmission) return;
    setMcqAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleRunCode = async () => {
    if (running || !assignment?.codingProblem) return;
    try {
      setRunning(true);
      setRunOutput('Compiling and executing code against sample test cases...');
      setExecutionResult(null);

      const res = await api.post('/submissions', {
        problemId: assignment.codingProblem._id,
        code: userCode,
        language: codeLanguage,
      });

      setRunOutput(res.data.output || 'Execution completed with no standard logs.');
      setExecutionResult(res.data);
    } catch (err: any) {
      console.error(err);
      setRunOutput(err.response?.data?.error || 'Compilation / run failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleCodingSubmit = async () => {
    if (submitting || mySubmission) return;
    try {
      setSubmitting(true);
      setRunOutput('Submitting code for final evaluation across all test cases...');

      const payload = {
        codingSubmission: {
          code: userCode,
          language: codeLanguage,
        }
      };

      await api.post(`/assignments/${assignmentId}/submit`, payload);
      alert('Congratulations! All compiler test cases passed. Assignment submitted and auto-graded successfully!');
      fetchData();
    } catch (err: any) {
      console.error('Submit coding assignment error:', err);
      const errMsg = err.response?.data?.error || 'Failed to submit solution. Make sure it compiles and passes all cases.';
      setRunOutput(`SUBMISSION FAILED:\n${errMsg}`);
      alert(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || mySubmission) return;

    try {
      setSubmitting(true);
      const payload: any = {};

      if (assignment.type === 'MCQ') {
        payload.mcqAnswers = Object.entries(mcqAnswers).map(([qId, ans]) => ({
          questionId: qId,
          selectedAnswer: ans,
        }));
      } else if (assignment.type === 'FileUpload') {
        if (!fileUrl.trim()) {
          alert('Please specify a file URL or description to submit.');
          setSubmitting(false);
          return;
        }
        payload.fileUrl = fileUrl;
      }

      await api.post(`/assignments/${assignmentId}/submit`, payload);
      alert('Assignment submitted successfully!');
      fetchData();
    } catch (err: any) {
      console.error('Submit assignment error:', err);
      alert(err.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!assignment) return null;

  const isDeadlinePassed = new Date() > new Date(assignment.deadline);
  const formattedDeadline = new Date(assignment.deadline).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 font-sans">
      {/* Assignment Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{assignment.title}</h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs font-semibold text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted uppercase">{assignment.type} Assignment</span>
            <span className="px-2 py-1 rounded bg-muted">{assignment.maxMarks} Marks Max</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Deadline: {formattedDeadline}</span>
          </div>
        </div>
      </div>

      {/* Mode 1: Already Submitted Review */}
      {mySubmission ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className={classNameMap('border-2 shadow-md overflow-hidden', mySubmission.status === 'Graded' ? 'border-emerald-200 bg-emerald-50/5' : 'border-indigo-200 bg-indigo-50/5')}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-foreground font-bold">
                <CheckCircle className={classNameMap('h-5 w-5', mySubmission.status === 'Graded' ? 'text-emerald-500' : 'text-indigo-500')} />
                Assignment Status: {mySubmission.status}
              </CardTitle>
              <CardDescription>
                Submitted on {new Date(mySubmission.submittedAt).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2 border-t">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Earned Grade Score:</span>
                  <span className="text-xl font-extrabold text-foreground">{mySubmission.score} / {assignment.maxMarks}</span>
                </div>
                {mySubmission.feedback && (
                  <div className="p-4 rounded-xl border bg-muted/35 space-y-1 text-sm">
                    <p className="font-bold text-foreground">Instructor Evaluation Feedback:</p>
                    <p className="text-muted-foreground text-xs leading-relaxed italic">"{mySubmission.feedback}"</p>
                  </div>
                )}
                {mySubmission.codingSubmission?.code && (
                  <div className="mt-4 border rounded-xl overflow-hidden shadow-inner">
                    <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 font-bold uppercase tracking-wider">Submitted Code Solution ({mySubmission.codingSubmission.language})</div>
                    <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap">{mySubmission.codingSubmission.code}</pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-2">
            <Button onClick={() => navigate(-1)} className="rounded-full px-6 gap-1.5 shadow-sm">
              Return to learning portal <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : assignment.type === 'Coding' ? (
        // Mode 2: Coding workspace split-pane
        <div className="space-y-6 animate-in fade-in duration-300">
          {isDeadlinePassed && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Deadline Expired</p>
                <p className="text-xs mt-0.5">The submission window is closed. You can no longer submit answers.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
            {/* Left Column: Problem Details */}
            <div className="flex flex-col h-full bg-white border border-border rounded-lg overflow-hidden shadow-sm max-h-[750px]">
              <div className="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-slate-50 to-slate-50/50">
                <FileText className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-foreground">Problem Description</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 prose max-w-none text-sm dark:prose-invert">
                {assignment.codingProblem ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-lg font-bold text-gray-900 m-0">{assignment.codingProblem.title}</h2>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        assignment.codingProblem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        assignment.codingProblem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {assignment.codingProblem.difficulty}
                      </span>
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: assignment.codingProblem.description }} />
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground font-medium text-xs">
                    No LeetCode problem description linked to this assignment.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Code Editor & Console Output */}
            <div className="flex flex-col h-full gap-4 max-h-[750px]">
              <div className="flex-1 min-h-[400px]">
                <CodeEditor
                  language={codeLanguage}
                  value={userCode}
                  onChange={setUserCode}
                  onLanguageChange={setCodeLanguage}
                  onRun={handleRunCode}
                  onSubmit={handleCodingSubmit}
                  isRunning={running}
                  isSubmitting={submitting}
                />
              </div>
              
              {/* Console Output Card */}
              <div className="h-44 bg-slate-900 text-slate-100 rounded-lg flex flex-col overflow-hidden shadow-md">
                <div className="bg-slate-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>Console Log Output</span>
                  {executionResult && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold ${
                      executionResult.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {executionResult.status}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap selection:bg-slate-700 text-slate-300">
                  {runOutput || 'Write your code and click "Run" to verify compile execution results.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mode 3: MCQ & FileUpload forms
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
          {isDeadlinePassed && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-600 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Deadline Expired</p>
                <p className="text-xs mt-0.5">The submission window is closed. You can no longer upload assets.</p>
              </div>
            </div>
          )}

          {/* MCQ questions */}
          {assignment.type === 'MCQ' && assignment.mcqQuestions && (
            <div className="space-y-6">
              {assignment.mcqQuestions.map((q: any, qIdx: number) => {
                const selected = mcqAnswers[q._id] || '';

                return (
                  <Card key={q._id} className="border">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold flex items-start gap-2 text-foreground">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        {q.questionText}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-2 pl-10">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const optIndexStr = String(optIdx);
                        const isChosen = selected === optIndexStr;

                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSelectMcq(q._id, optIndexStr)}
                            className={classNameMap(
                              'flex items-center justify-between p-3 rounded-lg border text-left text-sm transition-all outline-none',
                              isChosen
                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <span>{opt}</span>
                            <div className={classNameMap('h-4 w-4 rounded-full border flex items-center justify-center', isChosen ? 'border-primary bg-primary' : 'border-border bg-card')}>
                              {isChosen && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* File Upload reports */}
          {assignment.type === 'FileUpload' && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground font-bold">
                  <Upload className="h-5 w-5 text-primary" /> Upload Report Submission
                </CardTitle>
                <CardDescription>
                  Expected requirements: {assignment.fileRequirements || 'PDF or ZIP, max 10MB'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">Document Link or Asset URL</Label>
                  <Input
                    id="fileUrl"
                    type="url"
                    placeholder="https://drive.google.com/file/... or paste PDF link"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    required={assignment.type === 'FileUpload'}
                  />
                  <p className="text-xs text-muted-foreground leading-normal">
                    Provide a accessible sharing link to your PDF, document, or ZIP repository for instructor reviews.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Action Bar */}
          {!isDeadlinePassed && (
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full shadow-md bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white px-8"
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
