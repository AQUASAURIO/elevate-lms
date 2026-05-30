'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Toolbar } from './toolbar';
import { cn } from '@/lib/utils';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Start writing your response...',
  editable = true,
  className,
  minHeight = '300px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800/60 px-1 rounded',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80',
        },
      }),
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[inherit]',
      },
    },
    immediatelyRender: false,
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleEditorFocus = useCallback(() => {
    const container = document.getElementById('editor-container');
    container?.classList.add('ring-2', 'ring-ring/20');
  }, []);

  const handleEditorBlur = useCallback(() => {
    const container = document.getElementById('editor-container');
    container?.classList.remove('ring-2', 'ring-ring/20');
  }, []);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Toolbar */}
      <div className="rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <Toolbar editor={editor} />
      </div>

      {/* Editor area */}
      <div
        id="editor-container"
        className="rounded-xl border bg-white dark:bg-card shadow-sm transition-all duration-200"
        style={{ minHeight }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-6 sm:py-8">
          {editor ? (
            <EditorContent
              editor={editor}
              onFocus={handleEditorFocus}
              onBlur={handleEditorBlur}
            />
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          )}
        </div>
      </div>

      {/* TipTap CSS overrides for placeholder and content styling */}
      <style jsx global>{`
        /* Placeholder styling */
        .tiptap p.is-editor-empty:first-child::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        /* Prose-like content styling */
        .tiptap h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.2;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .tiptap h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .tiptap p {
          margin-bottom: 0.75rem;
          line-height: 1.7;
        }

        .tiptap ul,
        .tiptap ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .tiptap ul {
          list-style-type: disc;
        }

        .tiptap ol {
          list-style-type: decimal;
        }

        .tiptap li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }

        .tiptap a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .tiptap a:hover {
          opacity: 0.8;
        }

        .tiptap mark {
          background-color: #fef08a;
          border-radius: 2px;
          padding: 0 2px;
        }

        :is(.dark .tiptap mark) {
          background-color: rgba(202, 138, 4, 0.3);
        }

        /* Table styling */
        .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .tiptap th,
        .tiptap td {
          min-width: 100px;
          border: 1px solid var(--border);
          padding: 8px 12px;
          position: relative;
          text-align: left;
        }

        .tiptap th {
          background-color: var(--muted);
          font-weight: 600;
        }

        .tiptap td {
          background-color: transparent;
        }

        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* Selected cell highlight */
        .tiptap .selectedCell::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
