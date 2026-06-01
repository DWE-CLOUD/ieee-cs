import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, FileText, Save, Loader2, LogOut, ClipboardList, Camera, Upload, ExternalLink, Mail, Shield } from 'lucide-react';
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
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
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
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
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
      setEmailForm((current) => ({
        ...current,
        email: profile.email || '',
      }));
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

  const handleChangeEmail = async () => {
    if (!user) return;

    setIsChangingEmail(true);
    try {
      await api.patch('/api/profile/email', emailForm);
      toast.success('Login email updated');
      setEmailForm((current) => ({ ...current, password: '' }));
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.patch('/api/profile/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password updated');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
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
            {(isAdmin || isManager) && (
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
                  {!isAdmin && isManager && (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent rounded-full">
                      Team Lead
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
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Change your login email in Security below.
                  </p>
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

          {isMember && (
            <div className="mb-3 mt-2">
              <h2 className="font-serif text-2xl text-foreground">Other</h2>
              <p className="text-sm text-muted-foreground">
                Open dedicated workspaces for your public details page and resume.
              </p>
            </div>
          )}

          {isMember && (
            <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 p-5 md:p-8 shadow-elegant mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-medium text-foreground text-lg">Details Page Editor</h2>
                    <p className="text-sm text-muted-foreground">
                      Design your public member page with a live preview.
                    </p>
                  </div>
                </div>
                <Link
                  to="/member-editor"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90"
                >
                  Open Details Editor
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {isMember && (
            <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 p-5 md:p-8 shadow-elegant mb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-medium text-foreground text-lg">Resume Builder</h2>
                    <p className="text-sm text-muted-foreground">
                      Build and export a clean resume in a focused editor.
                    </p>
                  </div>
                </div>
                <Link
                  to="/resume"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground transition-all duration-300 hover:bg-muted"
                >
                  Open Resume
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 p-5 md:p-8 shadow-elegant mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-medium text-foreground text-lg">Security</h2>
                <p className="text-sm text-muted-foreground">Change your login email and password.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border/50 p-4 md:p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">Login Email</h3>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Email</label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Confirm password"
                    />
                  </div>
                  <button
                    onClick={handleChangeEmail}
                    disabled={isChangingEmail || !emailForm.email || !emailForm.password}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-foreground text-primary-foreground text-sm font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                  >
                    {isChangingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Update Email
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 p-4 md:p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !passwordForm.current_password ||
                    !passwordForm.new_password ||
                    !passwordForm.confirm_password
                  }
                  className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-sm font-medium text-foreground transition-all duration-300 hover:bg-muted disabled:opacity-50"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </div>
          </div>

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
