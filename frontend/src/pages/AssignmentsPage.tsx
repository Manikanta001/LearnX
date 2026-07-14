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
  ClipboardList,
  Plus,
  Search,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  CheckSquare
} from 'lucide-react';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Expand state for admin submissions list
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, any[]>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState('FileUpload'); // MCQ, Coding, FileUpload
  const [maxMarks, setMaxMarks] = useState('100');
  const [deadline, setDeadline] = useState('');
  const [instructions, setInstructions] = useState('');
  const [leetcodeNumber, setLeetcodeNumber] = useState('');
  const [creating, setCreating] = useState(false);

  // Grading Modal State
  const [gradingOpen, setGradingOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data || []);

      if (isAdminOrInstructor) {
        const coursesRes = await api.get('/courses');
        setCourses(coursesRes.data || []);
      } else {
        // Fetch student's own submissions for each assignment
        const subsData: Record<string, any> = {};
        for (const ass of res.data) {
          try {
            const subRes = await api.get(`/assignments/${ass._id}/my-submission`);
            if (subRes.data) {
              subsData[ass._id] = subRes.data;
            }
          } catch (e) {
            // ignore
          }
        }
        setMySubmissions(subsData);
      }
    } catch (err) {
      console.error('Fetch assignments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !deadline) return;

    try {
      setCreating(true);
      await api.post('/assignments', {
        title,
        description,
        course: courseId || null,
        type,
        maxMarks: Number(maxMarks),
        deadline,
        instructions,
        leetcodeNumber: type === 'Coding' ? leetcodeNumber : '',
      });

      setTitle('');
      setDescription('');
      setCourseId('');
      setType('FileUpload');
      setMaxMarks('100');
      setDeadline('');
      setInstructions('');
      setLeetcodeNumber('');
      setCreateOpen(false);
      fetchAssignments();
    } catch (err: any) {
      console.error('Create assignment error:', err);
      alert('Failed to create assignment: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSubmissions = async (assignmentId: string) => {
    if (expandedAssignment === assignmentId) {
      setExpandedAssignment(null);
      return;
    }

    setExpandedAssignment(assignmentId);

    // Fetch submissions if not already loaded
    if (!submissionsMap[assignmentId]) {
      try {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: true }));
        const res = await api.get(`/assignments/${assignmentId}/submissions`);
        setSubmissionsMap((prev) => ({ ...prev, [assignmentId]: res.data || [] }));
      } catch (err) {
        console.error('Fetch submissions error:', err);
      } finally {
        setLoadingSubmissions((prev) => ({ ...prev, [assignmentId]: false }));
      }
    }
  };

  const handleOpenGradeDialog = (sub: any) => {
    setActiveSubmission(sub);
    setGradeScore(sub.score || '');
    setGradeFeedback(sub.feedback || '');
    setGradingOpen(true);
  };

  const handlePostGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (grading || !activeSubmission) return;

    try {
      setGrading(true);
      await api.post(`/assignments/submission/${activeSubmission._id}/grade`, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
      });

      setGradingOpen(false);
      const assignmentId = activeSubmission.assignment?._id || activeSubmission.assignment;
      
      // Reload submissions list
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissionsMap((prev) => ({ ...prev, [assignmentId]: res.data || [] }));
      setActiveSubmission(null);
      alert('Submission graded successfully!');
    } catch (err) {
      console.error('Post grade error:', err);
      alert('Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const exportReport = (assignment: any) => {
    const subs = submissionsMap[assignment._id] || [];
    
    // CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Email,Submission Status,Score,Max Marks,Date Submitted,Feedback\n";

    // Populate rows
    subs.forEach((s) => {
      const studentName = s.user?.name || 'Anonymous';
      const studentEmail = s.user?.email || 'N/A';
      const status = s.status || 'Pending';
      const score = s.score !== undefined ? s.score : '';
      const maxMarks = assignment.maxMarks;
      const submittedDate = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '';
      const feedback = s.feedback ? s.feedback.replace(/"/g, '""') : '';

      csvContent += `"${studentName}","${studentEmail}","${status}","${score}","${maxMarks}","${submittedDate}","${feedback}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${assignment.title.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssignments = assignments.filter((ass) =>
    ass.title.toLowerCase().includes(search.toLowerCase()) ||
    (ass.course?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-indigo-600" /> Course Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdminOrInstructor 
              ? "Create, evaluate, grade and export reports for students' hands-on code and file submissions."
              : "Complete hands-on task assessments published by your instructors."}
          </p>
        </div>
        
        {isAdminOrInstructor && (
          <Button onClick={() => setCreateOpen(true)} className="rounded-full shadow-sm gap-2">
            <Plus className="h-4.5 w-4.5" /> Add Assignment
          </Button>
        )}
      </div>

      {/* Search filter bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assignments by name or course..."
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
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No assignments published</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {isAdminOrInstructor 
              ? "Get started by adding a course assignment."
              : "Assignments will appear here once published by your instructor."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((ass) => {
            const mySub = mySubmissions[ass._id];
            const isCompleted = !!mySub;
            const isGraded = mySub?.status === 'Graded';

            return (
              <Card key={ass._id} className="border flex flex-col justify-between hover:shadow-sm transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                          {ass.type}
                        </span>
                        {ass.course && (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                            {ass.course.title}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl font-bold mt-2 text-foreground">{ass.title}</CardTitle>
                    </div>

                    {!isAdminOrInstructor && (
                      <div className="flex items-center gap-1.5 self-start">
                        {isCompleted ? (
                          isGraded ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Graded: {mySub.score} / {ass.maxMarks}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="h-4 w-4" /> Submitted
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full flex items-center gap-1">
                            <Clock className="h-4 w-4" /> Pending
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <CardDescription className="text-sm text-muted-foreground mt-2 font-medium">
                    {ass.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Due: {new Date(ass.deadline).toLocaleDateString()} at {new Date(ass.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>•</span>
                    <span>Max Marks: {ass.maxMarks}</span>
                  </div>

                  {/* Student Submission Detail */}
                  {!isAdminOrInstructor && mySub && (
                    <div className="mt-4 p-3 bg-muted/40 border rounded-xl space-y-2 text-xs">
                      <p className="text-muted-foreground">
                        Submitted: <strong>{new Date(mySub.submittedAt).toLocaleString()}</strong>
                      </p>
                      {mySub.fileUrl && (
                        <p>
                          <a href={mySub.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                            Open Uploaded Document <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      )}
                      {mySub.feedback && (
                        <div className="border-t pt-2 mt-2">
                          <p className="font-bold text-foreground">Instructor Feedback:</p>
                          <p className="text-muted-foreground italic mt-0.5">"{mySub.feedback}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-muted/30 border-t p-4 flex flex-col items-stretch gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold uppercase">
                      Assessment Marks: {ass.maxMarks}
                    </span>

                    {isAdminOrInstructor ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSubmissions(ass._id)}
                          className="rounded-full gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
                        >
                          {expandedAssignment === ass._id ? (
                            <>Hide Results <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>See Results <ChevronDown className="h-4 w-4" /></>
                          )}
                        </Button>
                      </div>
                    ) : (
                      !isCompleted && (
                        <Link to={`/assignments/${ass._id}`}>
                          <Button size="sm" className="rounded-full shadow-sm font-bold">
                            Attempt Assignment
                          </Button>
                        </Link>
                      )
                    )}
                  </div>

                  {/* Admin Submissions Detail Drawer Panel */}
                  {isAdminOrInstructor && expandedAssignment === ass._id && (
                    <div className="border-t pt-4 space-y-4 w-full">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Student Submission Activity</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportReport(ass)}
                          disabled={!submissionsMap[ass._id] || submissionsMap[ass._id].length === 0}
                          className="rounded-full text-xs font-bold gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        >
                          <FileSpreadsheet className="h-4 w-4" /> Export Report (Excel/CSV)
                        </Button>
                      </div>

                      {loadingSubmissions[ass._id] ? (
                        <Skeleton className="h-16 w-full" />
                      ) : !submissionsMap[ass._id] || submissionsMap[ass._id].length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                          No student submissions registered for this assignment yet.
                        </div>
                      ) : (
                        <div className="border rounded-xl overflow-x-auto bg-white shadow-sm">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-muted/40 border-b font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="p-3">Student</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Submitted At</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Score</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y text-slate-700">
                              {submissionsMap[ass._id].map((sub) => (
                                <tr key={sub._id} className="hover:bg-muted/5 transition-colors">
                                  <td className="p-3 font-bold text-foreground">{sub.user?.name}</td>
                                  <td className="p-3">{sub.user?.email}</td>
                                  <td className="p-3">{new Date(sub.submittedAt).toLocaleDateString()}</td>
                                  <td className="p-3">
                                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${sub.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold">{sub.score !== undefined ? sub.score : '-'} / {ass.maxMarks}</td>
                                  <td className="p-3 text-right">
                                    <div className="flex gap-2 justify-end">
                                      {sub.fileUrl && (
                                        <a href={sub.fileUrl} target="_blank" rel="noreferrer">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600 hover:bg-indigo-50">
                                            <ExternalLink className="h-4.5 w-4.5" />
                                          </Button>
                                        </a>
                                      )}
                                      <Button
                                        size="sm"
                                        onClick={() => handleOpenGradeDialog(sub)}
                                        className="h-7 rounded-full text-[10px] font-bold gap-0.5"
                                      >
                                        <CheckSquare className="h-3 w-3" /> Grade
                                      </Button>
                                    </div>
                                  </td>
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

      {/* Assignment Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 bg-white">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-indigo-600" /> Add Assignment
              </CardTitle>
              <CardDescription>
                Define the requirements and settings for the student task.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateAssignment}>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                {type === 'Coding' && (
                  <div className="space-y-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                    <Label htmlFor="leetcodeNumber" className="text-indigo-900 font-bold text-xs uppercase">LeetCode Problem Number</Label>
                    <Input
                      id="leetcodeNumber"
                      placeholder="e.g. 1 (for Two Sum), 20 (for Valid Parentheses)"
                      value={leetcodeNumber}
                      onChange={(e) => setLeetcodeNumber(e.target.value)}
                      className="bg-white border-indigo-200 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-[10px] text-indigo-700 italic font-medium">
                      Entering a LeetCode problem number will automatically fetch its title, description, and test cases! Title and Short Description fields below can be left empty.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Heap Implementation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required={type !== 'Coding' || !leetcodeNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <textarea
                    id="description"
                    placeholder="Briefly state the goal of this task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course">Target Course</Label>
                    <select
                      id="course"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="">None (Independent Exam)</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Submission Type</Label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    >
                      <option value="FileUpload">File / Code PDF Upload</option>
                      <option value="Coding">Online Editor Submission</option>
                      <option value="MCQ">MCQ Set</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMarks">Max Marks</Label>
                    <Input
                      id="maxMarks"
                      type="number"
                      min="1"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Submission Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions (optional)</Label>
                  <textarea
                    id="instructions"
                    placeholder="Enter guidelines, instructions, or rules for attempting this task..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end border-t pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Assignment'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Grading / Review Evaluation Modal */}
      {gradingOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200 bg-white">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-indigo-600" /> Grade Student Submission
              </CardTitle>
              <CardDescription>
                Assign marks and leave comments feedback for the student submission.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePostGrade}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 text-xs bg-muted/40 p-4 rounded-xl border mb-2">
                  <p><strong>Assignment:</strong> {activeSubmission.assignment?.title || 'Assignment Item'}</p>
                  <p><strong>Student:</strong> {activeSubmission.user?.name} ({activeSubmission.user?.email})</p>
                  <p><strong>Type:</strong> {activeSubmission.submissionType}</p>
                  {activeSubmission.fileUrl && (
                    <p className="mt-2 font-bold">
                      <a href={activeSubmission.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                        Download / Read Document <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeScore">Award Score (Max: {activeSubmission.assignment?.maxMarks || 100})</Label>
                  <Input
                    id="gradeScore"
                    type="number"
                    min="0"
                    max={activeSubmission.assignment?.maxMarks || 100}
                    placeholder="e.g. 85"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeFeedback">Evaluation Feedback Comments</Label>
                  <textarea
                    id="gradeFeedback"
                    placeholder="Provide constructive review comments..."
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end border-t pt-4 mt-4">
                <Button type="button" variant="outline" onClick={() => setGradingOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={grading}>
                  {grading ? 'Submitting...' : 'Save Grade'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
