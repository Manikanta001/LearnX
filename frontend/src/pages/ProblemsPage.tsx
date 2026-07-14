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
  Code2,
  Plus,
  Search,
  CheckCircle,
  Clock,
  HelpCircle,
  Filter,
  ArrowRight
} from 'lucide-react';

export default function ProblemsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Create Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [leetcodeNumber, setLeetcodeNumber] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/problems');
      setProblems(res.data || []);
    } catch (err) {
      console.error('Fetch problems error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
    if (user?.id) {
      refreshProfile();
    }
  }, [user?.id]);

  const handleImportProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating || !leetcodeNumber.trim()) return;

    try {
      setCreating(true);
      await api.post('/problems', {
        leetcodeNumber: leetcodeNumber.trim(),
      });

      setLeetcodeNumber('');
      setCreateOpen(false);
      fetchProblems();
      alert('LeetCode problem imported and saved successfully!');
    } catch (err: any) {
      console.error('Import problem error:', err);
      alert('Failed to import problem: ' + (err.response?.data?.error || err.message));
    } finally {
      setCreating(false);
    }
  };

  // Filter and Search logic
  const filteredProblems = problems.filter((prob) => {
    const matchesSearch = prob.title.toLowerCase().includes(search.toLowerCase()) ||
      (prob.topic || '').toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || prob.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const getProblemStatus = (problemId: string) => {
    const solved = profile?.solvedProblems || [];
    const attempted = profile?.attemptedProblems || [];

    if (solved.includes(problemId)) {
      return <span title="Solved"><CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /></span>;
    }
    if (attempted.includes(problemId)) {
      return <span title="Attempted"><Clock className="h-5 w-5 text-amber-500 shrink-0" /></span>;
    }
    return <span title="Unsolved"><HelpCircle className="h-5 w-5 text-slate-300 shrink-0" /></span>;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl flex items-center gap-2">
            <Code2 className="h-8 w-8 text-indigo-600 animate-pulse" /> Coding Problems Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse coding challenges, compile code in real-time, verify test cases, and track your solution status.
          </p>
        </div>

        {isAdminOrInstructor && (
          <Button onClick={() => setCreateOpen(true)} className="rounded-full shadow-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
            <Plus className="h-4.5 w-4.5" /> Add Problem
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems by name, topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-white border-gray-200"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="flex h-9 rounded-full border border-gray-200 bg-white px-4 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problems List Table Grid */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl bg-card">
          <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg text-slate-700">No problems found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {isAdminOrInstructor
              ? "Get started by adding or importing a new programming challenge."
              : "No challenges match the current filter parameters."}
          </p>
        </div>
      ) : (
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-12 text-center">Status</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Topic/Tags</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProblems.map((prob) => (
                  <tr key={prob._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center w-12">
                      <div className="flex items-center justify-center">
                        {getProblemStatus(prob._id)}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link to={`/problems/${prob._id}`} className="hover:text-indigo-600 font-bold text-slate-900 block truncate max-w-xs sm:max-w-sm">
                        {prob.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-semibold">
                        {prob.topic || 'Coding'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        prob.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        prob.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link to={`/problems/${prob._id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-full text-xs font-bold gap-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          Solve <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Problem Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 bg-white">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 border-b pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-slate-900 font-extrabold">
                <Code2 className="h-6 w-6 text-indigo-600 animate-pulse" /> Import Coding Challenge
              </CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Enter a LeetCode problem number to automatically parse and pull problem specifications.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleImportProblem}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="leetcodeNumber">LeetCode Problem Number</Label>
                  <Input
                    id="leetcodeNumber"
                    type="number"
                    min="1"
                    placeholder="e.g. 1 (Two Sum), 20 (Valid Parentheses), 141 (Linked List Cycle)"
                    value={leetcodeNumber}
                    onChange={(e) => setLeetcodeNumber(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-indigo-600 italic font-medium leading-normal">
                    This maps details (HTML description, test cases, templates, constraints) directly into the platform repository for immediate user practice.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end border-t pt-4 mt-4 bg-slate-50/40">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-bold shadow-md">
                  {creating ? 'Importing...' : 'Import & Save'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
