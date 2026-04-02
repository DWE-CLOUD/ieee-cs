import { useState, useEffect } from "react";
import { ArrowLeft, Briefcase, Clock, MapPin, Users, ChevronRight, X, Loader2, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from 'sonner';
import ieeeLogo from "@/assets/ieee-logo.png";
import { DynamicApplicationForm } from "@/components/DynamicApplicationForm";
import { FormField } from "@/components/admin/FormBuilder";
interface Team {
  id: string;
  name: string;
  color: string;
}

interface Position {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  team_id: string | null;
  type: string;
  location: string;
  status: string;
  deadline: string | null;
  form_fields?: FormField[];
  teams?: Team;
}

const Positions = () => {
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingPosition, setApplyingPosition] = useState<Position | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const data = await api.get<Position[]>('/api/positions');
      setPositions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPosition) {
      setTimeout(() => setModalVisible(true), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPosition]);

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedPosition(null), 300);
  };

  const handleApplyClick = (position: Position) => {
    if (!user) {
      toast.error('Please sign in to apply');
      navigate('/auth');
      return;
    }
    setApplyingPosition(position);
    setShowApplyModal(true);
    handleCloseModal();
  };

  const filteredPositions = positions.filter((pos) => {
    if (filter === "open") return pos.status === 'open';
    if (filter === "closed") return pos.status === 'closed';
    return true;
  });

  const openCount = positions.filter((p) => p.status === 'open').length;

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105"
          >
            <img 
              src={ieeeLogo} 
              alt="IEEE Computer Society" 
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl transition-all duration-1000"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
            }}
          />
          <div 
            className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gold/5 blur-3xl transition-all duration-1000 delay-200"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'scale(1)' : 'scale(0.8)'
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div 
            className="flex items-center gap-2 mb-6 transition-all duration-700"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 shadow-soft">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-sm font-medium text-accent">{openCount} positions open</span>
            </div>
          </div>
          
          <h1 
            className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-6 transition-all duration-700 delay-100"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            Join Our Team
          </h1>
          <p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed transition-all duration-700 delay-200"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)'
            }}
          >
            Be part of something bigger. We're looking for passionate individuals to help us 
            build the future of tech at our college.
          </p>

          {/* Filters */}
          <div 
            className="flex items-center gap-3 transition-all duration-700 delay-300"
            style={{ 
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
            }}
          >
            {(["all", "open", "closed"] as const).map((f, index) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-500 overflow-hidden
                  ${filter === f 
                    ? "bg-foreground text-primary-foreground shadow-elegant" 
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/50 hover:border-border hover:shadow-soft"
                  }
                `}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className="relative z-10">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Positions Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPositions.map((position, index) => (
                <div
                  key={position.id}
                  onClick={() => setSelectedPosition(position)}
                  className={`
                    group relative p-8 rounded-3xl border cursor-pointer transition-all duration-500 
                    ${position.status === 'open'
                      ? "bg-card border-border/50 hover:border-accent/40 hover:shadow-elegant" 
                      : "bg-muted/30 border-border/30"
                    }
                  `}
                  style={{ 
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                    transitionDelay: `${400 + index * 100}ms`
                  }}
                >
                  <div className={`
                    absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500
                    ${position.status === 'open' ? 'group-hover:opacity-100' : ''}
                    bg-gradient-to-br from-accent/5 via-transparent to-gold/5
                  `} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-5">
                      <span 
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-300
                          ${position.status === 'open'
                            ? "bg-accent/15 text-accent" 
                            : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {position.status === 'open' ? "Open" : "Closed"}
                      </span>
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                        ${position.status === 'open'
                          ? 'bg-muted group-hover:bg-foreground' 
                          : 'bg-muted/50'
                        }
                      `}>
                        <ChevronRight className={`
                          w-5 h-5 transition-all duration-500
                          ${position.status === 'open'
                            ? 'text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5' 
                            : 'text-muted-foreground/50'
                          }
                        `} />
                      </div>
                    </div>

                    <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3 transition-colors duration-300">
                      {position.title}
                    </h3>
                    
                    <p className={`
                      text-sm leading-relaxed mb-6 line-clamp-2 transition-colors duration-300
                      ${position.status === 'open' ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                    `}>
                      {position.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { icon: Users, text: position.teams?.name || 'General' },
                        { icon: Briefcase, text: position.type },
                        { icon: MapPin, text: position.location },
                      ].map((item, i) => (
                        <div 
                          key={i}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                            ${position.status === 'open'
                              ? 'bg-muted/50 text-muted-foreground group-hover:bg-muted' 
                              : 'bg-muted/30 text-muted-foreground/60'
                            }
                          `}
                        >
                          <item.icon className="w-3.5 h-3.5" />
                          {item.text}
                        </div>
                      ))}
                    </div>

                    <div className={`
                      flex items-center gap-2 mt-6 pt-6 border-t text-sm transition-colors duration-300
                      ${position.status === 'open'
                        ? 'border-border/50 text-muted-foreground' 
                        : 'border-border/30 text-muted-foreground/60'
                      }
                    `}>
                      <Clock className="w-4 h-4" />
                      {position.status === 'open' && position.deadline
                        ? `Apply by ${formatDeadline(position.deadline)}`
                        : position.status === 'open'
                        ? "No deadline"
                        : "Applications closed"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredPositions.length === 0 && (
            <div 
              className="text-center py-20 transition-all duration-500"
              style={{ 
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
              }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">No positions found for this filter.</p>
              <button 
                onClick={() => setFilter("all")}
                className="mt-4 text-sm text-accent hover:underline"
              >
                View all positions
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Position Detail Modal */}
      {selectedPosition && (
        <div 
          className={`
            fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 transition-all duration-300
            ${modalVisible ? 'opacity-100' : 'opacity-0'}
          `}
          onClick={handleCloseModal}
        >
          <div className={`
            absolute inset-0 bg-foreground/30 backdrop-blur-md transition-all duration-500
            ${modalVisible ? 'opacity-100' : 'opacity-0'}
          `} />
          
          <div 
            className={`
              relative bg-background rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-elegant transition-all duration-500
              ${modalVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />
            
            <div className="relative p-8 md:p-10 overflow-y-auto max-h-[90vh]">
              <button
                onClick={handleCloseModal}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/80 backdrop-blur flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-all duration-300 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 pr-12">
                <span 
                  className={`
                    inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-4
                    ${selectedPosition.status === 'open'
                      ? "bg-accent/15 text-accent" 
                      : "bg-muted text-muted-foreground"
                    }
                  `}
                >
                  {selectedPosition.status === 'open' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                  )}
                  {selectedPosition.status === 'open' ? "Open for Applications" : "Applications Closed"}
                </span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">
                  {selectedPosition.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-border/50">
                {[
                  { icon: Users, text: `${selectedPosition.teams?.name || 'General'} Team` },
                  { icon: Briefcase, text: selectedPosition.type },
                  { icon: MapPin, text: selectedPosition.location },
                  ...(selectedPosition.status === 'open' && selectedPosition.deadline
                    ? [{ icon: Clock, text: `Apply by ${formatDeadline(selectedPosition.deadline)}` }]
                    : []),
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">About the Role</h3>
                <p className="text-muted-foreground leading-relaxed">{selectedPosition.description}</p>
              </div>

              {selectedPosition.requirements && selectedPosition.requirements.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">Requirements</h3>
                  <ul className="space-y-3">
                    {selectedPosition.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-3 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPosition.status === 'open' && (
                <button
                  onClick={() => handleApplyClick(selectedPosition)}
                  className="w-full py-4 rounded-2xl bg-foreground text-primary-foreground font-medium text-lg transition-all duration-300 hover:opacity-90 shadow-elegant flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal - Uses Dynamic Form */}
      {showApplyModal && applyingPosition && (
        <DynamicApplicationForm
          position={applyingPosition}
          onClose={() => { setShowApplyModal(false); setApplyingPosition(null); }}
          onSuccess={() => { 
            setShowApplyModal(false); 
            setApplyingPosition(null);
            toast.success('Application submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default Positions;
