'use client';

import { useEffect, useState } from 'react';
import './lexical-styles.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  EditorState,
  $isParagraphNode,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  ListNode,
  ListItemNode,
} from '@lexical/list';
import { $createLinkNode, LinkNode } from '@lexical/link';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

interface LexicalWrapperProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const theme = {
  paragraph: 'lexical-paragraph',
  heading: {
    h1: 'lexical-heading-h1',
    h2: 'lexical-heading-h2',
    h3: 'lexical-heading-h3',
    h4: 'lexical-heading-h4',
  },
  list: {
    nested: {
      listitem: 'lexical-nested-listitem',
    },
    ol: 'lexical-list-ol',
    ul: 'lexical-list-ul',
    listitem: 'lexical-listitem',
  },
  link: 'lexical-link',
  table: 'lexical-table',
  tableCell: 'lexical-table-cell',
  tableRow: 'lexical-table-row',
  quote: 'lexical-quote',
  text: {
    bold: 'lexical-text-bold',
    italic: 'lexical-text-italic',
    underline: 'lexical-text-underline',
    strikethrough: 'lexical-text-strikethrough',
  },
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));
          setIsStrikethrough(selection.hasFormat('strikethrough'));
        }
      });
    });
  }, [editor]);

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (tag: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isParagraphNode(node)) {
            const headingNode = $createHeadingNode(tag);
            const children = node.getChildren();
            headingNode.append(...children);
            node.replace(headingNode);
          }
        });
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isParagraphNode(node)) {
            const quoteNode = $createQuoteNode();
            const children = node.getChildren();
            quoteNode.append(...children);
            node.replace(quoteNode);
          }
        });
      }
    });
  };

  const insertList = (type: 'bullet' | 'number') => {
    if (type === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const selectedNodes = selection.getNodes();
          if (selectedNodes.length > 0) {
            const linkNode = $createLinkNode(url);
            selectedNodes.forEach((node) => {
              if ($isTextNode(node)) {
                linkNode.append(node);
              }
            });
            selection.insertNodes([linkNode]);
          }
        }
      });
    }
  };

  const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: '3',
      rows: '3',
      includeHeaders: false,
    });
  };

  const alignText = (alignment: 'left' | 'center' | 'right') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isParagraphNode(node)) {
            node.setFormat(alignment);
          }
        });
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-md">
      <div className="flex gap-1 border-r pr-2 mr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          className={isBold ? 'bg-gray-200' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          className={isItalic ? 'bg-gray-200' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          className={isUnderline ? 'bg-gray-200' : ''}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('strikethrough')}
          className={isStrikethrough ? 'bg-gray-200' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 border-r pr-2 mr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatHeading('h1')}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatHeading('h2')}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatHeading('h3')}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 border-r pr-2 mr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList('bullet')}
          title="Bullet List"
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertList('number')}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatQuote}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 border-r pr-2 mr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertTable}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 border-r pr-2 mr-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('left')}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('center')}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => alignText('right')}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function OnChangePluginHandler({ onChange }: { onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      onChange={(editorState: EditorState) => {
        editorState.read(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        });
      }}
    />
  );
}

function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && value && value.trim() !== '') {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(value, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
      setHasInitialized(true);
    }
  }, [editor, value, hasInitialized]);

  return null;
}

export function LexicalWrapper({
  value,
  onChange,
  placeholder = 'Enter memo content...',
  disabled = false,
}: LexicalWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initialConfig = {
    namespace: 'MemoEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical editor error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      TableCellNode,
      TableNode,
      TableRowNode,
    ],
    editable: !disabled,
  };

  if (!isMounted) {
    return (
      <div className="border rounded-md p-4 min-h-[300px] flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="lexical-editor-wrapper border rounded-md overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          {value && <InitialValuePlugin value={value} />}
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[300px] p-4 outline-none prose max-w-none" />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <OnChangePluginHandler onChange={onChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

