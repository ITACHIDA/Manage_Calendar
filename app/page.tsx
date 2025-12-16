"use client";

import { useEffect, useMemo, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventContentArg } from '@fullcalendar/core';

type GraphEvent = {
  id: string;
  title: string;
  start?: string;
  end?: string;
  location?: string;
  organizer?: string;
  isCancelled?: boolean;
  webLink?: string;
  description?: string;
};

export default function Page() {
  const { status } = useSession();
  const [events, setEvents] = useState<GraphEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<GraphEvent | null>(null);

  const isAuthed = status === 'authenticated';

  const fetchEvents = async () => {
    if (!isAuthed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/calendar/outlook', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load events');
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) return;
    fetchEvents();
    const onFocus = () => fetchEvents();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  const upcoming = useMemo(() => {
    return events
      .map((e) => ({
        ...e,
        startDate: e.start ? new Date(e.start) : null,
        endDate: e.end ? new Date(e.end) : null,
      }))
      .filter((e): e is GraphEvent & { startDate: Date; endDate: Date | null } => {
        return !!e.startDate && !isNaN(e.startDate.getTime());
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events]);

  const calendarEvents = useMemo(
    () =>
      upcoming.map((evt) => ({
        id: evt.id,
        title: evt.title,
        start: evt.startDate.toISOString(),
        end: evt.endDate ? evt.endDate.toISOString() : undefined,
        color: evt.isCancelled ? '#d1d5db' : '#0f6cbd',
        textColor: evt.isCancelled ? '#4b5563' : '#ffffff',
        extendedProps: {
          location: evt.location,
          organizer: evt.organizer,
          webLink: evt.webLink,
          description: evt.description,
        },
      })),
    [upcoming]
  );

  const formatDateTime = (date: Date | null) => {
    if (!date) return '';
    return `${date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })} - ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  const renderEventContent = (arg: EventContentArg) => {
    const description = (arg.event.extendedProps as any)?.description as string | undefined;
    const snippet = description ? (description.length > 80 ? `${description.slice(0, 80)}…` : description) : '';

    return (
      <div className="fc-event-custom">
        <div className="fc-event-title-row">{arg.event.title}</div>
        {snippet && <div className="fc-event-desc-row">{snippet}</div>}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <div className="bg-layer bg-layer--blur" aria-hidden />
      <div className="bg-layer bg-layer--grid" aria-hidden />

      <header className="nav">
        <div className="logo">
          <span className="logo__mark">MC</span>
          <span className="logo__text">Manage Calendar</span>
        </div>
        <nav className="nav__links">
          <a href="#events">Events</a>
        </nav>
        {isAuthed ? (
          <button className="btn btn--ghost" onClick={() => signOut()}>
            Sign out
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => signIn('azure-ad')}>
            Connect Outlook
          </button>
        )}
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero__copy">
            <p className="eyebrow">Unified scheduling</p>
            <h1>Outlook calendar, powered by Microsoft Graph.</h1>
            <p className="lead">
              Connect with Microsoft once; we fetch your real meeting data via Graph. No embeds, no ICS files -- just live
              events that update on focus and interval.
            </p>
            <div className="cta-row">
              {isAuthed ? (
                <button className="btn btn--outline" onClick={fetchEvents}>
                  Refresh events
                </button>
              ) : (
                <button className="btn btn--primary" onClick={() => signIn('azure-ad')}>
                  Connect Outlook
                </button>
              )}
            </div>
            <div className="chip-row">
              <span className="chip">Microsoft Graph</span>
              <span className="chip">Calendars.Read</span>
              <span className="chip">Polling refresh</span>
            </div>
          </div>
        </section>

        <section className="section" id="events">
          <div className="section__header">
            <p className="eyebrow">Meeting schedule</p>
            <div className="section__title">
              <h2>Upcoming events</h2>
              <p className="section__lead">
                Live data from Microsoft Graph. We refresh on focus and every 5 minutes. Switch to webhooks when ready.
              </p>
            </div>
            {isAuthed && (
              <button className="btn btn--outline" onClick={fetchEvents} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {!isAuthed && (
            <div className="empty-state">
              <p className="empty-state__title">Connect Outlook to view events</p>
              <p className="empty-state__body">We will pull meetings via Microsoft Graph and render them here.</p>
              <button className="btn btn--primary" onClick={() => signIn('azure-ad')}>
                Connect Outlook
              </button>
            </div>
          )}

          {isAuthed && (
            <>
              {error && <p className="form-message is-error">{error}</p>}
              {loading && <p className="form-message">Loading events...</p>}
              {calendarEvents.length > 0 && (
                <div className="calendar-shell">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    height="auto"
                    nowIndicator
                    events={calendarEvents}
                    eventContent={renderEventContent}
                    eventClick={(info) => {
                      const start = info.event.start ? new Date(info.event.start) : null;
                      const end = info.event.end ? new Date(info.event.end) : null;
                      setSelected({
                        id: info.event.id,
                        title: info.event.title,
                        start: start?.toISOString(),
                        end: end?.toISOString(),
                        location: info.event.extendedProps?.location,
                        organizer: info.event.extendedProps?.organizer,
                        isCancelled: info.event.extendedProps?.isCancelled,
                        webLink:
                          info.event.extendedProps?.webLink ||
                          `https://outlook.office.com/calendar/item/${info.event.id}`,
                        description: info.event.extendedProps?.description,
                      });
                    }}
                  />
                </div>
              )}
              {upcoming.length === 0 && !loading && !error && (
                <div className="empty-state">
                  <p className="empty-state__title">No upcoming events</p>
                  <p className="empty-state__body">Try refreshing or scheduling a new meeting.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <div>
          <p className="footer__brand">Manage Calendar</p>
          <p className="footer__note">Outlook via Graph, ready for polling or webhooks.</p>
        </div>
        <div className="footer__actions">
          {isAuthed ? (
            <button className="btn btn--ghost" onClick={() => signOut()}>
              Sign out
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={() => signIn('azure-ad')}>
              Connect Outlook
            </button>
          )}
        </div>
      </footer>

      {selected && (
        <div className="event-modal" role="dialog" aria-modal="true">
          <div className="event-modal__backdrop" onClick={() => setSelected(null)} />
          <div className="event-modal__card">
            <header className="event-modal__header">
              <div>
                <p className="event-modal__calendar">Calendar</p>
                <h3 className="event-modal__title">{selected.title}</h3>
              </div>
              <button className="event-modal__close" onClick={() => setSelected(null)} aria-label="Close">
                ×
              </button>
            </header>
            <div className="event-modal__body">
              <div className="event-modal__row">
                <span className="event-modal__icon">🗓️</span>
                <span>
                  {formatDateTime(selected.start ? new Date(selected.start) : null)}
                  {selected.end ? ` — ${new Date(selected.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                </span>
              </div>
              {selected.webLink && (
                <div className="event-modal__row">
                  <span className="event-modal__icon">🔗</span>
                  <a href={selected.webLink} target="_blank" rel="noopener noreferrer">
                    Open in Outlook
                  </a>
                </div>
              )}
              {selected.location && (
                <div className="event-modal__row">
                  <span className="event-modal__icon">📍</span>
                  <span>{selected.location}</span>
                </div>
              )}
              {selected.organizer && (
                <div className="event-modal__row">
                  <span className="event-modal__icon">👤</span>
                  <span>Organizer: {selected.organizer}</span>
                </div>
              )}
              {selected.description && (
                <div className="event-modal__row event-modal__description">
                  <span className="event-modal__icon">📝</span>
                  <p>{selected.description}</p>
                </div>
              )}
            </div>
            <div className="event-modal__footer">
              <button className="btn btn--outline" onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.webLink && (
                <a className="btn btn--primary" href={selected.webLink} target="_blank" rel="noopener noreferrer">
                  View in Outlook
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
