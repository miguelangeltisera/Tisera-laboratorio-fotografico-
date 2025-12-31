
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader.tsx';
import ComparisonSlider from './components/ComparisonSlider.tsx';
import { enhanceImage } from './services/geminiService.ts';
import { ImageState, EnhancementHistory, AspectRatio, EnhancementConfig } from './types.ts';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    enhanced: null,
    mimeType: null
  });
  const [config, setConfig] = useState<EnhancementConfig>({
    aspectRatio: "1:1",
    mode: 'reconstruct'
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EnhancementHistory[]>([]);

  useEffect(() => {
    const verifyAccess = async () => {
      // Priorizar la clave en process.env inyectada por Netlify
      if (process.env.API_KEY && process.env.API_KEY.trim().length > 10) {
        setHasKey(true);
        return;
      }
      
      // Fallback a selector si no hay clave de entorno
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(false);
      }
    };
    verifyAccess();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
    } else {
      setError("Por favor, configura la variable API_KEY en Netlify.");
    }
  };

  const handleImageSelected = useCallback((base64: string, mimeType: string) => {
    setImageState({ original: base64, enhanced: null, mimeType: mimeType });
    setError(null);
  }, []);

  const handleEnhance = async () => {
    if (!imageState.original || !imageState.mimeType) return;
    setIsProcessing(true);
    setError(null);

    try {
      const modePrompts = {
        reconstruct: "RESTURACIÓN MAESTRA: Reconstrucción forense. Rellena bordes rotos, sana grietas y mejora la definición con realismo orgánico. Aplica calibración de tonos profundos.",
        restore: "LIMPIEZA PRO: Elimina rayones y manchas químicas. Recupera el contraste y la nitidez original.",
        resize: `ESCALADO ULTRA-HD: Expande a ${config.aspectRatio} con regeneración de texturas inteligentes.`,
        artistic: "CALIBRACIÓN CROMÁTICA: Optimiza colores y balance de blancos para un acabado profesional.",
        standard: "MEJORA RÁPIDA: Optimización de brillo y contraste."
      };

      const finalPrompt = customPrompt ? `${modePrompts[config.mode]} Nota adicional: ${customPrompt}` : modePrompts[config.mode];
      
      const enhancedBase64 = await enhanceImage(
        imageState.original, 
        imageState.mimeType, 
        finalPrompt,
        config.aspectRatio
      );
      
      setImageState(prev => ({ ...prev, enhanced: enhancedBase64 }));

      const newEntry: EnhancementHistory = {
        id: Date.now().toString(),
        original: imageState.original,
        enhanced: enhancedBase64,
        prompt: finalPrompt,
        timestamp: Date.now()
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 8));
    } catch (err: any) {
      if (err.message.includes("API_KEY")) {
        setHasKey(false);
        setError("Error de autenticación. Verifica tu clave de API.");
      } else {
        setError(err.message || "Fallo en el procesado.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageState({ original: null, enhanced: null, mimeType: null });
    setError(null);
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-orange-50">
        <div className="glass p-12 rounded-[3rem] max-w-lg w-full text-center space-y-10 shadow-2xl border-orange-200/50">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 shadow-inner">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-orange-950 uppercase tracking-tighter">Acceso Requerido</h2>
            <p className="text-orange-800/70 text-sm font-medium leading-relaxed">
              El laboratorio de Miguel Ángel Tisera requiere una API KEY activa para operar. Conéctala para iniciar la restauración.
            </p>
          </div>
          <button 
            onClick={handleOpenKeySelector} 
            className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/30 active:scale-95"
          >
            Vincular API KEY
          </button>
          <div className="pt-4 border-t border-orange-100 flex flex-col gap-2">
            <p className="text-[10px] text-orange-900/30 uppercase tracking-[0.2em] font-black">Nota de Netlify</p>
            <p className="text-[11px] text-orange-700 font-bold">Asegúrate de haber guardado la clave en las variables de entorno.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-orange-200">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex items-center gap-6 group">
          <div className="w-20 h-20 bg-orange-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 transform -rotate-3 group-hover:rotate-0 transition-all">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-orange-950 uppercase">TIsera Photo Lab</h1>
            <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.4em] opacity-70">Unidad de Restauración Forense</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-10 py-4 rounded-[1.5rem] text-xs font-black border-2 border-orange-200 bg-white hover:bg-orange-50 text-orange-950 transition-all active:scale-95 shadow-lg uppercase tracking-widest">Nuevo Escaneo</button>
        )}
      </header>

      <main className="w-full max-w-6xl flex-grow">
        {!imageState.original ? (
          <div className="max-w-4xl mx-auto space-y-20">
            <div className="text-center space-y-8">
              <h2 className="text-7xl md:text-9xl font-black text-orange-950 leading-[0.8] tracking-tighter">
                Más Definición <br/><span className="text-orange-500">Mejores Tonos</span>
              </h2>
              <p className="text-orange-800/60 text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                Tecnología IA para sanar rayones, recuperar texturas y calibrar tonos. Devuelve la vida a tus memorias con calidad profesional.
              </p>
            </div>

            <div className="relative group p-1 bg-white rounded-[3.5rem] shadow-2xl">
               <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-amber-400 rounded-[4rem] blur-2xl opacity-10 group-hover:opacity-30 transition duration-1000"></div>
               <div className="relative">
                 <ImageUploader onImageSelected={handleImageSelected} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
               {[
                 { title: "Detalle HD", desc: "Regenera pestañas, piel y poros con precisión microscópica.", icon: "💎" },
                 { title: "Color Real", desc: "Elimina el descoloramiento y recupera la viveza de cada tono.", icon: "🎨" },
                 { title: "Sana el Tiempo", desc: "Borra quirúrgicamente rayones, grietas y manchas.", icon: "🩹" }
               ].map((f, i) => (
                 <div key={i} className="glass p-12 rounded-[3rem] border-b-[16px] border-orange-600/5 hover:border-orange-500 transition-all hover:-translate-y-4 group shadow-xl">
                   <div className="text-6xl mb-8 transform group-hover:scale-125 transition-transform duration-500">{f.icon}</div>
                   <h3 className="font-black text-orange-950 text-2xl mb-4">{f.title}</h3>
                   <p className="text-orange-800/50 text-sm leading-relaxed font-bold">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start animate-in fade-in zoom-in-95 duration-1000">
            <div className="lg:col-span-4 space-y-10">
              <div className="glass p-10 rounded-[3.5rem] space-y-10 shadow-2xl border-white/60">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Protocolo</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'reconstruct', label: 'Maestría', icon: '🧩' },
                      { id: 'restore', label: 'Sanar', icon: '🩹' },
                      { id: 'resize', label: 'HD Pro', icon: '📐' },
                      { id: 'artistic', label: 'Cine', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${
                          config.mode === mode.id 
                          ? 'bg-orange-600 border-orange-400 text-white shadow-2xl scale-[1.08]' 
                          : 'bg-white border-orange-50 text-orange-900 hover:border-orange-200'
                        }`}
                      >
                        <span className="text-4xl mb-2">{mode.icon}</span>
                        <span className="font-black text-[9px] uppercase tracking-[0.2em]">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Formato</label>
                  <div className="flex flex-wrap gap-3">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-orange-950 border-orange-800 text-white' 
                          : 'bg-white border-orange-50 text-orange-950 hover:bg-orange-100 shadow-sm'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Anotaciones</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-32 px-7 py-6 bg-white border-2 border-orange-50 rounded-[2.5rem] focus:ring-8 focus:ring-orange-500/10 transition-all outline-none resize-none text-sm placeholder:text-orange-100 text-orange-950 font-bold shadow-inner"
                    placeholder="Ej: 'Aclarar zona de ojos', 'Rellenar esquinas'..."
                  />
                </div>

                {error && (
                  <div className="p-7 bg-red-50 border-2 border-red-100 rounded-[2.5rem] text-red-600 text-xs font-black animate-bounce flex items-center gap-5">
                    <div className="shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg text-lg">!</div>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-8 rounded-[3rem] font-black text-2xl flex items-center justify-center gap-5 transition-all ${
                    isProcessing 
                    ? 'bg-orange-200 cursor-not-allowed text-white scale-95' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-600/40 active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Iniciar Procesado</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-16">
              {imageState.enhanced ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <div className="p-3 bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-orange-50">
                    <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-10">
                     <button 
                       onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                       className="w-full sm:w-auto px-16 py-7 bg-white hover:bg-orange-50 text-orange-950 rounded-[2.5rem] font-black transition-all border-2 border-orange-100 shadow-xl active:scale-95"
                     >
                       Re-Ajustar Motor
                     </button>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_final_hd.png"
                      className="w-full sm:w-auto px-20 py-7 bg-orange-950 text-white rounded-[2.5rem] font-black flex items-center justify-center gap-5 transition-all hover:bg-black shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95"
                    >
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Descargar HD</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-[5rem] overflow-hidden glass border-8 border-white shadow-[0_40px_80px_-15px_rgba(154,52,18,0.1)] bg-orange-50/20 group">
                  <img src={imageState.original} alt="Analizando" className="w-full h-full object-contain opacity-20 blur-3xl transition-all duration-1000 group-hover:opacity-30" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center space-y-10">
                    <div className="w-32 h-32 bg-orange-600/10 rounded-full flex items-center justify-center border-4 border-orange-600/20 animate-pulse">
                      <svg className="w-16 h-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-5xl font-black text-orange-950 tracking-tighter uppercase leading-tight">Escaneo Completado</h3>
                      <p className="text-orange-800/60 max-w-sm font-bold text-xl leading-relaxed">
                        Sistema listo para la reconstrucción profunda. Ajusta los parámetros y pulsa el botón principal.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-8 pt-8 px-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-grow bg-orange-100"></div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.8em] text-orange-900/20">Archivo de Sesión</h3>
                    <div className="h-[2px] flex-grow bg-orange-100"></div>
                  </div>
                  <div className="flex gap-10 overflow-x-auto pb-10 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-44 h-44 rounded-[3.5rem] overflow-hidden border-4 transition-all shadow-xl hover:scale-110 active:scale-95 ${
                          imageState.enhanced === item.enhanced ? 'border-orange-500 shadow-orange-500/40 ring-8 ring-orange-500/10' : 'border-white hover:border-orange-200'
                        }`}
                      >
                        <img src={item.enhanced} className="w-full h-full object-cover" alt="Log" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-48 py-24 w-full max-w-6xl border-t-8 border-orange-50/50 flex flex-col md:flex-row justify-between items-center gap-16 text-orange-900">
        <div className="flex flex-col items-center md:items-start space-y-6">
          <p className="text-[12px] uppercase tracking-[0.8em] opacity-30 font-black">Línea de Soporte</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-4xl font-black hover:text-orange-600 transition-all active:scale-95 underline decoration-orange-200 decoration-8 underline-offset-[16px] tracking-tighter">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right space-y-3 bg-white/50 p-10 rounded-[3rem] border border-orange-50 shadow-sm">
          <p className="opacity-40 text-[12px] font-black uppercase tracking-[0.5em]">TIsera Lab • Platinum v6.0</p>
          <p className="text-orange-600 text-lg font-black">Gemini 2.5 Vision Engine</p>
          <p className="opacity-20 text-[11px] font-bold italic tracking-tighter">© {new Date().getFullYear()} Especialistas en Restauración Forense</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
