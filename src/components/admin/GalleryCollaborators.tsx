import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

interface Collaborator {
  id: string;
  user_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface TeamManager {
  user_id: string;
  team_id: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

interface AdminUser {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  roles: { role: string }[];
}

const GalleryCollaborators = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCollaborators();
    fetchTeamManagers();
  }, []);

  const fetchCollaborators = async () => {
    try {
      const data = await api.get<Collaborator[]>('/api/admin/gallery/collaborators');
      setCollaborators(data);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamManagers = async () => {
    try {
      const users = await api.get<AdminUser[]>('/api/admin/users');
      const managersWithProfiles = users
        .filter((user) => user.roles.some((role) => role.role === 'manager'))
        .map((user) => ({
          user_id: user.user_id,
          team_id: '',
          profile: {
            display_name: user.display_name,
            email: user.email,
          },
        }));
      setTeamManagers(managersWithProfiles);
    } catch (error) {
      console.error('Error fetching team managers:', error);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedManager) return;

    setIsAdding(true);

    try {
      await api.post('/api/admin/gallery/collaborators', { user_id: selectedManager });
      toast.success('Collaborator added');
      setSelectedManager('');
      fetchCollaborators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add collaborator');
    }

    setIsAdding(false);
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      await api.delete(`/api/admin/gallery/collaborators/${id}`);
      toast.success('Collaborator removed');
      fetchCollaborators();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove collaborator');
    }
  };

  // Filter out managers who are already collaborators
  const availableManagers = teamManagers.filter(
    m => !collaborators.some(c => c.user_id === m.user_id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Gallery Collaborators</h3>
          <p className="text-sm text-muted-foreground">Add team managers as gallery collaborators</p>
        </div>
      </div>

      {/* Add collaborator */}
      <div className="flex items-center gap-2">
        <Select value={selectedManager} onValueChange={setSelectedManager}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a team manager" />
          </SelectTrigger>
          <SelectContent>
            {availableManagers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No team managers available
              </div>
            ) : (
              availableManagers.map((manager) => (
                <SelectItem key={manager.user_id} value={manager.user_id}>
                  {manager.profile?.display_name || manager.profile?.email || 'Unknown'}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleAddCollaborator} 
          disabled={!selectedManager || isAdding}
          className="gap-2"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </Button>
      </div>

      {/* Collaborators list */}
      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No collaborators yet</p>
            <p className="text-xs">Add team managers to give them gallery access</p>
          </div>
        ) : (
          collaborators.map((collab) => (
            <div 
              key={collab.id} 
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
            >
              <div>
                <p className="font-medium text-foreground">
                  {collab.profile?.display_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {collab.profile?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveCollaborator(collab.id)}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GalleryCollaborators;
