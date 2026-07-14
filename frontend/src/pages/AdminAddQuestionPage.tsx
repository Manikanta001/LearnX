import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { clearAdminPassword, isAdminLoggedIn } from '@/lib/adminAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Link as LinkIcon, Copy, AlertCircle } from 'lucide-react';

const defaultStarterCode = {
  javascript: 'function solve() {\n  // Write your solution here\n}',
  python: 'def solve():\n    # Write your solution here\n    pass',
  java: 'class Solution {\n    public void solve() {\n        // Write your solution here\n    }\n}',
  cpp: 'class Solution {\npublic:\n    void solve() {\n        // Write your solution here\n    }\n};',
};

const PROBLEM_TEMPLATE = `Problem Title here

Difficulty: Easy
Topic: Arrays

Description:
Write a detailed description of the problem here.

Examples:
[1, 2] | 3 | Explanation for this test case
[2, 7, 11, 15] | 9 | Another explanation

Constraints:
- First constraint
- Second constraint

Test Cases (exactly 4):
1 2 3 | 6
10 20 30 | 60
5 5 5 5 | 20
0 1 | 1
`;

export default function AdminAddQuestionPage() {
  const [tab, setTab] = useState<'manual' | 'leetcode'>('manual');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [topic, setTopic] = useState('Arrays');
  const [source, setSource] = useState('custom');
  const [sourceUrl, setSourceUrl] = useState('');
  const [description, setDescription] = useState('');
  const [testCasesRaw, setTestCasesRaw] = useState('');
  const [examplesRaw, setExamplesRaw] = useState('');
  const [constraintsRaw, setConstraintsRaw] = useState('');
  const [hintsRaw, setHintsRaw] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [leetcodeNumber, setLeetcodeNumber] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [pasteTemplate, setPasteTemplate] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const parseExamples = (raw: string) => {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|');
        return {
          input: (parts[0] || '').trim(),
          output: (parts[1] || '').trim(),
          explanation: (parts[2] || '').trim(),
        };
      });
  };

  const parseList = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const resetForm = () => {
    setTitle('');
    setDifficulty('Easy');
    setTopic('Arrays');
    setSource('custom');
    setSourceUrl('');
    setDescription('');
    setTestCasesRaw('');
    setExamplesRaw('');
    setConstraintsRaw('');
    setHintsRaw('');
    setLeetcodeNumber('');
    setLeetcodeUrl('');
  };

  const parseTestCases = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|');
        return {
          input: (parts[0] || '').trim(),
          expectedOutput: (parts[1] || '').trim(),
        };
      });

  const fillFormFromData = (data: any, url: string) => {
    setTitle(data.title);
    setDifficulty(data.difficulty);
    setTopic(data.topic);
    setSource('leetcode');
    setSourceUrl(url);
    setDescription(data.description);
    setExamplesRaw(
      data.examples
        ?.map((ex: any) => `${ex.input} | ${ex.output} | ${ex.explanation}`)
        .join('\n') || ''
    );
    setTestCasesRaw(
      data.examples
        ?.slice(0, 4)
        ?.map((ex: any) => `${ex.input} | ${ex.output}`)
        .join('\n') || ''
    );
    setConstraintsRaw(data.constraints?.join('\n') || '');
    setHintsRaw(data.hints?.join('\n') || '');
  };

  const handleFetchByNumber = async () => {
    setError('');
    setMessage('');
    setScrapingLoading(true);
    try {
      const res = await api.post('/admin/fetch-by-number', { number: leetcodeNumber });
      const url = `https://leetcode.com/problems/${res.data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}/`;
      fillFormFromData(res.data, res.data.leetcodeUrl || url);
      setMessage(`Problem #${leetcodeNumber} "${res.data.title}" imported successfully! Review and save.`);
      setTab('manual');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch problem');
    } finally {
      setScrapingLoading(false);
    }
  };

  const handleScrapeLeetcode = async () => {
    setError('');
    setMessage('');
    setScrapingLoading(true);

    try {
      const res = await api.post('/admin/scrape-leetcode', { url: leetcodeUrl });
      fillFormFromData(res.data, leetcodeUrl);
      setMessage('LeetCode problem imported successfully! Review and save.');
      setTab('manual');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to scrape LeetCode problem';
      const suggestion = err.response?.data?.suggestion;
      setError(`${errorMsg}${suggestion ? ` - ${suggestion}` : ''}`);
    } finally {
      setScrapingLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(PROBLEM_TEMPLATE);
    setMessage('Template copied to clipboard!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      const parsedTestCases = parseTestCases(testCasesRaw);
      if (parsedTestCases.length < 2) {
        setError('Please provide at least 2 test cases in this format: input | expected output');
        setSubmitting(false);
        return;
      }

      const payload = {
        title,
        difficulty,
        topic,
        source,
        sourceUrl,
        description,
        testCases: parsedTestCases,
        examples: parseExamples(examplesRaw),
        constraints: parseList(constraintsRaw),
        hints: parseList(hintsRaw),
        starterCode: defaultStarterCode,
      };

      await api.post('/problems', payload);
      setMessage('Question added successfully.');
      resetForm();
      setLeetcodeUrl('');
      setPasteTemplate('');
    } catch (err: any) {
      if (err.response?.status === 403) {
        clearAdminPassword();
        navigate('/admin/login');
        return;
      }
      setError(err.response?.data?.error || 'Failed to add question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'manual' ? 'default' : 'outline'}
          onClick={() => setTab('manual')}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Manually
        </Button>
        <Button
          variant={tab === 'leetcode' ? 'default' : 'outline'}
          onClick={() => setTab('leetcode')}
          className="gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Import from LeetCode
        </Button>
      </div>

      {tab === 'leetcode' ? (
        <Card>
          <CardHeader>
            <CardTitle>Import from LeetCode</CardTitle>
            <CardDescription>Enter a problem number (e.g. 268) or paste a full URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message ? <p className="rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-600">{message}</p> : null}
            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Import Failed</p>
                    <p className="text-xs mt-1">{error}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Primary: by problem number */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <p className="text-sm font-semibold">Option 1 — By Problem Number (Recommended)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={leetcodeNumber}
                  onChange={(e) => setLeetcodeNumber(e.target.value)}
                  placeholder="e.g. 268"
                  className="w-40"
                />
                <Button
                  onClick={handleFetchByNumber}
                  disabled={scrapingLoading || !leetcodeNumber}
                  className="flex-1 gap-2"
                >
                  {scrapingLoading ? (
                    <><div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />Fetching...</>
                  ) : (
                    <><LinkIcon className="h-4 w-4" />Fetch Problem</>)}
                </Button>
              </div>
            </div>

            {/* Fallback: by full URL */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-semibold">Option 2 — By Full URL</p>
              <div className="space-y-2">
                <Input
                  type="url"
                  value={leetcodeUrl}
                  onChange={(e) => setLeetcodeUrl(e.target.value)}
                  placeholder="https://leetcode.com/problems/missing-number/"
                />
              </div>
              <Button onClick={handleScrapeLeetcode} disabled={scrapingLoading || !leetcodeUrl} variant="outline" className="w-full gap-2">
                {scrapingLoading ? (
                  <><div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />Scraping...</>
                ) : (
                  <><LinkIcon className="h-4 w-4" />Import from URL</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Question
            </CardTitle>
            <CardDescription>Only admin users can create new DSA problems.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {message ? <p className="rounded-md bg-emerald-500/10 p-2 text-sm text-emerald-600">{message}</p> : null}
              {error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <select
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="custom">Custom</option>
                    <option value="leetcode">LeetCode</option>
                    <option value="gfg">GeeksforGeeks</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-url">Problem URL</Label>
                  <Input
                    id="source-url"
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/two-sum/"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-cases">Test Cases (at least 2 lines: input | expected output)</Label>
                <textarea
                  id="test-cases"
                  value={testCasesRaw}
                  onChange={(e) => setTestCasesRaw(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                  placeholder={'1 2 3 | 6\n2 7 11 15 | 9\n5 10 | 15\n0 0 | 0'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examples">Examples (one per line: input | output | explanation)</Label>
                <textarea
                  id="examples"
                  value={examplesRaw}
                  onChange={(e) => setExamplesRaw(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="[1, 2] | 3 | First example"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints">Constraints (one per line)</Label>
                <textarea
                  id="constraints"
                  value={constraintsRaw}
                  onChange={(e) => setConstraintsRaw(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="1 ≤ n ≤ 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hints">Hints (one per line)</Label>
                <textarea
                  id="hints"
                  value={hintsRaw}
                  onChange={(e) => setHintsRaw(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Try using a hash map"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Question'}
                </Button>
                <Button type="button" variant="outline" onClick={() => clearAdminPassword()}>
                  Logout Admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
