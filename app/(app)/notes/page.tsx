"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, Sparkles } from "lucide-react";

interface NoteMeta {
  id: string;
  name: string;
  modifiedTime: string;
}

interface WorkflowStep {
  title: string;
  detail: string;
  estimate_minutes: number;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [workflow, setWorkflow] = useState<{ title: string; steps: WorkflowStep[] } | null>(null);

  const loadNotes = async () => {
    const res = await fetch("/api/notes");
    if (res.ok) setNotes(await res.json());
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const openNote = async (id: string) => {
    setSelectedId(id);
    setWorkflow(null);
    const res = await fetch(`/api/notes/${id}`);
    if (res.ok) {
      const data = await res.json();
      setName(data.name);
      setContent(data.content ?? "");
    }
  };

  const createNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled note", content: "" }),
    });
    if (res.ok) {
      const data = await res.json();
      await loadNotes();
      openNote(data.id);
    }
  };

  const saveNote = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await fetch(`/api/notes/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, name }),
    });
    setSaving(false);
    if (res.ok) loadNotes();
  };

  const generateWorkflow = async () => {
    if (!selectedId) return;
    setGenerating(true);
    const res = await fetch("/api/ai/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: selectedId }),
    });
    setGenerating(false);
    if (res.ok) {
      const data = await res.json();
      setWorkflow(data);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Notes</h1>
          <Button size="sm" variant="outline" onClick={createNote}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
        <div className="space-y-1">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => openNote(note.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                selectedId === note.id && "bg-muted font-medium"
              )}
            >
              {note.name}
            </button>
          ))}
          {notes.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No notes yet.</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {selectedId ? (
          <>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-lg font-medium" />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Write your note…"
            />
            <div className="flex items-center gap-2">
              <Button onClick={saveNote} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button variant="outline" onClick={generateWorkflow} disabled={generating}>
                <Sparkles className="h-4 w-4" />
                {generating ? "Generating…" : "Generate workflow"}
              </Button>
            </div>

            {workflow ? (
              <div className="rounded-lg border bg-card p-4">
                <h2 className="font-medium">{workflow.title}</h2>
                <ol className="mt-2 space-y-2">
                  {workflow.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" />
                      <span>
                        <span className="font-medium">{step.title}</span>
                        {" — "}
                        {step.detail}{" "}
                        <span className="text-muted-foreground">({step.estimate_minutes} min)</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Select a note or create a new one.</p>
        )}
      </div>
    </div>
  );
}
