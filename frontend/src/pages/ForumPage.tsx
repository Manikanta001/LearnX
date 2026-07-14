import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ThumbsUp, Tag, PlusCircle, Search, HelpCircle, CornerDownRight, CheckCircle } from 'lucide-react';

export default function ForumPage() {
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  
  // Ask Question Modal State
  const [askOpen, setAskOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/forum', {
        params: {
          search: search || undefined,
          tag: tag || undefined,
        },
      });
      setQuestions(res.data);
    } catch (err) {
      console.error('Fetch forum questions error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [tag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting || !title.trim() || !content.trim()) return;

    try {
      setPosting(true);
      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post('/forum/ask', {
        title,
        content,
        tags: tagsArray,
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setTagsInput('');
      setAskOpen(false);
      
      // Reload questions
      fetchQuestions();
    } catch (err) {
      console.error('Ask question error:', err);
      alert('Failed to post question');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Forum Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Discussion <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Forum</span>
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Ask questions, share code templates, and assist peers. A StackOverflow-styled knowledgebase for developers.
          </p>
        </div>

        {user && (
          <Button onClick={() => setAskOpen(true)} className="rounded-full shadow-md gap-2 shrink-0">
            <PlusCircle className="h-4.5 w-4.5" /> Ask a Question
          </Button>
        )}
      </div>

      {/* Searches and Tag filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search discussion threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-24 rounded-full"
          />
          <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 rounded-full">
            Search
          </Button>
        </form>

        {tag && (
          <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full shrink-0">
            <Tag className="h-3.5 w-3.5" /> Filtered tag: {tag}
            <button onClick={() => setTag('')} className="hover:text-destructive font-bold ml-1 text-sm outline-none">
              ×
            </button>
          </div>
        )}
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-card">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No threads found</h3>
          <p className="text-muted-foreground mt-2">Start a discussion by asking a question.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const upvotesCount = q.upvotes?.length || 0;
            const commentsCount = q.comments?.length || 0;

            return (
              <Card key={q._id} className="hover:border-primary/20 hover:shadow-sm transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* Votes indicators */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 border text-center shrink-0 min-w-14">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-bold text-foreground mt-1">{upvotesCount}</span>
                    </div>

                    {/* Question details */}
                    <div className="flex-1 space-y-1">
                      <Link to={`/forum/${q._id}`}>
                        <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {q.title}
                        </h2>
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                        <span>Asked by {q.name}</span>
                        <span>•</span>
                        <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                        {q.acceptedAnswer && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle className="h-3.5 w-3.5" /> Solved
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 pl-20">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {q.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-2 pb-4 pl-20 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {q.tags?.map((t: string) => (
                      <button
                        key={t}
                        onClick={() => setTag(t)}
                        className="text-xs font-medium text-primary hover:text-white bg-primary/10 border border-primary/20 hover:bg-primary px-2.5 py-1 rounded-full transition-all outline-none"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{commentsCount} comments / replies</span>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ask Question Overlay Dialog */}
      {askOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" /> Ask a Public Question
              </CardTitle>
              <CardDescription>
                Describe your doubt or post your coding question. Peers and instructors will assist you.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAskQuestion}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Be specific. e.g. How to reverse a binary tree recursively?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Details Content</Label>
                  <textarea
                    id="content"
                    placeholder="Provide details about your problem, code blocks, or explanations..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="comma-separated tags. e.g. trees, binary, recursion"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setAskOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={posting}>
                  {posting ? 'Posting...' : 'Post Question'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
