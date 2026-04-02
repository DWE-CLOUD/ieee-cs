import { useState, useEffect } from 'react';
import { Users, Plus, X, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface TeamManager {
  id: string;
  user_id: string;
  team_id: string;
  teams?: Team;
}

interface ManagerAssignmentProps {
  userId: string;
  userName: string;
  teams: Team[];
  onUpdate: () => void;
}

const ManagerAssignment = ({ userId, userName, teams, onUpdate }: ManagerAssignmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [assignments, setAssignments] = useState<TeamManager[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssignments();
    }
  }, [isOpen, userId]);

  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<TeamManager[]>(`/api/admin/team-managers/${userId}`);
      setAssignments(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    setIsAssigning(true);

    try {
      await api.post('/api/admin/team-managers', { user_id: userId, team_id: teamId });
      toast.success('Team assigned');
      fetchAssignments();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign team');
    }

    setIsAssigning(false);
  };

  const handleRemoveTeam = async (assignmentId: string) => {
    try {
      await api.delete(`/api/admin/team-managers/${assignmentId}`);
      toast.success('Team removed');
      fetchAssignments();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove team');
    }
  };

  const assignedTeamIds = assignments.map(a => a.team_id);
  const availableTeams = teams.filter(t => !assignedTeamIds.includes(t.id));

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-all flex items-center gap-2"
      >
        <Shield className="w-3.5 h-3.5" />
        Manage Teams
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md" onClick={() => setIsOpen(false)}>
      <div className="bg-background rounded-2xl max-w-md w-full shadow-elegant" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl text-foreground">Manage Team Access</h3>
              <p className="text-sm text-muted-foreground">for {userName}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Current Assignments */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">Assigned Teams</h4>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 px-4 bg-muted/30 rounded-xl">
                    No teams assigned yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: assignment.teams?.color || '#3B82F6' }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {assignment.teams?.name || 'Unknown Team'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveTeam(assignment.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Team */}
              {availableTeams.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Add Team</h4>
                  <div className="space-y-2">
                    {availableTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => handleAssignTeam(team.id)}
                        disabled={isAssigning}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="text-sm text-foreground">{team.name}</span>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableTeams.length === 0 && assignments.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Assigned to all teams
                </p>
              )}
            </>
          )}

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Managers can add/edit positions and review applications for their assigned teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAssignment;
