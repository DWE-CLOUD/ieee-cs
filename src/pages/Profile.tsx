import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, FileText, Linkedin, Github, Twitter, Save, Loader2, LogOut, ClipboardList, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ieeeLogo from '@/assets/ieee-logo.png';
import ApplicationsTracker from '@/components/profile/ApplicationsTracker';
import TeamBadges from '@/components/profile/TeamBadges';
import TeamManagerDownloads from '@/components/profile/TeamManagerDownloads';
import { api } from '@/lib/api';

const Profile = () => {
  const { user, profile, isAdmin, isManager, managedTeams, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    bio: '',
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
        linkedin_url: profile.linkedin_url || '',
        github_url: profile.github_url || '',
        twitter_url: profile.twitter_url || '',
      });
    }
  }, [profile]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-12">
        <div 
          className="max-w-2xl mx-auto transition-all duration-700"
          style={{ 
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl text-foreground mb-2">Your Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-card rounded-3xl border border-border/50 p-8 shadow-elegant mb-6">
            {/* Avatar & Email */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/50">
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
                <h2 className="font-medium text-foreground text-lg">
                  {profile?.display_name || 'User'}
                </h2>
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
            <div className="space-y-6">
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

              {/* Phone */}
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
              className="w-full mt-8 py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="bg-card rounded-3xl border border-border/50 p-8 shadow-elegant mb-6">
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
