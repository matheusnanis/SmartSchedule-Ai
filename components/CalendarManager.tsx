
import React, { useState, useMemo, useRef } from 'react';
// Added Activity to imports to fix the error on line 536
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock,
  MoreVertical,
  X,
  CheckCircle2,
  Camera,
  Play,
  Square,
  ClipboardCheck,
  Image as ImageIcon,
  Check,
  Home,
  Star,
  Info,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Save,
  MessageSquare,
  Share2,
  Send,
  Activity
} from 'lucide-react';
import { Appointment, Client, Team, ChecklistItem } from '../types';

interface CalendarManagerProps {
  appointments: Appointment[];
  clients: Client[];
  teams: Team[];
  onAddAppointment: (apt: Appointment) => void;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onMoveAppointment: (id: string, newDate: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateAppointment?: (id: string, updates: Partial<Appointment>) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  darkMode?: boolean;
}

const toAMPM = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const STANDARD_TASKS = [
  "Dusting & Surfaces",
  "Full House Vacuuming",
  "Mopping & Floor Care",
  "Trash Removal",
  "Sanitize High-Touch Points"
];

const CalendarManager: React.FC<CalendarManagerProps> = ({ 
  appointments, 
  clients, 
  onUpdateAppointment,
  darkMode
}) => {
  const [view, setView] = useState<'DAY' | 'WEEK' | 'MONTH' | 'AGENDA'>('DAY');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [confirmingCheckOutId, setConfirmingCheckOutId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null); // Apt ID
  const [shareOptions, setShareOptions] = useState({
    times: true,
    duration: true,
    checklist: true,
    note: true
  });
  const [customNote, setCustomNote] = useState('Your home is now clean and fresh! Have a wonderful day.');
  
  const timeGridRef = useRef<HTMLDivElement>(null);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const START_HOUR = 7;
  const END_HOUR = 21;
  const HOUR_HEIGHT = 100;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

  const navigate = (direction: 'PREV' | 'NEXT') => {
    const newDate = new Date(currentDate);
    const amount = direction === 'NEXT' ? 1 : -1;
    if (view === 'DAY' || view === 'AGENDA') newDate.setDate(newDate.getDate() + amount);
    else if (view === 'WEEK') newDate.setDate(newDate.getDate() + (amount * 7));
    else if (view === 'MONTH') newDate.setMonth(newDate.getMonth() + amount);
    setCurrentDate(newDate);
    setExpandedAptId(null);
  };

  const calculatePosition = (time: string, duration: number = 120) => {
    const [h, m] = time.split(':').map(Number);
    const top = (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  const handleToggleExpand = (apt: Appointment) => {
    if (expandedAptId === apt.id) {
      setExpandedAptId(null);
    } else {
      setExpandedAptId(apt.id);
      if (!apt.checklist || apt.checklist.length === 0) {
        const client = clients.find(c => c.id === apt.clientId);
        const dynamicChecklist: ChecklistItem[] = [];
        STANDARD_TASKS.forEach(task => {
          dynamicChecklist.push({ id: Math.random().toString(36).substr(2, 9), task, completed: false, category: 'STANDARD' });
        });
        if (client?.houseDetails) {
          for (let i = 1; i <= client.houseDetails.bedrooms; i++) {
            dynamicChecklist.push({ id: Math.random().toString(36).substr(2, 9), task: `Bedroom ${i}`, completed: false, category: 'ROOM' });
          }
          for (let i = 1; i <= client.houseDetails.bathrooms; i++) {
            dynamicChecklist.push({ id: Math.random().toString(36).substr(2, 9), task: `Bathroom ${i}`, completed: false, category: 'ROOM' });
          }
        }
        if (client?.customTasks) {
          client.customTasks.forEach(task => {
            dynamicChecklist.push({ id: Math.random().toString(36).substr(2, 9), task: `SPECIAL: ${task}`, completed: false, category: 'SPECIAL' });
          });
        }
        onUpdateAppointment?.(apt.id, { checklist: dynamicChecklist });
      }
    }
  };

  const handleToggleTask = (aptId: string, taskId: string) => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;
    const newChecklist = apt.checklist.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    onUpdateAppointment?.(aptId, { checklist: newChecklist });
  };

  const handleCheckIn = (aptId: string) => {
    onUpdateAppointment?.(aptId, { checkInTime: new Date().toISOString(), status: 'IN_PROGRESS' });
  };

  const handleOpenCheckOutModal = (aptId: string) => {
    setConfirmingCheckOutId(aptId);
  };

  const handleFinalizeCheckOut = () => {
    if (!confirmingCheckOutId) return;
    const apt = appointments.find(a => a.id === confirmingCheckOutId);
    if (!apt) return;
    const checkOut = new Date();
    const duration = Math.round((checkOut.getTime() - new Date(apt.checkInTime!).getTime()) / 60000);
    onUpdateAppointment?.(confirmingCheckOutId, { 
      checkOutTime: checkOut.toISOString(), 
      actualDuration: duration, 
      status: 'COMPLETED' 
    });
    const finishedId = confirmingCheckOutId;
    setConfirmingCheckOutId(null);
    setShowShareModal(finishedId);
  };

  const handleAddTaskPhoto = (aptId: string, taskId: string, type: 'BEFORE' | 'AFTER') => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;
    const fakePhotoUrl = type === 'BEFORE' 
      ? 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400';
    const newChecklist = apt.checklist.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          [type === 'BEFORE' ? 'beforePhoto' : 'afterPhoto']: fakePhotoUrl,
          completed: type === 'AFTER' ? true : t.completed 
        };
      }
      return t;
    });
    onUpdateAppointment?.(aptId, { checklist: newChecklist });
  };

  const generateSMS = () => {
    if (!showShareModal) return;
    const apt = appointments.find(a => a.id === showShareModal);
    const client = clients.find(c => c.id === apt?.clientId);
    if (!apt || !client) return;

    let message = `Hello ${client.name}! This is a service update from your cleaning team. ✨\n\n`;
    
    if (shareOptions.times && apt.checkInTime && apt.checkOutTime) {
      const inT = new Date(apt.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const outT = new Date(apt.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      message += `Arrival: ${inT}\nDeparture: ${outT}\n`;
    }
    
    if (shareOptions.duration && apt.actualDuration) {
      message += `Total Duration: ${apt.actualDuration} minutes\n`;
    }

    if (shareOptions.checklist && apt.checklist) {
      const completed = apt.checklist.filter(t => t.completed).length;
      message += `\nTasks Completed: ${completed}/${apt.checklist.length}\n`;
      const rooms = apt.checklist.filter(t => t.category === 'ROOM' && t.completed).map(t => t.task);
      if (rooms.length > 0) message += `Rooms serviced: ${rooms.join(', ')}\n`;
    }

    if (shareOptions.note) {
      message += `\nNote: ${customNote}\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = client.phone.replace(/\D/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodedMessage}`;
    setShowShareModal(null);
    setExpandedAptId(null);
  };

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${darkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      <header className={`flex flex-col border-b sticky top-0 z-30 ${darkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-slate-200'} glass-header shrink-0`}>
        <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-20">
          <div className="flex flex-col -space-y-1">
             <h2 className="text-base md:text-xl font-black capitalize tracking-tighter italic">
               {view === 'MONTH' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}`}
             </h2>
             <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.3em]">Operational Board</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl p-1 bg-slate-100 dark:bg-zinc-800 border dark:border-zinc-700">
              <button onClick={() => navigate('PREV')} className="p-1.5 hover:text-emerald-500 transition-colors active-scale"><ChevronLeft size={16}/></button>
              <button onClick={() => navigate('NEXT')} className="p-1.5 hover:text-emerald-500 transition-colors active-scale"><ChevronRight size={16}/></button>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-6 pb-4">
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800 border dark:border-zinc-700 w-full shadow-inner">
            {['AGENDA', 'DAY', 'MONTH'].map((v) => (
              <button 
                key={v} 
                onClick={() => { setView(v as any); setExpandedAptId(null); }} 
                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all ${view === v ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-black/5' : 'text-slate-400'}`}
              >
                {v === 'AGENDA' ? 'List' : v === 'DAY' ? 'Day' : 'Month'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {view === 'DAY' && (
          <div ref={timeGridRef} className="h-full overflow-y-auto no-scrollbar">
            <div className="relative min-h-full flex" style={{ height: hours.length * HOUR_HEIGHT }}>
              <div className="w-16 md:w-20 border-r dark:border-zinc-800 sticky left-0 z-20 bg-inherit">
                {hours.map(h => (
                  <div key={h} className="h-[100px] flex justify-center items-start pt-4">
                    <span className="text-[9px] font-black text-slate-400 dark:text-zinc-600">
                      {h > 12 ? h-12 : h} {h >= 12 ? 'PM' : 'AM'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex-1 relative">
                {hours.map(h => <div key={h} className="h-[100px] border-b border-slate-100 dark:border-zinc-900/50 w-full" />)}
                {appointments.filter(a => a.date === currentDate.toISOString().split('T')[0]).map(apt => {
                    const { top, height } = calculatePosition(apt.time, apt.duration);
                    const client = clients.find(c => c.id === apt.clientId);
                    const isExpanded = expandedAptId === apt.id;
                    const completedTasks = apt.checklist?.filter(t => t.completed).length || 0;
                    const totalTasks = apt.checklist?.length || 1;
                    const progress = (completedTasks / totalTasks) * 100;
                    const statusColor = apt.status === 'IN_PROGRESS' ? 'border-blue-500' : apt.status === 'COMPLETED' ? 'border-emerald-500' : 'border-amber-400';

                    return (
                      <div 
                        key={apt.id} 
                        style={{ top: top + 6, height: isExpanded ? 'auto' : height - 12, minHeight: isExpanded ? 700 : 'unset', zIndex: isExpanded ? 50 : 10 }} 
                        className={`absolute left-3 right-3 rounded-[2.5rem] border-l-[12px] ${statusColor} p-6 shadow-2xl flex flex-col bg-white dark:bg-zinc-900 transition-all duration-500 ${isExpanded ? 'ring-8 ring-emerald-500/5' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                           <div className="flex flex-col">
                              <div className={`text-[10px] font-black italic tracking-wider uppercase ${apt.status === 'IN_PROGRESS' ? 'text-blue-500' : 'text-emerald-600'}`}>
                                {toAMPM(apt.time)} • {apt.duration} min
                              </div>
                              <h4 className="text-xl font-black uppercase tracking-tight dark:text-white mt-1">{client?.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mt-1">
                                 <Home size={12} /> {client?.houseDetails?.bedrooms}B / {client?.houseDetails?.bathrooms}Ba • {client?.houseType}
                              </div>
                           </div>
                           <button onClick={() => handleToggleExpand(apt)} className={`p-4 rounded-2xl transition-all active-scale ${isExpanded ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>
                              {isExpanded ? <X size={24} /> : <ClipboardCheck size={24} />}
                           </button>
                        </div>

                        {!isExpanded && (
                          <div className="mt-4 flex-1 flex flex-col justify-between">
                             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase truncate">
                                <MapPin size={12} className="text-emerald-500" /> {client?.address}
                             </div>
                             {progress > 0 && (
                               <div className="mt-4">
                                  <div className="flex justify-between text-[8px] font-black uppercase mb-1">
                                    <span>Quality Audit</span>
                                    <span>{Math.round(progress)}%</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                  </div>
                               </div>
                             )}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="mt-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                             <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-zinc-700/50 shadow-inner">
                                {!apt.checkInTime ? (
                                   <button onClick={() => handleCheckIn(apt.id)} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active-scale">
                                      <Play size={24} fill="currentColor" /> START SERVICE
                                   </button>
                                ) : !apt.checkOutTime ? (
                                   <div className="flex flex-col gap-6">
                                      <div className="flex items-center justify-between px-2">
                                         <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 animate-pulse border-2 border-blue-500/20">
                                               <Clock size={28} />
                                            </div>
                                            <div>
                                               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In progress since</div>
                                               <div className="text-lg font-black dark:text-white leading-none">
                                                 {toAMPM(new Date(apt.checkInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))}
                                               </div>
                                            </div>
                                         </div>
                                         <div className="text-right">
                                            <div className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">{Math.round(progress)}% Complete</div>
                                         </div>
                                      </div>
                                      
                                      <button 
                                        onClick={() => handleOpenCheckOutModal(apt.id)} 
                                        className={`w-full py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl transition-all active-scale ${progress === 100 ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                                      >
                                         <Square size={24} fill="currentColor" /> FINISH & CHECK-OUT
                                      </button>
                                   </div>
                                ) : (
                                   <div className="flex flex-col gap-4">
                                      <div className="flex items-center gap-6 p-4">
                                         <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 size={32} /></div>
                                         <div>
                                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Job Finished</div>
                                            <div className="text-xl font-black dark:text-white">{apt.actualDuration} minutes total</div>
                                         </div>
                                      </div>
                                      <button onClick={() => setShowShareModal(apt.id)} className="w-full py-4 bg-emerald-600/10 text-emerald-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all">
                                         <Share2 size={16}/> Resend Report to Client
                                      </button>
                                   </div>
                                )}
                             </div>

                             <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                   <h5 className="text-[12px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                      <ClipboardCheck size={20} className="text-emerald-500" /> Room-by-Room Evidence
                                   </h5>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                   {apt.checklist?.map(task => (
                                      <div key={task.id} className={`flex flex-col gap-4 p-5 rounded-[2.5rem] border-2 transition-all ${task.completed ? 'bg-emerald-50/20 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30' : 'bg-white dark:bg-zinc-800/50 border-slate-100 dark:border-zinc-700/50 shadow-sm'}`}>
                                         <div className="flex items-center gap-4">
                                            <button 
                                              onClick={() => handleToggleTask(apt.id, task.id)} 
                                              className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-200 dark:border-zinc-700'}`}
                                            >
                                               {task.completed && <Check size={22} strokeWidth={4} />}
                                            </button>
                                            <div className="flex-1">
                                               <span className={`text-[13px] font-black uppercase tracking-tight block ${task.completed ? 'line-through opacity-40' : 'dark:text-white'}`}>
                                                  {task.task}
                                               </span>
                                               <span className="text-[9px] font-black opacity-30 uppercase tracking-widest">{task.category || 'General'}</span>
                                            </div>
                                         </div>

                                         {!apt.checkOutTime && (
                                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-zinc-700/30">
                                              <button 
                                                onClick={() => handleAddTaskPhoto(apt.id, task.id, 'BEFORE')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${task.beforePhoto ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-500'}`}
                                              >
                                                <Camera size={16} /> {task.beforePhoto ? 'Before ✅' : 'Before'}
                                              </button>
                                              <button 
                                                onClick={() => handleAddTaskPhoto(apt.id, task.id, 'AFTER')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${task.afterPhoto ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-500'}`}
                                              >
                                                <CheckCircle2 size={16} /> {task.afterPhoto ? 'After ✅' : 'After'}
                                              </button>
                                            </div>
                                         )}
                                         
                                         {(task.beforePhoto || task.afterPhoto) && (
                                            <div className="flex gap-4 p-2 bg-slate-50 dark:bg-zinc-900 rounded-2xl">
                                              {task.beforePhoto && (
                                                <div className="relative group flex-1">
                                                  <img src={task.beforePhoto} className="w-full h-24 rounded-xl object-cover border-2 border-white shadow-md" alt="before" />
                                                  <div className="absolute top-1 left-1 bg-black/50 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase">Before</div>
                                                </div>
                                              )}
                                              {task.afterPhoto && (
                                                <div className="relative group flex-1">
                                                  <img src={task.afterPhoto} className="w-full h-24 rounded-xl object-cover border-2 border-white shadow-md" alt="after" />
                                                  <div className="absolute top-1 left-1 bg-emerald-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase">After</div>
                                                </div>
                                              )}
                                            </div>
                                         )}
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <button onClick={() => setExpandedAptId(null)} className="w-full py-6 text-slate-400 font-black text-[11px] uppercase tracking-[0.3em] hover:text-emerald-600 transition-colors">Close View</button>
                          </div>
                        )}
                      </div>
                    );
                })}
              </div>
            </div>
          </div>
        )}

        {view === 'AGENDA' && (
          <div className="h-full overflow-y-auto p-4 md:p-8 no-scrollbar space-y-4">
             {appointments.filter(a => a.date >= currentDate.toISOString().split('T')[0]).sort((a,b) => a.date.localeCompare(b.date)).map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                return (
                   <div key={apt.id} onClick={() => handleToggleExpand(apt)} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-zinc-800 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all active-scale cursor-pointer">
                      <div className="flex items-center gap-6">
                         <div className="text-center shrink-0">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{new Date(apt.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <div className="text-2xl font-black dark:text-white leading-none mt-1">{new Date(apt.date + 'T12:00:00').getDate()}</div>
                         </div>
                         <div className="h-10 w-px bg-slate-100 dark:bg-zinc-800"></div>
                         <div className="overflow-hidden">
                            <h4 className="text-sm font-black uppercase dark:text-white truncate">{client?.name}</h4>
                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase">
                               <span className="flex items-center gap-1 shrink-0"><Clock size={12}/> {toAMPM(apt.time)}</span>
                               <span className="flex items-center gap-1 truncate"><MapPin size={12}/> {client?.addressDetails.city}</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-xl font-black text-emerald-600 shrink-0 ml-4">${apt.amount}</div>
                   </div>
                );
             })}
          </div>
        )}
      </div>

      {/* CONFIRM CHECK-OUT MODAL */}
      {confirmingCheckOutId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 border-b dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                   <ShieldAlert size={40} />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase dark:text-white">Review & Finish Job</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Audit your service before leaving</p>
             </div>

             <div className="p-10 space-y-8">
                {(() => {
                  const apt = appointments.find(a => a.id === confirmingCheckOutId);
                  const pending = apt?.checklist?.filter(t => !t.completed).length || 0;
                  if (pending > 0) {
                    return (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-800/20">
                         <div className="flex items-center gap-4 text-amber-700 dark:text-amber-400 mb-4">
                            <AlertCircle size={28} />
                            <span className="text-sm font-black uppercase tracking-tight">Warning: {pending} Items Pending</span>
                         </div>
                         <p className="text-xs font-bold text-amber-800/70 dark:text-amber-400/70 leading-relaxed italic">
                           You haven't marked all rooms as finished. Are you sure you want to finalize the service without the full checklist?
                         </p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border-2 border-emerald-100 dark:border-amber-800/20 flex items-center gap-4 text-emerald-700 dark:text-emerald-400">
                       <CheckCircle2 size={32} />
                       <span className="text-sm font-black uppercase tracking-tight italic">Quality Approved: Everything Done!</span>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4 pt-4">
                   <button onClick={() => setConfirmingCheckOutId(null)} className="py-6 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-3xl font-black text-[11px] uppercase tracking-widest active-scale">
                      Back to Job
                   </button>
                   <button onClick={handleFinalizeCheckOut} className="py-6 bg-emerald-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 active-scale">
                      Confirm & Exit
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* SHARE REPORT MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-white/10">
              <div className="p-10 border-b dark:border-zinc-800 bg-emerald-600 text-white text-center">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare size={32} />
                 </div>
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase">Service Report</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-2">Send summary to your client</p>
              </div>

              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Info to Include:</p>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { id: 'times', label: 'Arrival/Departure', icon: Clock },
                         { id: 'duration', label: 'Total Duration', icon: Activity },
                         { id: 'checklist', label: 'Checklist Summary', icon: ClipboardCheck },
                         { id: 'note', label: 'Custom Note', icon: Star }
                       ].map(opt => (
                          <button 
                            key={opt.id} 
                            onClick={() => setShareOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof prev] }))}
                            className={`flex items-center gap-3 p-4 rounded-3xl border-2 transition-all text-left ${shareOptions[opt.id as keyof typeof shareOptions] ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-700' : 'bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400'}`}
                          >
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${shareOptions[opt.id as keyof typeof shareOptions] ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-zinc-700'}`}>
                                <opt.icon size={16} />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-tight leading-none">{opt.label}</span>
                          </button>
                       ))}
                    </div>
                 </div>

                 {shareOptions.note && (
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Closing Message:</p>
                      <textarea 
                        className="w-full p-6 bg-slate-50 dark:bg-zinc-800 border-none rounded-[2.5rem] text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[100px]"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="Type a personal message..."
                      />
                   </div>
                 )}

                 <div className="flex flex-col gap-4">
                    <button onClick={generateSMS} className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 active-scale">
                       <Send size={20} /> SEND VIA SMS
                    </button>
                    <button onClick={() => { setShowShareModal(null); setExpandedAptId(null); }} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors">
                       Skip Sharing
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <button className="fixed bottom-6 right-6 w-16 h-16 bg-emerald-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white/20">
        <Plus size={32} strokeWidth={4} />
      </button>
    </div>
  );
};

export default CalendarManager;
