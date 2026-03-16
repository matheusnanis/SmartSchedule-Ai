
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Menu, 
  Mic, 
  FileText, 
  Sparkles,
  Clock,
  LayoutDashboard,
  UsersRound,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  X
} from 'lucide-react';
import { AppTab, Appointment, Client, Expense, Team } from './types';
import LiveManager from './components/LiveManager';
import CalendarManager from './components/CalendarManager';
import EstimateManager from './components/EstimateManager';
import ClientManager from './components/ClientManager';
import Dashboard from './components/Dashboard';
import FinanceManager from './components/FinanceManager';
import TeamManager from './components/TeamManager';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CALENDAR);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('ss_theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // --- DADOS MVP ---
  const [clients, setClients] = useState<Client[]>([
    {
      id: 'c1',
      name: 'Sarah Jenkins',
      phone: '+1 617-555-0123',
      address: '782 Boylston St, Boston, MA 02116',
      addressDetails: { street: '782 Boylston St', city: 'Boston', state: 'MA', zipCode: '02116' },
      language: 'EN',
      preferences: ['Organic products only', 'Careful with the cat'],
      frequency: 'BIWEEKLY',
      preferredDay: 'TUESDAY',
      preferredTime: '09:00',
      defaultPrice: 220,
      houseType: 'HOUSE',
      houseDetails: { bedrooms: 4, bathrooms: 3, sqft: 2400 }
    }
  ]);

  const [teams, setTeams] = useState<Team[]>([
    {
      id: 't1',
      name: 'Equipe Alpha',
      color: 'bg-emerald-600',
      members: [
        { id: 'm1', name: 'Maria Silva', role: 'LEADER', defaultRate: 60, paymentModel: 'PER_SERVICE' }
      ]
    }
  ]);

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'a1',
      clientId: 'c1',
      teamId: 't1',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: 180,
      status: 'CONFIRMED',
      amount: 220,
      payouts: [{ memberId: 'm1', memberName: 'Maria Silva', amount: 60, model: 'PER_SERVICE' }],
      checklist: [],
      photos: []
    }
  ]);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Monitor de redimensionamento para fechar menus mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ss_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ss_theme', 'light');
    }
  }, [darkMode]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const NavItem = ({ tab, icon: Icon, label }: { tab: AppTab; icon: any; label: string }) => {
    const isActive = activeTab === tab;
    // No desktop aberto ou mobile, mostra texto. No desktop fechado, esconde.
    const showText = (window.innerWidth >= 1024 && isSidebarOpen) || (window.innerWidth < 1024);

    return (
      <button
        onClick={() => {
          setActiveTab(tab);
          if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all active-scale group relative mb-1 ${
          isActive 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
            : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
        } ${!showText ? 'justify-center px-0' : ''}`}
        title={!showText ? label : undefined}
      >
        <Icon size={22} className={`${isActive ? 'scale-110' : 'group-hover:scale-110'} shrink-0`} />
        {showText && (
          <span className="text-sm font-black tracking-tight whitespace-nowrap overflow-hidden animate-in fade-in duration-300 uppercase">
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-500 font-sans">
      
      {/* Botão de Troca de Tema (Fixo no Topo) */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-[80] p-3 rounded-2xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-slate-200 dark:border-zinc-700 shadow-xl active-scale"
      >
        {darkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
      </button>

      {/* Backdrop Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
          sidebar-transition flex flex-col h-screen shrink-0 z-[100]
          ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}
          ${window.innerWidth >= 1024 
            ? (isSidebarOpen ? 'w-72 border-r' : 'w-20 border-r') 
            : (isMobileMenuOpen ? 'fixed left-0 w-72 border-r shadow-2xl' : 'fixed -left-72 w-72')
          }
        `}
      >
        {/* Header da Sidebar */}
        <div className="p-4 flex items-center justify-between shrink-0 h-20 border-b dark:border-zinc-800/50">
           <div className={`flex items-center gap-3 ${!isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center w-full' : ''}`}>
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              {((isSidebarOpen && window.innerWidth >= 1024) || window.innerWidth < 1024) && (
                <h1 className="text-sm font-black tracking-tighter italic uppercase text-emerald-600 animate-in fade-in">
                  SmartSchedule
                </h1>
              )}
           </div>
           
           {/* Botão de Fechar na Sidebar (Mobile) */}
           <button onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors lg:hidden">
              <X size={24} />
           </button>
           
           {/* Botão de Recolher na Sidebar (Desktop) */}
           {window.innerWidth >= 1024 && isSidebarOpen && (
             <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
               <PanelLeftClose size={20} />
             </button>
           )}
        </div>

        {/* Links de Navegação */}
        <nav className="px-3 space-y-1 flex-1 overflow-y-auto no-scrollbar py-6">
          <NavItem tab={AppTab.CALENDAR} icon={Clock} label="Agenda Pro" />
          <NavItem tab={AppTab.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
          <NavItem tab={AppTab.CLIENTS} icon={Users} label="Clientes" />
          <NavItem tab={AppTab.TEAMS} icon={UsersRound} label="Equipes" />
          <NavItem tab={AppTab.ESTIMATES} icon={FileText} label="Orçamentos IA" />
          <NavItem tab={AppTab.FINANCE} icon={DollarSign} label="Financeiro" />
          <div className="pt-6 mt-4 border-t dark:border-zinc-800/50">
             <NavItem tab={AppTab.LIVE} icon={Mic} label="Assistente IA" />
          </div>
        </nav>

        {/* Footer da Sidebar (Perfil) */}
        <div className="p-4 border-t dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-800/20">
           <div className={`flex items-center gap-3 ${!isSidebarOpen && window.innerWidth >= 1024 ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-lg shrink-0">JD</div>
              {((isSidebarOpen && window.innerWidth >= 1024) || window.innerWidth < 1024) && (
                <div className="flex flex-col animate-in fade-in overflow-hidden">
                   <span className="text-[11px] font-black dark:text-white uppercase truncate">Jane Doe</span>
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Admin Pro</span>
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 border-b dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 glass-header flex items-center justify-between px-6 z-40 shrink-0">
          <div className="flex items-center gap-4">
            {/* Botão de Menu visível se a sidebar estiver fechada ou no mobile */}
            {(!isSidebarOpen || window.innerWidth < 1024) && (
              <button 
                className="p-2.5 text-slate-500 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" 
                onClick={toggleSidebar}
              >
                {window.innerWidth >= 1024 ? <PanelLeft size={24} /> : <Menu size={24} />}
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-lg font-black uppercase tracking-tighter italic dark:text-white leading-none">
                {activeTab}
              </h2>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 opacity-70">Escalando seu negócio nos EUA</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 pr-12">
             <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest">IA Sincronizada</span>
             </div>
          </div>
        </header>

        {/* Seção de Conteúdo Dinâmico */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-slate-50 dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeTab === AppTab.DASHBOARD && <Dashboard appointments={appointments} clients={clients} expenses={expenses} onUpdateStatus={()=>{}} />}
            {activeTab === AppTab.CALENDAR && (
              <CalendarManager 
                appointments={appointments} clients={clients} teams={teams}
                onAddAppointment={(apt) => setAppointments(p => [apt, ...p])}
                onUpdateStatus={(id, status) => setAppointments(p => p.map(a => a.id === id ? {...a, status} : a))}
                onMoveAppointment={(id, date) => setAppointments(p => p.map(a => a.id === id ? {...a, date} : a))}
                onUpdateNotes={(id, notes) => setAppointments(p => p.map(a => a.id === id ? {...a, notes} : a))}
                onUpdateAppointment={(id, updates) => setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, ...updates } : apt))}
                onToggleSidebar={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                darkMode={darkMode}
              />
            )}
            {activeTab === AppTab.CLIENTS && <ClientManager clients={clients} appointments={appointments} onAddClient={(c, autoApts) => {
              setClients(p => [c, ...p]);
              if (autoApts) setAppointments(p => [...autoApts, ...p]);
            }} />}
            {activeTab === AppTab.TEAMS && <TeamManager teams={teams} onUpdateTeams={setTeams} />}
            {activeTab === AppTab.ESTIMATES && <EstimateManager />}
            {activeTab === AppTab.FINANCE && <FinanceManager appointments={appointments} expenses={expenses} onAddExpense={(ex)=>setExpenses(p=>[ex,...p])} onDeleteExpense={(id)=>setExpenses(p=>p.filter(e=>e.id!==id))} teams={teams} />}
            {activeTab === AppTab.LIVE && <LiveManager />}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
