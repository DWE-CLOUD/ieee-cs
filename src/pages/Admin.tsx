import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Briefcase, Users, UserCheck, FileText, Plus, Edit2, Trash2, 
  Loader2, Check, X, ChevronDown, Eye, Clock, Mail, Phone, Download, Settings, Shield,
  CalendarDays, MapPin, Link as LinkIcon, Image, Star, Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ieeeLogo from '@/assets/ieee-cs-logo.png';
import { FormBuilder, FormField } from '@/components/admin/FormBuilder';
import ApplicationDetailModal from '@/components/admin/ApplicationDetailModal';
import ManagerAssignment from '@/components/admin/ManagerAssignment';
import TeamMembersManager from '@/components/admin/TeamMembersManager';
import GalleryManager from '@/components/admin/GalleryManager';
import LandingContentManager from '@/components/admin/LandingContentManager';
import { format } from 'date-fns';
import { api } from '@/lib/api';

type TabType = 'positions' | 'teams' | 'applications' | 'users' | 'events' | 'members' | 'gallery' | 'landing';

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

interface Team {
  id: string;
  name: string;
  description: string | null;
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

interface Application {
  id: string;
  position_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  status: string;
  created_at: string;
  accepted_by: string | null;
  remarks: string | null;
  positions?: Position;
  accepted_by_profile?: { display_name: string | null };
}

interface ApplicationResponse {
  id: string;
  application_id: string;
  field_id: string;
  field_label: string;
  field_type: string;
  response_value: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const [isLoaded, setIsLoaded] = useState(false);

  // Data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<(UserProfile & { roles: UserRole[] })[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Modal states
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
      toast.error('Access denied');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, activeTab]);

  const fetchData = async () => {
    setIsDataLoading(true);

    try {
      const data = await api.get<{
        teams: Team[];
        positions: Position[];
        applications: Application[];
        users: (UserProfile & { roles: UserRole[] })[];
        events: Event[];
      }>('/api/admin/dashboard');

      setTeams(data.teams);
      setPositions(data.positions);
      setApplications(data.applications);
      setUsers(data.users);
      setEvents(data.events);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleDeletePosition = async (id: string) => {
    if (!confirm('Are you sure you want to delete this position?')) return;

    try {
      await api.delete(`/api/admin/positions/${id}`);
      toast.success('Position deleted');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete position');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/api/admin/events/${id}`);
      toast.success('Event deleted');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      await api.delete(`/api/admin/teams/${id}`);
      toast.success('Team deleted');
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete team');
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: string, remarks?: string) => {
    try {
      await api.patch(`/api/admin/applications/${id}/status`, { status, remarks });
      toast.success('Application status updated');
      fetchData();
      setSelectedApplication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    try {
      if (currentlyAdmin) {
        await api.delete(`/api/admin/users/${userId}/roles/admin`);
        toast.success('Admin role removed');
      } else {
        await api.post(`/api/admin/users/${userId}/roles/admin`);
        toast.success('Admin role added');
      }
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${currentlyAdmin ? 'remove' : 'add'} admin role`);
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const tabs = [
    { id: 'positions' as TabType, label: 'Positions', icon: Briefcase, count: positions.length },
    { id: 'teams' as TabType, label: 'Teams', icon: Users, count: teams.length },
    { id: 'members' as TabType, label: 'Members', icon: Award, count: null },
    { id: 'events' as TabType, label: 'Events', icon: CalendarDays, count: events.length },
    { id: 'gallery' as TabType, label: 'Gallery', icon: Image, count: null },
    { id: 'landing' as TabType, label: 'Landing', icon: Settings, count: null },
    { id: 'applications' as TabType, label: 'Applications', icon: FileText, count: applications.filter(a => a.status === 'pending').length },
    { id: 'users' as TabType, label: 'Users', icon: UserCheck, count: users.length },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
            <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
          </Link>
          <Link to="/" className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div 
          className="max-w-7xl mx-auto transition-all duration-700"
          style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(20px)' }}
        >
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage positions, teams, applications, and users</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-foreground text-primary-foreground shadow-elegant'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card rounded-2xl md:rounded-3xl border border-border/50 shadow-elegant overflow-hidden">
            {isDataLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : (
              <>
                {/* Positions Tab */}
                {activeTab === 'positions' && (
                  <div>
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <h2 className="font-serif text-xl text-foreground">All Positions</h2>
                      <button
                        onClick={() => { setEditingPosition(null); setShowPositionModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium transition-all duration-300 hover:opacity-90"
                      >
                        <Plus className="w-4 h-4" />
                        Add Position
                      </button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {positions.map((position) => (
                        <div key={position.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-foreground">{position.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                position.status === 'open' ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
                              }`}>
                                {position.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {position.teams?.name || 'No team'} • {position.type} • {position.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingPosition(position); setShowPositionModal(true); }}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(position.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {positions.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No positions yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teams Tab */}
                {activeTab === 'teams' && (
                  <div>
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <h2 className="font-serif text-xl text-foreground">All Teams</h2>
                      <button
                        onClick={() => { setEditingTeam(null); setShowTeamModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium transition-all duration-300 hover:opacity-90"
                      >
                        <Plus className="w-4 h-4" />
                        Add Team
                      </button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
                            <div>
                              <h3 className="font-medium text-foreground">{team.name}</h3>
                              <p className="text-sm text-muted-foreground">{team.description || 'No description'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingTeam(team); setShowTeamModal(true); }}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div>
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <div>
                        <h2 className="font-serif text-xl text-foreground">Team Members</h2>
                        <p className="text-sm text-muted-foreground mt-1">Manage accepted members and their team badges</p>
                      </div>
                    </div>
                    <TeamMembersManager teams={teams} users={users} onUpdate={fetchData} />
                  </div>
                )}

                {/* Gallery Tab */}
                {activeTab === 'gallery' && (
                  <div className="p-6">
                    <GalleryManager />
                  </div>
                )}

                {activeTab === 'landing' && <LandingContentManager />}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <div className="flex items-center justify-between p-6 border-b border-border/50">
                      <h2 className="font-serif text-xl text-foreground">All Events</h2>
                      <button
                        onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium transition-all duration-300 hover:opacity-90"
                      >
                        <Plus className="w-4 h-4" />
                        Add Event
                      </button>
                    </div>
                    <div className="divide-y divide-border/50">
                      {events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            {event.image_url ? (
                              <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-xl object-cover" />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-medium text-foreground">{event.title}</h3>
                                {event.is_featured && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/15 text-gold flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Featured
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === 'upcoming' ? 'bg-accent/15 text-accent' :
                                  event.status === 'ongoing' ? 'bg-green-500/15 text-green-600' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3" />
                                  {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-muted text-xs">{event.type}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingEvent(event); setShowEventModal(true); }}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {events.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">No events yet</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                  <div>
                    <div className="p-6 border-b border-border/50">
                      <h2 className="font-serif text-xl text-foreground">All Applications</h2>
                    </div>
                    
                    {/* Status Sections */}
                    {['pending', 'reviewing', 'accepted', 'rejected'].map((status) => {
                      const statusApps = applications.filter(a => a.status === status);
                      if (statusApps.length === 0) return null;
                      
                      const statusConfig: Record<string, { label: string; bg: string }> = {
                        pending: { label: 'Pending', bg: 'bg-gold/10 border-gold/30' },
                        reviewing: { label: 'Reviewing', bg: 'bg-accent/10 border-accent/30' },
                        accepted: { label: 'Accepted', bg: 'bg-green-500/10 border-green-500/30' },
                        rejected: { label: 'Rejected', bg: 'bg-destructive/10 border-destructive/30' },
                      };
                      
                      return (
                        <div key={status} className="mb-6">
                          <div className={`px-6 py-3 border-l-4 ${statusConfig[status].bg}`}>
                            <h3 className="font-medium text-foreground">
                              {statusConfig[status].label} ({statusApps.length})
                            </h3>
                          </div>
                          <div className="divide-y divide-border/50">
                            {statusApps.map((app) => (
                              <div 
                                key={app.id} 
                                className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-medium text-foreground">{app.full_name}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      app.status === 'pending' ? 'bg-gold/15 text-gold' :
                                      app.status === 'reviewing' ? 'bg-accent/15 text-accent' :
                                      app.status === 'accepted' ? 'bg-green-500/15 text-green-600' :
                                      'bg-destructive/15 text-destructive'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {app.positions?.title || 'Unknown position'} • {app.email}
                                  </p>
                                  {app.status === 'accepted' && app.accepted_by_profile && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Accepted by: {app.accepted_by_profile.display_name || 'Unknown'}
                                    </p>
                                  )}
                                  {app.remarks && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      Remark: {app.remarks}
                                    </p>
                                  )}
                                </div>
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {applications.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">No applications yet</div>
                    )}
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <div className="p-6 border-b border-border/50">
                      <h2 className="font-serif text-xl text-foreground">All Users</h2>
                      <p className="text-sm text-muted-foreground mt-1">Manage user roles and team assignments</p>
                    </div>
                    <div className="divide-y divide-border/50">
                      {users.map((u) => {
                        const userIsAdmin = u.roles.some(r => r.role === 'admin');
                        const userIsManager = u.roles.some(r => r.role === 'manager');
                        const isCurrentUser = u.user_id === user?.id;
                        
                        return (
                          <div key={u.id} className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-medium text-foreground">{u.display_name || 'Unknown'}</h3>
                                {userIsAdmin && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent">
                                    Admin
                                  </span>
                                )}
                                {userIsManager && !userIsAdmin && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/15 text-gold flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Manager
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                            {!isCurrentUser && (
                              <div className="flex items-center gap-2">
                                {/* Manager Assignment */}
                                {!userIsAdmin && (
                                  <ManagerAssignment
                                    userId={u.user_id}
                                    userName={u.display_name || u.email || 'User'}
                                    teams={teams}
                                    onUpdate={fetchData}
                                  />
                                )}
                                {/* Admin Toggle */}
                                <button
                                  onClick={() => handleToggleAdmin(u.user_id, userIsAdmin)}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    userIsAdmin 
                                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                                      : 'bg-accent/10 text-accent hover:bg-accent/20'
                                  }`}
                                >
                                  {userIsAdmin ? 'Remove Admin' : 'Make Admin'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Position Modal */}
      {showPositionModal && (
        <PositionModal
          position={editingPosition}
          teams={teams}
          onClose={() => setShowPositionModal(false)}
          onSave={() => { setShowPositionModal(false); fetchData(); }}
        />
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <TeamModal
          team={editingTeam}
          onClose={() => setShowTeamModal(false)}
          onSave={() => { setShowTeamModal(false); fetchData(); }}
        />
      )}

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          onClose={() => setShowEventModal(false)}
          onSave={() => { setShowEventModal(false); fetchData(); }}
        />
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdateStatus={handleUpdateApplicationStatus}
        />
      )}
    </div>
  );
};

// Position Modal Component
const PositionModal = ({ 
  position, 
  teams, 
  onClose, 
  onSave 
}: { 
  position: Position | null; 
  teams: Team[]; 
  onClose: () => void; 
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: position?.title || '',
    description: position?.description || '',
    requirements: position?.requirements?.join('\n') || '',
    team_id: position?.team_id || '',
    type: position?.type || 'Volunteer',
    location: position?.location || 'Remote',
    status: position?.status || 'open',
    deadline: position?.deadline ? new Date(position.deadline).toISOString().split('T')[0] : '',
  });
  const [formFields, setFormFields] = useState<FormField[]>(
    (position?.form_fields as FormField[]) || []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'details' | 'form'>('details');

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    
    const data = {
      title: formData.title,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      team_id: formData.team_id || null,
      type: formData.type,
      location: formData.location,
      status: formData.status,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      form_fields: formFields as unknown as Record<string, unknown>[],
    };

    if (position) {
      try {
        await api.patch(`/api/admin/positions/${position.id}`, data);
        toast.success('Position updated');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update position');
      }
    } else {
      try {
        await api.post('/api/admin/positions', data);
        toast.success('Position created');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create position');
      }
    }
    
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md" onClick={onClose}>
      <div className="bg-background rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-elegant" onClick={e => e.stopPropagation()}>
        <div className="p-8 overflow-y-auto max-h-[90vh]">
          <h2 className="font-serif text-2xl text-foreground mb-4">
            {position ? 'Edit Position' : 'Add Position'}
          </h2>

          {/* Section Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveSection('details')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSection === 'details'
                  ? 'bg-foreground text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Position Details
            </button>
            <button
              onClick={() => setActiveSection('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSection === 'form'
                  ? 'bg-foreground text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" />
              Application Form
              {formFields.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-accent/20 text-accent">
                  {formFields.length}
                </span>
              )}
            </button>
          </div>
          
          {activeSection === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="e.g., Web Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Describe the role..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Requirements (one per line)</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="React experience&#10;Team collaboration&#10;..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Team</label>
                  <select
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Select team</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="Volunteer">Volunteer</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Full-time">Full-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>
          )}

          {activeSection === 'form' && (
            <FormBuilder fields={formFields} onChange={setFormFields} />
          )}

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium transition-all hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {position ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Modal Component
const TeamModal = ({ 
  team, 
  onClose, 
  onSave 
}: { 
  team: Team | null; 
  onClose: () => void; 
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    color: team?.color || '#3B82F6',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please enter a team name');
      return;
    }

    setIsSaving(true);
    
    if (team) {
      try {
        await api.patch(`/api/admin/teams/${team.id}`, formData);
        toast.success('Team updated');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update team');
      }
    } else {
      try {
        await api.post('/api/admin/teams', formData);
        toast.success('Team created');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create team');
      }
    }
    
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md" onClick={onClose}>
      <div className="bg-background rounded-3xl max-w-md w-full shadow-elegant" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <h2 className="font-serif text-2xl text-foreground mb-6">
            {team ? 'Edit Team' : 'Add Team'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g., Technical"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                placeholder="Describe the team..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-12 rounded-xl border border-border bg-background cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium transition-all hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {team ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Modal Component
const EventModal = ({ 
  event, 
  onClose, 
  onSave 
}: { 
  event: Event | null; 
  onClose: () => void; 
  onSave: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
    location: event?.location || '',
    type: event?.type || 'Workshop',
    image_url: event?.image_url || '',
    registration_url: event?.registration_url || '',
    is_featured: event?.is_featured || false,
    status: event?.status || 'upcoming',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSaving(true);
    
    const data = {
      title: formData.title,
      description: formData.description || null,
      date: new Date(formData.date).toISOString(),
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      location: formData.location || null,
      type: formData.type,
      image_url: formData.image_url || null,
      registration_url: formData.registration_url || null,
      is_featured: formData.is_featured,
      status: formData.status,
    };

    if (event) {
      try {
        await api.patch(`/api/admin/events/${event.id}`, data);
        toast.success('Event updated');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update event');
      }
    } else {
      try {
        await api.post('/api/admin/events', data);
        toast.success('Event created');
        onSave();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create event');
      }
    }
    
    setIsSaving(false);
  };

  const eventTypes = ['Workshop', 'Hackathon', 'Bootcamp', 'Webinar', 'Meetup', 'Conference', 'Competition', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md" onClick={onClose}>
      <div className="bg-background rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-elegant" onClick={e => e.stopPropagation()}>
        <div className="p-8 overflow-y-auto max-h-[90vh]">
          <h2 className="font-serif text-2xl text-foreground mb-6">
            {event ? 'Edit Event' : 'Add Event'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="e.g., Web Development Workshop"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                placeholder="Describe the event..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="e.g., CS Lab 204 or Online"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Image URL</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Registration URL</label>
              <input
                type="url"
                value={formData.registration_url}
                onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-5 h-5 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    Featured Event
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium transition-all hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl bg-foreground text-primary-foreground font-medium transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
