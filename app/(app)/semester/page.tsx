"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SemesterNote, Task } from "@/types/db";

export default function SemesterPage() {
  const [week, setWeek] = useState("1");
  const [notes, setNotes] = useState<SemesterNote[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [newDate, setNewDate] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async (w: string) => {
    const [notesRes, tasksRes] = await Promise.all([
      fetch(`/api/semester-notes?week=${w}`),
      fetch(`/api/tasks?week=${w}`),
    ]);
    if (notesRes.ok) setNotes(await notesRes.json());
    if (tasksRes.ok) setTasks(await tasksRes.json());
  };

  useEffect(() => {
    load(week);
    setSelectedDate(null);
  }, [week]);

  const openDate = (date: string) => {
    setSelectedDate(date);
    const existing = notes.find((n) => n.note_date === date);
    setDraftContent(existing?.content ?? "");
  };

  const addDate = () => {
    if (!newDate) return;
    openDate(newDate);
    setNewDate("");
  };

  const saveNote = async () => {
    if (!selectedDate) return;
    setSaving(true);
    await fetch("/api/semester-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note_date: selectedDate,
        semester_week: Number(week),
        content: draftContent,
      }),
    });
    setSaving(false);
    load(week);
  };

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((t) => t.deadline && t.deadline.startsWith(selectedDate));
  }, [tasks, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Semester</h1>
        <Select value={week} onValueChange={(v) => setWeek(v ?? "1")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
              <SelectItem key={w} value={String(w)}>
                Week {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <Button size="sm" onClick={addDate}>
              Open
            </Button>
          </div>
          <div className="space-y-1">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => openDate(note.note_date)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  selectedDate === note.note_date && "bg-muted font-medium"
                )}
              >
                {note.note_date}
              </button>
            ))}
            {notes.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No notes for this week yet.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {selectedDate ? (
            <>
              <div>
                <h2 className="mb-2 text-sm font-medium">{selectedDate}</h2>
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="min-h-[240px]"
                  placeholder="Notes for this day…"
                />
                <Button className="mt-2" onClick={saveNote} disabled={saving}>
                  {saving ? "Saving…" : "Save note"}
                </Button>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Tasks due this day</h3>
                <div className="space-y-1">
                  {tasksForSelectedDate.map((task) => (
                    <div key={task.id} className="rounded-md border bg-card px-3 py-2 text-sm">
                      {task.title}
                    </div>
                  ))}
                  {tasksForSelectedDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing due.</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Pick a date to view or add a note.</p>
          )}
        </div>
      </div>
    </div>
  );
}
