import { ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Palette,
  Save,
  Sparkles,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import ieeeLogo from '@/assets/ieee-logo.png';
import { getMemberProfilePath } from '@/lib/members';

const defaultColors = {
  theme_primary: '#1d4ed8',
  theme_secondary: '#0f172a',
  theme_surface: '#f8fafc',
};

const MemberPageEditor = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [opening, setOpening] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    headline: '',
    bio: '',
    location: '',
    website_url: '',
    cover_image_url: '',
    public_slug: '',
    theme_primary: defaultColors.theme_primary,
    theme_secondary: defaultColors.theme_secondary,
    theme_surface: defaultColors.theme_surface,
    profile_intro_label: '',
    about_title: '',
    specialties_title: '',
    highlights_title: '',
    connect_title: '',
    focus_title: '',
    focus_body: '',
    cta_label: '',
    cta_url: '',
    specialties: '',
    achievements: '',
    favorite_quote: '',
    linkedin_url: '',
    github_url: '',
    twitter_url: '',
  });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!profile) return;

    setFormData({
      display_name: profile.display_name || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website_url: profile.website_url || '',
      cover_image_url: profile.cover_image_url || '',
      public_slug: profile.public_slug || '',
      theme_primary: profile.theme_primary || defaultColors.theme_primary,
      theme_secondary: profile.theme_secondary || defaultColors.theme_secondary,
      theme_surface: profile.theme_surface || defaultColors.theme_surface,
      profile_intro_label: profile.profile_intro_label || '',
      about_title: profile.about_title || '',
      specialties_title: profile.specialties_title || '',
      highlights_title: profile.highlights_title || '',
      connect_title: profile.connect_title || '',
      focus_title: profile.focus_title || '',
      focus_body: profile.focus_body || '',
      cta_label: profile.cta_label || '',
      cta_url: profile.cta_url || '',
      specialties: (profile.specialties || []).join('\n'),
      achievements: (profile.achievements || []).join('\n'),
      favorite_quote: profile.favorite_quote || '',
      linkedin_url: profile.linkedin_url || '',
      github_url: profile.github_url || '',
      twitter_url: profile.twitter_url || '',
    });

    const timer = window.setTimeout(() => setOpening(false), 350);
    return () => window.clearTimeout(timer);
  }, [profile]);

  const updateField = (key: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/api/profile', formData);
      toast.success('Member page saved');
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save member page');
    } finally {
      setSaving(false);
    }
  };

  if (loading || opening) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-accent mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-foreground">Opening editor</h1>
          <p className="text-sm text-muted-foreground mt-2">Loading your live member page workspace.</p>
        </div>
      </div>
    );
  }

  const previewSpecialties = formData.specialties.split('\n').map((item) => item.trim()).filter(Boolean);
  const previewAchievements = formData.achievements.split('\n').map((item) => item.trim()).filter(Boolean);
  const publicPath = getMemberProfilePath(formData.public_slug || null, user?.id);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Profile
            </Link>
            <Link
              to={publicPath}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Public Page
            </Link>
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-7xl mx-auto grid gap-6 xl:grid-cols-[460px_1fr]">
          <section>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
                <Sparkles className="w-4 h-4" />
                Member Page
              </div>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground">Page Editor</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Tune your public page copy, colors, sections, and profile link with a live preview.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-5 md:p-6 space-y-5">
              <Field label="Display Name" value={formData.display_name} onChange={(value) => updateField('display_name', value)} />
              <Field label="Headline" value={formData.headline} onChange={(value) => updateField('headline', value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Public Slug" value={formData.public_slug} onChange={(value) => updateField('public_slug', value)} />
                <Field label="Location" value={formData.location} onChange={(value) => updateField('location', value)} />
              </div>
              <Field label="Cover Image URL" value={formData.cover_image_url} onChange={(value) => updateField('cover_image_url', value)} />
              <Area label="Bio" rows={4} value={formData.bio} onChange={(value) => updateField('bio', value)} />

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium text-foreground">Visual Style</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {(['theme_primary', 'theme_secondary', 'theme_surface'] as const).map((key) => (
                    <label key={key} className="block">
                      <span className="block text-xs text-muted-foreground mb-2">
                        {key.replace('theme_', '')}
                      </span>
                      <input
                        type="color"
                        value={formData[key]}
                        onChange={(event) => updateField(key, event.target.value)}
                        className="w-full h-11 rounded-xl border border-border bg-background cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                <Field label="Intro Label" value={formData.profile_intro_label} onChange={(value) => updateField('profile_intro_label', value)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="CTA Label" value={formData.cta_label} onChange={(value) => updateField('cta_label', value)} />
                  <Field label="CTA URL" value={formData.cta_url} onChange={(value) => updateField('cta_url', value)} />
                </div>
                <Field label="Focus Title" value={formData.focus_title} onChange={(value) => updateField('focus_title', value)} />
                <Area label="Focus Body" rows={3} value={formData.focus_body} onChange={(value) => updateField('focus_body', value)} />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                <Area label="Specialties" rows={4} value={formData.specialties} onChange={(value) => updateField('specialties', value)} />
                <Area label="Highlights" rows={4} value={formData.achievements} onChange={(value) => updateField('achievements', value)} />
                <Area label="Favorite Quote" rows={2} value={formData.favorite_quote} onChange={(value) => updateField('favorite_quote', value)} />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Website" value={formData.website_url} onChange={(value) => updateField('website_url', value)} />
                  <Field label="LinkedIn" value={formData.linkedin_url} onChange={(value) => updateField('linkedin_url', value)} />
                  <Field label="GitHub" value={formData.github_url} onChange={(value) => updateField('github_url', value)} />
                  <Field label="Twitter" value={formData.twitter_url} onChange={(value) => updateField('twitter_url', value)} />
                </div>
              </div>
            </div>
          </section>

          <section className="xl:sticky xl:top-24 xl:self-start">
            <div
              className="rounded-3xl overflow-hidden border border-border/50 shadow-elegant bg-white"
              style={{ backgroundColor: formData.theme_surface }}
            >
              <div
                className="relative min-h-[360px] p-8 md:p-10 text-white"
                style={{
                  background: formData.cover_image_url
                    ? `linear-gradient(135deg, ${formData.theme_secondary}dd, ${formData.theme_primary}aa), url(${formData.cover_image_url}) center/cover`
                    : `linear-gradient(135deg, ${formData.theme_primary}, ${formData.theme_secondary})`,
                }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs uppercase tracking-widest mb-8">
                  <Sparkles className="w-4 h-4" />
                  {formData.profile_intro_label || 'IEEE CS Member Profile'}
                </div>
                <div className="grid gap-6 md:grid-cols-[130px_1fr] md:items-end">
                  <div className="aspect-[4/5] rounded-3xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={formData.display_name || 'Member'} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-14 h-14 text-white/80" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-4xl md:text-6xl leading-none">
                      {formData.display_name || 'Your Name'}
                    </h2>
                    <p className="mt-4 text-white/80 text-lg">{formData.headline || 'Your headline appears here'}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="space-y-6">
                  <PreviewBlock title={formData.about_title || 'About'}>
                    <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                      {formData.bio || 'Write a short public introduction for your member page.'}
                    </p>
                  </PreviewBlock>
                  {formData.focus_body && (
                    <PreviewBlock title={formData.focus_title || 'Current Focus'}>
                      <p className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">{formData.focus_body}</p>
                    </PreviewBlock>
                  )}
                  {previewAchievements.length > 0 && (
                    <PreviewBlock title={formData.highlights_title || 'Highlights'}>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {previewAchievements.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </PreviewBlock>
                  )}
                </div>
                <div className="space-y-6">
                  {previewSpecialties.length > 0 && (
                    <PreviewBlock title={formData.specialties_title || 'Specialties'}>
                      <div className="flex flex-wrap gap-2">
                        {previewSpecialties.map((item) => (
                          <span
                            key={item}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border"
                            style={{
                              color: formData.theme_primary,
                              borderColor: `${formData.theme_primary}55`,
                              backgroundColor: `${formData.theme_primary}12`,
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </PreviewBlock>
                  )}
                  <PreviewBlock title={formData.connect_title || 'Connect'}>
                    <div className="flex flex-wrap gap-2">
                      {formData.website_url && <Globe className="w-5 h-5 text-muted-foreground" />}
                      {formData.linkedin_url && <Linkedin className="w-5 h-5 text-muted-foreground" />}
                      {formData.github_url && <Github className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </PreviewBlock>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-foreground mb-2">{label}</span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  </label>
);

const Area = ({
  label,
  rows,
  value,
  onChange,
}: {
  label: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-foreground mb-2">{label}</span>
    <textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
    />
  </label>
);

const PreviewBlock = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-2xl border border-border/50 bg-white p-5">
    <h3 className="font-serif text-xl text-foreground mb-3">{title}</h3>
    {children}
  </div>
);

export default MemberPageEditor;
