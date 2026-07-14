import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageSquare, Map, Send, Loader2, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';

export default function AICenterPage() {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'doubt'>('roadmap');

  // Doubt Solver State
  const [doubtQuery, setDoubtQuery] = useState('');
  const [doubtContext, setDoubtContext] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Hello! I am your LearnX AI CS Tutor. Ask me any doubt regarding coding syntax, algorithm steps, or space-time complexities!' },
  ]);
  const [solving, setSolving] = useState(false);

  // Roadmap State
  const [roadmapTopic, setRoadmapTopic] = useState('');
  const [generatedRoadmap, setGeneratedRoadmap] = useState<any | null>(null);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  const handleSendDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (solving || !doubtQuery.trim()) return;

    const query = doubtQuery;
    setChatHistory((prev) => [...prev, { sender: 'user', text: query }]);
    setDoubtQuery('');
    setSolving(true);

    try {
      const res = await api.post('/ai/doubt', {
        doubt: query,
        context: doubtContext || undefined,
      });

      setChatHistory((prev) => [...prev, { sender: 'ai', text: res.data.answer }]);
    } catch (err) {
      console.error('AI doubt solver error:', err);
      setChatHistory((prev) => [...prev, { sender: 'ai', text: 'Error: Failed to fetch response from OpenAI. Check your connection or API configuration.' }]);
    } finally {
      setSolving(false);
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatingRoadmap || !roadmapTopic.trim()) return;

    setGeneratingRoadmap(true);
    setGeneratedRoadmap(null);

    try {
      const res = await api.post('/ai/roadmap', { topic: roadmapTopic });
      setGeneratedRoadmap(res.data.roadmap);
    } catch (err) {
      console.error('AI roadmap error:', err);
      alert('Failed to generate roadmap. Try again.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          LearnX <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">AI Center</span>
        </h1>
        <p className="mt-2 text-base text-muted-foreground max-w-2xl">
          Leverage next-generation AI tutors to solve doubts, generate targeted quizzes, and map customized learning roadmaps.
        </p>
      </div>

      {/* Tabs Selector Bar */}
      <div className="flex gap-2 border-b pb-1 justify-start">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={classNameMap(
            'flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm outline-none transition-all',
            activeTab === 'roadmap'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Map className="h-4.5 w-4.5" /> AI Roadmap Generator
        </button>
        <button
          onClick={() => setActiveTab('doubt')}
          className={classNameMap(
            'flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm outline-none transition-all',
            activeTab === 'doubt'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <MessageSquare className="h-4.5 w-4.5" /> AI Doubt Solver
        </button>
      </div>

      {/* Tab Content A: Study Roadmap Generator */}
      {activeTab === 'roadmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="border-indigo-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-primary" /> Core Topic
                </CardTitle>
                <CardDescription>
                  Enter any skill or technology stack to get a customized timeline study track.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleGenerateRoadmap}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Target Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g. Dynamic Programming, Redux State Management"
                      value={roadmapTopic}
                      onChange={(e) => setRoadmapTopic(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2 pb-6">
                  <Button type="submit" disabled={generatingRoadmap} className="w-full rounded-full gap-1.5">
                    {generatingRoadmap ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing Timeline...
                      </>
                    ) : (
                      <>
                        Generate Roadmap Timeline <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Timeline Output Visualizer */}
          <div className="lg:col-span-2 space-y-6">
            {generatingRoadmap && (
              <div className="space-y-4">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {!generatingRoadmap && !generatedRoadmap && (
              <div className="text-center py-20 border-2 border-dashed rounded-xl bg-card">
                <Map className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No roadmap active</h3>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  Type a topic on the left panel to synthesize a customized syllabus timeline.
                </p>
              </div>
            )}

            {generatedRoadmap && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{generatedRoadmap.title}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{generatedRoadmap.description}</p>
                </div>

                {/* Vertical Timeline */}
                <div className="relative pl-8 border-l border-primary/20 space-y-8 pt-4">
                  {generatedRoadmap.steps?.map((step: any, sIdx: number) => (
                    <div key={sIdx} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-11.5 top-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {sIdx + 1}
                      </div>

                      <Card className="border hover:border-primary/10 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-foreground font-bold">{step.name}</CardTitle>
                          <CardDescription className="text-xs">{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtopics checklist</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-1.5">
                              {step.subtopics?.map((sub: string) => (
                                <div key={sub} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content B: Doubt Solver chat client */}
      {activeTab === 'doubt' && (
        <Card className="border shadow-sm flex flex-col h-[600px] overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4 shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" /> Active AI doubt solver
            </CardTitle>
            <CardDescription>
              Resolve questions about computer science algorithms, logic, or complexity bounds in real-time.
            </CardDescription>
          </CardHeader>

          {/* Messages list */}
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
            {chatHistory.map((chat, idx) => {
              const isAi = chat.sender === 'ai';
              return (
                <div key={idx} className={classNameMap('flex w-full', isAi ? 'justify-start' : 'justify-end')}>
                  <div
                    className={classNameMap(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap',
                      isAi
                        ? 'bg-card border text-foreground border-border rounded-tl-xs'
                        : 'bg-primary text-white rounded-tr-xs font-medium'
                    )}
                  >
                    {chat.text}
                  </div>
                </div>
              );
            })}
            {solving && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-tl-xs px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> AI Tutor is synthesizing answer...
                </div>
              </div>
            )}
          </CardContent>

          {/* Form input bar */}
          <CardFooter className="border-t p-4 shrink-0 bg-card">
            <form onSubmit={handleSendDoubt} className="flex items-center gap-3 w-full">
              <div className="flex-1 relative">
                <Input
                  placeholder="e.g. Why is the worst case lookup of hash table O(N) instead of O(1)?"
                  value={doubtQuery}
                  onChange={(e) => setDoubtQuery(e.target.value)}
                  disabled={solving}
                  className="pr-12 rounded-full"
                />
              </div>
              <Button type="submit" disabled={solving || !doubtQuery.trim()} size="icon" className="rounded-full shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
