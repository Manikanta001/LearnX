import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Zap, Trophy, Brain, ArrowRight, BookOpen, Timer } from 'lucide-react';
import CodeEditorShowcase from '@/components/CodeEditorShowcase';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: BookOpen, title: 'Problem Library', desc: 'Curated practice problems across all topics and difficulties' },
    { icon: Brain, title: 'AI Hints', desc: 'Get intelligent hints powered by AI when you are stuck' },
    { icon: Zap, title: 'Code Editor', desc: 'Built-in Monaco editor with syntax highlighting and execution' },
    { icon: Trophy, title: 'Progress Tracking', desc: 'Track your solving streak, mastery, and compete on leaderboards' },
    { icon: Timer, title: 'Mock Interviews', desc: 'Simulate real coding interviews with a 45-minute timer' },
    { icon: Code2, title: 'Topic Roadmap', desc: 'Follow a structured roadmap from arrays to dynamic programming' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative container mx-auto max-w-5xl px-4 py-24 sm:py-32 text-center">
          <div className="badge rounded-pill border border-info-subtle bg-info-subtle text-info-emphasis inline-flex items-center gap-2 px-4 py-2 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Smart Practice with LearnX
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Master Tech Skills with
            <br />
            <span className="text-primary">LearnX</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            LearnX is a modern platform to learn, practice, and master technology courses with AI-powered hints,
            real-time code execution, progress tracking, and mock interview simulations.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            {user ? (
              <Link to="/problems">
                <Button size="lg" className="gap-2">
                  Start Practicing <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Code Editor Showcase */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-4">Professional Code Editor</h2>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto">
            Write, execute, and optimize your code with our powerful Monaco editor featuring real-time syntax highlighting, 
            multiple language support, and integrated code execution.
          </p>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <CodeEditorShowcase />
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-12">Everything you need to ace your coding interviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
