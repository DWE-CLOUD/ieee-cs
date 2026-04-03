import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Loader2, UserX, Download, FileSpreadsheet, Crown, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';

interface ApplicationResponse {
  field_label: string;
  response_value: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  position_title: string;
  is_head: boolean;
  joined_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    phone: string | null;
    bio: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    twitter_url: string | null;
  };
  applicationResponses?: ApplicationResponse[];
}

interface Team {
  id: string;
  name: string;
  color: string;
}

interface AdminUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

interface TeamMembersManagerProps {
  teams: Team[];
  users: AdminUser[];
  onUpdate: () => void;
}

const TeamMembersManager = ({ teams, users, onUpdate }: TeamMembersManagerProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignment, setAssignment] = useState({
    user_id: '',
    team_id: '',
    position_title: '',
    is_head: false,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!assignment.team_id && teams.length > 0) {
      setAssignment((current) => ({ ...current, team_id: teams[0].id }));
    }
  }, [assignment.team_id, teams]);

  useEffect(() => {
    if (!assignment.user_id && users.length > 0) {
      setAssignment((current) => ({ ...current, user_id: users[0].user_id }));
    }
  }, [assignment.user_id, users]);

  const fetchMembers = async () => {
    setIsLoading(true);

    try {
      const membersData = await api.get<TeamMember[]>('/api/admin/team-members');
      setMembers(membersData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedExistingMember =
    members.find(
      (member) => member.user_id === assignment.user_id && member.team_id === assignment.team_id
    ) || null;

  const handleAssignMember = async () => {
    if (!assignment.user_id || !assignment.team_id || !assignment.position_title.trim()) {
      toast.error('Select a user, team, and position title');
      return;
    }

    setIsAssigning(true);

    try {
      await api.post('/api/admin/team-members', {
        user_id: assignment.user_id,
        team_id: assignment.team_id,
        position_title: assignment.position_title.trim(),
        is_head: assignment.is_head,
      });
      toast.success(selectedExistingMember ? 'Team member updated' : 'Team member added');
      await fetchMembers();
      onUpdate();
      setAssignment((current) => ({
        ...current,
        user_id: '',
        position_title: '',
        is_head: false,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save team member');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team? This will revoke their team badge.`)) return;

    try {
      await api.delete(`/api/admin/team-members/${memberId}`);
      toast.success('Team member removed');
      fetchMembers();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const handleToggleHead = async (member: TeamMember) => {
    const newIsHead = !member.is_head;

    try {
      await api.patch(`/api/admin/team-members/${member.id}`, { is_head: newIsHead });
      toast.success(newIsHead ? `${member.profiles?.display_name} is now team head` : 'Team head removed');
      fetchMembers();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update team head');
    }
  };

  const filteredMembers = selectedTeam === 'all' 
    ? members 
    : members.filter(m => m.team_id === selectedTeam);

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#3B82F6';
  };

  const downloadNamesOnly = () => {
    const data = filteredMembers.map(member => ({
      'Name': member.profiles?.display_name || 'Unknown',
      'Team': getTeamName(member.team_id),
      'Position': member.position_title
    }));

    downloadCSV(data, 'team_members_names.csv');
    toast.success('Names downloaded successfully');
  };

  const downloadFullData = () => {
    const data = filteredMembers.map(member => {
      const baseData: Record<string, string> = {
        'Name': member.profiles?.display_name || 'Unknown',
        'Email': member.profiles?.email || '',
        'Phone': member.profiles?.phone || '',
        'Team': getTeamName(member.team_id),
        'Position': member.position_title,
        'Bio': member.profiles?.bio || '',
        'LinkedIn': member.profiles?.linkedin_url || '',
        'GitHub': member.profiles?.github_url || '',
        'Twitter': member.profiles?.twitter_url || '',
        'Joined At': new Date(member.joined_at).toLocaleDateString()
      };

      // Add application form responses
      if (member.applicationResponses) {
        member.applicationResponses.forEach((response, index) => {
          baseData[`Form: ${response.field_label}`] = response.response_value || '';
        });
      }

      return baseData;
    });

    downloadCSV(data, 'team_members_full_data.csv');
    toast.success('Full data downloaded successfully');
  };

  const downloadCSV = (data: Record<string, string>[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to download');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = value.toString().replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 md:p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Add or Update Team Member</h3>
            <p className="text-sm text-muted-foreground">
              Assign any registered user to a team directly and optionally mark them as the current head.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">User</label>
            <select
              value={assignment.user_id}
              onChange={(e) => setAssignment((current) => ({ ...current, user_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.display_name || 'Unnamed user'}{user.email ? ` (${user.email})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Team</label>
            <select
              value={assignment.team_id}
              onChange={(e) => setAssignment((current) => ({ ...current, team_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Select team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Position Title</label>
            <input
              type="text"
              value={assignment.position_title}
              onChange={(e) =>
                setAssignment((current) => ({ ...current, position_title: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Domain Head, Designer, Developer..."
            />
          </div>

          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={assignment.is_head}
                onChange={(e) =>
                  setAssignment((current) => ({ ...current, is_head: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              Make this person head of the selected team
            </label>
            <button
              onClick={handleAssignMember}
              disabled={isAssigning || users.length === 0 || teams.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {selectedExistingMember ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </div>

        {selectedExistingMember ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This user is already in {getTeamName(selectedExistingMember.team_id)}. Saving here will update their role and head status.
          </p>
        ) : null}
      </div>

      {/* Filter and Download controls */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-foreground">Filter by Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={downloadNamesOnly}
              disabled={filteredMembers.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Names Only
            </button>
            <button
              onClick={downloadFullData}
              disabled={filteredMembers.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Full Data + Forms
            </button>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="divide-y divide-border/50">
        {filteredMembers.map((member) => (
          <div key={member.id} className="flex flex-col gap-4 p-4 md:p-6 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: `${getTeamColor(member.team_id)}20` }}
              >
                <Users className="w-5 h-5" style={{ color: getTeamColor(member.team_id) }} />
                {member.is_head && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Crown className="w-3 h-3 text-accent-foreground" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-foreground break-words">
                    {member.profiles?.display_name || 'Unknown User'}
                  </h3>
                  {member.is_head && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                      Head
                    </span>
                  )}
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getTeamColor(member.team_id)}20`,
                      color: getTeamColor(member.team_id)
                    }}
                  >
                    {getTeamName(member.team_id)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground break-all">
                  {member.position_title} • {member.profiles?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleToggleHead(member)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  member.is_head 
                    ? 'bg-accent/15 text-accent hover:bg-accent/25' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={member.is_head ? 'Remove as head' : 'Make team head'}
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">{member.is_head ? 'Head' : 'Make Head'}</span>
              </button>
              <button
                onClick={() => handleRemoveMember(member.id, member.profiles?.display_name || 'this member')}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <UserX className="w-4 h-4" />
                <span className="text-sm font-medium">Remove</span>
              </button>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No team members yet</p>
            <p className="text-sm mt-1">Use the form above to add one directly or accept an application.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMembersManager;
