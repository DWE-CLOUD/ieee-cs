import { useState, useEffect } from "react";
import { ArrowRight, Calendar, MapPin, Clock, ExternalLink, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";
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

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const content = useHomeContent();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.get<Event[]>('/api/events/upcoming');
      setEvents(data);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const days = differenceInDays(date, new Date());
    if (days < 7) return `In ${days} days`;
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

  // Placeholder events for empty state
  const placeholderEvents = [
    {
      id: "1",
      title: "Web Dev Workshop",
      description: "Learn React & Next.js from scratch with hands-on projects",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: "CS Lab 204",
      type: "Workshop",
      is_featured: true,
    },
    {
      id: "2",
      title: "HackFest 2025",
      description: "24-hour hackathon with amazing prizes and mentorship",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Main Auditorium",
      type: "Hackathon",
      is_featured: false,
    },
    {
      id: "3",
      title: "AI/ML Bootcamp",
      description: "Introduction to machine learning and neural networks",
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      location: "Online",
      type: "Bootcamp",
      is_featured: false,
    },
  ];

  const displayEvents = events.length > 0 ? events : placeholderEvents;

  return (
    <section id="events" className="px-8 py-20 bg-gradient-to-b from-background to-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
              <Sparkles className="w-3 h-3" />
              {content.upcomingEvents.eyebrow}
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              {content.upcomingEvents.title}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              {content.upcomingEvents.description}
            </p>
          </div>
          <SmartLink
            href={content.upcomingEvents.viewAllHref}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-all group"
          >
            {content.upcomingEvents.viewAllLabel}
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayEvents.map((event, index) => (
              <div
                key={event.id}
                className={`group relative bg-card rounded-2xl border transition-all duration-500 hover:shadow-elegant cursor-pointer overflow-hidden ${
                  event.is_featured 
                    ? 'border-accent/30 md:col-span-2 md:row-span-2' 
                    : 'border-border/50 hover:border-foreground/20'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Featured badge */}
                {event.is_featured && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  </div>
                )}

                {/* Image for featured events */}
                {event.is_featured && (event as Event).image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={(event as Event).image_url!} 
                      alt={event.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      sizes="(min-width: 768px) 66vw, 100vw"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className={`p-6 ${event.is_featured ? 'md:p-8' : ''}`}>
                  {/* Type & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-medium uppercase tracking-wider px-3 py-1.5 rounded-full border ${getTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{getDateLabel(event.date)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`font-serif text-foreground mb-2 group-hover:text-accent transition-colors ${
                    event.is_featured ? 'text-2xl md:text-3xl' : 'text-xl'
                  }`}>
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-muted-foreground mb-4 ${event.is_featured ? 'text-base' : 'text-sm line-clamp-2'}`}>
                    {event.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(event.date), "h:mm a")}
                    </div>
                  </div>

                  {/* Registration button for featured */}
                  {event.is_featured && (event as Event).registration_url && (
                    <a
                      href={(event as Event).registration_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm transition-all hover:opacity-90"
                    >
                      Register Now
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile view all link */}
        <SmartLink
          href={content.upcomingEvents.viewAllHref}
          className="md:hidden flex items-center justify-center gap-2 mt-8 px-5 py-2.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-all mx-auto w-fit"
        >
          {content.upcomingEvents.viewAllLabel}
          <ArrowRight className="w-4 h-4" />
        </SmartLink>

        {/* Empty state hint for admins */}
        {events.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm mt-6">
            {content.upcomingEvents.emptyHint}
          </p>
        )}
      </div>
    </section>
  );
};

export default UpcomingEvents;
