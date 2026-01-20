
import React, { useState, useRef } from 'react';
import { Language, Message } from './types';
import { translations } from './translations';
import { getGeminiResponse, generateSpeech, decodeAudioData } from './services/geminiService';
import { 
  Languages, 
  Send, 
  Mic, 
  Square, 
  Paperclip, 
  Volume2, 
  HelpCircle, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(Language.PL);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showAbilities, setShowAbilities] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, type: string, data: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const ttsAudioContextRef = useRef<AudioContext | null>(null);

  const t = translations[lang];

  const handleLanguageSwitch = (newLang: Language) => {
    setLang(newLang);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          setAttachedFile({
            name: "VoiceMessage.webm",
            type: "audio/webm",
            data: reader.result as string
          });
          setInputText(lang === Language.PL ? "[Nagranie głosowe]" : "[Голосовое сообщение]");
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      file: attachedFile || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setAttachedFile(null);
    setIsLoading(true);

    // Updated call to getGeminiResponse to handle object return with groundingSources
    const result = await getGeminiResponse(
      userMessage.content || "Analyze the attached file.",
      lang,
      userMessage.file ? { data: userMessage.file.data, mimeType: userMessage.file.type } : undefined
    );

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: result.text,
      groundingSources: result.groundingSources
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const playTTS = async (text: string) => {
    if (isPlayingSpeech) return;
    
    setIsPlayingSpeech(true);
    const audioData = await generateSpeech(text);
    
    if (audioData) {
      if (!ttsAudioContextRef.current) {
        ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = ttsAudioContextRef.current;
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingSpeech(false);
      source.start();
    } else {
      setIsPlayingSpeech(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Left Panel: Sofia Illustration */}
      <div className="w-full md:w-1/3 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col items-center justify-start p-6 md:p-12 pt-12 md:pt-24 md:sticky md:top-0 h-auto md:h-screen overflow-y-auto custom-scrollbar z-10">
        <div className="relative group w-full max-w-[280px] md:max-w-[340px]">
          {/* Efekt poświaty za zdjęciem */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-[3rem] blur-3xl group-hover:blur-[4rem] transition-all duration-700"></div>
          
          <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-slate-100 z-10 aspect-[4/5] bg-slate-100">
            <img 
              src="https://galakton.pl/sofia/sofia.png" 
              alt="Sofia - Twój Asystent"
              onError={(e) => {
                e.currentTarget.src = "https://raw.githubusercontent.com/StackBlitz/stackblitz-images/main/sofia-assistant.png";
              }}
              className="w-full h-full object-cover object-top transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
        
        <div className="mt-8 md:mt-10 text-center z-10 w-full max-w-sm px-4">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 md:mb-3 tracking-tighter uppercase">{t.header}</h1>
          <div className="bg-slate-50/80 backdrop-blur-md p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 mb-6 md:mb-8">
            <p className="text-lg md:text-xl text-slate-800 leading-relaxed font-semibold italic">"{t.welcome}"</p>
          </div>
          
          <button 
            onClick={() => setShowAbilities(!showAbilities)}
            className="group relative inline-flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 overflow-hidden"
          >
            <HelpCircle size={20} className="relative z-10 md:w-6 md:h-6" />
            <span className="relative z-10 text-base md:text-lg uppercase tracking-wider">{t.whatICanDo}</span>
          </button>
          
          {showAbilities && (
            <div className="mt-6 p-6 bg-white rounded-3xl text-left border-2 border-blue-50 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
              <ul className="space-y-4">
                {t.capabilities.map((cap, i) => (
                  <li key={i} className="flex gap-4 text-base text-slate-700 font-medium leading-snug">
                    <div className="shrink-0 mt-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="text-blue-600" size={16} />
                    </div>
                    {cap}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Interaction */}
      <div className="flex-1 flex flex-col min-h-[600px] md:h-screen">
        {/* Header with language switch */}
        <header className="p-4 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex justify-end gap-2 sticky top-0 z-20">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
            <button 
              onClick={() => handleLanguageSwitch(Language.PL)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${lang === Language.PL ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PL
            </button>
            <button 
              onClick={() => handleLanguageSwitch(Language.RU)}
              className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-black transition-all duration-300 ${lang === Language.RU ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              RU
            </button>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar bg-[#f8fafc]">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 opacity-50">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white border border-slate-100 text-blue-500 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 shadow-sm">
                <Languages size={40} className="md:w-12 md:h-12" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-slate-800 mb-3">{t.legalNotice}</p>
              <p className="text-sm md:text-slate-500 font-medium">{t.consultation}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 fade-in duration-300`}>
              <div className={`max-w-[90%] md:max-w-[85%] rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
              }`}>
                {msg.file && (
                  <div className={`mb-4 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 md:gap-4 border ${
                    msg.role === 'user' ? 'bg-blue-700/50 border-blue-400' : 'bg-slate-50 border-slate-100 shadow-inner'
                  }`}>
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Paperclip size={20} className="md:w-6 md:h-6" />
                    </div>
                    <span className="text-xs md:text-sm truncate font-bold tracking-tight">{msg.file.name}</span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed font-semibold text-[0.95rem] md:text-[1.05rem]">
                  {msg.content}
                </div>
                
                {/* Added grounding sources rendering for search result transparency as per guidelines */}
                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingSources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="max-w-[150px] truncate">{source.title || 'Source'}</span>
                          <Send size={10} className="opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <button 
                    onClick={() => playTTS(msg.content)}
                    disabled={isPlayingSpeech}
                    className="mt-6 flex items-center gap-3 px-5 py-2.5 md:px-6 md:py-3 bg-blue-50 rounded-xl md:rounded-2xl text-xs md:text-sm font-black text-blue-600 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {isPlayingSpeech ? <Loader2 size={16} className="animate-spin md:w-[18px] md:h-[18px]" /> : <Volume2 size={16} className="md:w-[18px] md:h-[18px]" />}
                    {t.listen}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-blue-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] rounded-tl-none shadow-xl flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-100">
                  {/* Fixed duplicate attribute: merged two className declarations into one */}
                  <Loader2 className="animate-spin text-white md:w-7 md:h-7" size={24} />
                </div>
                <span className="text-slate-800 font-black text-base md:text-lg tracking-tight uppercase">{t.summarizing}</span>
              </div>
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer className="p-4 md:p-12 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto space-y-4 md:space-y-6"
          >
            {attachedFile && (
              <div className="flex items-center justify-between p-4 md:p-5 bg-blue-600 rounded-2xl md:rounded-3xl border-2 border-blue-400 shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 md:gap-4 text-white">
                  <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl shadow-inner">
                    <Paperclip size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-black tracking-tight leading-none mb-1 truncate max-w-[150px] md:max-w-none">{attachedFile.name}</p>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80">{attachedFile.type}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-2 md:p-2.5 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl text-white transition-all"
                >
                  <Square size={20} fill="currentColor" className="md:w-6 md:h-6" />
                </button>
              </div>
            )}

            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={t.placeholder}
                className="w-full min-h-[120px] md:min-h-[140px] p-5 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] focus:ring-8 focus:ring-blue-500/5 focus:border-blue-400 focus:bg-white outline-none transition-all resize-none pr-32 md:pr-44 custom-scrollbar text-lg md:text-xl font-semibold shadow-inner placeholder:text-slate-400"
              />
              
              <div className="absolute bottom-5 right-5 md:bottom-8 md:right-8 flex items-center gap-2 md:gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 md:p-4 bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-xl md:rounded-2xl shadow-lg transition-all hover:scale-110 active:scale-95"
                  title="Upload File"
                >
                  <Paperclip size={24} className="md:w-7 md:h-7" />
                </button>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-95 ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-red-200' 
                      : 'bg-white border-2 border-slate-100 text-slate-600 hover:text-blue-600 hover:border-blue-200'
                  }`}
                  title={isRecording ? t.stopRecording : "Record Voice"}
                >
                  {isRecording ? <Square size={24} fill="currentColor" className="md:w-7 md:h-7" /> : <Mic size={24} className="md:w-7 md:h-7" />}
                </button>

                <button
                  type="submit"
                  disabled={isLoading || (!inputText.trim() && !attachedFile)}
                  className="p-4 md:p-5 bg-blue-600 text-white rounded-xl md:rounded-[1.5rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all flex items-center justify-center min-w-[56px] md:min-w-[72px] hover:scale-105 active:scale-95 group"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin md:w-8 md:h-8" /> : <Send size={24} className="md:w-8 md:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 px-2 md:px-6 text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">
              <AlertCircle size={16} className="md:w-[18px] md:h-[18px]" />
              {t.consultation}
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
          </form>
        </footer>
      </div>
    </div>
  );
};

export default App;
