import React, { useEffect, useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { Search, Filter, ChevronDown } from 'lucide-react';
import axios from 'axios';

export const ReconciliationView = () => {
  const { selectedCompanyId } = useCompany();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/reconciliation?company_id=${selectedCompanyId}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch reconciliation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyId]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL || ''}/api/boes/${id}/status`, {
        company_id: selectedCompanyId,
        status: newStatus
      });
      fetchData(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item.boe_number?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (item.hawb?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!selectedCompanyId) {
    return <div className="flex items-center justify-center h-full text-slate-500">Please select a company to view reconciliation.</div>;
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Reconciliation Engine</h2>
          <p className="text-slate-400 mt-1">Component-wise mismatch detection and status management.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search BOE or HAWB..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface border border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-500/50 w-64"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-surface border border-white/10 rounded-xl text-sm focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Invoiced">Invoiced</option>
              <option value="Discrepancy">Discrepancy</option>
              <option value="Paid">Paid</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Table Area */}
      <div className="glass-panel flex-1 overflow-hidden flex flex-col rounded-2xl border border-white/5">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface/50 text-slate-400 font-semibold sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">BOE / HAWB</th>
                <th className="px-6 py-4">Delivery Order (DO)</th>
                <th className="px-6 py-4">Duty</th>
                <th className="px-6 py-4">Storage</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-tr-xl w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">Loading records...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">No records found matching criteria.</td>
                </tr>
              ) : (
                filteredData.map(row => (
                  <tr key={row.boe_id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{row.boe_number}</div>
                      <div className="text-xs text-slate-500 mt-1">{row.hawb || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <ComponentPill 
                        rec={row.recorded_do} 
                        inv={row.invoiced_do} 
                        mismatch={row.do_mismatch} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ComponentPill 
                        rec={row.recorded_duty} 
                        inv={row.invoiced_duty} 
                        mismatch={row.duty_mismatch} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <ComponentPill 
                        rec={row.recorded_storage} 
                        inv={row.invoiced_storage} 
                        mismatch={row.storage_mismatch} 
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className="bg-surface hover:bg-surface-hover border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                        value={row.status}
                        onChange={(e) => handleStatusUpdate(row.boe_id, e.target.value)}
                      >
                         <option value="Pending">Pending</option>
                         <option value="Invoiced">Invoiced</option>
                         <option value="Discrepancy">Discrepancy</option>
                         <option value="Paid">Paid</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ComponentPill = ({ rec, inv, mismatch }: any) => {
  const isMismatch = Math.abs(parseFloat(mismatch)) > 0.01;
  const isPending = parseFloat(rec) === 0 && parseFloat(inv) === 0;

  if (isPending) return <span className="text-slate-600 text-xs">Awaiting Data</span>;

  return (
    <div className={`flex flex-col gap-1 p-2 rounded-lg border ${
      isMismatch ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/10'
    }`}>
      <div className="flex justify-between text-xs gap-4">
        <span className="text-slate-500">Rec:</span>
        <span className="text-slate-200">₹{parseFloat(rec).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs gap-4">
        <span className="text-slate-500">Inv:</span>
        <span className="text-slate-200">₹{parseFloat(inv).toFixed(2)}</span>
      </div>
      {isMismatch && (
        <div className="border-t border-red-500/10 mt-1 pt-1 flex justify-between text-[11px] font-medium text-red-400">
          <span>Diff:</span>
          <span>₹{parseFloat(mismatch).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Pending': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Invoiced': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Discrepancy': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Paid': 'bg-brand-500/10 text-brand-400 border-brand-500/20'
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
};
