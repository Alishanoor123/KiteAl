import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Loader2,
  Copy,
  Check,
  Download,
  Brain,
  ListTodo,
  FileText,
  HelpCircle,
  Lightbulb,
  Edit3,
  Smile,
  Zap,
  Flame,
  Compass,
  AlertCircle,
  User as UserIcon,
  ChevronDown,
  PanelLeft,
  Trash2,
} from 'lucide-react';
import { JournalEntry, JournalMessage, ReflectionMode, EntryMood } from '../types';
import { DeleteModal } from './DeleteModal';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onDeleteCurrentEntry?: () => void;
  isSaving: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const MODES: {
  id: ReflectionMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  {
    id: 'reflect',
    label: 'Reflect',
    icon: Brain,
    desc: 'Thoughtful empathetic commentary & deeper perspective',
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: FileText,
    desc: 'Structured executive recap & recurring core themes',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm',
    icon: Lightbulb,
    desc: 'Creative angles, lateral opportunities & breakthroughs',
  },
  {
    id: 'action_items',
    label: 'Action Plan',
    icon: ListTodo,
    desc: 'Concrete prioritized next steps & 48-hour initiatives',
  },
  {
    id: 'deep_inquiry',
    label: 'Inquiry',
    icon: HelpCircle,
    desc: 'Probing Socratic questions to challenge assumptions',
  },
];

const MOODS: {
  id: EntryMood;
  label: string;
  emoji: string;
  color: string;
  activeClass: string;
}[] = [
  {
    id: 'Focused',
    label: 'Focused',
    emoji: '🎯',
    color: 'text-amber-400',
    activeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-semibold',
  },
  {
    id: 'Reflective',
    label: 'Reflective',
    emoji: '🌙',
    color: 'text-indigo-400',
    activeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40 font-semibold',
  },
  {
    id: 'Anxious',
    label: 'Anxious',
    emoji: '🌧️',
    color: 'text-purple-400',
    activeClass: 'bg-purple-500/20 text-purple-200 border-purple-400/40 font-semibold',
  },
  {
    id: 'Creative',
    label: 'Creative',
    emoji: '💡',
    color: 'text-rose-400',
    activeClass: 'bg-rose-500/20 text-rose-200 border-rose-400/40 font-semibold',
  },
];

const PROMPT_STARTERS = [
  {
    title: 'Key Decision & Uncertainty',
    prompt:
      'Today I am navigating an important decision regarding my goals. Here is what is on the line and what is making me hesitate:',
  },
  {
    title: 'Unfiltered Mental Stream',
    prompt:
      'Here is an unfiltered stream of thoughts and tensions that have been occupying my focus throughout the day:',
  },
  {
    title: 'Challenge & Lateral Angles',
    prompt:
      'I am facing a complex challenge and looking for fresh lateral angles, blind spots, or alternative paths forward:',
  },
  {
    title: 'Weekly Clarity & Breakthrough',
    prompt:
      'Reflecting on a recent breakthrough or moment of clarity this week, and what it teaches me about how I work:',
  },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onDeleteCurrentEntry,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflect');
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [title, setTitle] = useState(entry.title || 'Untitled Reflection');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeModelName, setActiveModelName] = useState<string>('gemini-3.7-flash');
  const [isLensDropdownOpen, setIsLensDropdownOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lensDropdownRef = useRef<HTMLDivElement>(null);

  // Sync title when entry changes
  useEffect(() => {
    setTitle(entry.title || 'Untitled Reflection');
  }, [entry.id, entry.title]);

  // Clean up any ongoing fetch on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Close lens dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        lensDropdownRef.current &&
        !lensDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLensDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom of message stream smoothly when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages?.length, isGenerating]);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    const clean = title.trim() || 'Untitled Reflection';
    setTitle(clean);
    if (clean !== entry.title) {
      onUpdateEntry({
        ...entry,
        title: clean,
        updatedAt: Date.now(),
      });
    }
  };

  const handleMoodSelect = (mood: EntryMood) => {
    const newMood = entry.mood === mood ? undefined : mood;
    onUpdateEntry({
      ...entry,
      mood: newMood,
      updatedAt: Date.now(),
    });
  };

  const handleClearMood = () => {
    onUpdateEntry({
      ...entry,
      mood: undefined,
      updatedAt: Date.now(),
    });
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend || !textToSend.trim() || isGenerating) return;

    setErrorMessage(null);
    const userMsg: JournalMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
      mode: selectedMode,
    };

    const newMessages = [...(entry.messages || []), userMsg];

    // Optimistically update entry state with user message
    const updatedEntry: JournalEntry = {
      ...entry,
      messages: newMessages,
      updatedAt: Date.now(),
    };
    onUpdateEntry(updatedEntry);
    setInputText('');
    setIsGenerating(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 35000);

    try {
      // Prepend the user's prompt sent to Gemini with contextual mood directive if a mood is set
      const formattedForApi = newMessages.map((m, idx) => {
        if (m.role === 'user' && idx === newMessages.length - 1 && entry.mood) {
          return {
            role: m.role,
            content: `User Current Mood: ${entry.mood}. Adjust tone to match.\n\n${m.content}`,
          };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: formattedForApi,
          mode: selectedMode,
          mood: entry.mood,
          title: entry.title,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with error status ${response.status}`);
      }

      const data = await response.json();
      const modelUsed = data.modelUsed || 'gemini-3.7-flash';
      setActiveModelName(modelUsed);

      const assistantMsg: JournalMessage = {
        id: 'msg-' + (Date.now() + 1) + '-' + Math.random().toString(36).substr(2, 4),
        role: 'assistant',
        content: data.text || 'Reflection could not be generated at this time.',
        timestamp: Date.now(),
        mode: selectedMode,
        modelUsed,
      };

      const finalMessages = [...newMessages, assistantMsg];
      const newTitle = data.suggestedTitle || entry.title || 'Untitled Reflection';

      if (data.suggestedTitle) {
        setTitle(data.suggestedTitle);
      }

      onUpdateEntry({
        ...entry,
        title: newTitle,
        messages: finalMessages,
        updatedAt: Date.now(),
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error generating reflection:', err);
      if (err.name === 'AbortError') {
        setErrorMessage('The request timed out. Please check your connection and try again.');
      } else {
        setErrorMessage(
          err.message || 'Failed to synthesize reflection. Please try again.'
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyAll = async () => {
    const threadText =
      `# ${entry.title || 'Journal Reflection'}\n\n` +
      (entry.messages || [])
        .map(
          (m) =>
            `### ${m.role === 'user' ? 'Author' : 'Gemini AI'}\n${m.content}\n`
        )
        .join('\n---\n\n');

    try {
      await navigator.clipboard.writeText(threadText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy thread:', err);
    }
  };

  const handleExportMarkdown = () => {
    const threadText =
      `# ${entry.title || 'Journal Reflection'}\n` +
      `Date: ${new Date(entry.createdAt).toISOString()}\n` +
      (entry.mood ? `Mood: ${entry.mood}\n` : '') +
      `\n---\n\n` +
      (entry.messages || [])
        .map(
          (m) =>
            `## ${m.role === 'user' ? 'User Reflection' : 'Gemini Synthesis'}\n*${new Date(
              m.timestamp
            ).toLocaleTimeString()}*\n\n${m.content}\n`
        )
        .join('\n---\n\n');

    const blob = new Blob([threadText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').replace(/\s+/g, '_')}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalWords = (entry.messages || []).reduce((acc, m) => {
    return acc + (m.content ? m.content.trim().split(/\s+/).length : 0);
  }, 0);

  const currentModeObj = MODES.find((m) => m.id === selectedMode) || MODES[0];
  const CurrentModeIcon = currentModeObj.icon;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#1A1414] overflow-hidden w-full">
      {/* 1. Ultra-Clean Single-Row Subheader: Title, Lens Mode, Mood & Actions */}
      <div className="bg-[#221A1A] border-b border-[#3D3030] px-4 sm:px-6 py-2.5 shrink-0 z-20 shadow-xs">
        <div className="flex items-center justify-between gap-4 w-full max-w-6xl mx-auto">
          {/* Left: Title & Word Count with Generous Spacing */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isSidebarOpen && onToggleSidebar && (
              <button
                id="btn-expand-sidebar"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-xl text-[#C7BCB8] hover:text-[#F5EFEB] hover:bg-[#2A2121] transition-colors border border-[#3D3030] cursor-pointer flex items-center justify-center shrink-0"
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <PanelLeft className="w-4 h-4 text-[#D0888F]" />
              </button>
            )}

            {isEditingTitle ? (
              <input
                id="input-edit-reflection-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                autoFocus
                className="text-sm sm:text-base font-bold text-[#F5EFEB] bg-[#2A2121] border border-[#D0888F] rounded-xl px-3 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-[#D0888F]/40"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-2 cursor-pointer hover:bg-[#2A2121] px-2.5 py-1 rounded-xl transition-all min-w-0 border border-transparent hover:border-[#3D3030]"
                title="Click to rename reflection"
              >
                <h1 className="text-sm sm:text-base font-bold text-[#F5EFEB] truncate tracking-tight">
                  {title}
                </h1>
                <Edit3 className="w-3.5 h-3.5 text-[#8F827E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}

            <span className="hidden md:inline-flex text-[11px] font-mono text-[#8F827E] bg-[#2A2121] border border-[#3D3030] px-2 py-0.5 rounded-full shrink-0">
              {totalWords} words
            </span>
          </div>

          {/* Center/Right: Lens Mode Dropdown + Mood Selector + Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Lens Mode Dropdown */}
            <div className="relative" ref={lensDropdownRef}>
              <button
                id="btn-lens-mode-dropdown"
                onClick={() => setIsLensDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2A2121] hover:bg-[#332929] border border-[#3D3030] text-[#F5EFEB] transition-all cursor-pointer shadow-xs"
                title="Change AI Inquiry Lens"
              >
                <CurrentModeIcon className="w-3.5 h-3.5 text-[#D0888F]" />
                <span className="hidden sm:inline">{currentModeObj.label}</span>
                <ChevronDown className="w-3 h-3 text-[#8F827E]" />
              </button>

              {isLensDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#221A1A] border border-[#3D3030] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F827E]">
                    Inquiry Lens
                  </div>
                  {MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          setIsLensDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#D0888F]/15 text-[#D0888F] font-bold'
                            : 'text-[#C7BCB8] hover:bg-[#2A2121] hover:text-[#F5EFEB]'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-[#D0888F] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold">{mode.label}</div>
                          <div className="text-[10px] text-[#8F827E] line-clamp-1">
                            {mode.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current Mood Display if set */}
            {entry.mood && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2A2121] border border-[#3D3030] text-xs">
                <span className="text-[11px] text-[#8F827E]">Mood:</span>
                <span className="text-xs">{MOODS.find((m) => m.id === entry.mood)?.emoji || '🎯'}</span>
                <span className="text-[#F5EFEB] font-medium text-[11px]">{entry.mood}</span>
              </div>
            )}

            <div className="h-4 w-px bg-[#3D3030]" />

            {/* Quick Actions (Copy & Export & Delete) */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-copy-entry"
                onClick={handleCopyAll}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#3D3030] bg-[#2A2121] hover:bg-[#332929] hover:border-[#D0888F]/40 text-[#C7BCB8] hover:text-[#F5EFEB] text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Copy entire conversation thread"
              >
                {copiedAll ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#D0888F]" />
                )}
                <span className="hidden xl:inline">
                  {copiedAll ? 'Copied' : 'Copy'}
                </span>
              </button>

              <button
                id="btn-export-markdown"
                onClick={handleExportMarkdown}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#3D3030] bg-[#2A2121] hover:bg-[#332929] hover:border-[#D0888F]/40 text-[#C7BCB8] hover:text-[#F5EFEB] text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Export as Markdown document"
              >
                <Download className="w-3.5 h-3.5 text-[#D0888F]" />
                <span className="hidden xl:inline">Export</span>
              </button>

              {onDeleteCurrentEntry && (
                <button
                  id="btn-delete-current-entry"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#3D3030] bg-[#2A2121] hover:bg-rose-500/10 hover:border-rose-500/30 text-[#C7BCB8] hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="Delete this reflection"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FULL-HEIGHT, INDEPENDENTLY SCROLLING MAIN CHAT PANEL (80%+ Screen Real Estate) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 space-y-6 bg-[#1A1414]">
        {/* Empty State with Starters */}
        {(!entry.messages || entry.messages.length === 0) && (
          <div className="max-w-3xl mx-auto py-8 sm:py-12 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-[#D0888F]/10 border border-[#D0888F]/25 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Brain className="w-7 h-7 text-[#D0888F]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5EFEB] mb-2 tracking-tight">
              Begin Your Executive Reflection
            </h2>
            <p className="text-xs sm:text-sm text-[#C7BCB8] max-w-lg mx-auto mb-6 leading-relaxed">
              Write freely. Gemini will distill your thoughts, challenge unexamined assumptions, and help bring structural clarity to your mind.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
              {PROMPT_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(starter.prompt)}
                  className="p-3.5 rounded-xl bg-[#221A1A] border border-[#3D3030] hover:border-[#D0888F]/50 hover:bg-[#2A2121] text-left transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-[#D0888F] mb-1 group-hover:text-[#E3A8AF]">
                    {starter.title}
                  </span>
                  <p className="text-xs text-[#C7BCB8] group-hover:text-[#F5EFEB] line-clamp-2 leading-relaxed">
                    "{starter.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-6">
          {entry.messages?.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? 'items-end' : 'items-start'
                } animate-fade-in w-full`}
              >
                {/* Author Bar */}
                <div className="flex items-center justify-between w-full mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    {isUser ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#3D3030] text-[#C7BCB8] flex items-center justify-center text-[10px] font-bold">
                          <UserIcon className="w-3 h-3 text-[#C7BCB8]" />
                        </div>
                        <span className="text-xs font-bold text-[#F5EFEB]">You</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#D0888F] via-[#C47B82] to-[#E5A862] p-0.5 flex items-center justify-center shadow-xs">
                          <Sparkles className="w-3 h-3 text-[#1A1414]" />
                        </div>
                        <span className="text-xs font-bold text-[#D0888F]">
                          Gemini Reflection
                        </span>
                        <span className="text-[10px] font-mono text-[#8F827E] bg-[#221A1A] border border-[#3D3030] px-1.5 py-0.2 rounded-md hidden xs:inline font-medium">
                          {msg.modelUsed || 'gemini-3.7-flash'}
                        </span>
                      </div>
                    )}

                    {msg.mode && !isUser && (
                      <span className="text-[10px] px-2 py-0.2 bg-[#D0888F]/10 border border-[#D0888F]/20 text-[#D0888F] rounded-full font-medium">
                        {msg.mode.replace('_', ' ')}
                      </span>
                    )}

                    {entry.mood && isUser && (
                      <span className="text-[10px] px-2 py-0.2 bg-[#2A2121] border border-[#3D3030] text-[#C7BCB8] rounded-full">
                        Mood: {entry.mood}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8F827E] font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="p-1 rounded-md text-[#8F827E] hover:text-[#F5EFEB] hover:bg-[#2A2121] transition-colors cursor-pointer"
                      title="Copy message"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400 font-bold" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Content Bubble - WIDE & HIGH CONTRAST */}
                <div
                  className={`w-full rounded-2xl p-5 sm:p-6 text-[15px] sm:text-[16px] leading-[1.75] break-words shadow-sm ${
                    isUser
                      ? 'bg-[#2A2121] border border-[#3D3030] text-[#F5EFEB] rounded-tr-xs'
                      : 'bg-[#221A1A] border border-[#3D3030] text-[#F5EFEB] rounded-tl-xs shadow-md'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-sans text-[#F5EFEB] break-words">
                      {msg.content}
                    </p>
                  ) : (
                    <div className="prose prose-invert max-w-none text-[#F5EFEB] prose-p:leading-[1.75] prose-p:text-[#F5EFEB] prose-p:my-2.5 prose-headings:text-[#F5EFEB] prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-4 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-strong:text-[#D0888F] prose-strong:font-bold prose-ul:my-2.5 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-li:text-[#F5EFEB] prose-ol:my-2.5 prose-ol:list-decimal prose-ol:pl-5 prose-code:text-[#D0888F] prose-code:bg-[#1A1414] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-blockquote:border-l-3 prose-blockquote:border-[#D0888F] prose-blockquote:bg-[#D0888F]/5 prose-blockquote:pl-4 prose-blockquote:py-1.5 prose-blockquote:my-3 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-[#C7BCB8] break-words">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Generating Indicator */}
          {isGenerating && (
            <div className="flex flex-col items-start animate-fade-in w-full">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#D0888F] via-[#C47B82] to-[#E5A862] p-0.5 flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#1A1414]" />
                </div>
                <span className="text-xs font-bold text-[#D0888F]">Gemini AI</span>
                <span className="text-[10px] px-2 py-0.2 bg-[#D0888F]/10 text-[#D0888F] border border-[#D0888F]/20 rounded-full animate-pulse font-medium">
                  synthesizing reflection...
                </span>
              </div>
              <div className="w-full rounded-2xl rounded-tl-xs p-5 bg-[#221A1A] border border-[#3D3030] shadow-md flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[#D0888F] animate-spin shrink-0" />
                <p className="text-sm text-[#C7BCB8] font-medium">
                  Synthesizing mindful reflection with Gemini 3.7 Flash...
                </p>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-300 hover:text-rose-100 font-bold hover:underline shrink-0 ml-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 3. SLIM, UNCLUTTERED FLOATING PROMPT COMPOSER WITH MOOD SELECTOR */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#221A1A] border-t border-[#3D3030] z-20 shadow-lg">
        <div className="max-w-4xl lg:max-w-5xl mx-auto space-y-2">
          {/* 4 Compact Mood Selector Buttons */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-[#8F827E] font-medium mr-1 select-none">Mood:</span>
              {MOODS.map((m) => {
                const isSelected = entry.mood === m.id;
                return (
                  <button
                    key={m.id}
                    id={`btn-mood-${m.id.toLowerCase()}`}
                    type="button"
                    onClick={() => handleMoodSelect(m.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? m.activeClass
                        : 'bg-[#2A2121] text-[#C7BCB8] border-[#3D3030] hover:border-[#D0888F]/40 hover:text-[#F5EFEB]'
                    }`}
                    title={`Set mood to ${m.label}`}
                  >
                    <span className="text-xs leading-none">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {entry.mood && (
              <button
                id="btn-clear-mood"
                type="button"
                onClick={handleClearMood}
                className="text-[11px] text-[#8F827E] hover:text-[#D0888F] transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-[#2A2121]"
                title="Clear selected mood"
              >
                Clear
              </button>
            )}
          </div>

          {/* Prompt input box */}
          <div className="flex items-center gap-2.5 bg-[#2A2121] border border-[#3D3030] focus-within:border-[#D0888F] focus-within:ring-2 focus-within:ring-[#D0888F]/15 rounded-xl px-3 py-2 transition-all shadow-inner">
            <textarea
              id="input-reflection-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your reflection or thoughts... (Ctrl+Enter to send)"
              rows={1}
              className="flex-1 bg-transparent text-[#F5EFEB] text-sm placeholder:text-[#8F827E] focus:outline-none resize-none leading-normal max-h-32"
            />

            <button
              id="btn-send-reflection"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ${
                inputText.trim() && !isGenerating
                  ? 'bg-[#D0888F] hover:bg-[#C47B82] text-[#1A1414] shadow-md shadow-[#D0888F]/20'
                  : 'bg-[#332929] text-[#8F827E] border border-[#3D3030] cursor-not-allowed opacity-70'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A1414]" />
                  <span className="hidden sm:inline">Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#1A1414]" />
                  <span className="hidden sm:inline">Reflect</span>
                  <Send className="w-3 h-3 ml-0.5 text-[#1A1414]" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Current Reflection Modal */}
      <DeleteModal
        isOpen={isDeleteDialogOpen}
        title="Delete Reflection"
        itemTitle={entry.title || 'Untitled Reflection'}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          if (onDeleteCurrentEntry) {
            onDeleteCurrentEntry();
          }
        }}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
};
