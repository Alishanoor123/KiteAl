import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Clock,
  Trash2,
  ChevronRight,
  Sparkles,
  X,
  FileText,
  Smile,
  Zap,
  Flame,
  Compass,
  Plus,
  PanelLeftClose,
  PanelLeft,
  MessageSquare
} from 'lucide-react';
import { JournalEntry, EntryMood } from '../types';
import { DeleteModal } from './DeleteModal';

interface SidebarProps {
  entries: JournalEntry[];
  currentEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onNewEntry: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const MOOD_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; badge: string }
> = {
  Focused: {
    label: 'Focused',
    emoji: '🎯',
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  },
  Reflective: {
    label: 'Reflective',
    emoji: '🌙',
    color: 'text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  },
  Anxious: {
    label: 'Anxious',
    emoji: '🌧️',
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
  },
  Creative: {
    label: 'Creative',
    emoji: '💡',
    color: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  },
  Happy: {
    label: 'Happy',
    emoji: '😊',
    color: 'text-[#E5A862]',
    badge: 'bg-[#E5A862]/15 text-[#E5A862] border-[#E5A862]/30',
  },
  Reflected: {
    label: 'Reflective',
    emoji: '🌙',
    color: 'text-[#7EB894]',
    badge: 'bg-[#7EB894]/15 text-[#7EB894] border-[#7EB894]/30',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  currentEntryId,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  // Filter entries based on search query
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = entry.title?.toLowerCase().includes(q);
    const matchesPreview = entry.previewText?.toLowerCase().includes(q);
    const matchesMood = entry.mood?.toLowerCase().includes(q);
    const matchesMessages = entry.messages?.some((m) =>
      m.content.toLowerCase().includes(q)
    );
    return matchesTitle || matchesPreview || matchesMood || matchesMessages;
  });

  // Group entries by date
  const groupEntriesByTime = (list: JournalEntry[]) => {
    const today: JournalEntry[] = [];
    const yesterday: JournalEntry[] = [];
    const thisWeek: JournalEntry[] = [];
    const older: JournalEntry[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 86400000 * 7;

    list.forEach((entry) => {
      const time = entry.updatedAt || entry.createdAt || 0;
      if (time >= todayStart) {
        today.push(entry);
      } else if (time >= yesterdayStart) {
        yesterday.push(entry);
      } else if (time >= weekStart) {
        thisWeek.push(entry);
      } else {
        older.push(entry);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'Previous 7 Days', items: thisWeek },
      { label: 'Older History', items: older },
    ].filter((group) => group.items.length > 0);
  };

  const grouped = groupEntriesByTime(filteredEntries);

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop for small screens */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
      />

      <aside
        id="journal-sidebar"
        className="fixed md:relative inset-y-0 left-0 z-40 w-72 sm:w-80 h-full shrink-0 bg-[#221A1A] border-r border-[#3D3030] flex flex-col transition-all duration-200 ease-in-out shadow-2xl md:shadow-none select-none overflow-hidden"
      >
        {/* Top Header & New Button */}
        <div className="p-3.5 border-b border-[#3D3030] flex flex-col gap-3 bg-[#261E1E] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                id="btn-sidebar-toggle-header"
                onClick={onClose}
                className="p-1 rounded-lg text-[#C7BCB8] hover:text-[#F5EFEB] hover:bg-[#2A2121] transition-colors cursor-pointer border border-[#3D3030] hover:border-[#D0888F]/40 flex items-center justify-center"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5 text-[#D0888F]" />
              </button>
              <BookOpen className="w-4 h-4 text-[#D0888F]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#C7BCB8]">
                Reflections
              </h2>
            </div>

            <span className="text-[10px] bg-[#D0888F]/10 text-[#D0888F] border border-[#D0888F]/20 px-2 py-0.5 rounded-full font-mono font-medium">
              {entries.length}
            </span>
          </div>

          <button
            id="btn-sidebar-new-reflection"
            onClick={() => {
              onNewEntry();
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#2A2121] hover:bg-[#332929] border border-[#3D3030] hover:border-[#D0888F]/50 text-xs font-semibold text-[#F5EFEB] rounded-xl transition-all shadow-xs cursor-pointer group"
          >
            <Plus className="w-3.5 h-3.5 text-[#D0888F] group-hover:rotate-90 transition-transform duration-200" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-3.5 py-2.5 border-b border-[#3D3030] bg-[#221A1A] shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8F827E]" />
            <input
              id="input-search-history"
              type="text"
              placeholder="Search reflections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-7 py-1.5 text-xs bg-[#2A2121] border border-[#3D3030] rounded-xl text-[#F5EFEB] placeholder:text-[#8F827E] focus:outline-none focus:border-[#D0888F] focus:ring-2 focus:ring-[#D0888F]/15 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8F827E] hover:text-[#F5EFEB] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Fixed, Independent Scrollable Entry List Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-10 h-10 rounded-xl bg-[#D0888F]/10 border border-[#D0888F]/20 text-[#D0888F] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[#F5EFEB]">No reflections yet</p>
              <p className="text-[11px] text-[#8F827E] mt-1 mb-4 leading-relaxed">
                Start your first guided journaling entry with Gemini.
              </p>
              <button
                onClick={onNewEntry}
                className="px-4 py-1.5 bg-[#D0888F] hover:bg-[#C47B82] text-[#1A1414] rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Start Reflection
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-[#8F827E]">
              No reflections match "{searchQuery}"
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F827E] flex items-center justify-between">
                  <span>{group.label}</span>
                  <span className="text-[9px] font-mono opacity-80">{group.items.length}</span>
                </div>

                <div className="space-y-1">
                  {group.items.map((entry) => {
                    const isSelected = entry.id === currentEntryId;
                    const turnsCount = entry.messages?.length || 0;
                    const hasGeminiResponse = entry.messages?.some(
                      (m) => m.role === 'assistant'
                    );

                    return (
                      <div
                        key={entry.id}
                        className={`group relative rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-[#2A2121] border-[#D0888F]/50 shadow-sm'
                            : 'bg-[#261E1E]/50 hover:bg-[#2A2121] border-transparent hover:border-[#3D3030]'
                        }`}
                      >
                        <button
                          onClick={() => {
                            onSelectEntry(entry);
                            if (window.innerWidth < 768) {
                              onClose();
                            }
                          }}
                          className="w-full text-left p-2.5 sm:p-3 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <MessageSquare
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-[#D0888F]' : 'text-[#8F827E] group-hover:text-[#C7BCB8]'
                                }`}
                              />
                              <h3
                                className={`text-xs truncate ${
                                  isSelected ? 'text-[#F5EFEB] font-bold' : 'text-[#C7BCB8] group-hover:text-[#F5EFEB] font-medium'
                                }`}
                              >
                                {entry.title || 'Untitled Reflection'}
                              </h3>
                            </div>

                            <ChevronRight
                              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                isSelected
                                  ? 'text-[#D0888F] translate-x-0.5'
                                  : 'text-[#8F827E] opacity-0 group-hover:opacity-100'
                              }`}
                            />
                          </div>

                          {entry.previewText && (
                            <p className="text-[11px] line-clamp-2 mb-2 leading-relaxed text-[#8F827E] group-hover:text-[#C7BCB8] break-words">
                              {entry.previewText}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-1">
                            <span className="flex items-center gap-1 text-[#8F827E] font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDate(entry.updatedAt || entry.createdAt)}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {entry.mood && MOOD_CONFIG[entry.mood] && (
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border ${
                                    MOOD_CONFIG[entry.mood].badge
                                  }`}
                                  title={`Mood: ${MOOD_CONFIG[entry.mood].label}`}
                                >
                                  <span>{MOOD_CONFIG[entry.mood].emoji}</span>
                                  <span>{MOOD_CONFIG[entry.mood].label}</span>
                                </span>
                              )}

                              {hasGeminiResponse && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-[#D0888F]/10 text-[#D0888F] border border-[#D0888F]/20 font-mono">
                                  <Sparkles className="w-2.5 h-2.5 text-[#D0888F]" />
                                  <span>{turnsCount}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Delete action */}
                        <div className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#221A1A]/95 backdrop-blur-xs p-0.5 rounded-lg border border-[#3D3030]">
                          <button
                            id={`btn-delete-entry-${entry.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEntryToDelete(entry);
                            }}
                            title="Delete reflection"
                            className="p-1 rounded-md transition-colors cursor-pointer hover:bg-rose-500/20 text-[#8F827E] hover:text-[#D0888F]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t border-[#3D3030] text-[11px] text-[#8F827E] flex items-center justify-between bg-[#261E1E] shrink-0">
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Encrypted Firestore</span>
          </span>
          <span className="text-[10px] text-[#D0888F] bg-[#D0888F]/10 border border-[#D0888F]/20 px-2 py-0.5 rounded font-mono font-medium">
            Active
          </span>
        </div>
      </aside>

      {/* In-App Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!entryToDelete}
        title="Delete Reflection"
        itemTitle={entryToDelete?.title || 'Untitled Reflection'}
        onConfirm={() => {
          if (entryToDelete) {
            onDeleteEntry(entryToDelete.id);
            setEntryToDelete(null);
          }
        }}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
};
