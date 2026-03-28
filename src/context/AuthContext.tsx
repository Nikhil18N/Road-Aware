import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSession as getSessionFromStorage, clearSession as clearSessionFromStorage, setSession as setSessionInStorage } from '@/services/api';

// Define the shape of our context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUserFromLogin: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  setUserFromLogin: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session from localStorage/backend
    const checkSession = async () => {
      try {
        const storedSession = getSessionFromStorage();
        
        if (storedSession?.access_token) {
          // Create a Session-like object from stored data
          const sessionObj: any = {
            access_token: storedSession.access_token,
            refresh_token: storedSession.refresh_token,
            expires_in: 3600, // Default expiry
            token_type: 'bearer',
            user: {
              id: storedSession.user?.id || '',
              email: storedSession.user?.email || '',
              user_metadata: {
                full_name: storedSession.user?.full_name,
                role: storedSession.user?.role
              }
            }
          };

          setSession(sessionObj);
          setUser(sessionObj.user as User);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        clearSessionFromStorage();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signOut = async () => {
    try {
      // Call backend logout endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const storedSession = getSessionFromStorage();
      
      if (storedSession?.refresh_token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: storedSession.refresh_token }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local session regardless
      clearSessionFromStorage();
      setSession(null);
      setUser(null);
    }
  };

  const setUserFromLogin = (userData: any) => {
    // Update user and session state after login
    const storedSession = getSessionFromStorage();
    if (storedSession && userData) {
      const sessionObj: any = {
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userData.id || storedSession.user?.id,
          email: userData.email || storedSession.user?.email,
          user_metadata: {
            full_name: userData.full_name || storedSession.user?.full_name,
            role: userData.role || storedSession.user?.role
          }
        }
      };
      
      setSession(sessionObj);
      setUser(sessionObj.user as User);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, setUserFromLogin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
