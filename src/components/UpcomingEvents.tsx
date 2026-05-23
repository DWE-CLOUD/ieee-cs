import { useState, useEffect } from "react";
import { ArrowRight, Calendar, MapPin, Clock, ExternalLink, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import LazyImage from "@/components/LazyImage";
import SmartLink from "@/components/SmartLink";
import { useHomeContent } from "@/components/home/HomeContentProvider";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  end_date: string | null;
  location: string | null;
  type: string;
  image_url: string | null;
  registration_url: string | null;
  is_featured: boolean;
  status: string;
}

type EventState = "upcoming" | "ongoing" | "past";

const getEventState = (event: Event): EventState => {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = new Date(event.end_date || event.date).getTime();

  if (event.status === "ongoing" || (start <= now && end >= now)) return "ongoing";
  if (event.status === "completed" || end < now) return "past";
  return "upcoming";
};

const getStatusLabel = (state: EventState) => {
  if (state === "ongoing") return "Live now";
  if (state === "past") return "Past";
  return "Upcoming";
};

const getStatusClass = (state: EventState) => {
  if (state === "ongoing") return "bg-green-500/15 text-green-600 border-green-500/30";
  if (state === "past") return "bg-muted text-muted-foreground border-border";
  return "bg-accent/15 text-accent border-accent/30";
};

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const content = useHomeContent();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setError(null);
      const data = await api.get<Event[]>('/api/events/upcoming');
      setEvents(data);
    } catch (error) {
      setEvents([]);
      setError(error instanceof Error ? error.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const days = differenceInCalendarDays(date, new Date());
    if (days > 1 && days < 7) return `In ${days} days`;
    if (days === -1) return "Yesterday";
    return format(date, "MMM d");
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'workshop': return 'bg-accent/15 text-accent border-accent/30';
      case 'hackathon': return 'bg-gold/15 text-gold border-gold/30';
      case 'bootcamp': return 'bg-green-500/15 text-green-600 border-green-500/30';
      case 'webinar': return 'bg-purple-500/15 text-purple-600 border-purple-500/30';
      case 'meetup': return 'bg-pink-500/15 text-pink-600 border-pink-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const featuredEvent = events.find((event) => event.is_featured) || events[0];
  const supportingEvents = events
    .filter((event) => event.id !== featuredEvent?.id)
    .slice(0, 4);

  const renderEventCard = (event: Event, featured = false) => {
    const state = getEventState(event);

    return (
      <article
        key={event.id}
        className={`group relative bg-card border border-border/50 transition-all duration-500 hover:border-accent/30 hover:shadow-elegant overflow-hidden ${
          featured ? "rounded-3xl" : "rounded-2xl"
        }`}
      >
        {featured && event.image_url && (
          <div className="aspect-[16/8] overflow-hidden bg-muted">
            <LazyImage
              src={event.image_url}
              alt={event.title}
              fetchPriority="low"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        <div className={featured ? "p-6 md:p-8" : "p-5"}>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full border ${getStatusClass(state)}`}>
              {getStatusLabel(state)}
            </span>
            <span className={`text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full border ${getTypeColor(event.type)}`}>
              {event.type}
            </span>
            {featured && event.is_featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>
            )}
          </div>

          <h3 className={`font-serif text-foreground group-hover:text-accent transition-colors ${
            featured ? "text-3xl md:text-4xl" : "text-xl"
          }`}>
            {event.title}
          </h3>

          {event.description && (
            <p className={`text-muted-foreground mt-3 ${
              featured ? "text-base leading-relaxed line-clamp-3" : "text-sm line-clamp-2"
            }`}>
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {getDateLabel(event.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(event.date), "h:mm a")}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <SmartLink
              href="/events"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              View details
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </SmartLink>
            {event.registration_url && state !== "past" && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium text-sm transition-all hover:opacity-90"
              >
                Register
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section id="events" className="px-4 py-20 md:px-8 bg-gradient-to-b from-background to-secondary/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
              <Sparkles className="w-3 h-3" />
              {content.upcomingEvents.eyebrow || "What's happening"}
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Events
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Explore live programs, upcoming sessions, and highlights from past IEEE CS events.
            </p>
          </div>
          <SmartLink
            href="/events"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-all group"
          >
            View all events
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </SmartLink>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-6 animate-pulse">
                <div className="h-4 w-20 bg-muted rounded mb-4" />
                <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-full bg-muted rounded mb-4" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium text-destructive">Events could not be loaded.</p>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No events are available from the backend yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            {featuredEvent && renderEventCard(featuredEvent, true)}
            {supportingEvents.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {supportingEvents.map((event) => renderEventCard(event))}
              </div>
            )}
          </div>
        )}

        {/* Mobile view all link */}
        <SmartLink
          href="/events"
          className="md:hidden flex items-center justify-center gap-2 mt-8 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-all mx-auto w-fit"
        >
          View all events
          <ArrowRight className="w-4 h-4" />
        </SmartLink>

        {/* Empty state hint for admins */}
        {events.length === 0 && !loading && !error && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {content.upcomingEvents.emptyHint}
          </p>
        )}
      </div>
    </section>
  );
};

export default UpcomingEvents;
