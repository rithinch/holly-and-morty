
import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import AuthView from './components/AuthView';
import Dashboard from './components/Dashboard';
import AdvisorDashboard from './components/AdvisorDashboard';

type ViewMode = 'client' | 'advisor';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('client');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('hm_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    document.documentElement.classList.remove('dark');
    setIsLoading(false);
  }, []);

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    sessionStorage.setItem('hm_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('hm_user');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {!user ? (
        <AuthView onAuthenticated={handleLogin} />
      ) : (
        viewMode === 'client' ? (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            onSwitchView={() => setViewMode('advisor')}
          />
        ) : (
          <AdvisorDashboard 
            currentUser={user}
            onLogout={handleLogout}
            onSwitchView={() => setViewMode('client')}
          />
        )
      )}
    </div>
  );
};

export default App;
