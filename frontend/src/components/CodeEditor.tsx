import MonacoEditor, { Monaco } from '@monaco-editor/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { AlertCircle, Copy, RotateCcw, ZoomIn, ZoomOut, Code2, Play, CheckCircle2 } from 'lucide-react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  onLanguageChange: (lang: string) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  onRun?: () => void;
  isRunning?: boolean;
}

const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
];

const defaultTemplates: Record<string, string> = {
  javascript: `// Function to solve the problem
function solution(params) {
  // Your solution here
  
  return result;
}

// Main execution
const input = require('fs').readFileSync(0, 'utf-8').trim();
const result = solution(input);
console.log(result);`,
  python: `# Function to solve the problem
def solution(params):
    # Your solution here
    
    return result

# Main execution
if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().strip()
    result = solution(input_data)
    print(result)`,
  java: `import java.util.*;

class Solution {
    public void solve() {
        // Your solution here
        
    }
    
    public static void main(String[] args) {
        Solution solution = new Solution();
        solution.solve();
    }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void solve() {
        // Your solution here
        
    }
};

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    Solution solution;
    solution.solve();
    
    return 0;
}`,
};

export default function CodeEditor({ 
  language, 
  value, 
  onChange, 
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning = false,
  isSubmitting = false 
}: CodeEditorProps) {
  const monacoLang = language === 'cpp' ? 'cpp' : language;
  const [editorReady, setEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    setEditorReady(true);
    setIsLoading(false);
    editor.focus();
  };

  const handleEditorChange = (val: string | undefined) => {
    if (val !== undefined) {
      onChange(val);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    onChange(defaultTemplates[language] || '');
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setFontSize(prev => direction === 'in' ? Math.min(prev + 2, 24) : Math.max(prev - 2, 10));
  };

  return (
    <div className="flex flex-col h-full bg-white border border-border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-slate-50 to-slate-50/50 gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Code Editor</span>
          {editorReady && (
            <span className="inline-flex items-center gap-1.5 ml-auto">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-xs text-emerald-600 font-medium">Ready</span>
            </span>
          )}
        </div>
        
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background/50 gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('out')}
            disabled={fontSize <= 10}
            title="Decrease font size"
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-8 text-center">{fontSize}px</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom('in')}
            disabled={fontSize >= 24}
            title="Increase font size"
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            title="Copy to clipboard"
            className="h-8 px-2 gap-1"
          >
            <Copy className="h-4 w-4" />
            {copyFeedback ? <span className="text-xs">Copied!</span> : <span className="text-xs hidden sm:inline">Copy</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="Reset to template"
            className="h-8 px-2 gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Reset</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {onRun && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRun}
              disabled={isRunning}
              className="h-8 gap-1"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
          )}
          {onSubmit && (
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="h-8 gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30 relative">
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-red-200 shadow-lg">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <p className="text-sm text-red-700 font-medium">Editor failed to load</p>
              <button 
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 z-40">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground font-medium">Loading code editor...</p>
            </div>
          </div>
        )}

        <MonacoEditor
          height="100%"
          language={monacoLang}
          value={value}
          onChange={handleEditorChange}
          theme="light"
          onMount={handleEditorMount}
          loading={null}
          options={{
            fontSize: fontSize,
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Consolas, monospace",
            fontLigatures: true,
            parameterHints: { enabled: true },
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            minimap: { enabled: true, maxColumn: 80 },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorStyle: 'block',
            smoothScrolling: true,
            useTabStops: true,
            contextmenu: true,
            copyWithSyntaxHighlighting: true,
            dragAndDrop: true,
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            selectionHighlight: true,
            occurrencesHighlight: 'multiFile',
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
          }}
          defaultLanguage={monacoLang}
        />
      </div>
    </div>
  );
}
