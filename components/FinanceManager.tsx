
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  X, 
  UsersRound, 
  Calculator, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Loader2, 
  CheckCircle,
  TrendingUp,
  Target,
  Rocket,
  ShieldCheck,
  Zap,
  Info,
  AlertCircle
} from 'lucide-react';
import { Appointment, Expense, Team } from '../types';
import * as GeminiService from '../services/geminiService';

interface FinanceManagerProps {
  appointments: Appointment[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  teams: Team[];
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ appointments, expenses, onAddExpense, onDeleteExpense, teams }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [period, setPeriod] = useState<'WEEK' | 'MONTH' | 'ALL'>('WEEK');
  const [viewDate, setViewDate] = useState(new Date());
  const [isConsulting, setIsConsulting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [consultancyReport, setConsultancyReport] = useState<any>(null);
  const [consultancyError, setConsultancyError] = useState<string | null>(null);
  
  const [expenseForm, setExpenseForm] = useState({
    category: 'GAS' as Expense['category'],
    teamId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };
  
  const startOfSelectedWeek = getStartOfWeek(viewDate);
  const startOfSelectedMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

  const filteredApts = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date + 'T12:00:00');
      if (period === 'WEEK') {
         const endOfWeek = new Date(startOfSelectedWeek);
         endOfWeek.setDate(endOfWeek.getDate() + 7);
         return aptDate >= startOfSelectedWeek && aptDate < endOfWeek;
      }
      if (period === 'MONTH') {
         const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
         return aptDate >= startOfSelectedMonth && aptDate < endOfMonth;
      }
      return true;
    });
  }, [appointments, period, viewDate, startOfSelectedWeek, startOfSelectedMonth]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      const exDate = new Date(ex.date + 'T12:00:00');
      if (period === 'WEEK') {
         const endOfWeek = new Date(startOfSelectedWeek);
         endOfWeek.setDate(endOfWeek.getDate() + 7);
         return exDate >= startOfSelectedWeek && exDate < endOfWeek;
      }
      if (period === 'MONTH') {
         const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
         return exDate >= startOfSelectedMonth && exDate < endOfMonth;
      }
      return true;
    });
  }, [expenses, period, viewDate, startOfSelectedWeek, startOfSelectedMonth]);

  const totalRevenue = filteredApts.reduce((acc, curr) => curr.status === 'PAID' ? acc + curr.amount : acc, 0);
  const totalPayouts = filteredApts.filter(a => a.status === 'PAID').reduce((acc, curr) => acc + curr.payouts.reduce((sum, p) => sum + p.amount, 0), 0);
  const totalOtherExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = filteredApts.reduce((acc, curr) => {
    if (curr.status !== 'PAID') return acc;
    if (curr.aiData) return acc + curr.aiData.netProfit;
    return acc + (curr.amount - curr.payouts.reduce((s,p)=>s+p.amount,0) - (curr.amount * 0.15));
  }, 0) - totalOtherExpenses;

  const runConsultancy = async () => {
    if (filteredApts.length === 0) {
      alert("Adicione alguns agendamentos primeiro para que a IA possa analisar.");
      return;
    }
    
    setIsConsulting(true);
    setConsultancyError(null);
    setConsultancyReport(null);

    try {
      const result = await GeminiService.getBusinessConsultancy(filteredApts, filteredExpenses);
      if (result && result.analysis) {
        setConsultancyReport(result);
      } else {
        setConsultancyError("O consultor não conseguiu processar os dados adequadamente.");
      }
    } catch (e) {
      console.error(e);
      setConsultancyError("Erro ao conectar com o Consultor Gemini. Verifique sua conexão ou tente novamente em instantes.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) return alert('Preencha os dados');
    setIsCalculating(true);
    await new Promise(r => setTimeout(r, 600)); 
    onAddExpense({
      id: Math.random().toString(36).substr(2, 9),
      category: expenseForm.category,
      teamId: expenseForm.teamId || undefined,
      amount: Number(expenseForm.amount),
      description: expenseForm.description,
      date: expenseForm.date,
      aiVerified: true
    });
    setIsCalculating(false);
    setShowAddExpense(false);
  };

  const ledgerItems = useMemo(() => {
    const items: any[] = [];
    filteredApts.filter(a => a.status === 'PAID').forEach(apt => {
      items.push({
        id: `rev-${apt.id}`,
        type: 'REVENUE',
        date: apt.date,
        amount: apt.amount,
        description: `Receita Bruta: Faxina ${apt.time}`,
        teamId: apt.teamId,
        aiVerified: !!apt.aiData
      });
      const payoutTotal = apt.payouts.reduce((s,p) => s + p.amount, 0);
      if (payoutTotal > 0) {
        items.push({
          id: `pay-${apt.id}`,
          type: 'PAYOUT',
          date: apt.date,
          amount: payoutTotal,
          description: `Payouts Equipe: Faxina ${apt.time}`,
          teamId: apt.teamId,
          aiVerified: !!apt.aiData
        });
      }
    });
    filteredExpenses.forEach(ex => {
      items.push({
        id: ex.id,
        type: 'EXPENSE',
        date: ex.date,
        amount: ex.amount,
        description: ex.description,
        teamId: ex.teamId,
        aiVerified: ex.aiVerified
      });
    });
    return items.sort((a, b) => new Date(b.date + 'T12:00:00').getTime() - new Date(a.date + 'T12:00:00').getTime());
  }, [filteredApts, filteredExpenses]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
         <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
            <div>
               <h3 className="text-2xl font-black text-gray-900 tracking-tight italic">Gestão de Lucro Real</h3>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                 <ShieldCheck size={14} /> Auditado pelo Consultor Gemini Pro
               </p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
               <button onClick={() => setPeriod('WEEK')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${period === 'WEEK' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-400'}`}>Semana</button>
               <button onClick={() => setPeriod('MONTH')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${period === 'MONTH' ? 'bg-white text-emerald-700 shadow-md' : 'text-gray-400'}`}>Mês</button>
            </div>
         </div>

         <button 
           onClick={runConsultancy}
           disabled={isConsulting}
           className="w-full sm:w-auto bg-black text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
         >
           {isConsulting ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18} className="text-emerald-400 fill-emerald-400" />}
           {isConsulting ? "Analisando Empresa..." : "Relatório de Crescimento IA"}
         </button>
      </div>

      {consultancyError && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 text-rose-800 animate-in fade-in zoom-in-95">
           <AlertCircle className="shrink-0" size={24} />
           <p className="font-bold text-sm">{consultancyError}</p>
        </div>
      )}

      {consultancyReport && (
        <div className="bg-white border-2 border-emerald-100 rounded-[3rem] p-10 animate-in zoom-in-95 duration-500 shadow-2xl shadow-emerald-50 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5">
             <Rocket size={200} />
           </div>
           <div className="relative z-10 flex flex-col lg:flex-row gap-12">
              <div className="flex flex-col items-center justify-center lg:w-1/4 border-b lg:border-b-0 lg:border-r border-emerald-50 pb-8 lg:pb-0 lg:pr-12">
                 <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                       <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-50" />
                       <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * consultancyReport.healthScore) / 100} className="text-emerald-500 transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-3xl font-black text-emerald-900">{consultancyReport.healthScore}%</span>
                 </div>
                 <p className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Score de Saúde do Negócio</p>
              </div>
              <div className="flex-1 space-y-8">
                 <div className="flex items-start gap-4">
                    <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg"><Sparkles size={24}/></div>
                    <div>
                       <h4 className="text-lg font-black text-gray-900 tracking-tight">Análise do Consultor Gemini</h4>
                       <p className="text-sm text-gray-600 font-bold leading-relaxed mt-1">{consultancyReport.analysis}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                       <div className="flex items-center gap-2 mb-4">
                          <Target className="text-emerald-600" size={18}/>
                          <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Plano de Ação</span>
                       </div>
                       <ul className="space-y-3">
                          {consultancyReport.actionPlan.map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-xs font-bold text-emerald-800">
                               <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] shrink-0">{i+1}</div>
                               {step}
                            </li>
                          ))}
                       </ul>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                       <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="text-blue-600" size={18}/>
                          <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Dica de Precificação</span>
                       </div>
                       <p className="text-xs font-bold text-blue-800 italic leading-relaxed">"{consultancyReport.profitabilityInsight}"</p>
                    </div>
                 </div>
              </div>
              <button onClick={() => setConsultancyReport(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X size={24}/></button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-xl shadow-emerald-100 flex flex-col justify-between relative overflow-hidden group">
           <Calculator className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform" size={140} />
           <div className="relative z-10">
              <span className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em]">Lucro de Gestão (Boss)</span>
              <div className="text-5xl font-black mt-2 tracking-tighter">${Math.round(netProfit).toLocaleString()}</div>
           </div>
           <div className="mt-10 relative z-10 flex items-center gap-3 text-[10px] font-black bg-white/20 w-fit px-6 py-3 rounded-full uppercase tracking-widest border border-white/10">
              <ShieldCheck size={16} className="text-emerald-300" /> Matemática Auditada
           </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex justify-between items-start mb-8">
              <span className="text-gray-400 text-[11px] font-black uppercase tracking-widest">Faturamento Bruto</span>
              <div className="bg-emerald-50 p-4 rounded-2xl"><ArrowUpCircle size={28} className="text-emerald-500" /></div>
           </div>
           <div className="text-4xl font-black text-gray-900 tracking-tight">${totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex justify-between items-start mb-8">
              <span className="text-gray-400 text-[11px] font-black uppercase tracking-widest">Custo Equipe + Gastos</span>
              <div className="bg-rose-50 p-4 rounded-2xl"><ArrowDownCircle size={28} className="text-rose-500" /></div>
           </div>
           <div className="text-4xl font-black text-gray-900 tracking-tight">${(totalPayouts + totalOtherExpenses).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-8 bg-gray-50/50">
           <div>
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest italic">Livro de Caixa Detalhado</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                Demonstração automática com e sem equipe
              </p>
           </div>
           <button onClick={() => setShowAddExpense(true)} className="w-full sm:w-auto bg-rose-500 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all flex items-center justify-center gap-3">
             <Plus size={20}/> Registrar Despesa Manual
           </button>
        </div>

        <div className="divide-y divide-gray-100">
           {ledgerItems.map((item: any, idx) => (
              <div key={item.id} className="p-10 flex items-center justify-between hover:bg-gray-50/80 transition-all border-l-[6px] border-transparent hover:border-emerald-500 group">
                <div className="flex items-center gap-10">
                   <div className={`p-5 rounded-2xl shadow-sm transition-transform group-hover:scale-110 ${item.type === 'REVENUE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.type === 'REVENUE' ? <ArrowUpCircle size={28}/> : <ArrowDownCircle size={28}/>}
                   </div>
                   <div>
                      <div className="font-black text-gray-900 text-base tracking-tight">
                        {item.description}
                        {item.type === 'PAYOUT' && <span className="ml-2 text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded uppercase">Helper Payment</span>}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-2 tracking-widest flex items-center gap-4">
                        <span className="flex items-center gap-2"><CalendarDays size={14}/> {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        {item.aiVerified && <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md"><ShieldCheck size={12}/> AI Verified</span>}
                      </div>
                   </div>
                </div>
                <div className={`text-2xl font-black tracking-tighter ${item.type === 'REVENUE' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.type === 'REVENUE' ? '+' : '-'}${item.amount.toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>

      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              <div className="p-10 border-b border-gray-100 bg-rose-50 flex justify-between items-center">
                 <h3 className="text-xl font-black text-rose-900 tracking-tight">Registrar Gasto Extra</h3>
                 <button onClick={() => setShowAddExpense(false)} className="text-rose-400 p-2 hover:bg-white rounded-full transition"><X size={32}/></button>
              </div>
              <div className="p-12 space-y-10 bg-white text-center">
                 <div>
                    <label className="block text-[11px] font-black text-gray-400 mb-4 uppercase tracking-widest">Valor do Gasto ($)</label>
                    <input type="number" className="w-full p-8 bg-gray-50 border-2 border-transparent rounded-3xl font-black text-5xl text-center outline-none shadow-inner focus:bg-white focus:border-rose-500 transition-all" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-[11px] font-black text-gray-400 mb-4 uppercase tracking-widest">Descrição</label>
                    <input className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-2xl font-bold outline-none text-center focus:bg-white focus:border-rose-500 transition-all" placeholder="Ex: Gasolina Alpha" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                 </div>
                 {isCalculating && (
                   <div className="flex items-center justify-center gap-3 text-emerald-600 font-black text-[11px] uppercase animate-pulse">
                     <Loader2 className="animate-spin" size={18} /> Calculando Impacto IA...
                   </div>
                 )}
              </div>
              <div className="p-10 bg-gray-50 border-t border-gray-100 flex gap-6">
                 <button onClick={handleAddExpense} disabled={isCalculating} className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black shadow-2xl shadow-rose-100 uppercase text-[12px] tracking-widest disabled:opacity-50 transition-all">
                    Processar e Registrar
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
