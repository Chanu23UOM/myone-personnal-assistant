"use client";

import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CalendarPage() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async (start: Date, end: Date) => {
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    const res = await fetch(`/api/calendar/events?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setEvents(
      data.map((event: { id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }) => ({
        id: event.id,
        title: event.summary ?? "(untitled)",
        start: event.start?.dateTime ?? event.start?.date,
        end: event.end?.dateTime ?? event.end?.date,
      }))
    );
  }, []);

  const handleDatesSet = (arg: DatesSetArg) => {
    loadEvents(arg.start, arg.end);
  };

  const handleDateClick = (arg: DateClickArg) => {
    setDraftStart(arg.dateStr);
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !draftStart) return;
    setSaving(true);
    const start = new Date(draftStart);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const res = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        start: start.toISOString(),
        end: end.toISOString(),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setDialogOpen(false);
      loadEvents(
        new Date(start.getFullYear(), start.getMonth(), 1),
        new Date(start.getFullYear(), start.getMonth() + 1, 1)
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Synced with your Google Calendar. Click a day to quick-add an event.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          events={events}
          datesSet={handleDatesSet}
          dateClick={handleDateClick}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add event — {draftStart}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Study session"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Add to calendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
