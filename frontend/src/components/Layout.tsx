import React from 'react';
import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';
import { Building2, LayoutDashboard, UploadCloud, FileSpreadsheet, LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const { companies, selectedCompanyId, setSelectedCompanyId, isLoading } = useCompany();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-dark">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-panel border-y-0 border-l-0 rounded-none rounded-r-3xl z-10 flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tight gradient-text">BOE Finops</h1>
        </div>

        {/* Company Switcher */}
        <div className="px-6 pb-6 border-b border-white/5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Active Tenant</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
            <select
              disabled={isLoading}
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
              className="w-full bg-surface-hover/50 text-sm text-slate-100 rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500/50 appearance-none cursor-pointer border border-white/5 transition-all"
            >
              <option value="" disabled>Select Company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
          <NavItem to="/reconciliation" icon={<FileSpreadsheet className="w-5 h-5" />} label="Reconciliation" />
          <NavItem to="/upload" icon={<UploadCloud className="w-5 h-5" />} label="Data Ingestion" />
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => navigate('/login')}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-8">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto h-full space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-brand-500/10 text-brand-400 font-medium' 
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);
