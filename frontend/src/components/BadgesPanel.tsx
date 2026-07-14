import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Lock } from 'lucide-react';
import CertificateModal, { type CertBadge } from './CertificateModal';

type BadgeDef = CertBadge & {
  type: 'streak' | 'solved' | 'easy' | 'medium' | 'hard';
  threshold: number;
  hasCertificate?: boolean;
};

const BADGE_DEFS: BadgeDef[] = [
  // ── Streak milestones ──────────────────────────────────────────────────────
  {
    id: 'streak_3',   label: 'First Flame',    emoji: '🔥', desc: '3-day streak',
    type: 'streak', threshold: 3,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'streak_7',   label: 'Week Warrior',   emoji: '⚡', desc: '7-day streak',
    type: 'streak', threshold: 7,
    gradient: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'streak_10',  label: '10-Day Dynamo',  emoji: '💎', desc: '10-day streak',
    type: 'streak', threshold: 10, hasCertificate: true,
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    id: 'streak_20',  label: '20-Day Crusher', emoji: '🚀', desc: '20-day streak',
    type: 'streak', threshold: 20, hasCertificate: true,
    gradient: 'from-violet-500 to-purple-700',
  },
  {
    id: 'streak_30',  label: '30-Day Champ',   emoji: '👑', desc: '30-day streak',
    type: 'streak', threshold: 30, hasCertificate: true,
    gradient: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'streak_50',  label: '50-Day Veteran', emoji: '🌟', desc: '50-day streak',
    type: 'streak', threshold: 50, hasCertificate: true,
    gradient: 'from-pink-500 to-rose-700',
  },
  {
    id: 'streak_100', label: '100-Day Legend', emoji: '🏆', desc: '100-day streak',
    type: 'streak', threshold: 100, hasCertificate: true,
    gradient: 'from-emerald-400 to-teal-600',
  },
  // ── Problems solved ────────────────────────────────────────────────────────
  {
    id: 'solved_1',   label: 'First Step',      emoji: '🎯', desc: 'Solve 1 problem',
    type: 'solved', threshold: 1,
    gradient: 'from-green-400 to-emerald-500',
  },
  {
    id: 'solved_10',  label: 'Seedling',        emoji: '🌱', desc: 'Solve 10 problems',
    type: 'solved', threshold: 10,
    gradient: 'from-lime-400 to-green-600',
  },
  {
    id: 'solved_25',  label: 'Problem Solver',  emoji: '💡', desc: 'Solve 25 problems',
    type: 'solved', threshold: 25,
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'solved_50',  label: 'Code Warrior',    emoji: '⚔️', desc: 'Solve 50 problems',
    type: 'solved', threshold: 50,
    gradient: 'from-indigo-400 to-violet-600',
  },
  {
    id: 'solved_100', label: 'Algo Master',     emoji: '🧠', desc: 'Solve 100 problems',
    type: 'solved', threshold: 100,
    gradient: 'from-fuchsia-500 to-pink-700',
  },
  // ── Difficulty badges ──────────────────────────────────────────────────────
  {
    id: 'easy_5',   label: 'Easy Rider',      emoji: '🟢', desc: 'Solve 5 Easy problems',
    type: 'easy', threshold: 5,
    gradient: 'from-green-300 to-emerald-500',
  },
  {
    id: 'medium_5', label: 'Mid-Level Coder', emoji: '🟡', desc: 'Solve 5 Medium problems',
    type: 'medium', threshold: 5,
    gradient: 'from-yellow-400 to-amber-500',
  },
  {
    id: 'hard_1',   label: 'Hard Hitter',     emoji: '🔴', desc: 'Solve 1 Hard problem',
    type: 'hard', threshold: 1,
    gradient: 'from-red-500 to-rose-600',
  },
];

interface BadgesPanelProps {
  solvedProblems: string[];
  problems: any[];
  maxStreak: number;
  userName: string;
}

export default function BadgesPanel({ solvedProblems, problems, maxStreak, userName }: BadgesPanelProps) {
  const [certBadge, setCertBadge] = useState<BadgeDef | null>(null);

  const solved = problems.filter((p) => solvedProblems.includes(p.id));
  const solvedEasy   = solved.filter((p) => p.difficulty === 'Easy').length;
  const solvedMedium = solved.filter((p) => p.difficulty === 'Medium').length;
  const solvedHard   = solved.filter((p) => p.difficulty === 'Hard').length;

  const isUnlocked = (b: BadgeDef): boolean => {
    switch (b.type) {
      case 'streak': return maxStreak >= b.threshold;
      case 'solved': return solvedProblems.length >= b.threshold;
      case 'easy':   return solvedEasy >= b.threshold;
      case 'medium': return solvedMedium >= b.threshold;
      case 'hard':   return solvedHard >= b.threshold;
    }
  };

  const unlockedCount = BADGE_DEFS.filter(isUnlocked).length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Achievements &amp; Certificates
            </CardTitle>
            <span className="text-sm text-muted-foreground font-medium">
              {unlockedCount} / {BADGE_DEFS.length} unlocked
            </span>
          </div>
          {/* Progress bar across all badges */}
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${(unlockedCount / BADGE_DEFS.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
            {BADGE_DEFS.map((badge) => {
              const unlocked = isUnlocked(badge);
              return (
                <div
                  key={badge.id}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200 ${
                    unlocked
                      ? 'border-transparent shadow-md hover:scale-105 hover:shadow-lg cursor-default'
                      : 'border-border/50 opacity-50 grayscale'
                  }`}
                  title={`${badge.label}: ${badge.desc}`}
                >
                  {/* Gradient background for unlocked */}
                  {unlocked && (
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-br ${badge.gradient} opacity-[0.12]`}
                    />
                  )}

                  {/* Lock icon overlay for locked */}
                  {!unlocked && (
                    <div className="absolute top-1 right-1">
                      <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                    </div>
                  )}

                  <span className="text-2xl relative z-10 leading-none">{badge.emoji}</span>
                  <span className="text-[10px] font-semibold leading-tight relative z-10 line-clamp-2">
                    {badge.label}
                  </span>

                  {unlocked && badge.hasCertificate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 text-[9px] px-1.5 mt-0.5 relative z-10 border-indigo-400/50 text-indigo-400 hover:bg-indigo-500/10"
                      onClick={() => setCertBadge(badge)}
                    >
                      📜 Certificate
                    </Button>
                  ) : (
                    <span className="text-[9px] text-muted-foreground relative z-10 leading-tight">
                      {badge.desc}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {certBadge && (
        <CertificateModal
          badge={certBadge}
          userName={userName}
          onClose={() => setCertBadge(null)}
        />
      )}
    </>
  );
}
