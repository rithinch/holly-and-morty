
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, ProfileStatus, RiskAttitude, EmploymentStatus } from '../types';
import { apiService } from '../services/api';
import { 
  Users, Search, Filter, TrendingUp, ShieldCheck, Clock, ArrowRight, MoreVertical, 
  LayoutDashboard, LogOut, Bell, User, CheckCircle2, Briefcase, Target, FileText,
  ChevronRight, ChevronLeft, Loader2, RefreshCw, Activity, Zap, DollarSign, UserCheck,
  X, Code, SlidersHorizontal, Trash2, Download, Copy
} from 'lucide-react';

interface AdvisorDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchView: () => void;
}

type FilterType = 'name' | 'status' | 'risk' | 'employment' | 'networth' | 'income' | 'all';

const AdvisorDashboard: React.FC<AdvisorDashboardProps> = ({ currentUser, onLogout, onSwitchView }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pipeline' | 'Inventory'>('Pipeline');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  
  // Advanced Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | ''>('');
  const [riskFilter, setRiskFilter] = useState<RiskAttitude | ''>('');
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentStatus | ''>('');
  const [minNetWorth, setMinNetWorth] = useState<number | ''>('');
  const [maxNetWorth, setMaxNetWorth] = useState<number | ''>('');
  const [minIncome, setMinIncome] = useState<number | ''>('');
  const [maxIncome, setMaxIncome] = useState<number | ''>('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: UserProfile[] = [];
      
      // Select API endpoint based on active filter
      if (filterType === 'name' && searchQuery) {
        data = await apiService.searchByName(searchQuery);
      } else if (filterType === 'status' && statusFilter) {
        data = await apiService.searchByStatus(statusFilter as ProfileStatus);
      } else if (filterType === 'risk' && riskFilter) {
        data = await apiService.searchByRisk(riskFilter as RiskAttitude);
      } else if (filterType === 'employment' && employmentFilter) {
        data = await apiService.searchByEmployment(employmentFilter as EmploymentStatus);
      } else if (filterType === 'networth' && (minNetWorth !== '' || maxNetWorth !== '')) {
        data = await apiService.searchByNetWorth(Number(minNetWorth) || 0, Number(maxNetWorth) || 999999999);
      } else if (filterType === 'income' && (minIncome !== '' || maxIncome !== '')) {
        data = await apiService.searchByIncome(Number(minIncome) || 0, Number(maxIncome) || 999999999);
      } else {
        data = await apiService.getAllProfiles(100);
      }

      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch profiles", err);
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterType, searchQuery, statusFilter, riskFilter, employmentFilter, minNetWorth, maxNetWorth, minIncome, maxIncome]);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  const resetFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setStatusFilter('');
    setRiskFilter('');
    setEmploymentFilter('');
    setMinNetWorth('');
    setMaxNetWorth('');
    setMinIncome('');
    setMaxIncome('');
  };

  // Safe wrapper for profiles to prevent .filter errors
  const safeProfileList = useMemo(() => Array.isArray(profiles) ? profiles : [], [profiles]);

  const getStats = () => {
    const total = safeProfileList.length;
    const ready = safeProfileList.filter(p => p.status === ProfileStatus.COMPLETE || p.status === ProfileStatus.VERIFIED).length;
    const aum = safeProfileList.reduce((sum, p) => sum + (p.financial_position?.net_worth || 0), 0);
    const avgIncome = total > 0 ? (safeProfileList.reduce((sum, p) => sum + (p.employment?.annual_salary || 0), 0) / total) : 0;
    return { total, ready, aum, avgIncome };
  };

  const formatCurrency = (val?: number) => {
    if (!val) return '£0';
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(val);
  };

  const stats = getStats();

  const renderKanban = () => {
    const columns = [
      { id: ProfileStatus.NEW, label: 'New Discovery', color: 'bg-indigo-500' },
      { id: ProfileStatus.PARTIAL, label: 'Partial Map', color: 'bg-amber-500' },
      { id: ProfileStatus.COMPLETE, label: 'Analysis Complete', color: 'bg-emerald-500' },
      { id: ProfileStatus.VERIFIED, label: 'Verified Ready', color: 'bg-indigo-900' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[600px] animate-in fade-in duration-500">
        {columns.map(col => {
          const colProfiles = safeProfileList.filter(p => p.status === col.id);
          return (
            <div key={col.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{col.label}</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">{colProfiles.length}</span>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 min-h-[200px]">
                {colProfiles.map(p => (
                  <div 
                    key={p.user_id} 
                    onClick={() => setSelectedProfile(p)}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer group hover:-translate-y-1.5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-600 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        {p.personal_info?.first_name?.[0]}{p.personal_info?.last_name?.[0]}
                      </div>
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${p.risk_profile?.risk_attitude ? 'bg-indigo-400' : 'bg-slate-200'}`}></div>
                         <MoreVertical size={16} className="text-slate-300" />
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">{p.personal_info?.first_name} {p.personal_info?.last_name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Clock size={10} /> {p.user_id}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Net Worth</span>
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(p.financial_position?.net_worth)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        Review <ChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                ))}
                {colProfiles.length === 0 && !isLoading && (
                  <div className="h-32 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Trash2 size={24} className="opacity-20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">No matching leads</span>
                  </div>
                )}
                {isLoading && (
                   <div className="space-y-4">
                      {[1,2].map(i => (
                        <div key={i} className="bg-slate-50/50 h-32 rounded-2xl border border-slate-100 animate-pulse"></div>
                      ))}
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden font-outfit">
      {/* Advisor Sidebar */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col border-r border-white/5 relative z-20">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-[0_0_30px_rgba(99,102,241,0.2)] text-xl">
              HM
            </div>
            <div>
               <span className="text-2xl font-bold tracking-tight block">Advisor Desk</span>
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Institutional Access</span>
            </div>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'Pipeline', icon: <LayoutDashboard size={22} />, label: 'Lead Pipeline' },
              { id: 'Inventory', icon: <Users size={22} />, label: 'Client Inventory' },
              { id: 'Stats', icon: <Activity size={22} />, label: 'Market Metrics' },
              { id: 'Compliance', icon: <ShieldCheck size={22} />, label: 'FCA Governance' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.25rem] transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg font-black scale-[1.03]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white font-bold'
                }`}
              >
                {item.icon}
                <span className="tracking-tight text-base">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-10 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl space-y-4">
          <button 
            onClick={onSwitchView}
            className="w-full flex items-center justify-center gap-4 px-6 py-4 rounded-[1.25rem] bg-indigo-500/10 text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-all font-black text-sm uppercase tracking-widest border border-indigo-500/20"
          >
            <UserCheck size={20} />
            Client View
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-5 px-6 py-4 rounded-[1.25rem] text-slate-500 hover:text-white hover:bg-red-500/10 transition-all font-black">
            <LogOut size={22} />
            <span className="text-sm tracking-widest uppercase">Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#FDFDFF]">
        <header className="h-28 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-16 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Control</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{activeTab} Interface / {safeProfileList.length} Active Profiles</p>
          </div>
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl">
                <button onClick={() => fetchData()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                  <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <div className="w-[1px] h-6 bg-slate-200"></div>
                <div className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Live API Sync</div>
             </div>
             <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-50 text-indigo-700 flex items-center justify-center font-black border border-indigo-100 shadow-sm text-xl">
                {currentUser.personal_info?.first_name?.[0] || 'A'}
              </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Pipeline Leads', value: stats.total, icon: <Users className="text-indigo-600" />, trend: 'Structural Volume' },
                { label: 'Aggregate Net Worth', value: formatCurrency(stats.aum), icon: <DollarSign className="text-emerald-600" />, trend: 'Strategic Assets' },
                { label: 'Market Readiness', value: stats.ready, icon: <CheckCircle2 className="text-indigo-600" />, trend: 'Advice Potential' },
                { label: 'Avg Portfolio Yield', value: formatCurrency(stats.avgIncome), icon: <TrendingUp className="text-amber-600" />, trend: 'Yield Velocity' }
              ].map((kpi, i) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                      {kpi.icon}
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Live</div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{kpi.label}</p>
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{kpi.value}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-emerald-500" />
                    <p className="text-[11px] font-bold text-slate-400">{kpi.trend}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 space-y-8 animate-in slide-in-from-top-8 duration-700">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                        <SlidersHorizontal size={20} />
                     </div>
                     <h2 className="text-xl font-bold text-slate-900">Advanced Lead Discovery</h2>
                  </div>
                  <button onClick={resetFilters} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors flex items-center gap-2">
                     <Trash2 size={14} /> Clear All Filters
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Strategy</label>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer"
                    >
                      <option value="all">Global Inventory</option>
                      <option value="name">Search by Name</option>
                      <option value="status">Filter by Status</option>
                      <option value="employment">Filter by Employment</option>
                      <option value="risk">Search by Risk Attitude</option>
                      <option value="networth">Filter by Net Worth Range</option>
                      <option value="income">Filter by Income Range</option>
                    </select>
                  </div>

                  {filterType === 'name' && (
                    <div className="lg:col-span-3 animate-in slide-in-from-left-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Lead Name Reference</label>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="w-full h-12 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            placeholder="Type client name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                       </div>
                    </div>
                  )}

                  {filterType === 'status' && (
                    <div className="lg:col-span-3 animate-in slide-in-from-left-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Stage Selection</label>
                       <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                          {[ProfileStatus.NEW, ProfileStatus.PARTIAL, ProfileStatus.COMPLETE, ProfileStatus.VERIFIED].map(s => (
                            <button 
                              key={s}
                              onClick={() => setStatusFilter(s)}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'}`}
                            >
                              {s}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {filterType === 'risk' && (
                    <div className="lg:col-span-3 animate-in slide-in-from-left-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Risk Appetite Preference</label>
                       <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                          {[RiskAttitude.VERY_LOW, RiskAttitude.LOW, RiskAttitude.MEDIUM, RiskAttitude.HIGH, RiskAttitude.VERY_HIGH].map(r => (
                            <button 
                              key={r}
                              onClick={() => setRiskFilter(r)}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${riskFilter === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'}`}
                            >
                              {r.replace('_', ' ')}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {filterType === 'employment' && (
                    <div className="lg:col-span-3 animate-in slide-in-from-left-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Revenue Status</label>
                       <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                          {[EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.RETIRED, EmploymentStatus.UNEMPLOYED].map(e => (
                            <button 
                              key={e}
                              onClick={() => setEmploymentFilter(e)}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${employmentFilter === e ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'}`}
                            >
                              {e.replace('_', ' ')}
                            </button>
                          ))}
                       </div>
                    </div>
                  )}

                  {(filterType === 'networth' || filterType === 'income') && (
                    <div className="lg:col-span-3 grid grid-cols-2 gap-8 animate-in slide-in-from-left-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Min Value (£)</label>
                          <input 
                            type="number" 
                            className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            value={filterType === 'networth' ? minNetWorth : minIncome}
                            onChange={(e) => filterType === 'networth' ? setMinNetWorth(e.target.value ? Number(e.target.value) : '') : setMinIncome(e.target.value ? Number(e.target.value) : '')}
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Max Value (£)</label>
                          <input 
                            type="number" 
                            className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            value={filterType === 'networth' ? maxNetWorth : maxIncome}
                            onChange={(e) => filterType === 'networth' ? setMaxNetWorth(e.target.value ? Number(e.target.value) : '') : setMaxIncome(e.target.value ? Number(e.target.value) : '')}
                          />
                       </div>
                    </div>
                  )}

                  {filterType === 'all' && (
                    <div className="lg:col-span-3 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-[10px] font-black uppercase text-slate-300 tracking-widest">
                       Viewing Global Repository
                    </div>
                  )}
               </div>
            </div>

            <div className="space-y-12">
               <div className="flex items-center justify-between border-b border-slate-200 pb-6">
                 <div className="flex gap-16">
                   {['Pipeline', 'Inventory'].map(tab => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-6 text-sm font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab} Perspective
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-full animate-in slide-in-from-left-4"></div>}
                     </button>
                   ))}
                 </div>
                 <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                      <Download size={16} /> Export Strategy Report
                    </button>
                 </div>
               </div>

               {activeTab === 'Pipeline' ? renderKanban() : (
                 <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Structural Identity</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Context ID</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Profile</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Worth</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Stage Status</th>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {safeProfileList.length > 0 ? safeProfileList.map(p => (
                          <tr key={p.user_id} className="hover:bg-indigo-50/30 transition-all group cursor-pointer" onClick={() => setSelectedProfile(p)}>
                             <td className="p-8">
                               <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100">{p.personal_info?.first_name?.[0]}{p.personal_info?.last_name?.[0]}</div>
                                 <div>
                                    <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{p.personal_info?.first_name} {p.personal_info?.last_name}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.employment?.job_title || 'Unspecified'}</span>
                                 </div>
                               </div>
                             </td>
                             <td className="p-8 text-xs text-slate-400 font-mono tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">{p.user_id}</td>
                             <td className="p-8">
                                <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${p.risk_profile?.risk_attitude ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                   <span className="text-[10px] font-black uppercase text-slate-500">{p.risk_profile?.risk_attitude?.replace('_', ' ') || 'Pending'}</span>
                                </div>
                             </td>
                             <td className="p-8 text-sm font-bold text-slate-700">{formatCurrency(p.financial_position?.net_worth)}</td>
                             <td className="p-8">
                                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border tracking-widest ${
                                  p.status === ProfileStatus.COMPLETE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                  p.status === ProfileStatus.PARTIAL ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-50 text-slate-400 border-slate-200'
                                }`}>{p.status}</span>
                             </td>
                             <td className="p-8">
                               <button className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                                 <ChevronRight size={22} />
                               </button>
                             </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="p-24 text-center">
                               <div className="flex flex-col items-center gap-4 text-slate-300">
                                  <Trash2 size={48} className="opacity-10" />
                                  <p className="text-sm font-bold uppercase tracking-widest">Global Scan yielded no structural results</p>
                                  <button onClick={resetFilters} className="text-indigo-500 font-black text-[10px] uppercase underline tracking-widest">Restore Inventory</button>
                               </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {selectedProfile && (
        <div className="fixed inset-0 z-[300] flex justify-end bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-500 overflow-hidden">
            <header className="p-10 flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">
                    {selectedProfile.personal_info?.first_name?.[0]}{selectedProfile.personal_info?.last_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedProfile.personal_info?.first_name} {selectedProfile.personal_info?.last_name}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{selectedProfile.user_id}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedProfile.status} Mode / Structural Map</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setSelectedProfile(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all text-slate-400 group">
                 <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-[#FDFDFF]">
              <div className="grid grid-cols-3 gap-8">
                 <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Modelled Net Worth</p>
                   <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedProfile.financial_position?.net_worth)}</p>
                 </div>
                 <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Annual Yield (Gross)</p>
                   <p className="text-2xl font-bold text-slate-900">{formatCurrency(selectedProfile.employment?.annual_salary)}</p>
                 </div>
                 <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Risk Assessment</p>
                   <p className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{selectedProfile.risk_profile?.risk_attitude?.replace('_', ' ') || 'Not Modelled'}</p>
                 </div>
              </div>

              <div className="space-y-12">
                <section className="space-y-6">
                  <h3 className="flex items-center gap-4 text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] pb-6 border-b border-slate-100">
                    <Activity size={18} className="text-indigo-600" /> Revenue Context & Architecture
                  </h3>
                  <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                    <DetailItem label="Legal Status" value={selectedProfile.employment?.employment_status} />
                    <DetailItem label="Employer Entity" value={selectedProfile.employment?.employer_name} />
                    <DetailItem label="Tax Bracket Reference" value={selectedProfile.employment?.expected_tax_bracket} />
                    <DetailItem label="Role Classification" value={selectedProfile.employment?.job_title} />
                    <DetailItem label="Asset Liquidity" value={formatCurrency(selectedProfile.financial_position?.total_assets)} />
                    <DetailItem label="Liability Structure" value={formatCurrency(selectedProfile.financial_position?.total_liabilities)} />
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="flex items-center gap-4 text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] pb-6 border-b border-slate-100">
                    <Target size={18} className="text-indigo-600" /> Strategic Objectives
                  </h3>
                  <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                    <DetailItem label="Target Retirement" value={`${selectedProfile.goals_and_objectives?.retirement_age} Years`} />
                    <DetailItem label="Retirement Income" value={formatCurrency(selectedProfile.goals_and_objectives?.desired_retirement_income)} />
                    <DetailItem label="Legacy Parameters" value={selectedProfile.goals_and_objectives?.legacy_wishes} />
                    <DetailItem label="Risk Capacity" value={selectedProfile.risk_profile?.capacity_for_loss} />
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="flex items-center gap-4 text-slate-900 font-black uppercase tracking-[0.2em] text-[11px] pb-6 border-b border-slate-100">
                    <Code size={18} className="text-indigo-600" /> Institutional Source Object (JSON)
                  </h3>
                  <div className="relative group">
                    <pre className="bg-slate-950 p-10 rounded-[2.5rem] text-indigo-300 font-mono text-xs overflow-x-auto selection:bg-indigo-500/30 shadow-2xl leading-relaxed">
                      {JSON.stringify(selectedProfile, null, 2)}
                    </pre>
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedProfile, null, 2))}
                         className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all"
                       >
                         <Copy size={16} />
                       </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <footer className="p-10 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0 z-10">
               <button onClick={() => alert("Connecting for advice session...")} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all flex items-center gap-4 group">
                 Initiate Advice Connect <Zap size={20} className="group-hover:scale-125 transition-transform" />
               </button>
               <button onClick={() => setSelectedProfile(null)} className="px-10 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">Dismiss Lead Map</button>
            </footer>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-base font-bold text-slate-800">{value || <span className="text-slate-200">Not Captured</span>}</span>
  </div>
);

export default AdvisorDashboard;
