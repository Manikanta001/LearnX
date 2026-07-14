import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle, PlusCircle, ArrowLeft, Send } from 'lucide-react';

export default function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Submit Answer State
  const [answerContent, setAnswerContent] = useState('');
  const [answering, setAnswering] = useState(false);

  // Comments State
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchThreadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/forum/${id}`);
      setThread(res.data);
    } catch (err) {
      console.error('Fetch thread details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchThreadDetails();
    }
  }, [id, user]);

  const handleVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/forum/${postId}/vote`, { voteType });
      
      // Update vote counters locally
      setThread((prev: any) => {
        if (!prev) return null;
        
        // Check if vote is on main question
        if (prev.question._id === postId) {
          return {
            ...prev,
            question: {
              ...prev.question,
              upvotes: voteType === 'upvote' 
                ? (res.data.hasUpvoted ? [...prev.question.upvotes, user.id] : prev.question.upvotes.filter((uid: string) => uid !== user.id))
                : prev.question.upvotes.filter((uid: string) => uid !== user.id),
              downvotes: voteType === 'downvote'
                ? (res.data.hasDownvoted ? [...prev.question.downvotes, user.id] : prev.question.downvotes.filter((uid: string) => uid !== user.id))
                : prev.question.downvotes.filter((uid: string) => uid !== user.id),
            }
          };
        }

        // Check if vote is on answers
        const updatedAnswers = prev.answers.map((ans: any) => {
          if (ans._id === postId) {
            return {
              ...ans,
              upvotes: voteType === 'upvote'
                ? (res.data.hasUpvoted ? [...ans.upvotes, user.id] : ans.upvotes.filter((uid: string) => uid !== user.id))
                : ans.upvotes.filter((uid: string) => uid !== user.id),
              downvotes: voteType === 'downvote'
                ? (res.data.hasDownvoted ? [...ans.downvotes, user.id] : ans.downvotes.filter((uid: string) => uid !== user.id))
                : ans.downvotes.filter((uid: string) => uid !== user.id),
            };
          }
          return ans;
        });

        return { ...prev, answers: updatedAnswers };
      });

    } catch (err) {
      console.error('Voting error:', err);
    }
  };

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answering || !answerContent.trim()) return;

    try {
      setAnswering(true);
      await api.post(`/forum/${id}/answer`, { content: answerContent });
      setAnswerContent('');
      fetchThreadDetails(); // reload
    } catch (err) {
      console.error('Post answer error:', err);
      alert('Failed to post answer');
    } finally {
      setAnswering(false);
    }
  };

  const handlePostComment = async (postId: string) => {
    if (commenting || !commentContent.trim()) return;

    try {
      setCommenting(true);
      const res = await api.post(`/forum/${postId}/comment`, { content: commentContent });
      
      setCommentContent('');
      setCommentingPostId(null);
      
      // Update comment list in state locally
      setThread((prev: any) => {
        if (!prev) return null;
        if (prev.question._id === postId) {
          return {
            ...prev,
            question: { ...prev.question, comments: res.data.comments },
          };
        }

        const updatedAnswers = prev.answers.map((ans: any) => {
          if (ans._id === postId) {
            return { ...ans, comments: res.data.comments };
          }
          return ans;
        });

        return { ...prev, answers: updatedAnswers };
      });
    } catch (err) {
      console.error('Post comment error:', err);
      alert('Failed to post comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await api.post(`/forum/${id}/accept/${answerId}`);
      fetchThreadDetails(); // reload to get green tick
    } catch (err) {
      console.error('Accept answer error:', err);
      alert('Failed to accept answer');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!thread) return null;

  const { question, answers } = thread;
  const isQuestionAuthor = user && question.author?._id === user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-8">
      {/* Back to Forum navigation */}
      <div>
        <Link to="/forum" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Q&A Board
        </Link>
      </div>

      {/* 1. Main Question Post Section */}
      <div className="flex gap-4">
        {/* Voting Panel on Left */}
        <div className="flex flex-col items-center gap-1.5 pt-4 shrink-0">
          <button 
            onClick={() => handleVote(question._id, 'upvote')}
            className={classNameMap('p-2 rounded-full hover:bg-muted outline-none', user && question.upvotes?.includes(user.id) ? 'text-primary' : 'text-muted-foreground')}
          >
            <ThumbsUp className="h-5 w-5" />
          </button>
          <span className="font-bold text-lg text-foreground">
            {(question.upvotes?.length || 0) - (question.downvotes?.length || 0)}
          </span>
          <button 
            onClick={() => handleVote(question._id, 'downvote')}
            className={classNameMap('p-2 rounded-full hover:bg-muted outline-none', user && question.downvotes?.includes(user.id) ? 'text-rose-500' : 'text-muted-foreground')}
          >
            <ThumbsDown className="h-5 w-5" />
          </button>
        </div>

        {/* Body content on Right */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {question.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
              <span>Asked by <strong className="text-foreground font-semibold">{question.name}</strong></span>
              <span>•</span>
              <span>{new Date(question.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border-t pt-4">
            {question.content}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {question.tags?.map((t: string) => (
              <span key={t} className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>

          {/* Question Comments list */}
          <div className="pt-4 border-t space-y-3">
            <div className="divide-y space-y-2.5">
              {question.comments?.map((comment: any) => (
                <div key={comment._id} className="pt-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{comment.name}: </span>
                  {comment.content}
                  <span className="text-muted-foreground/60 ml-2">({new Date(comment.createdAt).toLocaleDateString()})</span>
                </div>
              ))}
            </div>

            {/* Post Comment Input trigger */}
            {user && (
              <div className="pt-1">
                {commentingPostId === question._id ? (
                  <div className="flex items-center gap-2 max-w-lg">
                    <Input
                      placeholder="Write your comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="h-8 text-xs rounded-full"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handlePostComment(question._id)}
                      disabled={commenting}
                      className="h-8 rounded-full text-xs"
                    >
                      Comment
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setCommentingPostId(null)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setCommentingPostId(question._id)}
                    className="text-xs text-primary hover:underline font-semibold"
                  >
                    Add a comment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Answers Section */}
      <div className="space-y-6 pt-6 border-t">
        <h2 className="text-xl font-bold text-foreground">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-8 divide-y">
          {answers.map((ans: any) => {
            const isAccepted = question.acceptedAnswer === ans._id;

            return (
              <div key={ans._id} className="flex gap-4 pt-6 first:pt-0">
                {/* Voting Panel */}
                <div className="flex flex-col items-center gap-1.5 pt-2 shrink-0">
                  <button 
                    onClick={() => handleVote(ans._id, 'upvote')}
                    className={classNameMap('p-2 rounded-full hover:bg-muted outline-none', user && ans.upvotes?.includes(user.id) ? 'text-primary' : 'text-muted-foreground')}
                  >
                    <ThumbsUp className="h-4.5 w-4.5" />
                  </button>
                  <span className="font-bold text-sm text-foreground">
                    {(ans.upvotes?.length || 0) - (ans.downvotes?.length || 0)}
                  </span>
                  <button 
                    onClick={() => handleVote(ans._id, 'downvote')}
                    className={classNameMap('p-2 rounded-full hover:bg-muted outline-none', user && ans.downvotes?.includes(user.id) ? 'text-rose-500' : 'text-muted-foreground')}
                  >
                    <ThumbsDown className="h-4.5 w-4.5" />
                  </button>

                  {/* Accept solution checkmark badge */}
                  {isAccepted && (
                    <div className="text-emerald-500 mt-2" title="Accepted Solution">
                      <CheckCircle className="h-7 w-7" />
                    </div>
                  )}

                  {/* Accept answer button (Question author only) */}
                  {!isAccepted && isQuestionAuthor && (
                    <button
                      onClick={() => handleAcceptAnswer(ans._id)}
                      className="text-muted-foreground hover:text-emerald-500 mt-2 transition-colors outline-none"
                      title="Accept Answer as Solution"
                    >
                      <CheckCircle className="h-6 w-6 opacity-30 hover:opacity-100" />
                    </button>
                  )}
                </div>

                {/* Body Content */}
                <div className="flex-1 space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Replied by <strong className="text-foreground font-semibold">{ans.name}</strong> on {new Date(ans.createdAt).toLocaleString()}
                  </div>

                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {ans.content}
                  </div>

                  {/* Comments on Answer */}
                  <div className="pt-4 border-t space-y-3">
                    <div className="divide-y space-y-2.5">
                      {ans.comments?.map((comment: any) => (
                        <div key={comment._id} className="pt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground">{comment.name}: </span>
                          {comment.content}
                          <span className="text-muted-foreground/60 ml-2">({new Date(comment.createdAt).toLocaleDateString()})</span>
                        </div>
                      ))}
                    </div>

                    {/* Comment on Answer input */}
                    {user && (
                      <div className="pt-1">
                        {commentingPostId === ans._id ? (
                          <div className="flex items-center gap-2 max-w-lg">
                            <Input
                              placeholder="Write your comment..."
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              className="h-8 text-xs rounded-full"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => handlePostComment(ans._id)}
                              disabled={commenting}
                              className="h-8 rounded-full text-xs"
                            >
                              Comment
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setCommentingPostId(null)}
                              className="h-8 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setCommentingPostId(ans._id)}
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            Add a comment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Post Answer Editor (Logged in users only) */}
      {user ? (
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-1.5 text-foreground font-bold">
              <PlusCircle className="h-5 w-5 text-indigo-600" /> Post Your Answer
            </CardTitle>
            <CardDescription>
              Submit details or complete code solutions in markdown.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handlePostAnswer}>
            <CardContent>
              <textarea
                placeholder="Write your detailed solution or explanation..."
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                className="flex min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button type="submit" disabled={answering} className="rounded-full shadow-sm gap-1.5">
                <Send className="h-4 w-4" /> {answering ? 'Posting...' : 'Submit Answer'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <div className="text-center p-6 border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">
            Please <Link to="/login" className="text-primary hover:underline font-semibold">login</Link> to write a reply or assist other learners.
          </p>
        </div>
      )}
    </div>
  );
}

function classNameMap(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
