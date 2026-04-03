import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, FileText, Linkedin, Github, Twitter, Save, Loader2, LogOut, ClipboardList, Camera, Upload, MapPin, Globe, Sparkles, ExternalLink, Palette, Hash, LayoutTemplate, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ieeeLogo from '@/assets/ieee-logo.png';
import ApplicationsTracker from '@/components/profile/ApplicationsTracker';
import TeamBadges from '@/components/profile/TeamBadges';
import TeamManagerDownloads from '@/components/profile/TeamManagerDownloads';
import { api } from '@/lib/api';
import { getMemberProfilePath } from '@/lib/members';

const Profile = () => {
  const { user, profile, isAdmin, isManager, managedTeams, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    bio: '',
    headline: '',
    location: '',
    website_url: '',
    cover_image_url: '',
    public_slug: '',
    theme_primary: '#1d4ed8',
    theme_secondary: '#0f172a',
    theme_surface: '#f8fafc',
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
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        headline: profile.headline || '',
        location: profile.location || '',
        website_url: profile.website_url || '',
        cover_image_url: profile.cover_image_url || '',
        public_slug: profile.public_slug || '',
        theme_primary: profile.theme_primary || '#1d4ed8',
        theme_secondary: profile.theme_secondary || '#0f172a',
        theme_surface: profile.theme_surface || '#f8fafc',
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
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    api
      .get<{ id: string }[]>('/api/team-memberships/me')
      .then((memberships) => setIsMember(memberships.length > 0))
      .catch(() => setIsMember(false));
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/api/profile/avatar', formData);
      toast.success('Profile picture updated successfully');
      await refreshProfile();
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);

    try {
      await api.patch('/api/profile', formData);
      toast.success('Profile updated successfully');
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }

    setIsSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const publicProfilePath = getMemberProfilePath(profile?.public_slug, user?.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
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
          <div className="flex items-center gap-3 md:gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 py-6 md:px-6 md:py-12">
        <div 
          className="max-w-2xl mx-auto transition-all duration-700"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 p-5 md:p-8 shadow-elegant mb-6">
            {/* Avatar & Email */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-6 md:mb-8 md:pb-8 border-b border-border/50">
              {/* Avatar with upload */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.display_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-accent" />
                  )}
                </div>
                
                {/* Upload overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 rounded-full bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-primary-foreground" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                <h2 className="font-medium text-foreground text-base md:text-lg">
                  {profile?.display_name || 'User'}
                </h2>
                {profile?.headline && (
                  <p className="text-sm text-foreground/80 mt-1">{profile.headline}</p>
                )}
                <p className="text-muted-foreground text-sm">{profile?.email}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {isAdmin && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                {/* Team Badges */}
                {user && <TeamBadges userId={user.id} />}
                {isMember && user && (
                  <Link
                    to={publicProfilePath}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors break-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Preview public member page
                  </Link>
                )}
                
                {/* Upload hint */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Change profile picture
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5 md:space-y-6">
              {/* Display Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Your name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    Headline
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Frontend lead, builder, design systems enthusiast"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    Public Slug
                  </label>
                  <input
                    type="text"
                    value={formData.public_slug}
                    onChange={(e) => setFormData({ ...formData, public_slug: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="your-name"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your page will open at `{getMemberProfilePath(formData.public_slug || null, user?.id)}`.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="Chennai, India"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-6">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Page Look</h3>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="https://images.example.com/cover.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={formData.theme_primary}
                      onChange={(e) => setFormData({ ...formData, theme_primary: e.target.value })}
                      className="w-full h-12 rounded-xl border border-border bg-background cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Secondary Color</label>
                    <input
                      type="color"
                      value={formData.theme_secondary}
                      onChange={(e) => setFormData({ ...formData, theme_secondary: e.target.value })}
                      className="w-full h-12 rounded-xl border border-border bg-background cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Surface Color</label>
                    <input
                      type="color"
                      value={formData.theme_surface}
                      onChange={(e) => setFormData({ ...formData, theme_surface: e.target.value })}
                      className="w-full h-12 rounded-xl border border-border bg-background cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 space-y-6">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Page Copy & Sections</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Hero Label</label>
                    <input
                      type="text"
                      value={formData.profile_intro_label}
                      onChange={(e) => setFormData({ ...formData, profile_intro_label: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="IEEE CS Member Profile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">About Section Title</label>
                    <input
                      type="text"
                      value={formData.about_title}
                      onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="About"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Specialties Title</label>
                    <input
                      type="text"
                      value={formData.specialties_title}
                      onChange={(e) => setFormData({ ...formData, specialties_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Specialties"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Highlights Title</label>
                    <input
                      type="text"
                      value={formData.highlights_title}
                      onChange={(e) => setFormData({ ...formData, highlights_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Highlights"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Connect Title</label>
                    <input
                      type="text"
                      value={formData.connect_title}
                      onChange={(e) => setFormData({ ...formData, connect_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Connect"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Focus Card Title</label>
                    <input
                      type="text"
                      value={formData.focus_title}
                      onChange={(e) => setFormData({ ...formData, focus_title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Currently Building"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Focus Card Body</label>
                  <textarea
                    value={formData.focus_body}
                    onChange={(e) => setFormData({ ...formData, focus_body: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                    placeholder="What are you building, exploring, or leading right now?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      CTA Label
                    </label>
                    <input
                      type="text"
                      value={formData.cta_label}
                      onChange={(e) => setFormData({ ...formData, cta_label: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="View Portfolio"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      CTA URL
                    </label>
                    <input
                      type="url"
                      value={formData.cta_url}
                      onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="https://yourportfolio.com/work"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Specialties
                </label>
                <textarea
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder={'React\nUI Systems\nMachine Learning'}
                />
                <p className="text-xs text-muted-foreground mt-1">One specialty per line.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Achievements / Highlights
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder={'Led the web team for HackFest\nBuilt the society website\nWon 2 internal hackathons'}
                />
                <p className="text-xs text-muted-foreground mt-1">One highlight per line.</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  Favorite Quote
                </label>
                <textarea
                  value={formData.favorite_quote}
                  onChange={(e) => setFormData({ ...formData, favorite_quote: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="A short quote or line that represents you"
                />
              </div>

              {/* Social Links */}
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-4">Social Links</h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Github className="w-4 h-4" />
                      GitHub
                    </label>
                    <input
                      type="url"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={formData.twitter_url}
                      onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-6 md:mt-8 py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Team Manager Downloads */}
          {isManager && managedTeams.length > 0 && (
            <TeamManagerDownloads managedTeams={managedTeams} />
          )}

          {/* My Applications Section */}
          <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 p-5 md:p-8 shadow-elegant mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-medium text-foreground text-lg">My Applications</h2>
                <p className="text-sm text-muted-foreground">Track your submitted applications</p>
              </div>
            </div>
            <ApplicationsTracker />
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 rounded-xl border border-destructive/50 text-destructive font-medium transition-all duration-300 hover:bg-destructive/10 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
