import { useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Users, Loader2, UserX, Download, FileSpreadsheet, Crown, UserPlus, ShieldCheck, ChevronDown, Eye, X, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  is_lead: boolean;
  permissions: string[] | null;
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
  const { isAdmin, managedTeams } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [exportMode, setExportMode] = useState('all');
  const [exportDetail, setExportDetail] = useState('full');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedLeadSettings, setSelectedLeadSettings] = useState<TeamMember | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignment, setAssignment] = useState({
    user_id: '',
    team_id: '',
    position_title: '',
    is_head: false,
    is_lead: false,
    permissions: [] as string[],
  });

  const permissionOptions = [
    { id: 'add_members', label: 'Add members' },
    { id: 'manage_members', label: 'Manage members' },
    { id: 'review_applications', label: 'Review applications' },
    { id: 'manage_events', label: 'Manage events' },
    { id: 'manage_gallery', label: 'Manage gallery' },
  ];

  const hasPermissionForTeam = (teamId: string, permission: string) => {
    if (isAdmin) return true;
    const team = managedTeams.find((item) => item.team_id === teamId);
    const permissions = team?.permissions || [];
    return (
      permissions.includes('manage_team') ||
      permissions.includes(permission) ||
      (permission === 'add_members' && permissions.includes('manage_members'))
    );
  };

  const canAddForTeam = (teamId: string) => hasPermissionForTeam(teamId, 'add_members');
  const canManageForTeam = (teamId: string) => hasPermissionForTeam(teamId, 'manage_members');
  const assignableTeams = teams.filter((team) => canAddForTeam(team.id));

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (!assignment.team_id && assignableTeams.length > 0) {
      setAssignment((current) => ({ ...current, team_id: assignableTeams[0].id }));
    }
  }, [assignment.team_id, assignableTeams]);

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

    if (selectedExistingMember && !canManageForTeam(assignment.team_id)) {
      toast.error('Manage members permission is required to update existing members');
      return;
    }

    setIsAssigning(true);

    try {
      await api.post('/api/admin/team-members', {
        user_id: assignment.user_id,
        team_id: assignment.team_id,
        position_title: assignment.position_title.trim(),
        is_head: canManageForTeam(assignment.team_id) ? assignment.is_head : false,
        is_lead: canManageForTeam(assignment.team_id) ? assignment.is_lead : false,
        permissions: canManageForTeam(assignment.team_id) ? assignment.permissions : [],
      });
      toast.success(selectedExistingMember ? 'Team member updated' : 'Team member added');
      await fetchMembers();
      onUpdate();
      setAssignment((current) => ({
        ...current,
        user_id: '',
        position_title: '',
        is_head: false,
        is_lead: false,
        permissions: [],
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

  const handleToggleLead = async (member: TeamMember) => {
    const nextIsLead = !member.is_lead;
    const nextPermissions =
      nextIsLead && (!member.permissions || member.permissions.length === 0)
        ? ['add_members']
        : member.permissions || [];

    try {
      await api.patch(`/api/admin/team-members/${member.id}`, {
        is_lead: nextIsLead,
        permissions: nextIsLead ? nextPermissions : [],
      });
      toast.success(nextIsLead ? 'Lead enabled' : 'Lead access revoked');
      fetchMembers();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update lead access');
    }
  };

  const handleTogglePermission = async (member: TeamMember, permission: string) => {
    const current = member.permissions || [];
    const nextPermissions = current.includes(permission)
      ? current.filter((item) => item !== permission)
      : [...current, permission];

    try {
      await api.patch(`/api/admin/team-members/${member.id}`, {
        is_lead: true,
        permissions: nextPermissions,
      });
      if (selectedLeadSettings?.id === member.id) {
        setSelectedLeadSettings({ ...member, is_lead: true, permissions: nextPermissions });
      }
      toast.success('Lead permissions updated');
      fetchMembers();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions');
    }
  };

  const filteredMembers = selectedTeam === 'all' 
    ? members 
    : members.filter(m => m.team_id === selectedTeam);

  const getExportMembers = () => {
    switch (exportMode) {
      case 'without-heads':
        return filteredMembers.filter((member) => !member.is_head);
      case 'heads-leads':
        return filteredMembers.filter((member) => member.is_head || member.is_lead);
      case 'heads':
        return filteredMembers.filter((member) => member.is_head);
      case 'leads':
        return filteredMembers.filter((member) => member.is_lead);
      case 'members-only':
        return filteredMembers.filter((member) => !member.is_head && !member.is_lead);
      default:
        return filteredMembers;
    }
  };

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#3B82F6';
  };

  const buildNamesData = (sourceMembers: TeamMember[]) =>
    sourceMembers.map(member => ({
      'Name': member.profiles?.display_name || 'Unknown',
      'Team': getTeamName(member.team_id),
      'Position': member.position_title,
      'Head': member.is_head ? 'Yes' : 'No',
      'Lead': member.is_lead ? 'Yes' : 'No',
    }));

  const buildFullData = (sourceMembers: TeamMember[]) =>
    sourceMembers.map(member => {
      const baseData: Record<string, string> = {
        'Name': member.profiles?.display_name || 'Unknown',
        'Email': member.profiles?.email || '',
        'Phone': member.profiles?.phone || '',
        'Team': getTeamName(member.team_id),
        'Position': member.position_title,
        'Head': member.is_head ? 'Yes' : 'No',
        'Lead': member.is_lead ? 'Yes' : 'No',
        'Permissions': (member.permissions || []).join('; '),
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

  const downloadSelectedData = () => {
    const exportMembers = getExportMembers();
    const data = exportDetail === 'names' ? buildNamesData(exportMembers) : buildFullData(exportMembers);
    const teamPart = selectedTeam === 'all' ? 'all_teams' : getTeamName(selectedTeam).toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const filename = `team_members_${teamPart}_${exportMode}_${exportDetail}.csv`;

    downloadCSV(data, filename);
    toast.success('Team data downloaded');
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
      {assignableTeams.length > 0 && (
      <div className="p-4 md:p-6 border-b border-border/50 bg-muted/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Add or Update Team Member</h3>
            <p className="text-sm text-muted-foreground">
              Assign registered users to teams you can manage.
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
              {assignableTeams.map((team) => (
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
            {canManageForTeam(assignment.team_id) && (
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
            )}
            {canManageForTeam(assignment.team_id) && (
            <label className="flex items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={assignment.is_lead}
                onChange={(e) =>
                  setAssignment((current) => ({
                    ...current,
                    is_lead: e.target.checked,
                    permissions: e.target.checked
                      ? current.permissions.length === 0
                        ? ['add_members']
                        : current.permissions
                      : [],
                  }))
                }
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              Mark as lead
            </label>
            )}
            {canManageForTeam(assignment.team_id) && assignment.is_lead && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex w-full items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors">
                    <span>{assignment.permissions.length || 'No'} permissions selected</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Lead permissions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {permissionOptions.map((permission) => (
                    <DropdownMenuCheckboxItem
                      key={permission.id}
                      checked={assignment.permissions.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        setAssignment((current) => ({
                          ...current,
                          permissions: checked
                            ? [...current.permissions, permission.id]
                            : current.permissions.filter((item) => item !== permission.id),
                        }))
                      }
                    >
                      {permission.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <button
              onClick={handleAssignMember}
              disabled={
                isAssigning ||
                users.length === 0 ||
                assignableTeams.length === 0 ||
                Boolean(selectedExistingMember && !canManageForTeam(assignment.team_id))
              }
              className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {selectedExistingMember && canManageForTeam(assignment.team_id) ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </div>

        {selectedExistingMember ? (
          <p className="mt-4 text-sm text-muted-foreground">
            This user is already in {getTeamName(selectedExistingMember.team_id)}.
            {canManageForTeam(selectedExistingMember.team_id)
              ? ' Saving here will update their role and access.'
              : ' Manage members permission is required to update existing members.'}
          </p>
        ) : null}
      </div>
      )}

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

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={exportMode}
              onChange={(e) => setExportMode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all">Full team</option>
              <option value="without-heads">Full team without heads</option>
              <option value="heads-leads">Heads and leads</option>
              <option value="heads">Heads only</option>
              <option value="leads">Leads only</option>
              <option value="members-only">Members only</option>
            </select>
            <select
              value={exportDetail}
              onChange={(e) => setExportDetail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="full">Full data + forms</option>
              <option value="names">Names/roles only</option>
            </select>
            <button
              onClick={downloadSelectedData}
              disabled={filteredMembers.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportDetail === 'names' ? <Download className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="divide-y divide-border/50">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedMember(member)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedMember(member);
              }
            }}
            className="flex flex-col gap-4 p-4 md:p-6 hover:bg-muted/30 transition-colors sm:flex-row sm:items-center sm:justify-between cursor-pointer"
          >
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
                  {member.is_lead && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/15 text-green-600 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Lead
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
              {canManageForTeam(member.team_id) && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleLead(member);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  member.is_lead
                    ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={member.is_lead ? 'Revoke lead' : 'Make lead'}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-medium">{member.is_lead ? 'Lead' : 'Make Lead'}</span>
              </button>
              )}
              {canManageForTeam(member.team_id) && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleHead(member);
                }}
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
              )}
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedMember(member);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Details</span>
              </button>
              {member.is_lead && canManageForTeam(member.team_id) && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedLeadSettings(member);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              )}
              {canManageForTeam(member.team_id) && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveMember(member.id, member.profiles?.display_name || 'this member');
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <UserX className="w-4 h-4" />
                <span className="text-sm font-medium">Remove</span>
              </button>
              )}
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

      {selectedMember && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md"
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-border/50 shadow-elegant"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
              aria-label="Close member details"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 border-b border-border/50">
              <div className="flex items-start gap-4 pr-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${getTeamColor(selectedMember.team_id)}20` }}
                >
                  <Users className="w-7 h-7" style={{ color: getTeamColor(selectedMember.team_id) }} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                      {selectedMember.profiles?.display_name || 'Unknown User'}
                    </h2>
                    {selectedMember.is_head && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent">
                        Head
                      </span>
                    )}
                    {selectedMember.is_lead && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-600">
                        Lead
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedMember.position_title} in {getTeamName(selectedMember.team_id)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 grid gap-6 md:grid-cols-2">
              <DetailSection title="Contact">
                <DetailRow label="Email" value={selectedMember.profiles?.email} />
                <DetailRow label="Phone" value={selectedMember.profiles?.phone} />
                <DetailRow label="LinkedIn" value={selectedMember.profiles?.linkedin_url} />
                <DetailRow label="GitHub" value={selectedMember.profiles?.github_url} />
                <DetailRow label="Twitter" value={selectedMember.profiles?.twitter_url} />
              </DetailSection>

              <DetailSection title="Team Access">
                <DetailRow label="Team" value={getTeamName(selectedMember.team_id)} />
                <DetailRow label="Position" value={selectedMember.position_title} />
                <DetailRow label="Head" value={selectedMember.is_head ? 'Yes' : 'No'} />
                <DetailRow label="Lead" value={selectedMember.is_lead ? 'Yes' : 'No'} />
                <DetailRow
                  label="Permissions"
                  value={
                    (selectedMember.permissions || [])
                      .map((id) => permissionOptions.find((permission) => permission.id === id)?.label || id)
                      .join(', ') || 'None'
                  }
                />
                <DetailRow label="Joined" value={new Date(selectedMember.joined_at).toLocaleString()} />
              </DetailSection>

              <div className="md:col-span-2">
                <DetailSection title="Bio">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedMember.profiles?.bio || 'No bio added.'}
                  </p>
                </DetailSection>
              </div>

              <div className="md:col-span-2">
                <DetailSection title="Application Form Responses">
                  {selectedMember.applicationResponses && selectedMember.applicationResponses.length > 0 ? (
                    <div className="grid gap-3">
                      {selectedMember.applicationResponses.map((response, index) => (
                        <div key={`${response.field_label}-${index}`} className="rounded-xl border border-border/50 p-4">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                            {response.field_label}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {response.response_value || 'No response'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No application responses found.</p>
                  )}
                </DetailSection>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedLeadSettings && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-md" onClick={() => setSelectedLeadSettings(null)}>
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border/50 shadow-elegant overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border/50 p-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Lead Settings</p>
                <h2 className="font-serif text-2xl text-foreground mt-1">
                  {selectedLeadSettings.profiles?.display_name || 'Lead'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedLeadSettings.position_title} in {getTeamName(selectedLeadSettings.team_id)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadSettings(null)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
                aria-label="Close lead settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-2xl border border-border/50 bg-card p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">Lead Access</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Revoke lead status or adjust the specific permissions below.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      handleToggleLead(selectedLeadSettings);
                      setSelectedLeadSettings(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-5">
                <h3 className="font-medium text-foreground mb-4">Permissions</h3>
                <div className="space-y-3">
                  {permissionOptions.map((permission) => {
                    const enabled = (selectedLeadSettings.permissions || []).includes(permission.id);

                    return (
                      <button
                        key={permission.id}
                        onClick={() => handleTogglePermission(selectedLeadSettings, permission.id)}
                        className={`w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border text-left transition-colors ${
                          enabled
                            ? 'bg-accent/10 text-foreground border-accent/30'
                            : 'bg-background text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">{permission.label}</span>
                        <span className={`w-10 h-5 rounded-full p-0.5 transition-colors ${enabled ? 'bg-accent' : 'bg-muted'}`}>
                          <span
                            className={`block w-4 h-4 rounded-full bg-background transition-transform ${
                              enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </div>
  );
};

const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-border/50 bg-card p-5">
    <h3 className="font-medium text-foreground mb-4">{title}</h3>
    {children}
  </section>
);

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid grid-cols-[110px_1fr] gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground break-words">{value || 'Not added'}</span>
  </div>
);

export default TeamMembersManager;
