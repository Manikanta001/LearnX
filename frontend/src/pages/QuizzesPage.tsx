import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Award,
  Plus,
  Search,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Brain,
  Trash2,
  Check
} from 'lucide-react';

export default function QuizzesPage() {
  const { user } = useAuth();
  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Expand state for admin attempts
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [attemptsMap, setAttemptsMap] = useState<Record<string, any[]>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<Record<string, boolean>>({});

  // Create Quiz Modal Settings State
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState('15');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [pointsPerQuestion, setPointsPerQuestion] = useState('10');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState('0.25');
  const [creating, setCreating] = useState(false);

  // Dynamic Questions Constructor List State
  const [questions, setQuestions] = useState<any[]>([]);

  // Question Builder constructor input states
  const [curText, setCurText] = useState('');
  const [curType, setCurType] = useState('SingleCorrect'); // SingleCorrect, MultipleCorrect, TrueFalse, FillInBlank
  const [curOptions, setCurOptions] = useState<string[]>(['', '', '', '']);
  const [curCorrectAnswers, setCurCorrectAnswers] = useState<string[]>([]);
  const [curExplanation, setCurExplanation] = useState('');

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quizzes');
      setQuizzes(res.data || []);

      if (isAdminOrInstructor) {
        const coursesRes = await api.get('/courses');
        setCourses(coursesRes.data || []);
      }
    } catch (err) {
      console.error('Fetch quizzes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  // Handle toggling option values and checkbox answers
  const handleOptionTextChange = (index: number, val: string) => {
    const copy = [...curOptions];
    const oldVal = copy[index];
    copy[index] = val;
    setCurOptions(copy);
    
    // Update correctAnswers values automatically
    setCurCorrectAnswers((prev) =>
      prev.map((v) => (v === oldVal ? val : v))
    );
  };

  const handleAddOptionInput = () => {
    setCurOptions((prev) => [...prev, '']);
  };

  const handleRemoveOptionInput = (index: number) => {
    if (curOptions.length <= 2) return; // keep at least 2 options
    const removedVal = curOptions[index];
    setCurOptions((prev) => prev.filter((_, idx) => idx !== index));
    setCurCorrectAnswers((prev) => prev.filter((x) => x !== removedVal));
  };

  const handleToggleOptionSelection = (val: string, checked: boolean) => {
    if (!val.trim()) return;
    if (curType === 'SingleCorrect' || curType === 'TrueFalse') {
      if (checked) {
        setCurCorrectAnswers([val]);
      }
    } else if (curType === 'MultipleCorrect') {
      if (checked) {
        setCurCorrectAnswers((prev) => [...prev, val]);
      } else {
        setCurCorrectAnswers((prev) => prev.filter((x) => x !== val));
      }
    }
  };

  const handleAddQuestionToQueue = () => {
    if (!curText.trim()) {
      alert('Please enter the question prompt text.');
      return;
    }

    let finalOptions = [...curOptions].filter((opt) => opt.trim() !== '');
    let finalCorrect = [...curCorrectAnswers].filter((ans) => ans.trim() !== '');

    if (curType === 'TrueFalse') {
      finalOptions = ['True', 'False'];
    } else if (curType === 'FillInBlank') {
      finalOptions = [];
    }

    if (finalCorrect.length === 0) {
      alert('Please select or specify at least one correct answer.');
      return;
    }

    const newQuestion = {
      questionText: curText,
      type: curType,
      options: finalOptions,
      correctAnswers: finalCorrect,
      explanation: curExplanation,
    };

    setQuestions((prev) => [...prev, newQuestion]);

    // Clear builder states for next question
    setCurText('');
    setCurExplanation('');
    setCurCorrectAnswers([]);
    setCurOptions(['', '', '', '']);
  };

  const handleRemoveQuestionFromQueue = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !title.trim()) return;

    if (questions.length === 0) {
      alert('Please add at least one question to the quiz preview queue before saving.');
      return;
    }

    try {
      setCreating(true);

      await api.post('/quizzes', {
        title,
        description,
        course: courseId || null,
        duration: Number(duration),
        maxAttempts: Number(maxAttempts),
        pointsPerQuestion: Number(pointsPerQuestion),
        negativeMarking,
        negativeMarkValue: Number(negativeMarkValue),
        questions,
      });

      setTitle('');
      setDescription('');
      setCourseId('');
      setDuration('15');
      setMaxAttempts('3');
      setPointsPerQuestion('10');
      setNegativeMarking(false);
      setNegativeMarkValue('0.25');
      setQuestions([]);
      setCreateOpen(false);
      fetchQuizzes();
    } catch (err) {
      console.error('Create quiz error:', err);
      alert('Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAttempts = async (quizId: string) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
      return;
    }

    setExpandedQuiz(quizId);

    // Fetch quiz attempts if not already loaded
    if (!attemptsMap[quizId]) {
      try {
        setLoadingAttempts((prev) => ({ ...prev, [quizId]: true }));
        const res = await api.get(`/quizzes/${quizId}/all-attempts`);
        setAttemptsMap((prev) => ({ ...prev, [quizId]: res.data || [] }));
      } catch (err) {
        console.error('Fetch quiz attempts error:', err);
      } finally {
        setLoadingAttempts((prev) => ({ ...prev, [quizId]: false }));
      }
    }
  };

  const exportReport = (quiz: any) => {
    const attempts = attemptsMap[quiz._id] || [];

    // CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Attempt Number,Score,Max Score,Time Taken (s),Result,Date Attempted\n";

    // Populate rows
    attempts.forEach((att) => {
      const studentName = att.user?.name || 'Anonymous';
      const studentEmail = att.user?.email || 'N/A';
      const attemptNum = att.attemptNumber;
      const score = att.score;
      const maxScore = att.maxScore;
      const timeTaken = att.timeTaken;
      const result = att.passed ? 'PASSED' : 'FAILED';
      const dateCompleted = att.completedAt ? new Date(att.completedAt).toLocaleDateString() : '';

      csvContent += `"${studentName}","${studentEmail}","${attemptNum}","${score}","${maxScore}","${timeTaken}","${result}","${dateCompleted}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${quiz.title.replace(/\s+/g, '_')}_Performance_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(search.toLowerCase()) ||
    (quiz.course?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
            <Award className="h-8 w-8 text-pink-600" /> Syllabus Quizzes
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrInstructor
              ? "Create quizzes, evaluate student performances, and download structured CSV/Excel reports."
              : "Topic checkpoints and syllabus knowledge evaluation tests."}
          </p>
        </div>

        {isAdminOrInstructor && (
          <Button onClick={() => setCreateOpen(true)} className="rounded-full shadow-sm gap-2 bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="h-4.5 w-4.5" /> Add Quiz
          </Button>
        )}
      </div>

      {/* Search filter bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search quizzes by name or course..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full bg-white border-gray-200"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No quizzes published</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {isAdminOrInstructor
              ? "Get started by adding a course syllabus quiz."
              : "Quizzes will appear here once published by your instructor."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => {
            const totalQuestions = quiz.questions?.length || 0;
            const points = quiz.pointsPerQuestion || 10;
            const totalMarks = totalQuestions * points;

            return (
              <Card key={quiz._id} className="border flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-pink-50 text-pink-700 rounded-full border border-pink-100">
                          Quiz Exam
                        </span>
                        {quiz.course && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                            {quiz.course.title}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold mt-2 text-foreground">{quiz.title}</CardTitle>
                    </div>
                  </div>

                  <CardDescription className="text-sm text-muted-foreground mt-2 font-medium">
                    {quiz.description || "Evaluate your understanding of course concepts."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" /> {quiz.duration} Minutes
                    </span>
                    <span>•</span>
                    <span>{totalQuestions} Questions</span>
                    <span>•</span>
                    <span>Max Points: {totalMarks}</span>
                  </div>
                </CardContent>

                <CardFooter className="bg-muted/30 border-t p-4 flex flex-col items-stretch gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold uppercase">
                      Max Attempts: {quiz.maxAttempts}
                    </span>

                    {isAdminOrInstructor ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAttempts(quiz._id)}
                        className="rounded-full gap-1 border-pink-200 text-pink-700 hover:bg-pink-50 font-bold"
                      >
                        {expandedQuiz === quiz._id ? (
                          <>Hide Results <ChevronUp className="h-4 w-4" /></>
                        ) : (
                          <>See Results <ChevronDown className="h-4 w-4" /></>
                        )}
                      </Button>
                    ) : (
                      <Link to={`/quizzes/${quiz._id}`}>
                        <Button size="sm" className="rounded-full shadow-sm font-bold bg-pink-600 hover:bg-pink-700 text-white">
                          Attempt Quiz
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Admin Attempts Detail Drawer Panel */}
                  {isAdminOrInstructor && expandedQuiz === quiz._id && (
                    <div className="border-t pt-4 space-y-4 w-full">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Student Quiz Performance</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(quiz)}
                          disabled={!attemptsMap[quiz._id] || attemptsMap[quiz._id].length === 0}
                          className="rounded-full text-xs font-bold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          <FileSpreadsheet className="h-4 w-4" /> Export Report (Excel/CSV)
                        </Button>
                      </div>

                      {loadingAttempts[quiz._id] ? (
                        <Skeleton className="h-16 w-full" />
                      ) : !attemptsMap[quiz._id] || attemptsMap[quiz._id].length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                          No student quiz attempts recorded yet.
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-x-auto bg-white shadow-sm">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="p-3">Student</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Attempt #</th>
                                <th className="p-3">Score</th>
                                <th className="p-3">Time Taken</th>
                                <th className="p-3 text-center">Result</th>
                                <th className="p-3 text-right">Date Attempted</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y text-slate-700">
                              {attemptsMap[quiz._id].map((att) => (
                                <tr key={att._id} className="hover:bg-muted/5 transition-colors">
                                  <td className="p-3 font-bold text-foreground">{att.user?.name}</td>
                                  <td className="p-3">{att.user?.email}</td>
                                  <td className="p-3 text-center font-semibold">Attempt {att.attemptNumber}</td>
                                  <td className="p-3 font-bold">{att.score} / {att.maxScore}</td>
                                  <td className="p-3">{Math.floor(att.timeTaken / 60)}m {att.timeTaken % 60}s</td>
                                  <td className="p-3 text-center">
                                    {att.passed ? (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100 flex items-center gap-1 justify-center w-20 mx-auto">
                                        <CheckCircle2 className="h-3 w-3" /> Passed
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase border border-rose-100 flex items-center gap-1 justify-center w-20 mx-auto">
                                        <XCircle className="h-3 w-3" /> Failed
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">{new Date(att.completedAt).toLocaleDateString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quiz Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 bg-white border border-slate-100">
            <CardHeader className="bg-gradient-to-r from-pink-50/50 to-rose-50/20 border-b pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-extrabold">
                <Brain className="h-6 w-6 text-pink-600 animate-pulse" /> Quiz Builder Wizard
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Assemble dynamic questions and customize options, time limits, and negative points.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateQuiz}>
              <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto pt-6">
                
                {/* Section A: Basic Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Quiz General Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Quiz Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. JavaScript Closures Diagnostic"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="course">Target Syllabus Course</Label>
                      <select
                        id="course"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      >
                        <option value="">None (Independent Diagnostic)</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">Short Description</Label>
                    <textarea
                      id="description"
                      placeholder="Briefly state target checks of this diagnostic exam..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="duration">Timer (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxAttempts">Allowed Attempts</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        min="1"
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="points">Points per Q</Label>
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={pointsPerQuestion}
                        onChange={(e) => setPointsPerQuestion(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="negativeMarking"
                      checked={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.checked)}
                      className="rounded text-pink-600 focus:ring-pink-500"
                    />
                    <Label htmlFor="negativeMarking" className="font-semibold text-slate-700">Enable Negative Marking</Label>
                  </div>

                  {negativeMarking && (
                    <div className="space-y-1.5 bg-rose-50/20 p-3 rounded-lg border border-rose-100 max-w-sm">
                      <Label htmlFor="negativeValue">Negative Mark Factor (e.g. 0.25 = -2.5 pts)</Label>
                      <Input
                        id="negativeValue"
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={negativeMarkValue}
                        onChange={(e) => setNegativeMarkValue(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Section B: Added Questions Queue Preview */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Questions Queue ({questions.length})</h3>
                    <span className="text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full">
                      Total Score: {questions.length * Number(pointsPerQuestion)} Points
                    </span>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-xl bg-slate-50/50 text-xs text-muted-foreground font-medium">
                      No questions added to the queue yet. Configure and add them below.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {questions.map((q, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 border rounded-lg text-xs hover:bg-slate-100/50 transition-colors">
                          <div className="space-y-1 pr-4">
                            <p className="font-bold text-slate-800">
                              Q{idx + 1}. <span className="text-pink-600 uppercase font-semibold text-[9px] border border-pink-200 px-1 rounded ml-1 bg-pink-50">{q.type}</span>
                            </p>
                            <p className="text-slate-600 font-medium">{q.questionText}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Answer: {q.correctAnswers.join(', ')}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveQuestionFromQueue(idx)}
                            className="h-6 w-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section C: Question Constructor */}
                <div className="space-y-4 border-t pt-5 bg-slate-50/30 p-4 rounded-xl border">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. Question Builder Stack</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="curText">Question Prompt Text</Label>
                    <Input
                      id="curText"
                      placeholder="e.g. Which keyword defines a block-scoped local variable?"
                      value={curText}
                      onChange={(e) => setCurText(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="curType">Question Type</Label>
                      <select
                        id="curType"
                        value={curType}
                        onChange={(e) => {
                          setCurType(e.target.value);
                          setCurCorrectAnswers([]);
                          if (e.target.value === 'TrueFalse') {
                            setCurOptions(['True', 'False']);
                          } else {
                            setCurOptions(['', '', '', '']);
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2"
                      >
                        <option value="SingleCorrect">Single Choice (Radio)</option>
                        <option value="MultipleCorrect">Multiple Selection (Checkboxes)</option>
                        <option value="TrueFalse">True / False</option>
                        <option value="FillInBlank">Fill in the Blank</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="curExplanation">Explanation Explanation / Hint</Label>
                      <Input
                        id="curExplanation"
                        placeholder="e.g. 'let' is block-scoped, while 'var' is function-scoped."
                        value={curExplanation}
                        onChange={(e) => setCurExplanation(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Constructor: Dynamic options details builder */}
                  {curType === 'FillInBlank' ? (
                    <div className="space-y-2 p-3 bg-white border rounded-lg">
                      <Label className="text-xs font-bold uppercase tracking-wider text-pink-700">Correct Text Answer</Label>
                      <Input
                        placeholder="Type the exact expected string answer value..."
                        onChange={(e) => setCurCorrectAnswers([e.target.value])}
                        value={curCorrectAnswers[0] || ''}
                      />
                    </div>
                  ) : curType === 'TrueFalse' ? (
                    <div className="space-y-2 p-3 bg-white border rounded-lg">
                      <Label className="text-xs font-bold uppercase tracking-wider text-pink-700">Select Correct Answer</Label>
                      <div className="flex gap-4">
                        {['True', 'False'].map((tf) => {
                          const isCorrect = curCorrectAnswers[0] === tf;
                          return (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => handleToggleOptionSelection(tf, true)}
                              className={`flex-1 p-3 rounded-lg border text-sm font-bold transition-all outline-none ${
                                isCorrect 
                                  ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {tf}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-white border rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <Label className="text-xs font-bold uppercase tracking-wider text-pink-700">Options List & Answers</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddOptionInput}
                          className="h-7 text-xs rounded-full gap-0.5 border-pink-200 text-pink-700 hover:bg-pink-50"
                        >
                          <Plus className="h-3 w-3" /> Add Option
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {curOptions.map((opt, oIdx) => {
                          const alphabet = String.fromCharCode(65 + oIdx);
                          const isChecked = curCorrectAnswers.includes(opt);

                          return (
                            <div key={oIdx} className="flex items-center gap-3">
                              {/* Selection Indicator check / radio */}
                              <input
                                type={curType === 'SingleCorrect' ? 'radio' : 'checkbox'}
                                name="correctOption"
                                checked={isChecked}
                                onChange={(e) => handleToggleOptionSelection(opt, e.target.checked)}
                                className="h-4.5 w-4.5 text-pink-600 focus:ring-pink-500 rounded border-slate-300 cursor-pointer"
                              />

                              <div className="flex-1 flex gap-1.5 items-center">
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 h-6 w-6 flex items-center justify-center rounded shrink-0">{alphabet}</span>
                                <Input
                                  placeholder={`Option ${alphabet} text...`}
                                  value={opt}
                                  onChange={(e) => handleOptionTextChange(oIdx, e.target.value)}
                                  className="h-8 text-xs bg-slate-50/20"
                                />
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOptionInput(oIdx)}
                                disabled={curOptions.length <= 2}
                                className="h-7 w-7 text-slate-300 hover:text-slate-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Mark correct options by checking the checkbox next to the options on the left.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      onClick={handleAddQuestionToQueue}
                      className="rounded-full text-xs font-bold gap-1 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Question to Queue
                    </Button>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="flex gap-2 justify-end border-t pt-4 mt-4 bg-slate-50/40">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="rounded-full bg-pink-600 hover:bg-pink-700 text-white px-6 font-bold shadow-md">
                  {creating ? 'Creating...' : 'Create Quiz Exam'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
