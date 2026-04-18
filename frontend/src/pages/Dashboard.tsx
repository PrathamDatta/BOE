import React, { useEffect, useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, AlertOctagon, TrendingDown, Layers } from 'lucide-react';
import axios from 'axios';

export const Dashboard = () => {
  const { selectedCompanyId } = useCompany();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCompanyId) return;
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_BASE_URL || ''}/api/dashboard?company_id=${selectedCompanyId}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedCompanyId]);

  if (!selectedCompanyId) return <div className="flex items-center justify-center h-full text-slate-500">Please select a company to view metrics.</div>;
  if (loading) return <div className="flex items-center justify-center h-full text-brand-500 animate-pulse">Loading financial data...</div>;

  const { metrics, statusChart } = data || {};
  const leakageVal = parseFloat(metrics?.total_leakage || 0);

  // Format chart data for BarChart (Recorded vs Invoiced)
  const financialData = [
    {
      name: 'Financial Totals',
      Recorded: parseFloat(metrics?.total_recorded || 0),
      Invoiced: parseFloat(metrics?.total_invoiced || 0),
    }
  ];

  const STATUS_COLORS: Record<string, string> = {
    'Pending': '#94a3b8',
    'Invoiced': '#10b981',
    'Discrepancy': '#ef4444',
    'Paid': '#3b82f6'
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-100">Financial Overview</h2>
        <p className="text-slate-400 mt-1">Consolidated view of BOE transactions and revenue leakage.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total BOEs Processed" 
          value={metrics?.total_boes || 0} 
          icon={<Layers className="text-brand-400 w-6 h-6" />} 
        />
        <KPICard 
          title="Discrepancies Detected" 
          value={metrics?.discrepancy_count || 0} 
          icon={<AlertOctagon className="text-red-400 w-6 h-6" />} 
          alert={Number(metrics?.discrepancy_count) > 0}
        />
        <KPICard 
          title="Revenue Leakage" 
          value={`₹${Math.abs(leakageVal).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<TrendingDown className="text-orange-400 w-6 h-6" />} 
          alert={leakageVal > 0}
        />
        <KPICard 
          title="Total Invoiced" 
          value={`₹${parseFloat(metrics?.total_invoiced || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={<ShieldCheck className="text-emerald-400 w-6 h-6" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Bar Chart: Recorded vs Invoiced */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 font-sans">Recorded vs Invoiced Totals</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: '#1e293b'}} 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}
                  itemStyle={{color: '#f8fafc'}}
                />
                <Legend />
                <Bar dataKey="Recorded" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={60} />
                <Bar dataKey="Invoiced" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Distribution */}
        <div className="glass-panel p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-200 mb-6 font-sans">Status Distribution</h3>
          <div className="flex-1 min-h-0">
            {statusChart?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={statusChart}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {statusChart.map((entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff'}}
                     itemStyle={{color: '#f8fafc'}}
                   />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, alert = false }: any) => (
  <div className={`glass-panel p-6 relative overflow-hidden group ${alert ? 'border-red-500/30' : ''}`}>
    {alert && <div className="absolute top-0 right-0 w-2 h-full bg-red-500/80" />}
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-surface rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
    <div>
      <h4 className="text-slate-400 text-sm font-medium mb-1">{title}</h4>
      <div className="text-3xl font-bold tracking-tight text-slate-100">{value}</div>
    </div>
  </div>
);
