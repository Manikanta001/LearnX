import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface InterviewTimerProps {
  duration: number;
  onTimeUp: () => void;
  className?: string;
}

export default function InterviewTimer({ duration, onTimeUp, className }: InterviewTimerProps) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(interval);
  }, [remaining, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 300;

  return (
    <div
      className={cn(
        'font-mono text-2xl font-bold tabular-nums',
        isLow ? 'text-red-500 animate-pulse' : 'text-foreground',
        className
      )}
    >
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
