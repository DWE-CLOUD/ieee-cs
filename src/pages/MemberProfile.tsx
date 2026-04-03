import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Github,
  Globe,
  Linkedin,
  Loader2,
  MapPin,
  Quote,
  Sparkles,
  Twitter,
} from 'lucide-react';
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
  public_slug: string | null;
  theme_primary: string | null;
  theme_secondary: string | null;
  theme_surface: string | null;
  profile_intro_label: string | null;
  about_title: string | null;
  specialties_title: string | null;
  highlights_title: string | null;
  connect_title: string | null;
  focus_title: string | null;
  focus_body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  specialties: string[];
  achievements: string[];
  favorite_quote: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  memberships: TeamMembership[];
}

const MemberProfile = () => {
  const { identifier } = useParams();
  const [profile, setProfile] = useState<MemberProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier) {
      setError('Member not found');
      setLoading(false);
      return;
    }

    api
      .get<MemberProfilePayload>(`/api/member-profiles/${identifier}`)
      .then((payload) => {
        setProfile(payload);
        setError(null);
      })
      .catch((fetchError) => {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load member profile');
      })
      .finally(() => setLoading(false));
  }, [identifier]);

  const theme = useMemo(() => {
    const base = profile?.memberships[0]?.team.color || '#1d4ed8';
    return {
      primary: profile?.theme_primary || base,
      secondary: profile?.theme_secondary || '#0f172a',
      surface: profile?.theme_surface || '#f8fafc',
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
              <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-16 md:px-6 md:py-24 text-center">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Member Profile Unavailable</h1>
          <p className="text-muted-foreground">{error || 'This member page could not be found.'}</p>
        </div>
      </div>
    );
  }

  const aboutTitle = profile.about_title || 'About';
  const specialtiesTitle = profile.specialties_title || 'Specialties';
  const highlightsTitle = profile.highlights_title || 'Highlights';
  const connectTitle = profile.connect_title || 'Connect';
  const introLabel = profile.profile_intro_label || 'IEEE CS Member Profile';
  const focusTitle = profile.focus_title || 'Current Focus';

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: `linear-gradient(180deg, ${theme.surface} 0%, #ffffff 45%, #f8fafc 100%)`,
      }}
    >
      <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
            <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: profile.cover_image_url
              ? undefined
              : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 58%, ${theme.surface} 180%)`,
          }}
        />
        {profile.cover_image_url ? (
          <div className="absolute inset-0">
            <img
              src={profile.cover_image_url}
              alt={profile.display_name || 'Member cover'}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.secondary}dd 0%, ${theme.primary}99 45%, rgba(15,23,42,0.84) 100%)`,
              }}
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%)]" />

        <div className="max-w-6xl mx-auto px-4 py-10 md:px-6 md:py-16 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 md:gap-8 items-end">
            <div className="relative">
              <div className="aspect-[4/5] rounded-[28px] md:rounded-[36px] overflow-hidden border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || 'Member avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl font-serif text-white/90">
                    {(profile.display_name || 'M')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-x-4 md:inset-x-6 -bottom-5 rounded-[24px] md:rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md px-4 py-3 text-white shadow-xl">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Profile URL</p>
                <p className="truncate text-sm font-medium">
                  /members/{profile.public_slug || profile.user_id}
                </p>
              </div>
            </div>

            <div className="text-white pt-10 lg:pt-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-[0.22em]">{introLabel}</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.92] tracking-tight">
                {profile.display_name || 'Team Member'}
              </h1>

              {profile.headline ? (
                <p className="text-base sm:text-lg md:text-2xl text-white/82 mt-4 max-w-3xl">{profile.headline}</p>
              ) : null}

              <div className="flex flex-wrap gap-3 mt-6">
                {profile.location ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </span>
                ) : null}
                {profile.memberships.map((membership) => (
                  <span
                    key={membership.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${membership.team.color}25`,
                      border: `1px solid ${membership.team.color}66`,
                    }}
                  >
                    <Award className="w-4 h-4" />
                    {membership.team.name}
                    {membership.is_head ? ' Head' : ''}
                  </span>
                ))}
              </div>

              {profile.cta_label && profile.cta_url ? (
                <div className="mt-8">
                  <a
                    href={profile.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium transition-transform hover:translate-x-0.5"
                    style={{
                      backgroundColor: '#ffffff',
                      color: theme.secondary,
                    }}
                  >
                    {profile.cta_label}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-6 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-8">
          <div className="space-y-8">
            <div
              className="rounded-[24px] md:rounded-[32px] border p-5 md:p-8 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]"
              style={{
                backgroundColor: '#ffffff',
                borderColor: `${theme.primary}22`,
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primary}18`, color: theme.primary }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-2xl md:text-3xl text-foreground">{aboutTitle}</h2>
              </div>
              <p className="text-muted-foreground leading-7 md:leading-8 text-sm md:text-base whitespace-pre-wrap">
                {profile.bio || 'This member has not added a public bio yet.'}
              </p>
            </div>

            {profile.focus_body ? (
              <div
                className="rounded-[24px] md:rounded-[32px] border p-5 md:p-8 shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]"
                style={{
                  background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)`,
                  borderColor: `${theme.primary}35`,
                }}
              >
                <p className="text-xs uppercase tracking-[0.22em] text-white/60 mb-3">{focusTitle}</p>
                <p className="text-white text-base md:text-xl leading-7 md:leading-8 whitespace-pre-wrap">
                  {profile.focus_body}
                </p>
              </div>
            ) : null}

            {profile.favorite_quote ? (
              <div
                className="rounded-[24px] md:rounded-[32px] border p-5 md:p-8"
                style={{
                  backgroundColor: `${theme.primary}10`,
                  borderColor: `${theme.primary}22`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Quote className="w-6 h-6" style={{ color: theme.primary }} />
                  <h2 className="font-serif text-xl md:text-2xl text-foreground">Signature Line</h2>
                </div>
                <p className="font-serif text-xl md:text-3xl leading-relaxed text-foreground/90">
                  “{profile.favorite_quote}”
                </p>
              </div>
            ) : null}

            {profile.achievements.length > 0 ? (
              <div className="rounded-[24px] md:rounded-[32px] border border-border/50 bg-card p-5 md:p-8 shadow-soft">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-5 md:mb-6">{highlightsTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.achievements.map((achievement, index) => (
                    <div
                      key={`${achievement}-${index}`}
                      className="rounded-2xl border p-5"
                      style={{
                        backgroundColor: `${theme.surface}`,
                        borderColor: `${theme.primary}1f`,
                      }}
                    >
                      <span
                        className="text-xs uppercase tracking-[0.22em]"
                        style={{ color: theme.primary }}
                      >
                        Highlight {index + 1}
                      </span>
                      <p className="text-foreground mt-2 leading-7">{achievement}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            {profile.specialties.length > 0 ? (
              <div className="rounded-[24px] md:rounded-[32px] border border-border/50 bg-card p-5 md:p-8 shadow-soft">
                <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-5 md:mb-6">{specialtiesTitle}</h2>
                <div className="flex flex-wrap gap-3">
                  {profile.specialties.map((specialty, index) => (
                    <span
                      key={`${specialty}-${index}`}
                      className="px-4 py-2 rounded-full text-sm font-medium border"
                      style={{
                        backgroundColor: `${theme.primary}14`,
                        borderColor: `${theme.primary}33`,
                        color: theme.primary,
                      }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[24px] md:rounded-[32px] border border-border/50 bg-card p-5 md:p-8 shadow-soft">
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-5 md:mb-6">Domains & Roles</h2>
              <div className="space-y-4">
                {profile.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-2xl border p-5"
                    style={{ borderColor: `${membership.team.color}2f` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-foreground">{membership.team.name}</h3>
                          {membership.is_head ? (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${membership.team.color}14`,
                                color: membership.team.color,
                              }}
                            >
                              Domain Head
                            </span>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-1">{membership.position_title}</p>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: membership.team.color }}
                      />
                    </div>
                    {membership.team.description ? (
                      <p className="text-sm text-muted-foreground mt-4 leading-6">
                        {membership.team.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] md:rounded-[32px] border border-border/50 bg-card p-5 md:p-8 shadow-soft">
              <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-5 md:mb-6">{connectTitle}</h2>
              <div className="space-y-3">
                {profile.website_url ? (
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-foreground">
                      <Globe className="w-4 h-4" />
                      Website
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                ) : null}
                {profile.linkedin_url ? (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-foreground">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                ) : null}
                {profile.github_url ? (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-foreground">
                      <Github className="w-4 h-4" />
                      GitHub
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                ) : null}
                {profile.twitter_url ? (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 px-4 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-3 text-foreground">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                ) : null}
                {!profile.website_url && !profile.linkedin_url && !profile.github_url && !profile.twitter_url ? (
                  <p className="text-muted-foreground">No public links added yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MemberProfile;
