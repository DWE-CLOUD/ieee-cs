import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
}

interface Session {
  user: User;
}

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
}

interface ManagedTeam {
  team_id: string;
  team_name: string;
}

interface SessionPayload {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isManager: boolean;
  managedTeams: ManagedTeam[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isManager: boolean;
  managedTeams: ManagedTeam[];
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [managedTeams, setManagedTeams] = useState<ManagedTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const applySession = (payload: SessionPayload) => {
    setUser(payload.user);
    setSession(payload.session);
    setProfile(payload.profile);
    setIsAdmin(payload.isAdmin);
    setIsManager(payload.isManager);
    setManagedTeams(payload.managedTeams);
  };

  const refreshProfile = async () => {
    const payload = await api.get<SessionPayload>('/api/auth/session');
    applySession(payload);
  };

  useEffect(() => {
    api
      .get<SessionPayload>('/api/auth/session')
      .then(applySession)
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      await api.post('/api/auth/signup', { email, password, fullName });
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await api.post('/api/auth/signin', { email, password });
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await api.post('/api/auth/signout');
    applySession({
      user: null,
      session: null,
      profile: null,
      isAdmin: false,
      isManager: false,
      managedTeams: [],
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isManager,
        managedTeams,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
