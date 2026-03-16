
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  MapPin, 
  CheckCircle, 
  DollarSign, 
  ArrowRight, 
  Plus,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Home,
  Sparkles,
  X,
  BrainCircuit,
  Zap,
  Building2,
  Building,
  ExternalLink,
  CalendarDays,
  Clock,
  Send,
  MoreHorizontal,
  Info,
  Lock,
  Dog,
  PlusCircle,
  MessageSquare,
  Maximize2,
  Check,
  Edit3,
  AlertTriangle,
  ThumbsUp,
  TrendingDown,
  BedDouble,
  Bath
} from 'lucide-react';
import { Estimate, PricingEstimate, HouseType, ServiceFrequency, DayOfWeek } from '../types';
import * as GeminiService from '../services/geminiService';

const SERVICOS_EXTRAS = [
  { id: 'oven', label: 'Interior do Forno', icon: '🔥' },
  { id: 'fridge', label: 'Interior Geladeira', icon: '❄️' },
  { id: 'windows', label: 'Janelas (Interno)', icon: '🪟' },
  { id: 'cabinets', label: 'Armários Cozinha', icon: '🗄️' },
  { id: 'laundry', label: 'Lavar/Secar Roupa', icon: '🧺' },
  { id: 'dishes', label: 'Louça/Pia', icon: '🍽️' }
];

const TIPOS_IMOVEL = [
  { id: 'HOUSE', label: 'Casa', icon: Home },
  { id: 'APARTMENT', label: 'Apartamento', icon: Building },
  { id: 'CONDO', label: 'Condomínio', icon: Building2 },
  { id: 'OFFICE', label: 'Escritório/Com.', icon: Building2 }
];

const EstimateManager: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [step, setStep] = useState(1);
  const [pricingMode, setPricingMode] = useState<'AI' | 'MANUAL' | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    street: '',
    city: '',
    state: '', // Alterado de 'MA' para vazio
    zipCode: '',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2000,
    houseType: 'HOUSE' as HouseType,
    serviceType: 'STANDARD' as any,
    frequency: 'BIWEEKLY' as ServiceFrequency,
    manualPrice: '',
    accessCode: '',
    hasDog: false,
    extraServices: [] as string[],
    cleaningInstructions: '',
    preferredDay: 'TUESDAY' as DayOfWeek,
    preferredTime: '09:00'
  });

  const [aiResult, setAiResult] = useState<PricingEstimate | null>(null);
  const [validationResult, setValidationResult] = useState<{
    status: 'GOOD' | 'LOW' | 'HIGH';
    message: string;
  } | null>(null);

  const getFrequencyMultiplier = (f: ServiceFrequency) => {
    switch(f) {
      case 'WEEKLY': return 0.90; 
      case 'BIWEEKLY': return 1.0;  
      case 'MONTHLY': return 1.05; 
      case 'ONETIME': return 1.20; 
      default: return 1.0;
    }
  };

  useEffect(() => {
    if (aiResult && pricingMode === 'AI') {
      const baseSuggested = Math.round((aiResult.low + aiResult.high) / 2);
      const adjusted = Math.round(baseSuggested * getFrequencyMultiplier(formData.frequency));
      setFormData(prev => ({ ...prev, manualPrice: adjusted.toString() }));
    }
  }, [aiResult, pricingMode, formData.frequency]);

  const handleAISearch = async () => {
    if (!formData.street) return alert("Digite o endereço primeiro");
    setIsSearchingAI(true);
    try {
      const info = await GeminiService.findPropertyInfo(formData.street);
      setFormData(prev => ({
        ...prev,
        city: info.city || prev.city,
        state: info.state || prev.state,
        zipCode: info.zipCode || prev.zipCode,
        street: info.formattedAddress || prev.street
      }));
    } catch (e) {
      alert("Endereço não localizado ou erro na IA do Google Maps.");
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.street || !formData.clientName) return alert("Por favor, preencha ao menos o Nome e a Rua/Número.");
      setStep(2);
    } else if (step === 2) {
      if (!pricingMode) return alert("Selecione um modo de cálculo.");
      if (pricingMode === 'AI') {
        setStep(3);
        await handleCalculate();
      } else {
        setStep(3);
      }
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await GeminiService.getSmartPricing(
        formData.zipCode,
        formData.bedrooms,
        formData.bathrooms,
        formData.sqft,
        formData.serviceType,
        formData.houseType
      );
      setAiResult(result);
    } catch (e) {
      console.error(e);
      setPricingMode('MANUAL');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateManualPrice = async () => {
    if (!formData.manualPrice || Number(formData.manualPrice) <= 0) return alert("Insira um valor para validar.");
    setIsValidating(true);
    setValidationResult(null);
    try {
      const market = await GeminiService.getSmartPricing(
        formData.zipCode,
        formData.bedrooms,
        formData.bathrooms,
        formData.sqft,
        formData.serviceType,
        formData.houseType
      );
      
      const price = Number(formData.manualPrice);
      let status: 'GOOD' | 'LOW' | 'HIGH' = 'GOOD';
      let msg = "Seu valor está competitivo e alinhado com o mercado local.";

      if (price < market.low) {
        status = 'LOW';
        msg = `Atenção: Seu valor de $${price} está abaixo da média mínima do mercado ($${market.low}). Você pode estar perdendo lucro.`;
      } else if (price > market.high) {
        status = 'HIGH';
        msg = `Atenção: Seu valor de $${price} está acima do teto do mercado local ($${market.high}). Isso pode dificultar o fechamento.`;
      }

      setValidationResult({ status, message: `${msg} Raciocínio IA: ${market.marketReasoning}` });
    } catch (e) {
      alert("Erro ao validar preço. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveEstimate = () => {
    const finalPrice = Number(formData.manualPrice);
    if (!finalPrice || finalPrice <= 0) return alert("Preço inválido.");

    const estimateData: Estimate = {
      id: isEditing && editingId ? editingId : Math.random().toString(36).substr(2, 9),
      clientName: formData.clientName,
      address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
      date: new Date().toISOString().split('T')[0],
      serviceType: formData.serviceType,
      houseType: formData.houseType,
      frequency: formData.frequency,
      details: { 
        bedrooms: formData.bedrooms, 
        bathrooms: formData.bathrooms, 
        sqft: formData.sqft,
        hasDog: formData.hasDog,
        accessCode: formData.accessCode,
        extraServices: formData.extraServices,
        cleaningInstructions: formData.cleaningInstructions
      },
      aiData: aiResult || { low: finalPrice, high: finalPrice, marketReasoning: "Calculado Manualmente" },
      finalPrice: finalPrice,
      status: 'DRAFT'
    };

    if (isEditing) {
      setEstimates(prev => prev.map(e => e.id === editingId ? estimateData : e));
    } else {
      setEstimates([estimateData, ...estimates]);
    }
    closeModal();
  };

  const handleEdit = (est: Estimate) => {
    setIsEditing(true);
    setEditingId(est.id);
    
    // Deconstruct address parts roughly
    const addrParts = est.address.split(', ');
    const zipState = addrParts[addrParts.length - 1]?.split(' ') || [];

    setFormData({
      clientName: est.clientName,
      street: addrParts[0] || '',
      city: addrParts[1] || '',
      state: zipState[0] || '',
      zipCode: zipState[1] || '',
      bedrooms: est.details.bedrooms,
      bathrooms: est.details.bathrooms,
      sqft: est.details.sqft,
      houseType: est.houseType,
      serviceType: est.serviceType,
      frequency: est.frequency,
      manualPrice: est.finalPrice.toString(),
      accessCode: est.details.accessCode || '',
      hasDog: est.details.hasDog || false,
      extraServices: est.details.extraServices || [],
      cleaningInstructions: est.details.cleaningInstructions || '',
      preferredDay: 'TUESDAY',
      preferredTime: '09:00'
    });

    setStep(1);
    setPricingMode(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setStep(1);
    setAiResult(null);
    setValidationResult(null);
    setPricingMode(null);
    setFormData({ 
      clientName: '', street: '', city: '', state: '', zipCode: '', 
      bedrooms: 3, bathrooms: 2, sqft: 2000, houseType: 'HOUSE', 
      serviceType: 'STANDARD', frequency: 'BIWEEKLY', manualPrice: '',
      accessCode: '', hasDog: false, extraServices: [], cleaningInstructions: '',
      preferredDay: 'TUESDAY', preferredTime: '09:00'
    });
  };

  const translateFreq = (f: string) => {
    const map: any = { WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', ONETIME: 'Único' };
    return map[f] || f;
  };

  const handleToggleExtra = (id: string) => {
    setFormData(prev => ({
      ...prev,
      extraServices: prev.extraServices.includes(id) 
        ? prev.extraServices.filter(x => x !== id)
        : [...prev.extraServices, id]
    }));
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-200 dark:border-zinc-800 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Gerador de Propostas</h2>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Inteligência de Mercado em Tempo Real</p>
        </div>
        <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active-scale">
          <Plus size={20} className="mr-2 inline" /> Nova Proposta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {estimates.length === 0 ? (
          <div className="col-span-full py-32 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-zinc-800 text-center flex flex-col items-center">
             <FileText size={80} className="text-slate-100 dark:text-zinc-800 mb-6" />
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Nenhuma proposta gerada ainda.</p>
          </div>
        ) : (
          estimates.map(est => (
            <div key={est.id} className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between h-[520px] group">
               <div>
                  <div className="flex justify-between items-center mb-6">
                     <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">RASCUNHO</span>
                     <div className="flex gap-2">
                        <button onClick={() => handleEdit(est)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Edit3 size={18}/></button>
                        <button onClick={() => setEstimates(p => p.filter(x => x.id !== est.id))} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
                     </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic mb-2">{est.clientName}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 truncate">
                     <MapPin size={12} className="text-emerald-500" /> {est.address}
                  </div>
                  
                  <div className="space-y-3 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-slate-100 dark:border-zinc-800">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">{translateFreq(est.frequency)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuração</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{est.details.bedrooms}Q/{est.details.bathrooms}B • {est.houseType}</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-end justify-between pt-8 border-t border-slate-100 dark:border-zinc-800">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Proposto</span>
                    <div className="text-4xl font-black text-emerald-600 tracking-tighter">${est.finalPrice}</div>
                  </div>
                  <button className="bg-zinc-900 dark:bg-zinc-800 text-white p-5 rounded-2xl shadow-xl hover:bg-emerald-600 transition-all active-scale">
                     <Send size={20} />
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="px-10 py-8 border-b dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase text-emerald-600">{isEditing ? 'Editar Proposta' : 'Nova Proposta Estratégica'}</h3>
                  <button onClick={closeModal} className="text-slate-400 p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-all"><X size={32} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar">
                  {step === 1 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-right duration-500">
                       <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={18}/> Detalhes e Localização</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nome do Prospecto</label>
                                <input className="w-full p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Ex: Sarah Jenkins" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value})} />
                             </div>
                             <div className="space-y-2 relative group">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Endereço Completo</label>
                                <input className="w-full p-5 pr-32 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Rua e Número" value={formData.street} onChange={e=>setFormData({...formData, street: e.target.value})} />
                                <button onClick={handleAISearch} disabled={isSearchingAI} className="absolute right-2 bottom-2 bg-emerald-600 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all">
                                   {isSearchingAI ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                                   Audit. IA
                                </button>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Cidade" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} />
                             <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="UF" value={formData.state} onChange={e=>setFormData({...formData, state: e.target.value})} />
                             <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="ZIP Code" value={formData.zipCode} onChange={e=>setFormData({...formData, zipCode: e.target.value})} />
                             <div className="relative">
                                <Maximize2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input className="w-full pl-12 p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Sqft (Aprox)" value={formData.sqft} onChange={e=>setFormData({...formData, sqft: Number(e.target.value)})} />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Home size={18}/> Configuração Residencial Estratégica</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {TIPOS_IMOVEL.map(type => (
                               <button 
                                 key={type.id}
                                 onClick={() => setFormData({...formData, houseType: type.id as HouseType})}
                                 className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border-2 transition-all ${formData.houseType === type.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}
                               >
                                  <type.icon size={28} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                               </button>
                             ))}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <BedDouble className="text-emerald-500" size={20} />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Quartos</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <button onClick={() => setFormData(p=>({...p, bedrooms: Math.max(1, p.bedrooms - 1)}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">-</button>
                                   <span className="text-xl font-black dark:text-white">{formData.bedrooms}</span>
                                   <button onClick={() => setFormData(p=>({...p, bedrooms: p.bedrooms + 1}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">+</button>
                                </div>
                             </div>
                             <div className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <Bath className="text-emerald-500" size={20} />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Banheiros</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <button onClick={() => setFormData(p=>({...p, bathrooms: Math.max(1, p.bathrooms - 0.5)}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">-</button>
                                   <span className="text-xl font-black dark:text-white">{formData.bathrooms}</span>
                                   <button onClick={() => setFormData(p=>({...p, bathrooms: p.bathrooms + 0.5}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">+</button>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><CalendarDays size={18}/> Frequência e Recorrência</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONETIME'].map((f) => (
                               <button 
                                 key={f} 
                                 onClick={() => setFormData({...formData, frequency: f as any})} 
                                 className={`p-6 rounded-[2rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.frequency === f ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 border-transparent'}`}
                               >
                                 {translateFreq(f)}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                          <div className="space-y-6">
                             <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={18}/> Segurança</h5>
                             <input className="w-full p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Código Keypad / Instrução de Acesso" value={formData.accessCode} onChange={e=>setFormData({...formData, accessCode: e.target.value})} />
                          </div>
                          <div className="space-y-6">
                             <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Dog size={18}/> Pets</h5>
                             <button onClick={() => setFormData({...formData, hasDog: !formData.hasDog})} className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.hasDog ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 text-amber-700' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}>
                                <div className="flex items-center gap-3"><Dog size={20} /><span className="text-xs font-black uppercase">O cliente tem pets</span></div>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.hasDog ? 'bg-amber-500' : 'bg-slate-200'}`}><div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.hasDog ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                             </button>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><PlusCircle size={18}/> Extras</h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                             {SERVICOS_EXTRAS.map(svc => (
                                <button key={svc.id} onClick={() => handleToggleExtra(svc.id)} className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${formData.extraServices.includes(svc.id) ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}>
                                   <span className="text-xl">{svc.icon}</span>
                                   <span className="text-[10px] font-black uppercase tracking-tight flex-1">{svc.label}</span>
                                   {formData.extraServices.includes(svc.id) && <Check size={14} className="text-emerald-500" />}
                                </button>
                             ))}
                          </div>
                       </div>

                       <button onClick={handleNextStep} className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl active-scale transition-all hover:bg-emerald-700">
                          Próximo Passo <ArrowRight size={24} strokeWidth={3} />
                       </button>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-500 py-10">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-12 rounded-full w-fit mx-auto mb-8">
                           <BrainCircuit size={80} className="text-emerald-600" />
                        </div>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase dark:text-white">Análise Estratégica</h4>
                        <div className="grid gap-6 max-w-2xl mx-auto">
                           <button onClick={()=>{setPricingMode('AI'); handleNextStep();}} className="p-10 rounded-[3rem] border-2 border-emerald-100 dark:border-zinc-800 hover:border-emerald-600 transition-all flex items-center gap-8 text-left bg-emerald-50/20 group">
                              <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl group-hover:scale-110 transition-transform"><Sparkles size={40}/></div>
                              <div>
                                 <div className="font-black text-xl uppercase tracking-tight dark:text-white">Calcular com IA</div>
                                 <p className="text-sm text-slate-500 font-bold mt-1">Sugestão automática baseada em dados reais do mercado local.</p>
                              </div>
                           </button>
                           <button onClick={()=>{setPricingMode('MANUAL'); handleNextStep();}} className="p-10 rounded-[3rem] border-2 border-slate-100 dark:border-zinc-800 hover:border-blue-600 transition-all flex items-center gap-8 text-left bg-slate-50/10 group">
                              <div className="bg-slate-400 p-8 rounded-3xl text-white group-hover:bg-blue-600 transition-all"><Zap size={40}/></div>
                              <div>
                                 <div className="font-black text-xl uppercase tracking-tight dark:text-white">Definir Manualmente</div>
                                 <p className="text-sm text-slate-500 font-bold mt-1">Você define o preço e a IA valida se o valor está competitivo.</p>
                              </div>
                           </button>
                        </div>
                        <button onClick={() => setStep(1)} className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">Voltar para Edição</button>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 py-6">
                       {loading ? (
                         <div className="py-24 text-center flex flex-col items-center">
                            <Loader2 className="text-emerald-600 animate-spin mb-8" size={64} />
                            <h4 className="text-3xl font-black tracking-tighter italic uppercase dark:text-white">Consultando mercado local...</h4>
                         </div>
                       ) : pricingMode === 'AI' && aiResult ? (
                         <div className="space-y-12">
                            <div className="bg-zinc-900 dark:bg-zinc-950 p-16 rounded-[4rem] text-white text-center shadow-[0_40px_100px_rgba(16,185,129,0.15)] relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                               <div className="relative z-10">
                                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-6">Sugestão Estratégica IA</div>
                                  <div className="text-8xl font-black tracking-tighter mb-12">${formData.manualPrice}</div>
                                  <div className="relative max-w-sm mx-auto">
                                     <input type="number" className="w-full bg-white/5 text-white font-black text-4xl text-center py-8 rounded-[2.5rem] border border-white/10 focus:ring-4 focus:ring-emerald-500 outline-none transition-all" value={formData.manualPrice} onChange={e=>setFormData({...formData, manualPrice: e.target.value})} />
                                     <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10" size={32} />
                                  </div>
                               </div>
                            </div>
                            
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800/30">
                               <div className="flex gap-6 mb-8">
                                  <Info className="text-emerald-600 shrink-0" size={32} />
                                  <div className="space-y-2">
                                     <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Justificativa de Mercado:</span>
                                     <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 leading-relaxed italic">"{aiResult.marketReasoning}"</p>
                                  </div>
                               </div>
                               
                               {aiResult.sources && aiResult.sources.length > 0 && (
                                  <div className="space-y-4 pt-6 border-t border-emerald-100 dark:border-emerald-800/50">
                                     <span className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Fontes de Auditoria:</span>
                                     <div className="flex flex-wrap gap-3">
                                        {aiResult.sources.map((s, idx) => (
                                           <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-xl text-[9px] font-black text-emerald-600 uppercase flex items-center gap-2 border border-emerald-50 hover:bg-emerald-600 hover:text-white transition-all">
                                              <ExternalLink size={12} /> {s.title}
                                           </a>
                                        ))}
                                     </div>
                                  </div>
                               )}
                            </div>
                            
                            <button onClick={handleSaveEstimate} className="w-full py-8 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-2xl text-base uppercase tracking-[0.2em] flex items-center justify-center gap-4 active-scale transition-all hover:bg-emerald-700">
                               <CheckCircle size={28} /> Finalizar & Salvar Proposta
                            </button>
                         </div>
                       ) : (
                         <div className="space-y-12">
                            <div className="text-center space-y-4">
                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insira o Valor Desejado</div>
                               <div className="relative max-w-md mx-auto">
                                  <input type="number" className="w-full text-center outline-none bg-slate-50 dark:bg-zinc-800 py-16 rounded-[4rem] text-6xl font-black shadow-inner dark:text-white focus:bg-white transition-all" value={formData.manualPrice} onChange={e=>setFormData({...formData, manualPrice: e.target.value})} placeholder="0.00" />
                                  <DollarSign className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300" size={40} />
                               </div>
                            </div>

                            {validationResult ? (
                               <div className={`p-8 rounded-[2.5rem] border-2 animate-in slide-in-from-top-4 transition-all ${validationResult.status === 'GOOD' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10' : validationResult.status === 'LOW' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/10' : 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/10'}`}>
                                  <div className="flex items-center gap-4 mb-3">
                                     {validationResult.status === 'GOOD' ? <ThumbsUp size={24} /> : validationResult.status === 'LOW' ? <TrendingDown size={24} /> : <AlertTriangle size={24} />}
                                     <span className="text-xs font-black uppercase tracking-widest">Análise Concluída</span>
                                  </div>
                                  <p className="text-sm font-bold leading-relaxed">{validationResult.message}</p>
                               </div>
                            ) : (
                               <button 
                                 onClick={handleValidateManualPrice} 
                                 disabled={isValidating}
                                 className="w-full py-8 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 active-scale transition-all hover:bg-emerald-50 hover:text-emerald-700"
                               >
                                 {isValidating ? <Loader2 className="animate-spin" size={24}/> : <Sparkles size={24}/>}
                                 {isValidating ? 'Consultando Mercado...' : 'Validar com IA Estratégica'}
                               </button>
                            )}

                            <div className="flex flex-col gap-4">
                               <button onClick={handleSaveEstimate} className={`w-full py-8 text-white font-black rounded-[2.5rem] text-base uppercase tracking-[0.2em] shadow-2xl transition-all active-scale ${validationResult ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                  {validationResult ? 'Finalizar Proposta' : 'Continuar sem Validação'}
                               </button>
                               <button onClick={() => setStep(2)} className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">Mudar Método de Precificação</button>
                            </div>
                         </div>
                       )}
                    </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EstimateManager;
