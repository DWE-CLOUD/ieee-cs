import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ieeeLogo from '@/assets/ieee-logo.png';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const MagicLogin = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Signing you in...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This magic login link is missing its token.');
      return;
    }

    api
      .post('/api/auth/magic/verify', { token })
      .then(async () => {
        await refreshProfile();
        setStatus('success');
        setMessage('Magic login complete. Redirecting...');
        toast.success('Signed in successfully');
        setTimeout(() => navigate('/'), 1200);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Magic login failed');
      });
  }, [navigate, refreshProfile, token]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 glass-strong px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-105">
            <img src={ieeeLogo} alt="IEEE Computer Society" className="h-8 w-auto object-contain" />
          </Link>
          <Link
            to="/auth"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Sign In
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-card rounded-3xl border border-border/50 p-8 md:p-10 shadow-elegant text-center">
          <div className="mb-6 flex justify-center">
            {status === 'loading' && <Loader2 className="w-10 h-10 animate-spin text-accent" />}
            {status === 'success' && <CheckCircle2 className="w-10 h-10 text-green-600" />}
            {status === 'error' && <XCircle className="w-10 h-10 text-destructive" />}
          </div>

          <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Magic Login</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default MagicLogin;
