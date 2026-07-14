import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Layers,
  Type,
  Link2,
  Layers3,
  ListOrdered,
  GitBranch,
  Share2,
  Cpu,
  ChevronRight,
} from 'lucide-react';

const normalizeTopic = (topic: string) => {
  const t = (topic || '').trim();
  if (!t) return 'General';
  if (t.toLowerCase() === 'array') return 'Arrays';
  if (t.toLowerCase() === 'string') return 'Strings';
  return t;
};

const topicConfig = [
  { name: 'Arrays', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Strings', icon: Type, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'Linked Lists', icon: Link2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { name: 'Stacks', icon: Layers3, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { name: 'Queues', icon: ListOrdered, color: 'text-green-500', bg: 'bg-green-500/10' },
  { name: 'Trees', icon: GitBranch, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { name: 'Graphs', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { name: 'Dynamic Programming', icon: Cpu, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export default function RoadmapPage() {
  const { profile } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get('/problems');
        setProblems(res.data);
      } catch (err) {
        console.error('Failed to fetch problems:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const solvedProblems = profile?.solvedProblems || [];

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Topic Roadmap</h1>
        <p className="text-muted-foreground">Master course topics step by step, from fundamentals to advanced</p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

        <div className="space-y-6">
          {topicConfig.map((topic, index) => {
            const Icon = topic.icon;
            const topicProblems = problems.filter((p) => normalizeTopic(p.topic) === topic.name);
            const solved = topicProblems.filter((p) => solvedProblems.includes(p.id));
            const progress = topicProblems.length > 0 ? (solved.length / topicProblems.length) * 100 : 0;

            const easy = topicProblems.filter((p) => p.difficulty === 'Easy');
            const medium = topicProblems.filter((p) => p.difficulty === 'Medium');
            const hard = topicProblems.filter((p) => p.difficulty === 'Hard');

            return (
              <div key={topic.name} className="relative flex gap-4 sm:gap-6">
                <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${progress === 100 ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-background'}`}>
                  <Icon className={`h-5 w-5 ${progress === 100 ? 'text-emerald-500' : topic.color}`} />
                </div>

                <Card className="flex-1 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-normal">#{index + 1}</span>
                        {topic.name}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {solved.length}/{topicProblems.length} solved
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={progress} />

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Easy', items: easy, color: 'text-emerald-500' },
                        { label: 'Medium', items: medium, color: 'text-amber-500' },
                        { label: 'Hard', items: hard, color: 'text-red-500' },
                      ].map((group) => (
                        <div key={group.label} className="text-center p-2 rounded-lg bg-muted/50">
                          <div className={`text-lg font-bold ${group.color}`}>{group.items.length}</div>
                          <div className="text-xs text-muted-foreground">{group.label}</div>
                        </div>
                      ))}
                    </div>

                    {topicProblems.length > 0 && (
                      <div className="space-y-1">
                        {topicProblems.slice(0, 3).map((p) => (
                          <Link
                            key={p.id}
                            to={`/problems/${p.id}`}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                          >
                            <span className={solvedProblems.includes(p.id) ? 'text-emerald-500' : ''}>
                              {p.title}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                        {topicProblems.length > 3 && (
                          <Link to={`/problems?topic=${encodeURIComponent(topic.name)}`}>
                            <Button variant="ghost" size="sm" className="w-full text-xs mt-1">
                              View all {topicProblems.length} problems
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
