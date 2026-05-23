import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { differenceInCalendarDays, format, isToday, isTomorrow } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LazyImage from "@/components/LazyImage";
import { api } from "@/lib/api";

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

type EventFilter = "all" | "upcoming" | "ongoing" | "past";

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";

  const days = differenceInCalendarDays(date, new Date());
  if (days > 1 && days < 7) return `In ${days} days`;
  if (days === -1) return "Yesterday";

  return format(date, "MMM d, yyyy");
};

const getEventState = (event: Event): EventFilter => {
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = new Date(event.end_date || event.date).getTime();

  if (event.status === "ongoing" || (start <= now && end >= now)) return "ongoing";
  if (end < now || event.status === "completed") return "past";
  return "upcoming";
};

const getBadgeClasses = (state: EventFilter) => {
  switch (state) {
    case "ongoing":
      return "bg-green-500/15 text-green-600 border-green-500/30";
    case "past":
      return "bg-muted text-muted-foreground border-border";
    case "upcoming":
      return "bg-accent/15 text-accent border-accent/30";
    default:
      return "bg-card text-foreground border-border";
  }
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    api
      .get<Event[]>("/api/events")
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const eventTypes = useMemo(
    () => Array.from(new Set(events.map((event) => event.type).filter(Boolean))).sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const state = getEventState(event);
        const matchesStatus = filter === "all" || state === filter;
        const matchesType = typeFilter === "all" || event.type === typeFilter;
        const matchesSearch =
          !query ||
          [event.title, event.description, event.location, event.type]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        return matchesStatus && matchesType && matchesSearch;
      })
      .sort((a, b) => {
        const stateRank = { ongoing: 0, upcoming: 1, past: 2, all: 3 };
        const stateDelta = stateRank[getEventState(a)] - stateRank[getEventState(b)];
        if (stateDelta !== 0) return stateDelta;

        const aTime = new Date(a.date).getTime();
        const bTime = new Date(b.date).getTime();
        return getEventState(a) === "past" ? bTime - aTime : aTime - bTime;
      });
  }, [events, filter, search, typeFilter]);

  const counts = useMemo(
    () => ({
      all: events.length,
      upcoming: events.filter((event) => getEventState(event) === "upcoming").length,
      ongoing: events.filter((event) => getEventState(event) === "ongoing").length,
      past: events.filter((event) => getEventState(event) === "past").length,
    }),
    [events]
  );

  const filters: { id: EventFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "ongoing", label: "Live" },
    { id: "past", label: "Past" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <section className="px-4 pt-32 pb-12 md:px-8 md:pt-40 md:pb-16 border-b border-border/40">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-4">
                <Sparkles className="w-4 h-4" />
                IEEE CS Events
              </div>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground leading-none">
                Events
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mt-5 leading-relaxed">
                Browse upcoming sessions, live programs, and past workshops from the chapter.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-2xl font-serif text-foreground">{counts.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-2xl font-serif text-foreground">{counts.ongoing}</p>
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="text-2xl font-serif text-foreground">{counts.past}</p>
                <p className="text-xs text-muted-foreground">Past</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                    filter === item.id
                      ? "bg-foreground text-primary-foreground border-foreground shadow-soft"
                      : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
                  }`}
                >
                  {item.label} ({counts[item.id]})
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-0 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search events"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="px-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="all">All types</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-3xl border border-border/50 bg-card p-10 text-center">
              <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="font-serif text-2xl text-foreground mb-2">No events found</h2>
              <p className="text-sm text-muted-foreground">Try changing the search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvents.map((event) => {
                const state = getEventState(event);

                return (
                  <article
                    key={event.id}
                    className="group rounded-3xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-elegant"
                  >
                    {event.image_url && (
                      <div className="aspect-[16/8] overflow-hidden bg-muted">
                        <LazyImage
                          src={event.image_url}
                          alt={event.title}
                          fetchPriority="low"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6 md:p-8">
                      <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium uppercase tracking-wider ${getBadgeClasses(state)}`}
                        >
                          {state === "ongoing" ? "Live now" : state}
                        </span>
                        {event.is_featured && (
                          <span className="px-3 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-medium">
                            Featured
                          </span>
                        )}
                        <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                          {event.type}
                        </span>
                      </div>

                      <h2 className="font-serif text-2xl md:text-3xl text-foreground group-hover:text-accent transition-colors">
                        {event.title}
                      </h2>
                      {event.description && (
                        <p className="text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-6 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted/60">
                          <CalendarDays className="w-4 h-4" />
                          {getDateLabel(event.date)}
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted/60">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.date), "h:mm a")}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted/60">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {event.registration_url && state !== "past" && (
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Register
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Events;
