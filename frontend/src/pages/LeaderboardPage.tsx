import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, Medal, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'solved' | 'streak'>('solved');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/leaderboard?sortBy=${sortBy}`);
        setUsers(res.data);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [sortBy]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">See how you rank against other coders</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Button
          variant={sortBy === 'solved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('solved')}
          className="gap-2"
        >
          <Trophy className="h-4 w-4" />
          Problems Solved
        </Button>
        <Button
          variant={sortBy === 'streak' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('streak')}
          className="gap-2"
        >
          <Flame className="h-4 w-4" />
          Streak
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Rank / User</span>
            <span>{sortBy === 'solved' ? 'Problems Solved' : 'Streak'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No users yet. Be the first!</p>
          ) : (
            users.map((u, i) => (
              <div
                key={u.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg transition-colors',
                  i < 3 ? 'bg-primary/5' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-4">
                  {getRankIcon(i)}
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="font-medium">{u.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {sortBy === 'solved' ? (
                    <span className="font-mono font-bold text-primary">{u.solvedCount}</span>
                  ) : (
                    <span className="font-mono font-bold text-orange-500 flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      {u.streak}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
