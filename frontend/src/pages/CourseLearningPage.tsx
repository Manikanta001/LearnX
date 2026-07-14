import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlayCircle,
  FileText,
  HelpCircle,
  Edit3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Award,
  BookOpen,
  ArrowLeft,
  Menu,
  X,
} from 'lucide-react';

export default function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}`);
      if (!res.data.isEnrolled) {
        // Redirect to detail page if not enrolled
        navigate(`/courses/${courseId}`);
        return;
      }
      setCourse(res.data.course);
      setEnrollment(res.data);
      setCompletedLessons(res.data.completedLessons || []);

      // Default active lesson to first lesson in course
      const firstModule = res.data.course.modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
      }
    } catch (err) {
      console.error('Fetch learning data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && user) {
      fetchLearningData();
    }
  }, [courseId, user]);

  const handleMarkComplete = async () => {
    if (!activeLesson || completing) return;

    try {
      setCompleting(true);
      const res = await api.post(`/courses/${courseId}/lessons/${activeLesson._id}/complete`);
      
      const newCompleted = res.data.enrollment.completedLessons || [];
      setCompletedLessons(newCompleted);
      setEnrollment((prev: any) => ({
        ...prev,
        progress: res.data.enrollment.progress,
        completed: res.data.enrollment.completed,
      }));

      // Check if certificate just earned
      if (res.data.enrollment.completed && !enrollment?.completed) {
        setShowCertDialog(true);
      }

      // Automatically advance to the next lesson
      advanceNextLesson(newCompleted);
    } catch (err) {
      console.error('Complete lesson error:', err);
    } finally {
      setCompleting(false);
    }
  };

  const advanceNextLesson = (newCompleted: string[]) => {
    let activeFound = false;
    let nextLessonToSet = null;

    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (activeFound) {
          nextLessonToSet = lesson;
          break;
        }
        if (lesson._id === activeLesson._id) {
          activeFound = true;
        }
      }
      if (nextLessonToSet) break;
    }

    if (nextLessonToSet) {
      setActiveLesson(nextLessonToSet);
    }
  };

  const selectLesson = (lesson: any) => {
    setActiveLesson(lesson);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-80 border-r p-4 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Sidebar Navigation */}
      <div
        className={classNameMap(
          'w-80 border-r bg-card h-full flex flex-col shrink-0 transition-all duration-300 z-20 absolute lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <Link to="/courses" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold">
            <ArrowLeft className="h-4 w-4" /> Back to Catalog
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b bg-primary/5">
          <h2 className="font-bold text-sm text-foreground line-clamp-1">{course.title}</h2>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">Course progress</span>
            <span className="font-bold text-primary">{enrollment?.progress || 0}%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1.5">
            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${enrollment?.progress || 0}%` }} />
          </div>
        </div>

        {/* Modules syllabus list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {course.modules?.map((mod: any, modIdx: number) => (
            <div key={mod._id} className="space-y-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                M{modIdx + 1}: {mod.title}
              </h3>
              <div className="space-y-1">
                {mod.lessons?.map((lesson: any) => {
                  const isCompleted = completedLessons.includes(lesson._id);
                  const isActive = activeLesson?._id === lesson._id;
                  let Icon = PlayCircle;
                  if (lesson.type === 'pdf') Icon = FileText;
                  if (lesson.type === 'article') Icon = BookOpen;
                  if (lesson.type === 'quiz') Icon = HelpCircle;
                  if (lesson.type === 'assignment') Icon = Edit3;

                  return (
                    <button
                      key={lesson._id}
                      onClick={() => selectLesson(lesson)}
                      className={classNameMap(
                        'w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left text-sm transition-all',
                        isActive
                          ? 'bg-primary text-white font-medium shadow-sm'
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className={classNameMap('h-4.5 w-4.5 shrink-0 mt-0.5', isActive ? 'text-white' : 'text-emerald-500')} />
                      ) : (
                        <Icon className="h-4.5 w-4.5 shrink-0 mt-0.5 text-muted-foreground/80" />
                      )}
                      <span className="line-clamp-2">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel active lesson viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-extrabold text-foreground text-base sm:text-lg line-clamp-1">
              {activeLesson?.title || 'Learning Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeLesson && (
              <Button
                onClick={handleMarkComplete}
                disabled={completing || completedLessons.includes(activeLesson._id)}
                size="sm"
                className="rounded-full shadow-sm"
              >
                {completedLessons.includes(activeLesson._id) ? 'Completed' : 'Mark Complete'}
              </Button>
            )}
          </div>
        </div>

        {/* Lesson View Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          {activeLesson ? (
            <div className="space-y-6">
              {/* Type 1: Video stream */}
              {activeLesson.type === 'video' && (
                <div className="space-y-4">
                  {activeLesson.videoUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border shadow-md">
                      <video
                        src={activeLesson.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl flex items-center justify-center bg-muted border">
                      <PlayCircle className="h-16 w-16 text-muted-foreground animate-pulse" />
                    </div>
                  )}
                </div>
              )}

              {/* Type 2: PDF download note */}
              {activeLesson.type === 'pdf' && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> Download PDF study materials
                    </CardTitle>
                    <CardDescription>
                      Read and review notes structured for this lesson.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-start pt-2">
                    <a href={activeLesson.notesUrl || '#'} target="_blank" rel="noreferrer">
                      <Button className="gap-2 rounded-full shadow-sm">
                        <Download className="h-4 w-4" /> Download Notes PDF
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Type 3: Quiz Assessment */}
              {activeLesson.type === 'quiz' && (
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-transparent">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <HelpCircle className="h-5 w-5 text-indigo-600" /> Lesson Quiz Assessment
                    </CardTitle>
                    <CardDescription>
                      Evaluate your modular understanding on completion of previous materials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Link to={`/quizzes/${activeLesson.refId}`}>
                      <Button className="rounded-full shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        Start Quiz Assessment <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Type 4: Coding / Custom Assignments */}
              {activeLesson.type === 'assignment' && (
                <Card className="border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <Edit3 className="h-5 w-5 text-indigo-600" /> Module Assignment
                    </CardTitle>
                    <CardDescription>
                      Solve coding challenges or MCQ worksheets to solidify your skillset.
                    </CardDescription>
                  </CardHeader>
                  {activeLesson.refId && (
                    <CardContent className="pt-2">
                      <Link to={`/assignments/${activeLesson.refId}`}>
                        <Button className="rounded-full shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                          View Assignment Task <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Lesson Instructions Content */}
              {activeLesson.content && (
                <div className="prose dark:prose-invert max-w-none pt-4 border-t">
                  <h3 className="text-lg font-bold text-foreground mb-4">Lesson Material Details</h3>
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeLesson.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg">Select a Lesson</h3>
              <p className="text-muted-foreground mt-1">Pick a lesson from the sidebar menu to begin learning.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verified Certificate Earned Dialog */}
      {showCertDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/10 to-card shadow-2xl relative animate-in zoom-in-95 duration-200">
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shadow-inner">
                <Award className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-foreground">Congratulations!</CardTitle>
              <CardDescription className="text-base">
                You have successfully completed all lessons for <strong>{course.title}</strong>!
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Your performance has been evaluated. You have earned a verified LearnX certificate for this coursework.
              </p>
            </CardContent>
            <div className="p-6 pt-0 flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/profile">
                <Button onClick={() => setShowCertDialog(false)} className="w-full rounded-full gap-1.5">
                  View in Profile <Award className="h-4 w-4" />
                </Button>
              </Link>
              <Button onClick={() => setShowCertDialog(false)} variant="outline" className="rounded-full">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Simple helper to merge className variables
function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
