
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Radio, Sparkles, X, Activity } from 'lucide-react';

const LiveManager: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Clique para despertar sua assistente');
  const [volume, setVolume] = useState(0);
  
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setStatus('Conectando ao sistema neural...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;
      
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const inputSource = inputAudioContext.createMediaStreamSource(stream);
      const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "Você é o 'Gerente Digital', um consultor sênior bilíngue especialista em empresas de limpeza nos Estados Unidos. Fale em Português-BR com tom profissional, prático e motivador. Ajude a dona da empresa com rotas, orçamentos e motivação das helpers.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        callbacks: {
          onopen: () => {
            setStatus('Sistema Ativo: Pode falar agora');
            setIsActive(true);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length) * 100);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            inputSource.connect(processor);
            processor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) playAudioChunk(base64Audio);
             if (msg.serverContent?.interrupted) {
               activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
               activeSourcesRef.current.clear();
               nextStartTimeRef.current = 0;
             }
          },
          onclose: () => { setStatus('Gerente Offline.'); setIsActive(false); },
          onerror: () => { setStatus('Falha de sinal IA.'); setIsActive(false); }
        }
      });
      sessionPromise.then(sess => { sessionRef.current = sess; });
    } catch (error) { setStatus('Permissão de microfone negada.'); }
  };

  const stopSession = () => {
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current.onaudioprocess = null; }
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (sessionRef.current) sessionRef.current.close();
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch (e) {} });
    setIsActive(false); setStatus('Clique para despertar sua assistente'); setVolume(0);
  };

  function createBlob(data: Float32Array) {
    const l = data.length; const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
    let b = ''; const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
    return { data: btoa(b), mimeType: 'audio/pcm;rate=16000' };
  }

  async function playAudioChunk(base64: string) {
    const ctx = outputAudioContextRef.current; if (!ctx) return;
    const b = atob(base64); const bytes = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) bytes[i] = b.charCodeAt(i);
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    const s = ctx.createBufferSource(); s.buffer = buffer; s.connect(ctx.destination);
    activeSourcesRef.current.add(s); s.onended = () => activeSourcesRef.current.delete(s);
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    s.start(nextStartTimeRef.current); nextStartTimeRef.current += buffer.duration;
  }

  return (
    <div className="relative min-h-[500px] flex items-center justify-center p-8 bg-zinc-950 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500">
      <div className={`absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-indigo-900/20 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-30'}`}></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 flex flex-col items-center gap-12 text-center max-w-sm">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">IA Em Tempo Real</span>
           </div>
           <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Gerente Digital</h2>
           <p className="text-zinc-400 text-sm font-medium h-10 transition-all">{status}</p>
        </div>

        <div className="relative flex items-center justify-center w-64 h-64">
           <div className={`absolute inset-0 rounded-full border border-white/5 scale-150 transition-transform duration-1000 ${isActive ? 'animate-spin-slow' : ''}`}></div>
           <div className={`absolute inset-0 rounded-full border border-emerald-500/20 scale-125 transition-transform duration-1000 ${isActive ? 'animate-reverse-spin-slow' : ''}`}></div>
           
           <button
             onClick={isActive ? stopSession : startSession}
             className={`relative z-20 w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 group shadow-[0_0_50px_rgba(16,185,129,0.1)] hover:shadow-[0_0_80px_rgba(16,185,129,0.3)] active-scale ${
               isActive ? 'bg-zinc-800 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-emerald-600'
             }`}
           >
             {isActive ? (
                <div className="flex gap-2 items-center h-16">
                   {[1,2,3,4,5,6].map(i => (
                     <div 
                        key={i} 
                        className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(12, Math.min(56, volume * (1 + i * 0.3)))}px`}}
                     />
                   ))}
                </div>
             ) : (
                <Mic size={56} className="text-white group-hover:scale-110 transition-transform" />
             )}
           </button>
        </div>

        <div className="flex gap-12">
           <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                 <Radio size={22} />
              </div>
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Sinal</p>
           </div>
           <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                 <Activity size={22} />
              </div>
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">IA Health</p>
           </div>
        </div>

        {isActive && (
           <button onClick={stopSession} className="flex items-center gap-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-rose-400 transition-colors">
              <X size={16} /> Encerrar Consulta
           </button>
        )}
      </div>
    </div>
  );
};

export default LiveManager;
