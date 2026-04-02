import { useState, useEffect } from 'react';
import { 
  X, Mail, Phone, Clock, Download, FileText, ExternalLink, 
  Image as ImageIcon, Loader2, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';

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
  positions?: {
    id: string;
    title: string;
    team_id: string | null;
  };
}

interface ApplicationResponse {
  id: string;
  application_id: string;
  field_id: string;
  field_label: string;
  field_type: string;
  response_value: string | null;
}

interface ApplicationDetailModalProps {
  application: Application & { remarks?: string | null };
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, remarks?: string) => void;
}

const ApplicationDetailModal = ({ 
  application, 
  onClose, 
  onUpdateStatus 
}: ApplicationDetailModalProps) => {
  const [responses, setResponses] = useState<ApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [remarks, setRemarks] = useState(application.remarks || '');

  useEffect(() => {
    fetchResponses();
  }, [application.id]);

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<{ responses: ApplicationResponse[]; resume_url: string | null }>(
        `/api/admin/applications/${application.id}/responses`
      );
      setResponses(data.responses);
      if (data.resume_url) {
        setResumeUrl(`/api/admin/applications/${application.id}/resume`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderFieldValue = (response: ApplicationResponse) => {
    const { field_type, response_value, field_label } = response;
    
    if (!response_value) {
      return <span className="text-muted-foreground italic">No response</span>;
    }

    switch (field_type) {
      case 'checkbox':
        return response_value === 'true' ? (
          <span className="flex items-center gap-2 text-accent">
            <CheckCircle2 className="w-4 h-4" /> Yes
          </span>
        ) : (
          <span className="flex items-center gap-2 text-muted-foreground">
            <XCircle className="w-4 h-4" /> No
          </span>
        );
      
      case 'file':
      {
        const isImage = response_value.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        const isPdf = response_value.match(/\.pdf$/i);
        
        return (
          <FilePreview 
            applicationId={application.id}
            path={response_value} 
            isImage={!!isImage} 
            isPdf={!!isPdf}
            label={field_label}
          />
        );
      }
      
      case 'textarea':
        return (
          <p className="text-sm text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
            {response_value}
          </p>
        );
      
      case 'select':
      case 'radio':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent/10 text-accent">
            {response_value}
          </span>
        );
      
      case 'email':
        return (
          <a 
            href={`mailto:${response_value}`} 
            className="text-accent hover:underline flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {response_value}
          </a>
        );
      
      case 'phone':
        return (
          <a 
            href={`tel:${response_value}`} 
            className="text-accent hover:underline flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            {response_value}
          </a>
        );
      
      case 'date':
        return (
          <span className="text-foreground">
            {new Date(response_value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        );
      
      default:
        return <span className="text-foreground">{response_value}</span>;
    }
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: 'bg-gold/15 text-gold border-gold/30', icon: <AlertCircle className="w-4 h-4" /> },
    reviewing: { color: 'bg-accent/15 text-accent border-accent/30', icon: <Loader2 className="w-4 h-4" /> },
    accepted: { color: 'bg-green-500/15 text-green-600 border-green-500/30', icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { color: 'bg-destructive/15 text-destructive border-destructive/30', icon: <XCircle className="w-4 h-4" /> },
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-md" 
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-elegant flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-background border-b border-border/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl text-foreground">{application.full_name}</h2>
              <p className="text-muted-foreground">Applied for {application.positions?.title}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Current Status */}
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig[application.status]?.color || 'bg-muted'}`}>
            {statusConfig[application.status]?.icon}
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${application.email}`} className="hover:text-accent transition-colors">
                {application.email}
              </a>
            </div>
            {application.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${application.phone}`} className="hover:text-accent transition-colors">
                  {application.phone}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Applied {new Date(application.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>

          {/* Resume */}
          {resumeUrl && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">Resume</h3>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground group-hover:text-accent transition-colors">
                    View Resume
                  </p>
                  <p className="text-xs text-muted-foreground">Click to open in new tab</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </a>
            </div>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-2">Cover Letter</h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl whitespace-pre-wrap">
                {application.cover_letter}
              </p>
            </div>
          )}

          {/* Custom Form Responses */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : responses.length > 0 ? (
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-medium text-foreground border-t border-border/50 pt-4">
                Application Form Responses
              </h3>
              {responses.map((response) => (
                <div key={response.id} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    {response.field_label}
                  </label>
                  <div>{renderFieldValue(response)}</div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Remarks Input */}
          <div className="border-t border-border/50 pt-4">
            <label className="text-sm font-medium text-accent mb-2 block">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add a remark for this application..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              rows={2}
            />
          </div>
        </div>

        {/* Footer - Status Actions */}
        <div className="flex-shrink-0 bg-background border-t border-border/50 p-6">
          <h3 className="text-sm font-medium text-foreground mb-3">Update Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['pending', 'reviewing', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(application.id, status, remarks)}
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  application.status === status
                    ? 'bg-foreground text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// File Preview Component
const FilePreview = ({ 
  applicationId,
  path, 
  isImage, 
  isPdf,
  label 
}: { 
  applicationId: string;
  path: string; 
  isImage: boolean; 
  isPdf: boolean;
  label: string;
}) => {
  const signedUrl = `/api/admin/applications/${applicationId}/resume?path=${encodeURIComponent(path)}`;

  if (isImage) {
    return (
      <div className="space-y-2">
        <a 
          href={signedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block"
        >
          <img 
            src={signedUrl} 
            alt={label}
            className="max-w-full max-h-64 rounded-lg border border-border object-contain"
          />
        </a>
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Open full size
        </a>
      </div>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group max-w-sm"
    >
      <div className="p-2 rounded-lg bg-accent/10">
        {isPdf ? (
          <FileText className="w-4 h-4 text-accent" />
        ) : (
          <ImageIcon className="w-4 h-4 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
          {path.split('/').pop() || 'Download File'}
        </p>
      </div>
      <Download className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
    </a>
  );
};

export default ApplicationDetailModal;
