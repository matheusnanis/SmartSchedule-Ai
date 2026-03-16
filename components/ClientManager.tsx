
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  X,
  DollarSign,
  Home,
  ChevronRight,
  CalendarDays,
  FileText,
  Building2,
  BedDouble,
  Bath,
  PlusCircle,
  Dog,
  Lock,
  Clock,
  Zap,
  Building,
  Maximize2,
  Loader2,
  Check,
  MessageSquare
} from 'lucide-react';
import { Client, Appointment, HouseType, ServiceFrequency, DayOfWeek } from '../types';
import * as GeminiService from '../services/geminiService';

interface ClientManagerProps {
  clients: Client[];
  appointments: Appointment[];
  onAddClient: (client: Client, autoAppointments?: Appointment[]) => void;
}

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

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '+1 ',
    street: '',
    city: '',
    state: '', // Alterado de 'MA' para vazio
    zipCode: '',
    language: 'PT' as const,
    accessCode: '',
    hasDog: false,
    bedrooms: 3,
    bathrooms: 2,
    sqft: '',
    defaultPrice: '',
    houseType: 'HOUSE' as HouseType,
    frequency: 'BIWEEKLY' as ServiceFrequency,
    preferredDay: 'TUESDAY' as DayOfWeek,
    preferredTime: '09:00',
    extraServices: [] as string[],
    cleaningInstructions: ''
  });

  const handleAISearch = async () => {
    if (!newClient.street) return alert("Digite o endereço primeiro");
    setIsSearchingAI(true);
    try {
      const info = await GeminiService.findPropertyInfo(newClient.street);
      setNewClient(prev => ({
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

  const handleToggleExtra = (id: string) => {
    setNewClient(prev => ({
      ...prev,
      extraServices: prev.extraServices.includes(id) 
        ? prev.extraServices.filter(x => x !== id)
        : [...prev.extraServices, id]
    }));
  };

  const handleSave = () => {
    if (!newClient.name || !newClient.street) return alert('Nome e Endereço são obrigatórios.');

    const clientId = Math.random().toString(36).substr(2, 9);
    const clientData: Client = {
      id: clientId,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      address: `${newClient.street}, ${newClient.city}, ${newClient.state} ${newClient.zipCode}`,
      addressDetails: { 
        street: newClient.street, 
        city: newClient.city, 
        state: newClient.state, 
        zipCode: newClient.zipCode,
        verifiedWithAI: true 
      },
      language: newClient.language,
      preferences: [],
      cleaningInstructions: newClient.cleaningInstructions,
      accessCode: newClient.accessCode,
      hasDog: newClient.hasDog,
      extraServices: newClient.extraServices,
      frequency: newClient.frequency,
      preferredDay: newClient.preferredDay,
      preferredTime: newClient.preferredTime,
      defaultPrice: Number(newClient.defaultPrice) || 0,
      houseType: newClient.houseType,
      houseDetails: { 
        bedrooms: Number(newClient.bedrooms), 
        bathrooms: Number(newClient.bathrooms), 
        sqft: newClient.sqft ? Number(newClient.sqft) : undefined 
      }
    };

    onAddClient(clientData, []);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewClient({ 
      name: '', email: '', phone: '+1 ', street: '', city: '', state: '', 
      zipCode: '', language: 'PT', accessCode: '', hasDog: false, extraServices: [], 
      bedrooms: 3, bathrooms: 2, sqft: '', defaultPrice: '', houseType: 'HOUSE', 
      frequency: 'BIWEEKLY', preferredDay: 'TUESDAY', preferredTime: '09:00',
      cleaningInstructions: ''
    });
  };

  const translateFreq = (f: string) => {
    const map: any = { WEEKLY: 'Semanal', BIWEEKLY: 'Quinzenal', MONTHLY: 'Mensal', ONETIME: 'Única' };
    return map[f] || f;
  };

  const translateDay = (d: string) => {
    const map: any = { MONDAY: 'Segunda', TUESDAY: 'Terça', WEDNESDAY: 'Quarta', THURSDAY: 'Quinta', FRIDAY: 'Sexta', SATURDAY: 'Sábado' };
    return map[d] || d;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white dark:bg-zinc-900 p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col lg:flex-row justify-between items-center gap-8">
         <div className="flex items-center gap-6">
            <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-xl rotate-3 shrink-0">
               <Users size={32} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">Clientes</h2>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-2">Gerencie sua base de ativos</p>
            </div>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
               <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-bold outline-none" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
               />
               <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
            <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active-scale text-xs uppercase tracking-widest">
              <Plus size={20} /> Novo Cliente
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
          <div key={client.id} className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all flex flex-col group">
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{client.name}</h3>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                    {translateFreq(client.frequency)} • {translateDay(client.preferredDay || '')} às {client.preferredTime}
                  </span>
               </div>
               <div className="bg-slate-50 dark:bg-zinc-800 p-3 rounded-2xl text-emerald-600 border dark:border-zinc-700">
                  {client.houseType === 'HOUSE' ? <Home size={20}/> : <Building size={20}/>}
               </div>
            </div>
            
            <div className="space-y-3 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border dark:border-zinc-800 mb-6">
               <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2"><BedDouble size={16} className="text-emerald-500"/> {client.houseDetails?.bedrooms} Quartos</div>
                  <div className="flex items-center gap-2"><Bath size={16} className="text-emerald-500"/> {client.houseDetails?.bathrooms} Banheiros</div>
               </div>
               <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400">
                  <MapPin size={12}/> {client.addressDetails.city}, {client.addressDetails.state}
               </div>
            </div>

            <div className="mt-auto flex items-center justify-between pt-6 border-t dark:border-zinc-800">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Preço Padrão</span>
                  <div className="text-2xl font-black text-emerald-600">${client.defaultPrice}</div>
               </div>
               <button className="p-3 bg-slate-900 text-white rounded-xl active-scale"><ChevronRight size={20}/></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="px-10 py-8 border-b dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-emerald-600">Onboarding de Cliente</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Perfil inteligente com verificação por IA</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-all text-slate-400"><X size={32}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><FileText size={18}/> Cadastro e Localização</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nome Completo</label>
                          <input className="w-full p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Ex: Sarah Jenkins" value={newClient.name} onChange={e=>setNewClient({...newClient, name: e.target.value})} />
                       </div>
                       <div className="space-y-2 relative group">
                          <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Endereço (Rua e Número)</label>
                          <input className="w-full p-5 pr-32 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Ex: 782 Boylston St" value={newClient.street} onChange={e=>setNewClient({...newClient, street: e.target.value})} />
                          <button onClick={handleAISearch} disabled={isSearchingAI} className="absolute right-2 bottom-2 bg-emerald-600 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg">
                             {isSearchingAI ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} fill="currentColor" />}
                             Auditar IA
                          </button>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Cidade" value={newClient.city} onChange={e=>setNewClient({...newClient, city: e.target.value})} />
                       <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Estado (UF)" value={newClient.state} onChange={e=>setNewClient({...newClient, state: e.target.value})} />
                       <input className="p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="ZIP Code" value={newClient.zipCode} onChange={e=>setNewClient({...newClient, zipCode: e.target.value})} />
                       <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                          <input className="w-full pl-10 p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Preço" type="number" value={newClient.defaultPrice} onChange={e=>setNewClient({...newClient, defaultPrice: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Home size={18}/> Tipo de Propriedade</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {TIPOS_IMOVEL.map(type => (
                         <button 
                           key={type.id}
                           onClick={() => setNewClient({...newClient, houseType: type.id as HouseType})}
                           className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border-2 transition-all ${newClient.houseType === type.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}
                         >
                            <type.icon size={28} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                         </button>
                       ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Quartos</span>
                          <div className="flex items-center gap-4">
                             <button onClick={()=>setNewClient(p=>({...p, bedrooms: Math.max(0, p.bedrooms-1)}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">-</button>
                             <span className="text-xl font-black dark:text-white">{newClient.bedrooms}</span>
                             <button onClick={()=>setNewClient(p=>({...p, bedrooms: p.bedrooms+1}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">+</button>
                          </div>
                       </div>
                       <div className="bg-slate-50 dark:bg-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Banheiros</span>
                          <div className="flex items-center gap-4">
                             <button onClick={()=>setNewClient(p=>({...p, bathrooms: Math.max(0, p.bathrooms-1)}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">-</button>
                             <span className="text-xl font-black dark:text-white">{newClient.bathrooms}</span>
                             <button onClick={()=>setNewClient(p=>({...p, bathrooms: p.bathrooms+1}))} className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 shadow-sm flex items-center justify-center font-black">+</button>
                          </div>
                       </div>
                       <div className="relative">
                          <Maximize2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input className="w-full pl-12 p-6 bg-slate-50 dark:bg-zinc-800 rounded-3xl border-none font-bold outline-none dark:text-white" placeholder="Sqft (Opcional)" value={newClient.sqft} onChange={e=>setNewClient({...newClient, sqft: e.target.value})} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><CalendarDays size={18}/> Configuração de Frequência</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Recorrência</label>
                          <select className="w-full p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold dark:text-white outline-none" value={newClient.frequency} onChange={e=>setNewClient({...newClient, frequency: e.target.value as ServiceFrequency})}>
                             <option value="WEEKLY">Semanal</option>
                             <option value="BIWEEKLY">Quinzenal</option>
                             <option value="MONTHLY">Mensal</option>
                             <option value="ONETIME">Apenas uma vez</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Dia Preferencial</label>
                          <select className="w-full p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold dark:text-white outline-none" value={newClient.preferredDay} onChange={e=>setNewClient({...newClient, preferredDay: e.target.value as DayOfWeek})}>
                             <option value="MONDAY">Segunda-feira</option>
                             <option value="TUESDAY">Terça-feira</option>
                             <option value="WEDNESDAY">Quarta-feira</option>
                             <option value="THURSDAY">Quinta-feira</option>
                             <option value="FRIDAY">Sexta-feira</option>
                             <option value="SATURDAY">Sábado</option>
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Horário Base</label>
                          <div className="relative">
                             <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                             <input type="time" className="w-full pl-12 p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold dark:text-white outline-none" value={newClient.preferredTime} onChange={e=>setNewClient({...newClient, preferredTime: e.target.value})} />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                       <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={18}/> Acesso e Segurança</h5>
                       <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input className="w-full pl-12 p-5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border-none font-bold outline-none dark:text-white" placeholder="Código do Portão / Teclado" value={newClient.accessCode} onChange={e=>setNewClient({...newClient, accessCode: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Dog size={18}/> Presença de Pets</h5>
                       <button 
                         onClick={() => setNewClient({...newClient, hasDog: !newClient.hasDog})}
                         className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${newClient.hasDog ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 text-amber-700' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}
                       >
                          <div className="flex items-center gap-3">
                             <Dog size={20} />
                             <span className="text-xs font-black uppercase">O cliente tem cachorros</span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${newClient.hasDog ? 'bg-amber-500' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 rounded-full bg-white transition-transform ${newClient.hasDog ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><PlusCircle size={18}/> Limpezas Extras (Adicionais)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {SERVICOS_EXTRAS.map(svc => (
                          <button 
                            key={svc.id}
                            onClick={() => handleToggleExtra(svc.id)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${newClient.extraServices.includes(svc.id) ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}
                          >
                             <span className="text-xl">{svc.icon}</span>
                             <span className="text-[10px] font-black uppercase tracking-tight flex-1">{svc.label}</span>
                             {newClient.extraServices.includes(svc.id) && <Check size={14} className="text-emerald-500" />}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><MessageSquare size={18}/> Instruções de Limpeza (Para a Equipe)</h5>
                    <textarea 
                      className="w-full p-6 bg-slate-50 dark:bg-zinc-800 rounded-[2.5rem] border-none font-bold outline-none dark:text-white min-h-[150px] resize-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Não entrar com sapatos, focar muito no pó do quarto principal, usar apenas produtos orgânicos na sala..."
                      value={newClient.cleaningInstructions}
                      onChange={e => setNewClient({...newClient, cleaningInstructions: e.target.value})}
                    />
                 </div>
              </div>

              <div className="p-10 bg-slate-50 dark:bg-zinc-800/80 border-t dark:border-zinc-800 flex gap-6 shrink-0">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">Descartar</button>
                 <button onClick={handleSave} className="flex-[2] py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active-scale flex items-center justify-center gap-3">
                    <Check size={20} strokeWidth={4} /> Finalizar Cadastro
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
