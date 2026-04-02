import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface Application {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  position: {
    id: string;
    title: string;
    team?: {
      name: string;
      color: string;
    };
  };
}

const ApplicationsTracker = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const data = await api.get<Application[]>('/api/applications/me');
      setApplications(data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'reviewing':
        return <FileText className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewing':
        return 'Under Review';
      case 'approved':
      case 'accepted':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'reviewing':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">You haven't submitted any applications yet.</p>
        <Link
          to="/positions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="w-4 h-4" />
          Browse Positions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="p-4 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {app.position?.team && (
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{
                      backgroundColor: `${app.position.team.color}20`,
                      color: app.position.team.color,
                    }}
                  >
                    {app.position.team.name}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-foreground">
                {app.position?.title || 'Position'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Applied on {formatDate(app.created_at)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}
              >
                {getStatusIcon(app.status)}
                {getStatusLabel(app.status)}
              </div>
              {app.updated_at !== app.created_at && (
                <p className="text-xs text-muted-foreground">
                  Updated {formatDate(app.updated_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationsTracker;
