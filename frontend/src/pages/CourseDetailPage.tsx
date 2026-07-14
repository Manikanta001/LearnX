import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, FileText, HelpCircle, Edit3, ArrowRight, UserCheck, BookOpen, Clock, Award } from 'lucide-react';
import DifficultyBadge from '@/components/DifficultyBadge';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
      setIsEnrolled(res.data.isEnrolled);
    } catch (err) {
      console.error('Fetch course details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
    }
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setEnrollmentLoading(true);
      await api.post(`/courses/${id}/enroll`);
      setIsEnrolled(true);
      navigate(`/learn/${id}`);
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested course syllabus could not be retrieved.</p>
        <Link to="/courses" className="mt-4 inline-block">
          <Button>Back to Catalog</Button>
        </Link>
      </div>
    );
  }

  // Count total lessons
  let totalLessons = 0;
  course.modules?.forEach((m: any) => {
    totalLessons += m.lessons?.length || 0;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top Banner section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={course.difficulty} />
            <span className="text-sm text-primary font-semibold uppercase">{course.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {course.title}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{course.modules?.length || 0} Modules</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              <span>{totalLessons} Lessons</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span>Verified Certificate</span>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {course.instructor?.name?.charAt(0) || 'I'}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Course Instructor</p>
              <p className="font-semibold text-foreground">{course.instructor?.name || 'Academic Instructor'}</p>
            </div>
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 overflow-hidden border-primary/20 shadow-md">
            <div className="h-44 overflow-hidden bg-muted">
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=600&auto=format&fit=crop'}
                alt={course.title}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-6 space-y-4">
              {isEnrolled ? (
                <Link to={`/learn/${course._id}`} className="w-full block">
                  <Button className="w-full gap-2 rounded-full shadow-md">
                    Continue Learning <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={enrollmentLoading}
                  className="w-full gap-2 rounded-full shadow-md bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white"
                >
                  {enrollmentLoading ? 'Enrolling...' : 'Enroll Now'} <UserCheck className="h-4 w-4" />
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Free Enrollment sponsored by LearnX Academic Credits.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Syllabus outline */}
      <div className="mt-8 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Course Syllabus</h2>
        
        {course.modules?.map((mod: any, index: number) => (
          <Card key={mod._id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </span>
                {mod.title}
              </CardTitle>
              {mod.description && (
                <CardDescription className="pl-8">{mod.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0 border-t">
              <div className="divide-y">
                {mod.lessons?.map((lesson: any) => {
                  let Icon = PlayCircle;
                  if (lesson.type === 'pdf') Icon = FileText;
                  if (lesson.type === 'quiz') Icon = HelpCircle;
                  if (lesson.type === 'assignment') Icon = Edit3;

                  return (
                    <div key={lesson._id} className="flex items-center justify-between p-4 pl-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground uppercase">{lesson.type}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lesson.duration ? `${lesson.duration} mins` : '--'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
