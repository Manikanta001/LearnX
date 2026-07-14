import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import DifficultyBadge from '@/components/DifficultyBadge';
import { CheckCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
  };
  isSolved?: boolean;
  isBookmarked?: boolean;
  onBookmark?: (id: string) => void;
}

export default function ProblemCard({ problem, isSolved, isBookmarked, onBookmark }: ProblemCardProps) {
  return (
    <Link to={`/problems/${problem.id}`}>
      <Card className="group hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isSolved && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
            <div className="min-w-0">
              <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                {problem.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{problem.topic}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DifficultyBadge difficulty={problem.difficulty} />
            {onBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onBookmark(problem.id);
                }}
                className="p-1 hover:text-primary transition-colors"
              >
                <Bookmark
                  className={cn('h-4 w-4', isBookmarked && 'fill-primary text-primary')}
                />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
