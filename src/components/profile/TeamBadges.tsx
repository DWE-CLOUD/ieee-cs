import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { api } from '@/lib/api';

interface TeamMembership {
  id: string;
  team_id: string;
  position_title: string;
  joined_at: string;
  teams: {
    id: string;
    name: string;
    color: string;
  };
}

interface TeamBadgesProps {
  userId: string;
}

const TeamBadges = ({ userId }: TeamBadgesProps) => {
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const data = await api.get<TeamMembership[]>('/api/team-memberships/me');
        setMemberships(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberships();
  }, [userId]);

  if (isLoading || memberships.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {memberships.map((membership) => (
        <div
          key={membership.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: `${membership.teams.color}20`,
            borderColor: `${membership.teams.color}50`,
            color: membership.teams.color,
          }}
        >
          <Award className="w-3.5 h-3.5" />
          <span>{membership.teams.name}</span>
          <span className="opacity-70">•</span>
          <span className="opacity-80">{membership.position_title}</span>
        </div>
      ))}
    </div>
  );
};

export default TeamBadges;
