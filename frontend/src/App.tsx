import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, Stethoscope,
  Menu, X, Bell, User, Activity,
  LogOut, Settings, CreditCard, FileText, BarChart3
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Experts from './pages/Experts';
import Login from './pages/Login';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Notifications from './pages/Notifications';
import PatientDashboard from './pages/PatientDashboard';
import Home from './pages/Home';
import About from './pages/About';

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null,
  login: () => {}, logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

/* ─── Admin Sidebar ─────────────────────────────────────────────────────── */
const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuGroups = [
    { label: 'Main', items: [
      { icon: LayoutDashboard, label: 'Dashboard',    path: '/' },
      { icon: Users,           label: 'Patients',     path: '/patients' },
      { icon: Calendar,        label: 'Appointments', path: '/appointments' },
      { icon: Stethoscope,     label: 'Experts',      path: '/experts' },
    ]},
    { label: 'Finance', items: [
      { icon: CreditCard, label: 'Payments', path: '/payments' },
    ]},
    { label: 'Insights', items: [
      { icon: BarChart3, label: 'Analytics',     path: '/analytics' },
      { icon: FileText,  label: 'Reports',       path: '/reports' },
      { icon: Bell,      label: 'Notifications', path: '/notifications' },
    ]},
    { label: 'Account', items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]},
  ];

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">Nila Health</span>
              <p className="text-[10px] text-slate-500 -mt-0.5">Admin Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-5 overflow-y-auto">
          {menuGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2 px-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} to={item.path} onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${active ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.label}
                      {active && <div className="ml-auto w-1.5 h-1.5 bg-cyan-400 rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role_name || 'Administrator'}</p>
            </div>
            <button onClick={logout} title="Logout" className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const location = useLocation();
  const { user } = useAuth();
  const titles: Record<string, string> = {
    '/': 'Dashboard', '/patients': 'Patients', '/appointments': 'Appointments',
    '/experts': 'Experts & Doctors', '/payments': 'Payment Management',
    '/analytics': 'Analytics', '/reports': 'Reports',
    '/notifications': 'Notifications', '/settings': 'Settings',
  };
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">{titles[location.pathname] || 'Admin Panel'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/notifications" className="relative p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-800/60 rounded-xl">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white leading-none">{user?.full_name || 'Admin'}</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-[#070e1a] text-slate-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/patients"      element={<Patients />} />
            <Route path="/appointments"  element={<Appointments />} />
            <Route path="/experts"       element={<Experts />} />
            <Route path="/payments"      element={<Payments />} />
            <Route path="/analytics"     element={<Analytics />} />
            <Route path="/reports"       element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function isPatientUser(user: any) { return user && !user.role_name; }

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (isPatientUser(user)) return <Navigate to="/patient" replace />;
  return <>{children}</>;
}

function PatientRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!isPatientUser(user)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [user,  setUser]  = useState<any | null>(() => {
    const stored = localStorage.getItem('user');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });

  const login = (newToken: string, newUser: any) => {
    setToken(newToken); setUser(newUser);
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  const homeRedirect = !token ? '/home' : isPatientUser(user) ? '/patient' : '/';

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Router>
        <Routes>
          {/* Public pages */}
          <Route path="/home"  element={<Home />} />
          <Route path="/about" element={<About />} />

          {/* Root → home for unauthenticated, dashboard for authenticated */}
          <Route path="/"
            element={token ? (isPatientUser(user) ? <Navigate to="/patient" replace /> : <Navigate to="/dashboard" replace />) : <Navigate to="/home" replace />} />

          <Route path="/login"
            element={token ? <Navigate to={homeRedirect} replace /> : <Login onLogin={login} />} />

          <Route path="/patient"
            element={<PatientRoute><PatientDashboard /></PatientRoute>} />

          <Route path="/dashboard/*"
            element={<AdminRoute><AppLayout /></AdminRoute>} />

          <Route path="/*"
            element={<AdminRoute><AppLayout /></AdminRoute>} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
