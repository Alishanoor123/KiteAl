import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  logoutUser,
  subscribeToUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from './lib/firebase';
import { JournalEntry, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { JournalEditor } from './components/JournalEditor';
import { AuthScreen } from './components/AuthScreen';
import { Loader2, Sparkles, Plus } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor Firebase Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
        setEntries([]);
        setCurrentEntryId(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore entries for the authenticated user
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (userEntries) => {
        setEntries(userEntries);
        // If no active entry is selected, default to the most recent one
        setCurrentEntryId((prevId) => {
          if (prevId && userEntries.some((e) => e.id === prevId)) {
            return prevId;
          }
          return userEntries.length > 0 ? userEntries[0].id : null;
        });
      },
      (error) => {
        console.error('Failed to subscribe to Firestore entries:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Create a brand new blank journal entry
  const handleNewEntry = useCallback(() => {
    if (!user) return;

    const newId = 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const newEntry: JournalEntry = {
      id: newId,
      userId: user.uid,
      title: 'Untitled Reflection',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistically update
    setEntries((prev) => [newEntry, ...prev]);
    setCurrentEntryId(newId);

    // Save initial document to Firestore
    setIsSaving(true);
    saveJournalEntry(user.uid, newEntry)
      .catch(console.error)
      .finally(() => setIsSaving(false));
  }, [user]);

  // Handle entry update (with autosave to Firestore)
  const handleUpdateEntry = useCallback(
    (updated: JournalEntry) => {
      if (!user) return;

      // Update local state immediately for snappy UI
      setEntries((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
      );

      // Debounced or direct Firestore save
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveJournalEntry(user.uid, updated)
          .catch((err) => console.error('Error saving entry to Firestore:', err))
          .finally(() => setIsSaving(false));
      }, 400);
    },
    [user]
  );

  // Handle deleting an entry
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!user) return;

      try {
        await deleteJournalEntry(user.uid, entryId);
        setEntries((prev) => prev.filter((e) => e.id !== entryId));

        if (currentEntryId === entryId) {
          const remaining = entries.filter((e) => e.id !== entryId);
          if (remaining.length > 0) {
            setCurrentEntryId(remaining[0].id);
          } else {
            handleNewEntry();
          }
        }
      } catch (err) {
        console.error('Failed to delete entry:', err);
      }
    },
    [user, currentEntryId, entries, handleNewEntry]
  );

  const handleContinueAsGuest = useCallback(() => {
    const guestUser: UserProfile = {
      uid: 'guest-' + Date.now(),
      displayName: 'Guest Journaler',
      email: 'guest@local.device',
      photoURL: null,
    };
    setUser(guestUser);
    const initialEntry: JournalEntry = {
      id: 'entry-' + Date.now(),
      userId: guestUser.uid,
      title: 'First Reflection',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setEntries([initialEntry]);
    setCurrentEntryId(initialEntry.id);
  }, []);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Find the currently active entry or generate a temporary container
  const currentEntry: JournalEntry | undefined =
    entries.find((e) => e.id === currentEntryId) ||
    (user
      ? {
          id: currentEntryId || 'temp-id',
          userId: user.uid,
          title: 'Untitled Reflection',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      : undefined);

  if (loadingAuth) {
    return (
      <div className="h-screen w-screen bg-[#1A1414] flex flex-col items-center justify-center p-6 text-[#F5EFEB]">
        <div className="w-12 h-12 rounded-2xl bg-[#221A1A] border border-[#3D3030] flex items-center justify-center mb-4 shadow-xl">
          <Sparkles className="w-6 h-6 text-[#D0888F] animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-medium text-[#C7BCB8]">
          <Loader2 className="w-4 h-4 animate-spin text-[#D0888F]" />
          <span>Connecting to your secure journal partition...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render the landing & auth view
  if (!user) {
    return (
      <AuthScreen
        onAuthSuccess={() => {}}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#1A1414] flex flex-col overflow-hidden selection:bg-[#D0888F] selection:text-[#1A1414]">
      {/* Top Navigation */}
      <Navbar
        user={user}
        isSaving={isSaving}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        totalEntriesCount={entries.length}
      />

      {/* Main Workspace with Fixed Sidebar + Independent Main Chat */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        <Sidebar
          entries={entries}
          currentEntryId={currentEntryId}
          onSelectEntry={(entry) => setCurrentEntryId(entry.id)}
          onDeleteEntry={handleDeleteEntry}
          onNewEntry={handleNewEntry}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#1A1414] overflow-hidden">
          {currentEntry ? (
            <JournalEditor
              key={currentEntry.id}
              entry={currentEntry}
              onUpdateEntry={handleUpdateEntry}
              onDeleteCurrentEntry={() => handleDeleteEntry(currentEntry.id)}
              isSaving={isSaving}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1A1414]">
              <div className="w-14 h-14 rounded-2xl bg-[#221A1A] border border-[#3D3030] flex items-center justify-center mb-4 shadow-xl">
                <Sparkles className="w-7 h-7 text-[#D0888F]" />
              </div>
              <h2 className="text-lg font-bold text-[#F5EFEB] mb-2 tracking-tight">
                No active reflection
              </h2>
              <p className="text-xs text-[#C7BCB8] mb-6 max-w-sm leading-relaxed">
                Create a new reflection entry to begin journaling with Gemini.
              </p>
              <button
                id="btn-create-blank-entry"
                onClick={handleNewEntry}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#D0888F] hover:bg-[#C47B82] text-[#1A1414] font-bold rounded-xl text-xs transition-all shadow-lg shadow-[#D0888F]/25 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Reflection</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
