import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardLayout from './components/DashboardLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import RoadmapPage from './pages/RoadmapPage';
import LeaderboardPage from './pages/LeaderboardPage';
import InterviewPage from './pages/InterviewPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminAddQuestionPage from './pages/AdminAddQuestionPage';

// New EdTech LMS Pages
import CoursesPage from './pages/CoursesPage';
import StudyMaterialsPage from './pages/StudyMaterialsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import QuizzesPage from './pages/QuizzesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseLearningPage from './pages/CourseLearningPage';
import QuizAttemptPage from './pages/QuizAttemptPage';
import AssignmentAttemptPage from './pages/AssignmentAttemptPage';
import ForumPage from './pages/ForumPage';
import ForumThreadPage from './pages/ForumThreadPage';
import AICenterPage from './pages/AICenterPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import InstructorDashboardPage from './pages/InstructorDashboardPage';

export default function App() {
  return (
    <Routes>
      {/* Public Routes with standard top Navbar */}
      <Route path="/" element={
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1"><HomePage /></main>
        </div>
      } />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Authenticated Student Hub with new Layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/interview" element={<InterviewPage />} />

        {/* DSA compiler tracks */}
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:id" element={<ProblemDetailPage />} />

        {/* Structured course paths & Study Materials */}
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/study-materials" element={<StudyMaterialsPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/learn/:courseId" element={<CourseLearningPage />} />

        {/* Quizzes & Assignments */}
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/quizzes" element={<QuizzesPage />} />
        <Route path="/quizzes/:quizId" element={<QuizAttemptPage />} />
        <Route path="/assignments/:assignmentId" element={<AssignmentAttemptPage />} />

        {/* Q&A Discussions */}
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/:id" element={<ForumThreadPage />} />

        {/* AI Centre doubt/roadmap assistants */}
        <Route path="/ai-features" element={<AICenterPage />} />

        {/* Role-Specific Panels (Instructor / Admin) */}
        <Route path="/admin/add-question" element={<AdminAddQuestionPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboardPage />} />
      </Route>
    </Routes>
  );
}
