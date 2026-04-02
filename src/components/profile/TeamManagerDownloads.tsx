import { useState } from 'react';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Users } from 'lucide-react';
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

interface ManagedTeam {
  team_id: string;
  team_name: string;
}

interface TeamManagerDownloadsProps {
  managedTeams: ManagedTeam[];
}

const TeamManagerDownloads = ({ managedTeams }: TeamManagerDownloadsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>(managedTeams[0]?.team_id || '');

  const fetchTeamMembers = async (teamId: string): Promise<TeamMember[]> => {
    return api.get<TeamMember[]>(`/api/manager/team-members?teamId=${encodeURIComponent(teamId)}`);
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

  const downloadNamesOnly = async () => {
    if (!selectedTeam) return;
    setIsLoading(true);

    const members = await fetchTeamMembers(selectedTeam);
    const teamName = managedTeams.find(t => t.team_id === selectedTeam)?.team_name || 'Team';

    const data = members.map(member => ({
      'Name': member.profiles?.display_name || 'Unknown',
      'Position': member.position_title
    }));

    downloadCSV(data, `${teamName.toLowerCase().replace(/\s+/g, '_')}_names.csv`);
    toast.success('Names downloaded successfully');
    setIsLoading(false);
  };

  const downloadFullData = async () => {
    if (!selectedTeam) return;
    setIsLoading(true);

    const members = await fetchTeamMembers(selectedTeam);
    const teamName = managedTeams.find(t => t.team_id === selectedTeam)?.team_name || 'Team';

    const data = members.map(member => {
      const baseData: Record<string, string> = {
        'Name': member.profiles?.display_name || 'Unknown',
        'Email': member.profiles?.email || '',
        'Phone': member.profiles?.phone || '',
        'Position': member.position_title,
        'Bio': member.profiles?.bio || '',
        'LinkedIn': member.profiles?.linkedin_url || '',
        'GitHub': member.profiles?.github_url || '',
        'Twitter': member.profiles?.twitter_url || '',
        'Joined At': new Date(member.joined_at).toLocaleDateString()
      };

      // Add application form responses
      if (member.applicationResponses) {
        member.applicationResponses.forEach((response) => {
          baseData[`Form: ${response.field_label}`] = response.response_value || '';
        });
      }

      return baseData;
    });

    downloadCSV(data, `${teamName.toLowerCase().replace(/\s+/g, '_')}_full_data.csv`);
    toast.success('Full data downloaded successfully');
    setIsLoading(false);
  };

  if (managedTeams.length === 0) return null;

  return (
    <div className="bg-card rounded-3xl border border-border/50 p-8 shadow-elegant mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="font-medium text-foreground text-lg">Team Management</h2>
          <p className="text-sm text-muted-foreground">Download your team members data</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Select Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {managedTeams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.team_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={downloadNamesOnly}
            disabled={isLoading || !selectedTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Names Only
          </button>
          <button
            onClick={downloadFullData}
            disabled={isLoading || !selectedTeam}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground font-medium transition-all duration-300 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Full Data + Forms
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamManagerDownloads;
