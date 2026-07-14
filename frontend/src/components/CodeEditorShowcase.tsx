import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Code2, Copy, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const showcodeSnippet = `function solution(nums) {
  // Two-pointer approach
  let left = 0, right = nums.length - 1;
  
  while (left < right) {
    const sum = nums[left] + nums[right];
    
    if (sum === 9) {
      return [left + 1, right + 1];
    } else if (sum < 9) {
      left++;
    } else {
      right--;
    }
  }
  
  return [-1, -1];
}`;

export default function CodeEditorShowcase() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(showcodeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">Professional Code Editor</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 gap-1"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1"
          >
            <Play className="h-4 w-4" />
            Run
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-lg bg-white">
        <div className="h-80 overflow-hidden">
          <MonacoEditor
            height="100%"
            language="javascript"
            value={showcodeSnippet}
            theme="light"
            options={{
              fontSize: 12,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              lineNumbers: 'on',
              minimap: { enabled: false },
              padding: { top: 12, bottom: 12 },
              scrollBeyondLastLine: false,
              folding: true,
              wordWrap: 'on',
              automaticLayout: true,
              readOnly: true,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Syntax Highlighting
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Code Execution
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Quick Tips
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Multi-language
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Zoom Controls
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
          Templates
        </div>
      </div>
    </div>
  );
}
