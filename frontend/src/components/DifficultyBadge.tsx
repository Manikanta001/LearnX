import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  className?: string;
}

export default function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const colors = {
    Easy: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Hard: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colors[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
