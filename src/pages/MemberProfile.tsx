import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Award, Globe, Github, Linkedin, MapPin, Quote, Sparkles, Twitter, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import ieeeLogo from '@/assets/ieee-cs-logo.png';

interface TeamMembership {
  id: string;
  team_id: string;
  position_title: string;
  is_head: boolean;
  joined_at: string;
  team: {
    id: string;
    name: string;
    color: string;
    description: string | null;
  };
}

interface MemberProfilePayload {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  website_url: string | null;
  cover_image_url: string | null;
  specialties: string[];
  achievements: string[];
  favorite_quote: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  memberships: TeamMembership[];
}

const MemberProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<MemberProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('Member not found');
      setLoading(false);
      return;
    }

    api
      .get<MemberProfilePayload>(`/api/member-profiles/${userId}`)
      .then((payload) => {
        setProfile(payload);
        setError(null);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load member profile');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const accentColor = useMemo(
    () => profile?.memberships[0]?.team.color || '#111111',
    [profile]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 glass-strong px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
              <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
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
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="font-serif text-4xl text-foreground mb-3">Member Profile Unavailable</h1>
          <p className="text-muted-foreground">{error || 'This member page could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-strong px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
            <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
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

      <section className="relative overflow-hidden">
        {profile.cover_image_url ? (
          <div className="absolute inset-0">
            <img src={profile.cover_image_url} alt={profile.display_name || 'Member cover'} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/60" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, #111111 55%, #f6f1e8 140%)`,
            }}
          />
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%)]" />
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-end">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[32px] overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm shadow-2xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || 'Member avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl font-serif text-white/90">
                    {(profile.display_name || 'M')[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.22em]">IEEE CS Member Profile</span>
              </div>

              <h1 className="font-serif text-5xl md:text-7xl leading-[0.92] tracking-tight">
                {profile.display_name || 'Team Member'}
              </h1>

              {profile.headline && (
                <p className="text-lg md:text-2xl text-white/80 mt-4 max-w-3xl">{profile.headline}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-6">
                {profile.location && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </span>
                )}
                {profile.memberships.map((membership) => (
                  <span
                    key={membership.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${membership.team.color}22`,
                      border: `1px solid ${membership.team.color}55`,
                    }}
                  >
                    <Award className="w-4 h-4" />
                    {membership.team.name}
                    {membership.is_head ? ' Head' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="space-y-8">
            <div className="rounded-[32px] bg-card border border-border/50 p-8 shadow-elegant">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-3xl text-foreground">About</h2>
              </div>
              <p className="text-muted-foreground leading-8 text-base whitespace-pre-wrap">
                {profile.bio || 'This member has not added a public bio yet.'}
              </p>
            </div>

            {profile.favorite_quote && (
              <div className="rounded-[32px] border border-border/50 p-8 bg-gradient-to-br from-secondary/60 to-background shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <Quote className="w-6 h-6 text-accent" />
                  <h2 className="font-serif text-2xl text-foreground">Signature Line</h2>
                </div>
                <p className="font-serif text-2xl md:text-3xl leading-relaxed text-foreground/90">
                  “{profile.favorite_quote}”
                </p>
              </div>
            )}

            {profile.achievements.length > 0 && (
              <div className="rounded-[32px] bg-card border border-border/50 p-8 shadow-soft">
                <h2 className="font-serif text-3xl text-foreground mb-6">Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.achievements.map((achievement, index) => (
                    <div key={`${achievement}-${index}`} className="rounded-2xl bg-muted/50 border border-border/40 p-5">
                      <span className="text-xs uppercase tracking-[0.22em] text-accent">Highlight {index + 1}</span>
                      <p className="text-foreground mt-2 leading-7">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {profile.specialties.length > 0 && (
              <div className="rounded-[32px] bg-card border border-border/50 p-8 shadow-soft">
                <h2 className="font-serif text-3xl text-foreground mb-6">Specialties</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.specialties.map((specialty, index) => (
                    <span
                      key={`${specialty}-${index}`}
                      className="px-4 py-2 rounded-full text-sm font-medium border"
                      style={{
                        backgroundColor: `${accentColor}15`,
                        borderColor: `${accentColor}40`,
                        color: accentColor,
                      }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[32px] bg-card border border-border/50 p-8 shadow-soft">
              <h2 className="font-serif text-3xl text-foreground mb-6">Domains & Roles</h2>
              <div className="space-y-4">
                {profile.memberships.map((membership) => (
                  <div key={membership.id} className="rounded-2xl border border-border/40 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{membership.team.name}</h3>
                          {membership.is_head && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                              Domain Head
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1">{membership.position_title}</p>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: membership.team.color }}
                      />
                    </div>
                    {membership.team.description && (
                      <p className="text-sm text-muted-foreground mt-4 leading-6">{membership.team.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] bg-card border border-border/50 p-8 shadow-soft">
              <h2 className="font-serif text-3xl text-foreground mb-6">Connect</h2>
              <div className="space-y-3">
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors">
                    <span className="flex items-center gap-3 text-foreground"><Globe className="w-4 h-4" /> Website</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors">
                    <span className="flex items-center gap-3 text-foreground"><Linkedin className="w-4 h-4" /> LinkedIn</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors">
                    <span className="flex items-center gap-3 text-foreground"><Github className="w-4 h-4" /> GitHub</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors">
                    <span className="flex items-center gap-3 text-foreground"><Twitter className="w-4 h-4" /> Twitter</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
                {!profile.website_url && !profile.linkedin_url && !profile.github_url && !profile.twitter_url && (
                  <p className="text-muted-foreground">No public links added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MemberProfile;
