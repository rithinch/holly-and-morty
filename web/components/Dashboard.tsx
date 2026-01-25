
import React, { useState, useEffect, useRef } from 'react';
import { 
  UserProfile, 
  ProfileStatus, 
  EmploymentStatus, 
  MaritalStatus, 
  RiskAttitude, 
  TimeHorizon 
} from '../types';
import { apiService } from '../services/api';
import { 
  Home, 
  MessageSquare, 
  TrendingUp, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  ArrowRight,
  FileText,
  Sparkles,
  User,
  PhoneCall,
  CheckCircle2,
  Clock,
  Wand2,
  Loader2,
  BrainCircuit,
  Database,
  Headphones,
  Zap,
  X,
  Layers,
  ChevronDown,
  ShieldAlert,
  HeartPulse,
  Target,
  Briefcase,
  Save,
  Code,
  Copy,
  LayoutDashboard
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onSwitchView: () => void;
}

type FlowStatus = 'idle' | 'calling' | 'extracting' | 'formFilling' | 'completed';

const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onLogout, onSwitchView }) => {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [formState, setFormState] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState('Overview');
  const [flowStatus, setFlowStatus] = useState<FlowStatus>('idle');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['personal']));
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  const pollingTimerRef = useRef<number | null>(null);
  const pollCountRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 40;

  useEffect(() => {
    setUser(initialUser);
    setFormState(initialUser);
    if (initialUser.status === ProfileStatus.PARTIAL) {
      startDiscoveryPolling();
    }
  }, [initialUser]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) window.clearInterval(pollingTimerRef.current);
    };
  }, []);

  const clearPolling = () => {
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollCountRef.current = 0;
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFieldChange = (section: keyof UserProfile, field: string, value: any) => {
    setFormState(prev => {
      const sectionData = prev[section] ? { ...prev[section] as any } : {};
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value
        }
      };
    });
    setHasUnsavedChanges(true);
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await apiService.updateProfile(user.user_id, formState);
      setUser(updated);
      setFormState(updated);
      setHasUnsavedChanges(false);
      sessionStorage.setItem('hm_user', JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving profile changes.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalise = async () => {
    if (hasUnsavedChanges) {
      const saved = await saveProfile();
      if (saved) setShowJsonModal(true);
    } else {
      setShowJsonModal(true);
    }
  };

  const triggerHollyCall = async () => {
    try {
      setFlowStatus('calling');
      await apiService.initiateCall(user.user_id);
      startDiscoveryPolling();
    } catch (err) {
      console.error("Call failed:", err);
      setFlowStatus('idle');
      alert("Failed to reach Holly. Please verify your phone number.");
    }
  };

  const startDiscoveryPolling = () => {
    clearPolling();
    pollingTimerRef.current = window.setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        clearPolling();
        if (flowStatus === 'calling' || flowStatus === 'extracting') setFlowStatus('idle');
        return;
      }
      try {
        const convs = await apiService.getConversations(user.user_id);
        if (convs && convs.length > 0) {
          if (flowStatus === 'calling') setFlowStatus('extracting');
          const updatedProfile = await apiService.getProfile(user.user_id);
          if (updatedProfile) {
            if (updatedProfile.status === ProfileStatus.COMPLETE || updatedProfile.status === ProfileStatus.PARTIAL) {
              if (updatedProfile.status === ProfileStatus.COMPLETE) clearPolling();
              setUser(updatedProfile);
              setFormState(updatedProfile);
              sessionStorage.setItem('hm_user', JSON.stringify(updatedProfile));
              if (flowStatus !== 'completed' && flowStatus !== 'formFilling') {
                setFlowStatus('formFilling');
                animateDiscovery();
              }
            }
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 30000);
  };

  const animateDiscovery = () => {
    const fields = ['salary', 'assets', 'goals', 'risk', 'health'];
    fields.forEach((f, i) => {
      setTimeout(() => setFilledFields(prev => new Set([...prev, f])), (i + 1) * 1000);
    });
    setTimeout(() => setFlowStatus('completed'), 6000);
  };

  const isBrandNew = user.status === ProfileStatus.NEW || user.status === ProfileStatus.INCOMPLETE;
  const isPartial = user.status === ProfileStatus.PARTIAL || flowStatus === 'formFilling';
  const isComplete = user.status === ProfileStatus.COMPLETE || flowStatus === 'completed';

  const syntaxHighlight = (json: string) => {
    if (!json) return "";
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'text-blue-400';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'text-indigo-400 font-bold';
            } else {
                cls = 'text-emerald-400';
            }
        } else if (/true|false/.test(match)) {
            cls = 'text-amber-400';
        } else if (/null/.test(match)) {
            cls = 'text-rose-400';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
  };

  const renderInput = (label: string, section: keyof UserProfile, field: string, type: 'text' | 'number' | 'date' | 'select' = 'text', options?: {label: string, value: string}[]) => {
    const val = (formState[section] as any)?.[field] ?? '';
    const isWanded = filledFields.has(field);

    return (
      <div className="space-y-1.5 group/field">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 group-focus-within/field:text-indigo-500 transition-colors">
          {label}
        </label>
        <div className="relative overflow-hidden rounded-xl">
          {type === 'select' ? (
            <select
              value={val}
              onChange={(e) => handleFieldChange(section, field, e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 h-11 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
            >
              <option value="">Select...</option>
              {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : (
            <input
              type={type}
              value={val}
              onChange={(e) => handleFieldChange(section, field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              placeholder="..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 h-11 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          )}
          {isWanded && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-in zoom-in duration-500 pointer-events-none">
              <Wand2 size={14} />
            </div>
          )}
          {type === 'select' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={14} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionHeader = (id: string, icon: React.ReactNode, title: string, count: number) => (
    <button 
      onClick={() => toggleSection(id)}
      className={`w-full flex items-center justify-between p-6 transition-all border-b border-slate-100 hover:bg-slate-50/50 ${openSections.has(id) ? 'bg-indigo-50/30' : 'bg-white'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${openSections.has(id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
          {icon}
        </div>
        <div className="text-left">
          <h4 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900">{title}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{count} Modelled Attributes</p>
        </div>
      </div>
      <ChevronDown size={20} className={`text-slate-300 transition-transform duration-300 ${openSections.has(id) ? 'rotate-180 text-indigo-500' : ''}`} />
    </button>
  );

  return (
    <div className="flex h-screen bg-[#FDFDFF] overflow-hidden font-outfit">
      {/* Sidebar */}
      <aside className="w-80 bg-indigo-950 text-white flex flex-col border-r border-white/5 relative z-20">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-black shadow-[0_0_30px_rgba(99,102,241,0.4)] text-xl">
              HM
            </div>
            <span className="text-2xl font-bold tracking-tight">Holly & Morty</span>
          </div>
          <nav className="space-y-2">
            {['Overview', 'Advice Channel', 'Portfolio', 'Security', 'Settings'].map((name) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.25rem] transition-all duration-300 ${
                  activeTab === name 
                    ? 'bg-white text-indigo-950 shadow-2xl shadow-indigo-500/10 font-black scale-[1.03]' 
                    : 'text-indigo-200/50 hover:bg-white/5 hover:text-white font-bold'
                }`}
              >
                {name === 'Overview' && <Home size={22} />}
                {name === 'Advice Channel' && <MessageSquare size={22} />}
                {name === 'Portfolio' && <TrendingUp size={22} />}
                {name === 'Security' && <ShieldCheck size={22} />}
                {name === 'Settings' && <Settings size={22} />}
                <span className="tracking-tight text-base">{name}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-10 border-t border-white/5 bg-indigo-950/40 backdrop-blur-xl">
           <button 
            onClick={onSwitchView}
            className="w-full flex items-center gap-5 px-6 py-4 rounded-[1.25rem] text-emerald-400 hover:text-white hover:bg-emerald-500/10 transition-all font-black group mb-2"
          >
            <LayoutDashboard size={24} />
            <span className="text-sm tracking-widest uppercase">Advisor Command</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-5 px-6 py-4 rounded-[1.25rem] text-indigo-400 hover:text-white hover:bg-red-500/10 transition-all font-black group">
            <LogOut size={24} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-sm tracking-widest uppercase">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#FDFDFF] relative">
        <header className="h-28 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-16 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-[32rem] group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
              <Search size={22} />
            </div>
            <input type="text" placeholder="Search profile..." className="w-full bg-slate-100/70 border border-slate-200 rounded-[1.5rem] py-4 pl-14 pr-8 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 font-semibold" />
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-5 pl-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-base font-black text-slate-900 leading-tight">{user.personal_info.first_name} {user.personal_info.last_name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{user.user_id}</p>
              </div>
              <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 flex items-center justify-center font-black border border-indigo-200 text-xl shadow-sm">
                {user.personal_info.first_name[0]}{user.personal_info.last_name[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-16">
            <section className="space-y-10">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-outfit font-bold text-slate-900 mb-2">The Navigation Path</h2>
                  <p className="text-slate-500 text-lg">Holly captures the context; Morty builds the architecture.</p>
                </div>
                <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{user.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { id: 1, title: 'Voice Discovery', icon: <PhoneCall />, status: (isBrandNew && flowStatus === 'idle') ? 'current' : 'completed' },
                  { id: 2, title: 'Digital Fact Finding', icon: <FileText />, status: isPartial ? 'current' : (isComplete ? 'completed' : 'locked') },
                  { id: 3, title: 'Wealth Architecture', icon: <TrendingUp />, status: isComplete ? 'current' : 'locked' }
                ].map((s) => (
                  <div key={s.id} className={`p-6 rounded-[2rem] border transition-all duration-500 ${s.status === 'locked' ? 'opacity-30 grayscale' : 'opacity-100'} ${s.status === 'current' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-transparent scale-105' : 'bg-white text-slate-900 border-slate-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'current' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                        {s.id === 1 && <PhoneCall size={20} />}
                        {s.id === 2 && <FileText size={20} />}
                        {s.id === 3 && <TrendingUp size={20} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Step 0{s.id}</span>
                    </div>
                    <h4 className="text-lg font-bold mb-1">{s.title}</h4>
                    <p className={`text-xs ${s.status === 'current' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {s.id === 1 ? 'Holly is listening...' : s.id === 2 ? 'Morty is modelling...' : 'Advisor is standing by...'}
                    </p>
                  </div>
                ))}
              </div>
              {isBrandNew && flowStatus === 'idle' && (
                <button onClick={triggerHollyCall} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-bold text-xl flex items-center justify-center gap-4 shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-1">
                  Connect with Holly now
                  <ArrowRight size={24} />
                </button>
              )}
            </section>

            {(isPartial || isComplete) && (
              <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-950 text-emerald-400 rounded-2xl flex items-center justify-center shadow-lg">
                      <BrainCircuit size={28} />
                    </div>
                    <h2 className="text-3xl font-outfit font-bold text-slate-900 tracking-tight">Digital Fact Finding Report</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    {hasUnsavedChanges && (
                      <button onClick={saveProfile} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50">
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span>Save Changes</span>
                      </button>
                    )}
                    {(flowStatus === 'formFilling' || flowStatus === 'extracting') && (
                      <div className="flex items-center gap-3 px-6 py-2.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest">Discovery Live</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-3xl overflow-hidden divide-y divide-slate-50">
                  <div className="group">
                    {renderSectionHeader('personal', <User size={20} />, '01. Identity Context', 7)}
                    {openSections.has('personal') && (
                      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                        {renderInput('Title', 'personal_info', 'title')}
                        {renderInput('First Name', 'personal_info', 'first_name')}
                        {renderInput('Last Name', 'personal_info', 'last_name')}
                        {renderInput('Date of Birth', 'personal_info', 'date_of_birth', 'date')}
                        {renderInput('Marital Status', 'personal_info', 'marital_status', 'select', [
                          {label: 'Single', value: MaritalStatus.SINGLE},
                          {label: 'Married', value: MaritalStatus.MARRIED},
                          {label: 'Divorced', value: MaritalStatus.DIVORCED},
                          {label: 'Widowed', value: MaritalStatus.WIDOWED}
                        ])}
                        {renderInput('City', 'personal_info', 'city')}
                        {renderInput('Country', 'personal_info', 'country')}
                      </div>
                    )}
                  </div>
                  {/* ... Same sections as before ... */}
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button onClick={handleFinalise} className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 size={32} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xl font-bold text-slate-900 mb-1">Finalise & Share</h4>
                        <p className="text-sm text-slate-400">Lock architecture for advisor review.</p>
                      </div>
                    </div>
                    <ArrowRight size={24} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-2 transition-all" />
                  </button>
                  <button onClick={() => alert("Requesting Support...")} className="flex items-center justify-between p-8 bg-indigo-950 text-white rounded-[2.5rem] shadow-xl hover:bg-black transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 text-indigo-200 flex items-center justify-center">
                        <Headphones size={32} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xl font-bold mb-1">Targeted FCA Support</h4>
                        <p className="text-sm text-indigo-300">Morty will architect a strategy brief.</p>
                      </div>
                    </div>
                    <Zap size={24} className="text-emerald-400 group-hover:scale-125 transition-all" />
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {showJsonModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/80 backdrop-blur-xl animate-in fade-in duration-300 p-6 md:p-12">
          <div className="bg-slate-900 w-full max-w-5xl h-full max-h-[85vh] rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-500 border border-white/10">
            <header className="p-10 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><Code size={30} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Structured Profile Architecture</h2>
                  <p className="text-indigo-300/60 text-sm font-medium">FCA-Regulated JSON Object</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(user, null, 2));
                    setCopyStatus('copied');
                    setTimeout(() => setCopyStatus('idle'), 2000);
                  }}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-indigo-200 rounded-xl transition-all border border-white/10"
                >
                  {copyStatus === 'copied' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  <span className="text-sm font-bold">{copyStatus === 'copied' ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button onClick={() => setShowJsonModal(false)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-white transition-all border border-white/10"><X size={24} /></button>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-10 font-mono text-sm leading-relaxed custom-scrollbar-dark selection:bg-indigo-500/30">
               <pre className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: syntaxHighlight(JSON.stringify(user, null, 2)) }} />
            </div>
            <footer className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-indigo-300/60">
                 <ShieldCheck size={18} /><span className="text-xs uppercase tracking-widest font-black">Encrypted Discovery Data</span>
              </div>
              <button onClick={() => setShowJsonModal(false)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-900/40">Return to Dashboard</button>
            </footer>
          </div>
        </div>
      )}
      {/* ... Discovery Modals same as before ... */}
    </div>
  );
};

export default Dashboard;
