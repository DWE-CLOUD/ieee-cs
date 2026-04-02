import { Code, Palette, Users, Settings, ArrowUpRight, X, Linkedin, Github, Crown, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useHomeContent } from "@/components/home/HomeContentProvider";

interface TeamMember {
  id: string;
  user_id: string;
  position_title: string;
  is_head?: boolean;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    linkedin_url: string | null;
    github_url: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  members: TeamMember[];
}

// Icon mapping for teams
const getTeamIcon = (teamName: string) => {
  const name = teamName.toLowerCase();
  if (name.includes('web') || name.includes('dev') || name.includes('tech')) return Code;
  if (name.includes('creative') || name.includes('design') || name.includes('media')) return Palette;
  if (name.includes('lead') || name.includes('exec') || name.includes('management')) return Users;
  return Settings;
};

// Generate accent color from team color
const getAccentColor = (color: string) => {
  // Just return the color with some opacity adjustments
  return color;
};

const getBgClass = (color: string) => {
  // Convert hex to a light background style
  return { backgroundColor: `${color}20` };
};

type AnimationState = 'closed' | 'opening' | 'open' | 'closing';

const TeamSection = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>('closed');
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const content = useHomeContent();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll-linked horizontal scroll effect (desktop only)
  useEffect(() => {
    const section = sectionRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!section || !scrollContainer || teams.length === 0) return;

    // Only apply on desktop
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    let currentScrollLeft = 0;
    let targetScrollLeft = 0;
    let animationId: number;

    const smoothScroll = () => {
      const diff = targetScrollLeft - currentScrollLeft;
      // Smooth easing - move 8% of remaining distance each frame
      currentScrollLeft += diff * 0.08;
      
      // Stop animating when close enough
      if (Math.abs(diff) > 0.5) {
        scrollContainer.scrollLeft = currentScrollLeft;
        animationId = requestAnimationFrame(smoothScroll);
      } else {
        scrollContainer.scrollLeft = targetScrollLeft;
      }
    };

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Start when the cards container is fully visible (section top reaches 60% of window)
      const scrollStart = windowHeight * 0.4;
      // End when section is mostly scrolled past
      const scrollEnd = -sectionHeight + windowHeight * 0.6;
      
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      
      if (sectionTop <= scrollStart && sectionTop >= scrollEnd) {
        const progress = (scrollStart - sectionTop) / (scrollStart - scrollEnd);
        // Clamp progress between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progress));
        targetScrollLeft = clampedProgress * maxScroll;
        
        // Start smooth animation if not already running
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(smoothScroll);
      } else if (sectionTop > scrollStart) {
        // Before section - keep at start
        targetScrollLeft = 0;
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(smoothScroll);
      } else if (sectionTop < scrollEnd) {
        // After section - keep at end
        targetScrollLeft = maxScroll;
        cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(smoothScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, [teams]);

  useEffect(() => {
    fetchTeamsWithMembers();
  }, []);

  const fetchTeamsWithMembers = async () => {
    setIsLoading(true);

    try {
      const teamsWithMembers = await api.get<Team[]>('/api/teams-with-members');
      setTeams(teamsWithMembers);
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = (team: Team, index: number) => {
    const rect = cardRefs.current[index]?.getBoundingClientRect();
    if (rect) {
      setCardRect(rect);
      setSelectedTeam(team);
      setAnimationState('opening');
      document.body.style.overflow = 'hidden';
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationState('open');
        });
      });
    }
  };

  const closeLightbox = () => {
    setAnimationState('closing');
    
    setTimeout(() => {
      setAnimationState('closed');
      setSelectedTeam(null);
      setCardRect(null);
      document.body.style.overflow = '';
    }, 500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && animationState === 'open') {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animationState]);

  const getModalStyles = () => {
    if (!cardRect) return {};

    const isExpanded = animationState === 'open';
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 16 : 40;

    if (isExpanded) {
      return {
        top: padding,
        left: padding,
        width: `calc(100vw - ${padding * 2}px)`,
        height: `calc(100vh - ${padding * 2}px)`,
        borderRadius: isMobile ? '16px' : '24px',
      };
    } else {
      return {
        top: cardRect.top,
        left: cardRect.left,
        width: cardRect.width,
        height: cardRect.height,
        borderRadius: isMobile ? '16px' : '24px',
      };
    }
  };

  const isVisible = animationState !== 'closed';
  const isExpanded = animationState === 'open';

  if (isLoading) {
    return (
      <section id="team" className="bg-background py-24 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section id="team" className="bg-background py-24 px-8">
        <div className="max-w-7xl mx-auto text-center py-20">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="font-serif text-3xl text-foreground mb-2">No Teams Yet</h2>
          <p className="text-muted-foreground">Teams will appear here once they're created.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="team" className="bg-background py-16 md:py-24 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto" ref={sectionRef}>
          {/* Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-20">
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
              <span className="text-xs uppercase tracking-widest text-muted-foreground whitespace-nowrap md:pt-4">
                {content.team.eyebrow}
              </span>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl text-foreground leading-none">
                {content.team.title}
              </h2>
            </div>
            <div className="flex items-end lg:justify-end">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {content.team.description}
              </p>
            </div>
          </div>

          {/* Team Categories - Grid on mobile, horizontal scroll on desktop */}
          <div 
            ref={scrollContainerRef}
            className="grid grid-cols-2 gap-4 md:flex md:gap-6 md:overflow-x-auto md:pb-6 md:scrollbar-hide md:-mx-8 md:px-8"
          >
            {teams.map((team, index) => {
              const IconComponent = getTeamIcon(team.name);
              const isHovered = hoveredCard === team.id;
              
              return (
                <div
                  key={team.id}
                  ref={(el) => (cardRefs.current[index] = el)}
                  className="group animate-fade-in w-full md:flex-shrink-0 md:w-[320px] md:snap-start"
                  onMouseEnter={() => setHoveredCard(team.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => openLightbox(team, index)}
                  style={{
                    animationDelay: `${index * 0.15}s`,
                    animationFillMode: 'both',
                  }}
                >
                  {/* Image/Icon Container */}
                  <div 
                    className="relative aspect-square md:aspect-[4/5] mb-3 md:mb-6 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 ease-out"
                    style={{
                      ...getBgClass(team.color),
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isHovered ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none',
                    }}
                  >
                    {/* Decorative pattern */}
                    <div className="absolute inset-0 opacity-30">
                      <svg className="w-full h-full" viewBox="0 0 200 250">
                        <pattern id={`grid-${team.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                          <circle cx="1" cy="1" r="1" fill="currentColor" className="text-foreground/20" />
                        </pattern>
                        <rect width="100%" height="100%" fill={`url(#grid-${team.id})`} />
                      </svg>
                    </div>

                    {/* Team Head Avatar or Icon */}
                    {(() => {
                      const teamHead = team.members.find(m => m.is_head);
                      if (teamHead && teamHead.profiles.avatar_url) {
                        return (
                          <>
                            {/* Animated glow rings behind avatar */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              {/* Outer pulsing ring */}
                              <div 
                                className={`
                                  absolute w-32 md:w-56 h-32 md:h-56 rounded-full
                                  bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20
                                  transition-all duration-1000 ease-out animate-pulse
                                  ${isHovered ? 'scale-110 opacity-80' : 'scale-100 opacity-40'}
                                `} 
                              />
                              {/* Middle gradient ring */}
                              <div 
                                className={`
                                  absolute w-28 md:w-48 h-28 md:h-48 rounded-full
                                  border-2 border-accent/30
                                  transition-all duration-700 ease-out
                                  ${isHovered ? 'scale-125 opacity-0 rotate-45' : 'scale-100 opacity-100 rotate-0'}
                                `} 
                              />
                              {/* Inner decorative ring */}
                              <div 
                                className={`
                                  absolute w-24 md:w-42 h-24 md:h-42 rounded-full
                                  border border-foreground/10 border-dashed
                                  transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-150 opacity-0 -rotate-90' : 'scale-100 opacity-60 rotate-0'}
                                `} 
                              />
                            </div>

                            {/* Team Head Avatar with enhanced styling */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              {/* Glowing backdrop */}
                              <div 
                                className={`
                                  absolute w-22 md:w-40 h-22 md:h-40 rounded-full
                                  bg-gradient-to-br from-accent/40 to-primary/20 blur-xl
                                  transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-125 opacity-80' : 'scale-100 opacity-50'}
                                `}
                              />
                              {/* Avatar container */}
                              <div 
                                className={`
                                  relative z-10 w-20 md:w-36 h-20 md:h-36 rounded-full overflow-hidden
                                  ring-4 ring-background/80 shadow-2xl
                                  transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-110 ring-accent/50' : 'scale-100'}
                                `}
                                style={{
                                  boxShadow: isHovered 
                                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 40px rgba(var(--accent), 0.3)' 
                                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                }}
                              >
                                <img 
                                  src={teamHead.profiles.avatar_url} 
                                  alt={teamHead.profiles.display_name || 'Team Head'}
                                  className={`
                                    w-full h-full object-cover transition-transform duration-700
                                    ${isHovered ? 'scale-110' : 'scale-100'}
                                  `}
                                />
                                {/* Overlay gradient on hover */}
                                <div 
                                  className={`
                                    absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent
                                    transition-opacity duration-300
                                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                                  `}
                                />
                              </div>
                              
                              {/* Crown badge - enhanced */}
                              <div 
                                className={`
                                  absolute z-20 left-1/2 -translate-x-1/2
                                  w-8 md:w-10 h-8 md:h-10 rounded-full 
                                  bg-gradient-to-br from-accent to-accent/80 
                                  flex items-center justify-center
                                  shadow-lg transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-110 -translate-y-1 shadow-accent/40' : 'scale-100'}
                                `}
                                style={{ 
                                  top: 'calc(50% - 3.5rem)', 
                                  marginTop: '-1.5rem',
                                  boxShadow: isHovered 
                                    ? '0 8px 25px -5px rgba(var(--accent), 0.5)' 
                                    : '0 4px 15px -3px rgba(0, 0, 0, 0.3)'
                                }}
                              >
                                <Crown className={`
                                  w-4 md:w-5 h-4 md:h-5 text-accent-foreground
                                  transition-transform duration-300
                                  ${isHovered ? 'scale-110' : 'scale-100'}
                                `} />
                              </div>
                            </div>

                            {/* Head name badge - enhanced design */}
                            <div 
                              className={`
                                absolute bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 z-10
                                px-4 py-2 rounded-2xl 
                                bg-gradient-to-br from-background/95 to-background/85
                                backdrop-blur-md shadow-xl border border-border/30
                                transition-all duration-500 ease-out
                                ${isHovered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <p className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap">
                                  {teamHead.profiles.display_name}
                                </p>
                              </div>
                              <p className="text-[10px] md:text-xs text-accent font-medium text-center mt-0.5">Team Head</p>
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <>
                            {/* Animated circles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div 
                                className={`
                                  absolute w-20 md:w-40 h-20 md:h-40 rounded-full border-2 border-foreground/10
                                  transition-all duration-700 ease-out
                                  ${isHovered ? 'scale-125 opacity-0' : 'scale-100 opacity-100'}
                                `} 
                              />
                              <div 
                                className={`
                                  absolute w-16 md:w-32 h-16 md:h-32 rounded-full border border-foreground/15
                                  transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}
                                `} 
                              />
                              <div 
                                className="absolute w-24 md:w-48 h-24 md:h-48 rounded-full transition-all duration-500 ease-out"
                                style={{ 
                                  backgroundColor: team.color,
                                  opacity: isHovered ? 0.6 : 0.4,
                                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                }}
                              />
                            </div>

                            {/* Main icon container */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div 
                                className={`
                                  relative z-10 w-14 md:w-24 h-14 md:h-24 rounded-full bg-foreground 
                                  flex items-center justify-center
                                  transition-all duration-500 ease-out
                                  ${isHovered ? 'scale-110 rotate-6' : 'scale-100 rotate-0'}
                                `}
                              >
                                <IconComponent 
                                  className={`
                                    w-7 md:w-12 h-7 md:h-12 text-background
                                    transition-all duration-300
                                    ${isHovered ? 'scale-110' : 'scale-100'}
                                  `} 
                                  strokeWidth={1.5} 
                                />
                              </div>
                            </div>
                          </>
                        );
                      }
                    })()}

                    {/* Member count badge */}
                    <div 
                      className={`
                        absolute top-2 md:top-4 right-2 md:right-4 px-2 md:px-3 py-1 md:py-1.5 rounded-full 
                        bg-background/90 backdrop-blur-sm
                        text-[10px] md:text-xs font-medium text-foreground
                        transition-all duration-300
                        ${isHovered ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 md:opacity-0'}
                      `}
                      style={{ opacity: window.innerWidth < 768 ? 1 : undefined }}
                    >
                      {team.members.length} members
                    </div>

                    {/* Arrow indicator */}
                    <div 
                      className={`
                        absolute bottom-2 md:bottom-4 right-2 md:right-4 w-8 md:w-10 h-8 md:h-10 rounded-full
                        bg-foreground flex items-center justify-center
                        transition-all duration-300
                        ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 md:opacity-0'}
                      `}
                      style={{ opacity: window.innerWidth < 768 ? 1 : undefined, transform: window.innerWidth < 768 ? 'none' : undefined }}
                    >
                      <ArrowUpRight className="w-4 md:w-5 h-4 md:h-5 text-background" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-1 md:space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 
                        className={`
                          font-serif text-base md:text-2xl text-foreground
                          transition-all duration-300
                          ${isHovered ? 'translate-x-1' : 'translate-x-0'}
                        `}
                      >
                        {team.name}
                      </h3>
                    </div>
                    <p 
                      className={`
                        text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3
                        transition-all duration-500
                        ${isHovered ? 'text-foreground/70' : 'text-muted-foreground'}
                      `}
                    >
                      {team.description || 'A dedicated team working together to achieve great things.'}
                    </p>
                    
                    {/* Animated underline - hidden on mobile */}
                    <div className="hidden md:block pt-2">
                      <div 
                        className={`
                          h-0.5 bg-foreground rounded-full
                          transition-all duration-500 ease-out
                          ${isHovered ? 'w-full' : 'w-0'}
                        `}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {isVisible && selectedTeam && (
        <div 
          className="fixed inset-0 z-50"
          onClick={closeLightbox}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md transition-opacity duration-500"
            style={{ opacity: isExpanded ? 1 : 0 }}
          />

          {/* Expanding Card Container */}
          <div
            className="absolute bg-background overflow-hidden shadow-2xl"
            style={{
              ...getModalStyles(),
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform duration-300"
              style={{ 
                opacity: isExpanded ? 1 : 0,
                transform: isExpanded ? 'scale(1)' : 'scale(0.5)',
                transition: 'all 0.3s ease-out 0.2s',
              }}
            >
              <X className="w-6 h-6" />
            </button>

            {/* Content Container */}
            <div 
              className="h-full overflow-y-auto"
              style={{ 
                opacity: isExpanded ? 1 : 0,
                transition: 'opacity 0.4s ease-out 0.1s',
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 min-h-full">
                {/* Left: Team Feature Section */}
                <div 
                  className="relative min-h-[400px] lg:min-h-full flex flex-col items-center justify-center p-8 lg:p-12"
                  style={{ backgroundColor: `${selectedTeam.color}40` }}
                >
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 400 500">
                      <pattern id="lightbox-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="2" fill="currentColor" className="text-foreground" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#lightbox-grid)" />
                    </svg>
                  </div>

                  {/* Team Icon */}
                  <div 
                    className="relative z-10 text-center"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.9)',
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
                    }}
                  >
                    {/* Icon container */}
                    <div 
                      className="w-36 h-36 md:w-44 md:h-44 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl"
                      style={{
                        backgroundColor: selectedTeam.color,
                        transform: isExpanded ? 'scale(1)' : 'scale(0.5)',
                        transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
                      }}
                    >
                      {(() => {
                        const Icon = getTeamIcon(selectedTeam.name);
                        return <Icon className="w-20 h-20 text-white" strokeWidth={1.5} />;
                      })()}
                    </div>

                    {/* Team info */}
                    <div 
                      className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl max-w-xs mx-auto"
                      style={{
                        opacity: isExpanded ? 1 : 0,
                        transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.5s ease-out 0.35s',
                      }}
                    >
                      {(() => {
                        const teamHead = selectedTeam.members.find(m => m.is_head);
                        return teamHead ? (
                          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20">
                            <div className="relative">
                              {teamHead.profiles.avatar_url ? (
                                <img 
                                  src={teamHead.profiles.avatar_url} 
                                  alt={teamHead.profiles.display_name || 'Head'} 
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-accent shadow-lg"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg">
                                  <Crown className="w-5 h-5 text-accent-foreground" />
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-md">
                                <Crown className="w-3 h-3 text-accent-foreground" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
                                  Team Head
                                </span>
                              </div>
                              <p className="text-sm font-medium text-foreground mt-1">{teamHead.profiles.display_name}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-accent/60 animate-pulse" />
                            <span className="text-xs uppercase tracking-widest text-muted-foreground">
                              {selectedTeam.members.length} Members
                            </span>
                          </div>
                        );
                      })()}
                      <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                        {selectedTeam.name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedTeam.description || 'A dedicated team working together to achieve great things.'}
                      </p>
                    </div>
                  </div>

                  {/* Floating decorative elements */}
                  <div 
                    className="absolute top-1/4 left-1/6 w-16 h-16 rounded-full border-2 border-foreground/20"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'scale(1)' : 'scale(0)',
                      transition: 'all 0.5s ease-out 0.4s',
                    }}
                  />
                  <div 
                    className="absolute bottom-1/4 right-1/6 w-24 h-24 rounded-full border border-foreground/10"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'scale(1)' : 'scale(0)',
                      transition: 'all 0.5s ease-out 0.5s',
                    }}
                  />
                </div>

                {/* Right: Content Section */}
                <div className="p-8 md:p-12 lg:p-16 flex flex-col">
                  {/* Header */}
                  <div 
                    className="mb-8"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0)' : 'translateY(30px)',
                      transition: 'all 0.5s ease-out 0.2s',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {(() => {
                        const Icon = getTeamIcon(selectedTeam.name);
                        return <Icon className="w-6 h-6 text-foreground" strokeWidth={1.5} />;
                      })()}
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        / {selectedTeam.members.length} members /
                      </span>
                    </div>
                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4">
                      {selectedTeam.name}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedTeam.description || 'A dedicated team working together to achieve great things.'}
                    </p>
                  </div>

                  {/* Team Members */}
                  <div 
                    className="flex-1"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0)' : 'translateY(30px)',
                      transition: 'all 0.5s ease-out 0.3s',
                    }}
                  >
                    <h3 className="text-sm font-medium text-foreground mb-6 uppercase tracking-wider">
                      Team Members
                    </h3>
                    {selectedTeam.members.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTeam.members.map((member, idx) => (
                          <div 
                            key={member.id}
                            className="group/member flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors duration-300"
                            style={{
                              opacity: isExpanded ? 1 : 0,
                              transform: isExpanded ? 'translateX(0)' : 'translateX(-20px)',
                              transition: `all 0.4s ease-out ${0.4 + idx * 0.08}s`,
                            }}
                          >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-background flex items-center justify-center">
                              {member.profiles.avatar_url ? (
                                <img 
                                  src={member.profiles.avatar_url} 
                                  alt={member.profiles.display_name || 'Team member'}
                                  className="w-full h-full object-cover group-hover/member:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <span className="text-lg font-medium text-muted-foreground">
                                  {(member.profiles.display_name || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">
                                  {member.profiles.display_name || 'Team Member'}
                                </p>
                                {member.is_head && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-semibold rounded-full flex-shrink-0">
                                    <Crown className="w-3 h-3" />
                                    Head
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{member.position_title}</p>
                            </div>
                            {(member.profiles.linkedin_url || member.profiles.github_url) && (
                              <div className="flex items-center gap-1">
                                {member.profiles.linkedin_url && (
                                  <a 
                                    href={member.profiles.linkedin_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                )}
                                {member.profiles.github_url && (
                                  <a 
                                    href={member.profiles.github_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Github className="w-4 h-4 text-muted-foreground" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No members yet</p>
                        <p className="text-sm mt-1">Apply for a position to join this team!</p>
                      </div>
                    )}
                  </div>

                  {/* Join Team CTA */}
                  <div 
                    className="mt-8 pt-6 border-t border-border"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateY(0)' : 'translateY(20px)',
                      transition: 'all 0.4s ease-out 0.55s',
                    }}
                  >
                    <Link 
                      to="/positions" 
                      className="w-full py-4 rounded-2xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group"
                    >
                      <span>{content.team.joinCtaLabel} {selectedTeam.name}</span>
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamSection;
