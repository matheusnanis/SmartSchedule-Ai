
import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react';
import { Appointment, Client, Expense } from '../types';
import { 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  appointments: Appointment[];
  clients: Client[];
  expenses: Expense[];
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ appointments, clients }) => {
  const [period, setPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');

  const totalRevenue = appointments.reduce((acc, curr) => curr.status === 'PAID' ? acc + curr.amount : acc, 0);
  
  const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-500">
      <div className={`absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-125 transition-transform duration-700 ${colorClass}`}>
        <Icon size={120} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-4 rounded-2xl ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
          </div>
          {trend && (
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-800/30">
               <TrendingUp size={12}/> +12%
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
      </div>
    </div>
  );

  const chartData = [
    { name: 'Seg', bruto: 400, liquido: 240 },
    { name: 'Ter', bruto: 300, liquido: 180 },
    { name: 'Qua', bruto: 500, liquido: 310 },
    { name: 'Qui', bruto: 280, liquido: 150 },
    { name: 'Sex', bruto: 590, liquido: 420 },
    { name: 'Sáb', bruto: 800, liquido: 550 },
    { name: 'Dom', bruto: 0, liquido: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Faturamento Total" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} colorClass="text-emerald-500 bg-emerald-500" trend />
        <StatCard title="Lucro Líquido Est." value={`$${Math.round(totalRevenue * 0.45).toLocaleString()}`} icon={ShieldCheck} colorClass="text-indigo-500 bg-indigo-500" />
        <StatCard title="Serviços Realizados" value={appointments.length} icon={Clock} colorClass="text-amber-500 bg-amber-500" />
        <StatCard title="Base de Clientes" value={clients.length} icon={Users} colorClass="text-sky-500 bg-sky-500" trend />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Gráfico Semanal */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[3rem] border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
              <div>
                <h4 className="text-xl font-black tracking-tight italic uppercase dark:text-white transition-all">Desempenho Semanal</h4>
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-1">Comparativo de entrada e saída</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border dark:border-zinc-700">
                 <button onClick={() => setPeriod('WEEK')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${period === 'WEEK' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-slate-400'}`}>Semana</button>
                 <button onClick={() => setPeriod('MONTH')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${period === 'MONTH' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-slate-400'}`}>Mês</button>
              </div>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', backgroundColor: '#18181b', color: '#fff', fontWeight: 800, fontSize: '12px'}} 
                  />
                  <Bar dataKey="bruto" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
                  <Bar dataKey="liquido" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Card IA de Otimização */}
        <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group">
           <Zap className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:rotate-12 transition-transform duration-1000" size={180} />
           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md mb-8 border border-white/20">
                 <Sparkles size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">IA Insight</span>
              </div>
              <h3 className="text-3xl font-black tracking-tighter italic uppercase mb-4 leading-tight">Margem de Lucro em Alta!</h3>
              <p className="text-sm font-medium opacity-90 leading-relaxed">Sua equipe 'Alpha' otimizou as rotas e economizou 12% em combustível. Considere reinvestir em marketing local.</p>
           </div>
           <button className="relative z-10 w-full py-5 bg-white text-emerald-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl active-scale mt-10 hover:bg-emerald-50">
              Detalhes do Relatório
           </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
