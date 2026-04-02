import { useEffect, useRef, useState } from "react";
import AsteriskIcon from "./icons/AsteriskIcon";

const events = [
  {
    id: 1,
    step: "01",
    title: "HackFest 2024",
    subtitle: "Annual Hackathon",
    description: "Our flagship 24-hour hackathon where 200+ students built innovative solutions. Teams competed for prizes worth $5000.",
    highlights: [
      "200+ participants from 15 colleges",
      "50 innovative projects submitted",
      "Industry mentors from top tech companies",
      "Best project won internship opportunities",
    ],
  },
  {
    id: 2,
    step: "02", 
    title: "TechTalk Series",
    subtitle: "Workshop & Seminars",
    description: "Monthly technical workshops covering cutting-edge technologies. Industry experts shared insights on AI, Cloud, and Web3.",
    highlights: [
      "12 workshops conducted this year",
      "Guest speakers from Google & Microsoft",
      "Hands-on coding sessions",
      "Certificate of participation",
    ],
  },
  {
    id: 3,
    step: "03",
    title: "CodeSprint 2024",
    subtitle: "Competitive Programming",
    description: "Intense coding competition testing algorithmic skills. Top performers qualified for regional IEEE competitions.",
    highlights: [
      "500+ problems solved collectively",
      "Top 3 qualified for regionals",
      "Cash prizes for winners",
      "Coding resources provided",
    ],
  },
];

const EventsTimeline = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeEvent, setActiveEvent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = sectionRef.current.offsetHeight;

      const start = windowHeight * 0.5;
      const end = -sectionHeight + windowHeight * 0.5;
      const current = rect.top;
      
      const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));
      setScrollProgress(progress);
      
      // Determine active event based on progress
      if (progress < 0.33) setActiveEvent(0);
      else if (progress < 0.66) setActiveEvent(1);
      else setActiveEvent(2);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-20 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
              / Our Journey /
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight">
              Building Community
              <br />
              Through Events
              <span className="inline-block w-16 h-1.5 bg-foreground ml-4 align-middle rounded-full" />
            </h2>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              From hackathons to workshops, we create opportunities for students to learn, 
              build, and grow together. Each event is designed to push boundaries and 
              foster innovation in our tech community.
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-2xl md:text-3xl text-foreground">
              {events[activeEvent].title}
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-48 md:w-64 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${scrollProgress * 100}%` }}
                />
              </div>
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center">
                <AsteriskIcon className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-6 text-sm">
            {events.map((event, index) => {
              // Calculate if this step should be "completed" based on progress
              const stepThreshold = index / events.length;
              const isCompleted = scrollProgress > stepThreshold;
              const isActive = activeEvent === index;
              
              return (
                <button
                  key={event.id}
                  onClick={() => setActiveEvent(index)}
                  className={`
                    flex items-center gap-2 transition-all duration-500
                    ${isActive 
                      ? 'text-foreground font-medium scale-105' 
                      : isCompleted
                        ? 'text-foreground/70'
                        : 'text-muted-foreground hover:text-foreground/70'
                    }
                  `}
                >
                  <span 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                      transition-all duration-500
                      ${isActive 
                        ? 'bg-foreground text-background' 
                        : isCompleted 
                          ? 'bg-foreground/20 text-foreground'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {event.step}
                  </span>
                  <span 
                    className={`
                      uppercase tracking-wider text-xs transition-all duration-500
                      ${isActive ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0'}
                      overflow-hidden whitespace-nowrap
                    `}
                  >
                    {event.subtitle}
                  </span>
                </button>
              );
            })}
            <span className="ml-auto text-xs text-muted-foreground">
              PROGRESS <span className="text-foreground font-medium">{Math.round(scrollProgress * 100)}%</span>
            </span>
          </div>
        </div>

        {/* Event Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Event Details Card */}
          <div className="bg-secondary/50 rounded-3xl p-8 md:p-10">
            <p className="text-sm text-foreground/80 mb-6">
              <span className="text-foreground font-medium">{events[activeEvent].subtitle}</span>
              {" — "}
              {events[activeEvent].description}
            </p>

            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Event Highlights:
              </h4>
              {events[activeEvent].highlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 py-2 border-t border-border/50 text-sm text-muted-foreground"
                  style={{
                    opacity: 0.5 + (scrollProgress * 0.5),
                    transform: `translateX(${(1 - scrollProgress) * (index * 5)}px)`,
                    transition: `all 0.5s ease-out ${index * 0.1}s`,
                  }}
                >
                  <span className="text-foreground/40">→</span>
                  {highlight}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual Card */}
          <div className="bg-foreground rounded-3xl p-8 md:p-10 text-primary-foreground relative overflow-hidden min-h-[400px]">
            {/* Decorative elements */}
            <div className="absolute top-6 right-6">
              <span className="text-xs uppercase tracking-widest opacity-60">IEEE CS</span>
            </div>
            
            {/* Event number */}
            <div className="absolute bottom-8 left-8">
              <span className="font-serif text-[120px] md:text-[150px] leading-none opacity-10">
                {events[activeEvent].step}
              </span>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-full border border-primary-foreground/30 flex items-center justify-center mb-6">
                  <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                </div>
                <h3 className="font-serif text-3xl md:text-4xl mb-2">
                  {events[activeEvent].title}
                </h3>
                <p className="text-primary-foreground/60 text-sm">
                  {events[activeEvent].subtitle}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                  <span className="font-serif text-4xl">{activeEvent === 0 ? '200+' : activeEvent === 1 ? '12' : '500+'}</span>
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    {activeEvent === 0 ? 'Participants' : activeEvent === 1 ? 'Workshops' : 'Problems Solved'}
                  </p>
                </div>
                <div>
                  <span className="font-serif text-4xl">{activeEvent === 0 ? '50' : activeEvent === 1 ? '24+' : '3'}</span>
                  <p className="text-xs text-primary-foreground/60 mt-1">
                    {activeEvent === 0 ? 'Projects Built' : activeEvent === 1 ? 'Hours of Content' : 'Regional Qualifiers'}
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative lines */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
              <svg viewBox="0 0 200 400" fill="none" className="w-full h-full">
                <path d="M50 0 L50 400" stroke="currentColor" strokeWidth="0.5" />
                <path d="M100 0 L100 400" stroke="currentColor" strokeWidth="0.5" />
                <path d="M150 0 L150 400" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="100" cy="200" r="40" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventsTimeline;
