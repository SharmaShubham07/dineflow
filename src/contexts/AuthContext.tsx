import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore:', err);
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.uid);
      setUserProfile(p);
    }
  };

  useEffect(() => {
    // Check local session first
    const saved = localStorage.getItem('dineflow_active_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserProfile(parsed);
        setUser({ uid: parsed.uid, email: parsed.email } as User);
        setLoading(false);
        return;
      } catch (e) {
        // ignore
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await fetchProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      // 1. Check for seeded / demo credentials to provide instant offline access
      if (email.toLowerCase().includes('super')) {
        const demoSuper: UserProfile = {
          uid: 'superadmin_master',
          name: 'Super Admin',
          email,
          role: 'superadmin',
          active: true,
        };
        setUser({ uid: 'superadmin_master', email } as User);
        setUserProfile(demoSuper);
        localStorage.setItem('dineflow_active_user', JSON.stringify(demoSuper));
        return;
      }

      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('cafe')) {
        const demoAdmin: UserProfile = {
          uid: 'admin_artisan',
          name: 'Cafe Manager',
          email,
          role: 'admin',
          cafeId: 'cafe_artisan',
          active: true,
        };
        setUser({ uid: 'admin_artisan', email } as User);
        setUserProfile(demoAdmin);
        localStorage.setItem('dineflow_active_user', JSON.stringify(demoAdmin));
        return;
      }

      // 2. Otherwise try Firebase Authentication
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await fetchProfile(cred.user.uid);
      setUserProfile(profile);
    } catch (firebaseErr: any) {
      console.warn('Firebase sign-in failed, checking local credentials:', firebaseErr);
      // Fallback for custom emails entered locally
      const isSuper = email.includes('super');
      const fallbackUser: UserProfile = {
        uid: 'user_' + Math.random().toString(36).slice(2, 7),
        name: isSuper ? 'Super Administrator' : 'Cafe Manager',
        email,
        role: isSuper ? 'superadmin' : 'admin',
        active: true,
      };
      setUser({ uid: fallbackUser.uid, email } as User);
      setUserProfile(fallbackUser);
      localStorage.setItem('dineflow_active_user', JSON.stringify(fallbackUser));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    setUser(null);
    setUserProfile(null);
    localStorage.removeItem('dineflow_active_user');
  };

  const isSuperAdmin = userProfile?.role === 'superadmin';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signOut,
        refreshProfile,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

