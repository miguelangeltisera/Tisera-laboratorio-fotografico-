
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader.tsx';
import ComparisonSlider from './components/ComparisonSlider.tsx';
import { enhanceImage } from './services/geminiService.ts';
import { ImageState, EnhancementHistory, AspectRatio, EnhancementConfig } from './types.ts';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(true); // Iniciamos en true para permitir flujo fluido
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
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        if (!selected && !process.env.API_KEY) {
          setHasKey(false);
        }
      } else if (!process.env.API_KEY) {
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true); // Proceder tras el diálogo según guías de race condition
    } else {
      setHasKey(true); // Forzar si no hay plugin para intentar usar process.env
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
        reconstruct: "MODO RECONSTRUCCIÓN AVANZADA: Tu misión es rellenar partes faltantes, esquinas rotas o áreas dañadas. Utiliza síntesis de imagen para crear contenido nuevo coherente. Mejora drásticamente la definición de rostros y texturas. Recupera tonos naturales eliminando el descoloramiento.",
        restore: "RESTAURACIÓN CLÁSICA: Borra rayones, motas de polvo y grietas de papel. Suaviza el ruido pero mantén la nitidez de los bordes. Mejora el contraste y la viveza de los colores.",
        resize: `ESCALADO HD: Aumenta la resolución y expande el lienzo a ${config.aspectRatio} generando fondo inteligente en los bordes nuevos.`,
        artistic: "MEJORA CINEMÁTICA: Aplica gradación de color profesional, mejora la iluminación y dale un acabado de alta definición con mejores tonos de piel.",
        standard: "OPTIMIZACIÓN GENERAL: Mejora brillo, contraste y nitidez estándar."
      };

      const finalPrompt = customPrompt ? `${modePrompts[config.mode]} Instrucción adicional: ${customPrompt}` : modePrompts[config.mode];
      
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
      }
      setError(err.message || "Error inesperado en el procesamiento.");
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#ecfdf5]">
        <div className="glass p-12 rounded-[2.5rem] max-w-lg w-full text-center space-y-8 shadow-2xl border-emerald-100/50">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2 shadow-inner">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Acceso Requerido</h2>
            <p className="text-emerald-800/70 text-sm">
              Para iniciar el laboratorio de restauración de Miguel Ángel Tisera, es necesario activar una clave de API válida.
            </p>
          </div>
          <button 
            onClick={handleOpenKeySelector} 
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
          >
            Activar Laboratorio
          </button>
          <p className="text-[10px] text-emerald-900/40 uppercase tracking-widest font-bold">
            Usa tu clave del proyecto de Google Cloud
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-emerald-200">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-emerald-950 uppercase">TIsera Photo Lab</h1>
            <p className="text-emerald-600 font-bold text-[10px] uppercase tracking-[0.4em]">Advanced Restoration Unit</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-10 py-4 rounded-[1.5rem] text-xs font-black border-2 border-emerald-100 bg-white hover:bg-emerald-50 text-emerald-950 transition-all active:scale-95 shadow-lg uppercase tracking-widest">Nuevo Proyecto</button>
        )}
      </header>

      <main className="w-full max-w-6xl flex-grow">
        {!imageState.original ? (
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-6">
              <h2 className="text-6xl md:text-8xl font-black text-emerald-950 leading-[0.85] tracking-tighter">
                Reconstruye y Mejora <br/><span className="text-emerald-500">tus recuerdos</span>
              </h2>
              <p className="text-emerald-800/60 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Tecnología forense para sanar rayones, rellenar partes faltantes y mejorar la definición tonal con IA de vanguardia.
              </p>
            </div>

            <div className="relative group">
               <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
               <div className="relative">
                 <ImageUploader onImageSelected={handleImageSelected} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10">
               {[
                 { title: "Sana Rayones", desc: "Elimina grietas, manchas y suciedad física sin alterar la textura original.", icon: "🩹" },
                 { title: "Reconstruye", desc: "Relleno contextual de áreas faltantes con alta fidelidad anatómica.", icon: "🧩" },
                 { title: "Mejores Tonos", desc: "Corrección de color y aumento de definición HD profesional.", icon: "💎" }
               ].map((f, i) => (
                 <div key={i} className="glass p-10 rounded-[2.5rem] border-b-[12px] border-emerald-600/10 hover:border-emerald-500 transition-all hover:-translate-y-2 group">
                   <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{f.icon}</div>
                   <h3 className="font-black text-emerald-950 text-2xl mb-3">{f.title}</h3>
                   <p className="text-emerald-800/60 text-sm leading-relaxed font-medium">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in duration-1000">
            <div className="lg:col-span-4 space-y-8">
              <div className="glass p-8 rounded-[3rem] space-y-8 shadow-2xl border-white/50">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950/30 ml-2">Protocolo de IA</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'reconstruct', label: 'Reconstruir', icon: '🧩' },
                      { id: 'restore', label: 'Sanar Daños', icon: '🩹' },
                      { id: 'resize', label: 'Escalar HD', icon: '📐' },
                      { id: 'artistic', label: 'Tonos Pro', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${
                          config.mode === mode.id 
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl scale-[1.05]' 
                          : 'bg-white border-emerald-100 text-emerald-900 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-3xl mb-2">{mode.icon}</span>
                        <span className="font-black text-[9px] uppercase tracking-wider">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950/30 ml-2">Formato de Salida</label>
                  <div className="flex flex-wrap gap-2">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black border-2 transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-teal-600 border-teal-400 text-white' 
                          : 'bg-white border-emerald-100 text-emerald-950 hover:bg-emerald-50 shadow-sm'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-950/30 ml-2">Instrucciones</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-32 px-6 py-5 bg-white border-2 border-emerald-100 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none resize-none text-sm placeholder:text-emerald-200 text-emerald-950 font-bold shadow-inner"
                    placeholder="Ej: 'Dale más definición a los ojos', 'Rellena la esquina rota'..."
                  />
                </div>

                {error && (
                  <div className="p-6 bg-red-50 border-2 border-red-100 rounded-[2rem] text-red-600 text-xs font-black animate-pulse flex items-center gap-4">
                    <div className="shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg">!</div>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-7 rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all ${
                    isProcessing 
                    ? 'bg-emerald-300 cursor-not-allowed text-white scale-95' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/40 active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Procesar Imagen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-12">
              {imageState.enhanced ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="p-2 bg-white rounded-[3.5rem] shadow-2xl">
                    <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-8 px-4">
                     <button 
                       onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                       className="px-12 py-6 bg-white hover:bg-emerald-50 text-emerald-950 rounded-[2rem] font-black transition-all border-2 border-emerald-100 shadow-xl active:scale-95"
                     >
                       Re-ajustar IA
                     </button>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_restored_hd.png"
                      className="w-full sm:w-auto px-16 py-6 bg-emerald-950 text-white rounded-[2rem] font-black flex items-center justify-center gap-4 transition-all hover:bg-black shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <span>Descargar Resultado</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-[4.5rem] overflow-hidden glass border-8 border-white shadow-2xl bg-emerald-50/30">
                  <img src={imageState.original} alt="Scan" className="w-full h-full object-contain opacity-30 blur-2xl transition-all duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8">
                    <div className="w-28 h-28 bg-emerald-600/10 rounded-full flex items-center justify-center border-4 border-emerald-600/30 animate-pulse">
                      <svg className="w-14 h-14 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-emerald-950 tracking-tighter uppercase">Imagen Detectada</h3>
                      <p className="text-emerald-800/60 max-w-sm font-bold text-lg leading-snug">
                        El sistema de visión de Miguel Ángel Tisera está listo. Haz clic en el botón para iniciar la reconstrucción.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-6 pt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-950/20 ml-6">Laboratorio de Historial</h3>
                  <div className="flex gap-8 overflow-x-auto pb-8 px-6 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-36 h-36 rounded-[3rem] overflow-hidden border-4 transition-all shadow-xl hover:scale-110 active:scale-95 ${
                          imageState.enhanced === item.enhanced ? 'border-emerald-500 shadow-emerald-500/30' : 'border-white hover:border-emerald-200'
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

      <footer className="mt-40 py-20 w-full max-w-6xl border-t-4 border-emerald-100/40 flex flex-col md:flex-row justify-between items-center gap-12 text-emerald-900">
        <div className="flex flex-col items-center md:items-start space-y-4">
          <p className="text-[11px] uppercase tracking-[0.7em] opacity-40 font-black">Soporte Técnico Especializado</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-3xl font-black hover:text-emerald-600 transition-all active:scale-95 underline decoration-emerald-200 decoration-4 underline-offset-12">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right space-y-2 bg-white/40 p-8 rounded-[2rem] border border-emerald-50">
          <p className="opacity-50 text-[11px] font-black uppercase tracking-[0.4em]">TIsera Photo Lab • v4.0 Ultra</p>
          <p className="text-emerald-600 text-sm font-black">Powered by Gemini 2.5 Vision Engine</p>
          <p className="opacity-30 text-[10px] font-bold italic tracking-tighter">© {new Date().getFullYear()} Preservación de Memorias Digitales</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
