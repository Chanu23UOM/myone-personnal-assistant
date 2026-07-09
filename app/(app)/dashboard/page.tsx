"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Newspaper, TrendingUp, Calendar as CalendarIcon, Plus } from "lucide-react";
import type { AiSuggestion, IdeasPayload, NewsPayload, ProgressPayload, Task } from "@/types/db";

interface CalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export default function DashboardPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [idea, setIdea] = useState<AiSuggestion<IdeasPayload> | null>(null);
  const [news, setNews] = useState<AiSuggestion<NewsPayload> | null>(null);
  const [progress, setProgress] = useState<AiSuggestion<ProgressPayload> | null>(null);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const [quickAddMode, setQuickAddMode] = useState<"task" | "note">("task");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  const loadToday = async () => {
    const today = new Date();
    const params = new URLSearchParams({
      start: startOfDay(today).toISOString(),
      end: endOfDay(today).toISOString(),
    });
    const [eventsRes, tasksRes] = await Promise.all([
      fetch(`/api/calendar/events?${params.toString()}`),
      fetch("/api/tasks"),
    ]);
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (tasksRes.ok) {
      const allTasks: Task[] = await tasksRes.json();
      const todayKey = startOfDay(today).toDateString();
      setTasks(allTasks.filter((t) => t.deadline && new Date(t.deadline).toDateString() === todayKey));
    }
  };

  const loadSuggestions = async () => {
    const [ideaRes, newsRes, progressRes] = await Promise.all([
      fetch("/api/ai/suggestions?type=idea"),
      fetch("/api/ai/suggestions?type=news"),
      fetch("/api/ai/suggestions?type=progress"),
    ]);
    if (ideaRes.ok) setIdea(await ideaRes.json());
    if (newsRes.ok) setNews(await newsRes.json());
    if (progressRes.ok) setProgress(await progressRes.json());
  };

  useEffect(() => {
    loadToday();
    loadSuggestions();
  }, []);

  const toggleTaskDone = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: task.status === "done" ? "todo" : "done" }),
    });
    loadToday();
  };

  const generateIdea = async () => {
    setLoadingIdea(true);
    const res = await fetch("/api/ai/ideas", { method: "POST" });
    setLoadingIdea(false);
    if (res.ok) setIdea(await res.json());
  };

  const generateNews = async () => {
    setLoadingNews(true);
    const res = await fetch("/api/ai/news", { method: "POST" });
    setLoadingNews(false);
    if (res.ok) setNews(await res.json());
  };

  const generateProgress = async () => {
    setLoadingProgress(true);
    const res = await fetch("/api/ai/progress", { method: "POST" });
    setLoadingProgress(false);
    if (res.ok) setProgress(await res.json());
  };

  const submitQuickAdd = async () => {
    if (!quickAddTitle.trim()) return;
    setQuickAddSaving(true);
    if (quickAddMode === "task") {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quickAddTitle }),
      });
      loadToday();
    } else {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickAddTitle, content: "" }),
      });
    }
    setQuickAddSaving(false);
    setQuickAddTitle("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your day, at a glance.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <Tabs value={quickAddMode} onValueChange={(v) => setQuickAddMode((v as "task" | "note") ?? "task")}>
            <TabsList>
              <TabsTrigger value="task">Task</TabsTrigger>
              <TabsTrigger value="note">Note</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            placeholder={quickAddMode === "task" ? "Quick-add a task…" : "Quick-add a note title…"}
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && submitQuickAdd()}
          />
          <Button onClick={submitQuickAdd} disabled={quickAddSaving || !quickAddTitle.trim()}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Today
            </CardTitle>
            <CardDescription>Calendar events and tasks due today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Events</p>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing on your calendar today.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {events.map((e) => (
                    <li key={e.id}>{e.summary ?? "(untitled)"}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Tasks</p>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing due today.</p>
              ) : (
                <ul className="space-y-1">
                  {tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={t.status === "done"} onCheckedChange={() => toggleTaskDone(t)} />
                      <span className={t.status === "done" ? "line-through text-muted-foreground" : ""}>
                        {t.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Link href="/calendar" className="text-xs text-muted-foreground underline underline-offset-2">
              Open calendar →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Morning briefing
            </CardTitle>
            <CardDescription>AI-suggested focus for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {idea?.payload?.ideas?.length ? (
              <ul className="space-y-2 text-sm">
                {idea.payload.ideas.map((i, index) => (
                  <li key={index}>
                    <span className="font-medium">{i.idea}</span>
                    <p className="text-muted-foreground">{i.why}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No briefing generated yet.</p>
            )}
            <Button size="sm" variant="outline" onClick={generateIdea} disabled={loadingIdea}>
              {loadingIdea ? "Thinking…" : "Generate today's idea"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              News digest
            </CardTitle>
            <CardDescription>Ranked from real headlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {news?.payload?.items?.length ? (
              <ul className="space-y-2 text-sm">
                {news.payload.items.map((item, index) => (
                  <li key={index}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
                      {item.title}
                    </a>
                    <p className="text-muted-foreground">{item.summary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No digest generated yet.</p>
            )}
            <Button size="sm" variant="outline" onClick={generateNews} disabled={loadingNews}>
              {loadingNews ? "Fetching…" : "Generate news digest"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress
            </CardTitle>
            <CardDescription>Last 7 days of tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {progress?.payload?.summary ? (
              <div className="space-y-2 text-sm">
                <p>{progress.payload.summary}</p>
                {progress.payload.whats_behind?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Behind on</p>
                    <ul className="list-inside list-disc">
                      {progress.payload.whats_behind.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No analysis generated yet.</p>
            )}
            <Button size="sm" variant="outline" onClick={generateProgress} disabled={loadingProgress}>
              {loadingProgress ? "Analyzing…" : "Analyze progress"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
