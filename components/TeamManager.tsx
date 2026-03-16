
import React, { useState, useEffect } from 'react';
import { 
  UsersRound, 
  Plus, 
  Trash2, 
  UserPlus, 
  X, 
  Save, 
  Car, 
  Star, 
  User, 
  Edit3, 
  Check, 
  BadgeDollarSign,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { Team, TeamMember, MemberRole, PaymentModel } from '../types';

interface TeamManagerProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ teams, onUpdateTeams }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [currentMembers, setCurrentMembers] = useState<TeamMember[]>([]);
  
  // Estado para o membro que está sendo editado/criado no formulário lateral
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Omit<TeamMember, 'id'>>({
    name: '',
    role: 'HELPER',
    defaultRate: 40,
    paymentModel: 'PER_SERVICE'
  });

  const handleOpenAdd = () => {
    setEditingTeamId(null);
    setTeamName('');
    setCurrentMembers([]);
    resetMemberForm();
    setShowModal(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setCurrentMembers([...team.members]);
    resetMemberForm();
    setShowModal(true);
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      role: 'HELPER',
      defaultRate: 40,
      paymentModel: 'PER_SERVICE'
    });
    setEditingMemberId(null);
  };

  const handleAddOrUpdateMember = () => {
    if (!memberForm.name.trim()) return alert("O nome do integrante é obrigatório.");
    if (memberForm.defaultRate <= 0) return alert("Defina um valor de pagamento válido.");

    if (editingMemberId) {
      // Atualizar membro existente no rascunho
      setCurrentMembers(currentMembers.map(m => 
        m.id === editingMemberId ? { ...memberForm, id: editingMemberId } : m
      ));
    } else {
      // Adicionar novo membro ao rascunho
      const newMember: TeamMember = {
        id: Math.random().toString(36).substr(2, 9),
        ...memberForm
      };
      setCurrentMembers([...currentMembers, newMember]);
    }
    resetMemberForm();
  };

  const handleEditMemberInDraft = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      role: member.role,
      defaultRate: member.defaultRate,
      paymentModel: member.paymentModel
    });
  };

  const handleSaveTeam = () => {
    const trimmedName = teamName.trim();
    if (!trimmedName) return alert("Dê um nome à equipe.");
    if (currentMembers.length === 0) return alert("Adicione pelo menos um integrante à equipe.");

    let updatedTeams: Team[];
    if (editingTeamId) {
      updatedTeams = teams.map(t => 
        t.id === editingTeamId ? { ...t, name: trimmedName, members: currentMembers } : t
      );
    } else {
      const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
      const newTeam: Team = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        members: currentMembers,
        color: colors[teams.length % colors.length]
      };
      updatedTeams = [...teams, newTeam];
    }

    onUpdateTeams(updatedTeams);
    setShowModal(false);
  };

  const getRoleIcon = (role: MemberRole) => {
    switch(role) {
      case 'DRIVER': return <Car size={14} />;
      case 'LEADER': return <Star size={14} />;
      default: return <User size={14} />;
    }
  };

  const getRoleLabel = (role: MemberRole) => {
    switch(role) {
      case 'DRIVER': return 'Motorista';
      case 'LEADER': return 'Líder';
      default: return 'Helper';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">Gestão de Equipes</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{teams.length} equipes configuradas</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-emerald-600 text-white px-5 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">
          <Plus size={24} /> <span className="hidden sm:inline">CRIAR EQUIPE</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
             <UsersRound size={48} className="mb-4 opacity-20" />
             <p className="font-black uppercase text-xs tracking-widest">Nenhuma equipe cadastrada</p>
             <button onClick={handleOpenAdd} className="mt-4 text-emerald-600 font-bold hover:underline">Adicionar a primeira equipe</button>
          </div>
        ) : (
          teams.map(team => (
            <div key={team.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={`w-14 h-14 rounded-2xl ${team.color} flex items-center justify-center text-white shadow-lg`}>
                        <UsersRound size={28} />
                     </div>
                     <div>
                        <h4 className="font-black text-gray-900 text-xl tracking-tight">{team.name}</h4>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{team.members.length} integrantes</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleOpenEdit(team)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all shadow-sm"><Edit3 size={18}/></button>
                     <button onClick={() => { if(confirm("Remover equipe?")) onUpdateTeams(teams.filter(t => t.id !== team.id)); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"><Trash2 size={18}/></button>
                  </div>
               </div>
               
               <div className="space-y-2 relative z-10">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="text-emerald-600">{getRoleIcon(member.role)}</div>
                         <div>
                            <div className="text-xs font-black text-gray-900">{member.name}</div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase">
                               {getRoleLabel(member.role)} • {member.paymentModel === 'PER_SERVICE' ? 'Por Casa' : 'Fixo'}
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-black text-gray-900">${member.defaultRate}</div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingTeamId ? 'Editar Equipe' : 'Configurar Equipe'}
                    </h3>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Defina integrantes e modelos de pagamento</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition"><X size={28} /></button>
              </div>

              <div className="p-10 flex flex-col lg:flex-row gap-10 overflow-y-auto">
                 {/* Lado Esquerdo: Formulário de Membro */}
                 <div className="flex-1 space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nome da Equipe</label>
                        <input 
                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl font-black text-gray-900 focus:bg-white focus:border-emerald-600 outline-none shadow-inner transition-all" 
                            placeholder="Ex: Equipe de Terça" 
                            value={teamName} 
                            onChange={e => setTeamName(e.target.value)} 
                        />
                    </div>

                    <div className="bg-emerald-50/50 p-8 rounded-[2rem] border-2 border-emerald-100 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <UserPlus size={18} className="text-emerald-600" />
                            <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                {editingMemberId ? 'Editando Integrante' : 'Novo Integrante'}
                            </h4>
                        </div>
                        
                        <div>
                            <label className="block text-[9px] font-black text-emerald-600/60 uppercase mb-2">Nome do Helper</label>
                            <input 
                                className="w-full p-3 bg-white rounded-xl text-sm font-bold border border-emerald-100 focus:border-emerald-500 outline-none" 
                                value={memberForm.name} 
                                onChange={e => setMemberForm({...memberForm, name: e.target.value})} 
                                placeholder="Nome completo"
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-emerald-600/60 uppercase mb-2">Função Principal</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['DRIVER', 'LEADER', 'HELPER'] as MemberRole[]).map(r => (
                                    <button 
                                        key={r} 
                                        type="button"
                                        onClick={() => setMemberForm({...memberForm, role: r})} 
                                        className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${memberForm.role === r ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-gray-400 border-emerald-100 hover:border-emerald-300'}`}
                                    >
                                        {getRoleLabel(r)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-emerald-100">
                            <label className="block text-[9px] font-black text-emerald-600 uppercase mb-3">Modelo de Pagamento</label>
                            <div className="flex gap-2 mb-4">
                                <button 
                                    type="button"
                                    onClick={() => setMemberForm({...memberForm, paymentModel: 'PER_SERVICE'})}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black border transition-all ${memberForm.paymentModel === 'PER_SERVICE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                                >
                                    <BadgeDollarSign size={14}/> Por Casa
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setMemberForm({...memberForm, paymentModel: 'DAILY_FIXED'})}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black border transition-all ${memberForm.paymentModel === 'DAILY_FIXED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-400 border-transparent'}`}
                                >
                                    <CalendarDays size={14}/> Fixo Diário
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-emerald-800 uppercase">Valor ($)</span>
                                <input 
                                    type="number" 
                                    className="flex-1 p-3 bg-gray-50 rounded-xl text-lg font-black border border-emerald-50 outline-none focus:bg-white focus:border-emerald-500" 
                                    value={memberForm.defaultRate} 
                                    onChange={e => setMemberForm({...memberForm, defaultRate: Number(e.target.value)})} 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                           {editingMemberId && (
                             <button onClick={resetMemberForm} className="flex-1 py-4 bg-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase transition-all">
                                Cancelar
                             </button>
                           )}
                           <button onClick={handleAddOrUpdateMember} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 active:scale-95 transition-all">
                                {editingMemberId ? <Check size={16} /> : <Plus size={16} />}
                                {editingMemberId ? 'ATUALIZAR' : 'ADICIONAR À LISTA'}
                           </button>
                        </div>
                    </div>
                 </div>

                 {/* Lado Direito: Visualização dos Membros */}
                 <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Integrantes da Equipe ({currentMembers.length})</label>
                    <div className="flex-1 space-y-3 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 overflow-y-auto">
                        {currentMembers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                                <UsersRound size={48} />
                                <p className="text-[10px] font-black uppercase mt-4">Nenhum integrante adicionado</p>
                            </div>
                        ) : (
                            currentMembers.map(m => (
                                <div key={m.id} className={`flex items-center justify-between p-4 bg-white rounded-2xl border transition-all shadow-sm ${editingMemberId === m.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">{getRoleIcon(m.role)}</div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900">{m.name}</div>
                                            <div className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-2">
                                                {getRoleLabel(m.role)} 
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] ${m.paymentModel === 'PER_SERVICE' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {m.paymentModel === 'PER_SERVICE' ? 'Por Casa' : 'Fixo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditMemberInDraft(m)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit3 size={16}/></button>
                                        <button onClick={() => setCurrentMembers(currentMembers.filter(x => x.id !== m.id))} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><X size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {currentMembers.length > 0 && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                         <AlertCircle className="text-emerald-600" size={18} />
                         <p className="text-[9px] font-bold text-emerald-800 uppercase leading-tight">Os valores acima são sugestões automáticas ao criar novos agendamentos.</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-5 font-black text-gray-400 uppercase text-xs tracking-widest hover:text-gray-900 transition-colors">Cancelar</button>
                 <button onClick={handleSaveTeam} className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-2xl shadow-emerald-100 uppercase text-xs tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    <Save size={20} /> FINALIZAR EQUIPE
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
