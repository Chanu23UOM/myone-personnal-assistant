"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskStatus } from "@/types/db";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [semesterWeek, setSemesterWeek] = useState("");
  const [priority, setPriority] = useState("normal");
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadTasks = async (week?: string) => {
    const params = new URLSearchParams();
    if (week && week !== "all") params.set("week", week);
    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) setTasks(await res.json());
  };

  useEffect(() => {
    loadTasks(weekFilter);
  }, [weekFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    for (const task of tasks) {
      const key = task.deadline ? new Date(task.deadline).toDateString() : "No deadline";
      groups[key] = groups[key] ?? [];
      groups[key].push(task);
    }
    return groups;
  }, [tasks]);

  const toggleDone = async (task: Task) => {
    const status: TaskStatus = task.status === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadTasks(weekFilter);
  };

  const createTask = async () => {
    if (!title.trim()) return;
    setCreating(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        semester_week: semesterWeek ? Number(semesterWeek) : undefined,
        priority,
        sync_to_calendar: syncToCalendar && !!deadline,
      }),
    });
    setCreating(false);
    setTitle("");
    setDeadline("");
    setSemesterWeek("");
    loadTasks(weekFilter);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Select value={weekFilter} onValueChange={(v) => setWeekFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => (
              <SelectItem key={w} value={String(w)}>
                Week {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Add task</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finish assignment" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-deadline">Deadline</Label>
            <Input id="task-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-week">Semester week</Label>
            <Input id="task-week" type="number" min={1} value={semesterWeek} onChange={(e) => setSemesterWeek(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={priority} onValueChange={(v) => setPriority(v ?? "normal")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={syncToCalendar} onCheckedChange={(v) => setSyncToCalendar(v === true)} />
            Sync deadline to Calendar
          </label>
          <Button onClick={createTask} disabled={creating || !title.trim()}>
            {creating ? "Adding…" : "Add task"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([group, groupTasks]) => (
          <div key={group}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{group}</h3>
            <div className="space-y-1">
              {groupTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                  <Checkbox checked={task.status === "done"} onCheckedChange={() => toggleDone(task)} />
                  <div className="flex-1">
                    <p className={task.status === "done" ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </p>
                    {task.semester_week ? (
                      <p className="text-xs text-muted-foreground">Week {task.semester_week}</p>
                    ) : null}
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{task.priority}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks yet.</p> : null}
      </div>
    </div>
  );
}
