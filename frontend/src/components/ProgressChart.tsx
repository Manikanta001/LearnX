import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProgressChartProps {
  solvedProblems: string[];
  problems: any[];
}

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

const normalizeTopic = (topic: string) => {
  const t = (topic || '').trim();
  if (!t) return 'General';
  if (t.toLowerCase() === 'array') return 'Arrays';
  if (t.toLowerCase() === 'string') return 'Strings';
  return t;
};

export default function ProgressChart({ solvedProblems, problems }: ProgressChartProps) {
  const solved = problems.filter((p) => solvedProblems.includes(p.id));

  const difficultyData = [
    {
      name: 'Easy',
      solved: solved.filter((p) => p.difficulty === 'Easy').length,
      total: problems.filter((p) => p.difficulty === 'Easy').length,
    },
    {
      name: 'Medium',
      solved: solved.filter((p) => p.difficulty === 'Medium').length,
      total: problems.filter((p) => p.difficulty === 'Medium').length,
    },
    {
      name: 'Hard',
      solved: solved.filter((p) => p.difficulty === 'Hard').length,
      total: problems.filter((p) => p.difficulty === 'Hard').length,
    },
  ];

  const pieData = difficultyData
    .map((d) => ({ name: d.name, value: d.solved }))
    .filter((d) => d.value > 0);

  const topics = [...new Set(problems.map((p) => normalizeTopic(p.topic)))];
  const topicData = topics
    .map((topic) => {
      const total = problems.filter((p) => normalizeTopic(p.topic) === topic).length;
      const solvedCount = solved.filter((p) => normalizeTopic(p.topic) === topic).length;
      return {
        name: topic,
        solved: solvedCount,
        total,
        completion: total > 0 ? Math.round((solvedCount / total) * 100) : 0,
      };
    })
    .filter((d) => d.total > 0)
    .sort((a, b) => {
      if (b.completion !== a.completion) return b.completion - a.completion;
      return b.total - a.total;
    })
    .slice(0, 10);

  const topicAccent = ['bg-blue-500', 'bg-cyan-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Problems Solved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground py-12">No problems solved yet</p>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {difficultyData.map((d, i) => (
              <div key={d.name} className="text-center">
                <div className="text-2xl font-bold" style={{ color: COLORS[i] }}>
                  {d.solved}/{d.total}
                </div>
                <div className="text-xs text-muted-foreground">{d.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topic Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topicData.length === 0 ? (
            <p className="text-muted-foreground py-8">No topic data available yet.</p>
          ) : (
            topicData.map((topic, index) => (
              <div key={topic.name} className="rounded-lg border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${topicAccent[index % topicAccent.length]}`} />
                    <span className="truncate text-sm font-medium text-foreground">{topic.name}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-foreground">{topic.solved}/{topic.total}</div>
                    <div className="text-xs text-muted-foreground">{topic.completion}% complete</div>
                  </div>
                </div>
                <Progress value={topic.completion} className="h-2.5 bg-muted" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
