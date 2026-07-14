import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, Trophy, CheckCircle, Shield, BarChart2, GitCommit, ChevronRight, ClipboardList, GraduationCap, MessageSquare, Flame } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [discussionsCount, setDiscussionsCount] = useState(0);
  const [userRank, setUserRank] = useState<number>(25);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, enrolledRes] = await Promise.all([
          api.get('/courses'),
          api.get('/courses/enrolled'),
        ]);

        const enrolledData = enrolledRes.data || [];
        setEnrolledCourses(enrolledData);

        // Fetch forum discussions count
        try {
          const forumRes = await api.get('/forum');
          setDiscussionsCount(forumRes.data?.length || 0);
        } catch (e) {
          setDiscussionsCount(0);
        }

        // Fetch leaderboard to calculate rank
        try {
          const leaderboardRes = await api.get('/leaderboard?sortBy=solved');
          const leaderboardData = leaderboardRes.data || [];
          const currentUserId = user?.id || (profile as any)?._id;
          const foundIndex = leaderboardData.findIndex((u: any) => u.id === currentUserId || u._id === currentUserId);
          if (foundIndex !== -1) {
            setUserRank(foundIndex + 1);
          } else {
            setUserRank(leaderboardData.length + 1);
          }
        } catch (e) {
          setUserRank(25);
        }

        // Extract assignments & quizzes from all courses
        const foundAssignments: any[] = [];
        const foundQuizzes: any[] = [];
        coursesRes.data?.forEach((course: any) => {
          course.modules?.forEach((module: any) => {
            module.lessons?.forEach((lesson: any) => {
              if (lesson.type === 'assignment') {
                foundAssignments.push({
                  refId: lesson.refId,
                  title: lesson.title,
                  courseTitle: course.title,
                  courseId: course._id,
                  duration: lesson.duration,
                });
              } else if (lesson.type === 'quiz') {
                foundQuizzes.push({
                  refId: lesson.refId,
                  title: lesson.title,
                  courseTitle: course.title,
                  courseId: course._id,
                  duration: lesson.duration,
                });
              }
            });
          });
        });

        setAssignments(foundAssignments);
        setQuizzes(foundQuizzes);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 max-w-[1200px] mx-auto pt-6">
        <Skeleton className="h-48 w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const solvedProblems = profile?.solvedProblems || [];

  const avgProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / enrolledCourses.length)
    : 0;

  // Generate mock heatmap data for demonstration of advanced features
  const heatmapDays = Array.from({ length: 90 }, (_, i) => Math.floor(Math.random() * 4));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1200px] mx-auto pt-6 pb-12">
      
      {/* Profile Header Card */}
      <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden relative bg-white">
        {/* Premium Banner */}
        <div className="h-32 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500"></div>
        
        <CardContent className="p-6 sm:p-8 pt-0 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          {/* Avatar Area */}
          <div className="relative shrink-0 -mt-12 sm:-mt-16 z-10">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white flex items-center justify-center text-5xl font-extrabold text-indigo-600 shadow-xl ring-4 ring-white">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <button className="absolute bottom-1 right-1 h-8 w-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform ring-2 ring-white">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          
          {/* User Info Area */}
          <div className="flex-1 text-center sm:text-left pt-4 sm:pt-6 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex flex-col sm:flex-row sm:items-center gap-2">
                  {profile?.name || 'Mukkera Manikanta'}
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider w-max mx-auto sm:mx-0">Pro Plan</span>
                </h1>
                <p className="text-gray-500 text-base font-medium mt-1">
                  {profile?.email || 'mukkeramanikanta85@gmail.com'}
                </p>
                
                {/* Pills */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-bold border border-amber-100">
                    <Trophy className="h-4 w-4" /> Rank #{userRank}
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
                    <CheckCircle className="h-4 w-4" /> {solvedProblems.length} Solved
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="rounded-full gap-2 text-gray-700 font-bold border-gray-200 hover:bg-gray-50 shadow-sm shrink-0">
                <Shield className="h-4 w-4" /> Secure Access
              </Button>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        
        {/* Card 1: ASSESSMENTS */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
              <BarChart2 className="h-6 w-6" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{assignments.length + quizzes.length}</h3>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-2">ASSESSMENTS</p>
            <p className="text-purple-600 font-extrabold text-sm mt-1">Overall: {avgProgress}%</p>
          </CardContent>
        </Card>

        {/* Card 2: COURSES */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 mb-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{enrolledCourses.length}</h3>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-2">COURSES</p>
            <p className="text-pink-600 font-extrabold text-sm mt-1">Enrolled</p>
          </CardContent>
        </Card>

        {/* Card 3: SOCIAL PLATFORM QUESTIONS */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 mb-4">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{discussionsCount}</h3>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-2 text-center leading-tight">SOCIAL PLATFORM QUESTIONS</p>
            <p className="text-cyan-600 font-extrabold text-sm mt-1">Active Threads</p>
          </CardContent>
        </Card>

        {/* Card 4: DAILY STREAKS */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{profile?.streak || 0}</h3>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-2">DAILY STREAKS</p>
            <p className="text-amber-600 font-extrabold text-sm mt-1">Max Streaks: {profile?.maxStreak || 0}</p>
          </CardContent>
        </Card>

        {/* Card 5: COURSE PROGRESS */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{avgProgress}%</h3>
            <p className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-2">COURSE PROGRESS</p>
            <p className="text-emerald-600 font-extrabold text-sm mt-1">Average Completion</p>
          </CardContent>
        </Card>

      </div>

      {/* Active Assignments & Quizzes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Active Assignments Card */}
        <Card className="border border-gray-100 shadow-sm rounded-xl bg-white">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" /> Active Assignments
            </CardTitle>
            <CardDescription>Practical hands-on task assessments published by instructors.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-medium">
                No active assignments published yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignments.map((item, index) => (
                  <div key={index} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Course: {item.courseTitle}</p>
                    </div>
                    <Link to={`/assignments/${item.refId}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        Attempt
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Quizzes Card */}
        <Card className="border border-gray-100 shadow-sm rounded-xl bg-white">
          <CardHeader className="p-6 pb-3">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-pink-600" /> Active Quizzes
            </CardTitle>
            <CardDescription>Topic checkpoints and syllabus validation tests.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4">
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm font-medium">
                No active quizzes published yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {quizzes.map((item, index) => (
                  <div key={index} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-900 text-sm hover:text-pink-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1 font-medium">Course: {item.courseTitle}</p>
                    </div>
                    <Link to={`/quizzes/${item.refId}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs font-bold border-pink-200 text-pink-700 hover:bg-pink-50">
                        Attempt
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Advanced Heatmap Section */}
      <Card className="border border-gray-100 shadow-sm rounded-xl bg-white">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <GitCommit className="h-5 w-5 text-indigo-600" /> Coding Activity
            </CardTitle>
            <div className="text-sm font-bold text-gray-500">
              184 Submissions in the last 90 days
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex gap-1.5 flex-wrap">
            {heatmapDays.map((level, i) => {
              // Map random levels to specific colors for the heatmap
              const colors = [
                'bg-gray-100', // 0: no activity
                'bg-indigo-200', // 1: low
                'bg-indigo-400', // 2: medium
                'bg-indigo-600'  // 3: high
              ];
              return (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-sm ${colors[level]} hover:ring-2 ring-indigo-300 transition-all cursor-pointer`}
                  title={`${level * 3} submissions`}
                ></div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-gray-400">
            Less 
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-200"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-400"></div>
            <div className="w-3 h-3 rounded-sm bg-indigo-600"></div>
            More
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
