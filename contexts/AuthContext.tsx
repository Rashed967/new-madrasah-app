
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async (supabaseUser: SupabaseUser) => {
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', supabaseUser.id)
          .single();

        if (error) throw error;

        const userIsAdmin = profile.role === 'admin' || profile.role === 'super_admin';
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          const appUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'ব্যবহারকারী',
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
          };
          setUser(appUser);
        } else {
          // If not an admin, treat as logged out for this dashboard
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
        setIsAdmin(false);
      }
    };

    const initializeSession = async (session: Session | null) => {
      if (session?.user) {
        await fetchUserRole(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    // Get the session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeSession(session);
    });

    // Set up the auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      initializeSession(session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
