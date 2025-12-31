
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader.tsx';
import ComparisonSlider from './components/ComparisonSlider.tsx';
import { enhanceImage } from './services/geminiService.ts';
import { ImageState, EnhancementHistory, AspectRatio, EnhancementConfig } from './types.ts';

const App: React.FC = () => {
  // Inicializamos comprobando si existe la clave en el entorno global de Netlify
  const [hasKey, setHasKey] = useState<boolean>(() => {
    return !!(process.env.API_KEY && process.env.API_KEY.length > 10);
  });
  
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
    const checkAuth = async () => {
      // Si ya detectamos la clave en process.env, no hacemos nada más
      if (hasKey) return;

      // Si no, intentamos usar el puente de la plataforma aistudio
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          if (selected) setHasKey(true);
        } catch (e) {
          console.error("Error al verificar clave en plataforma", e);
        }
      }
    };
    checkAuth();
  }, [hasKey]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        // Asumimos éxito inmediato según lineamientos para evitar race conditions
        setHasKey(true);
        setError(null);
      } catch (e) {
        setError("Error al abrir el selector. Verifica las variables en Netlify.");
      }
    } else {
      setError("Variable API_KEY no detectada. Asegúrate de que en Netlify el nombre sea API_KEY.");
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
        reconstruct: "MEJORA DE DEFINICIÓN Y TONOS: Realiza una reconstrucción profunda. Aumenta la nitidez de detalles faciales y texturas. Calibra los tonos para que sean vibrantes y naturales, eliminando cualquier neblina o descoloramiento.",
        restore: "RESTAURACIÓN TÉCNICA: Borra rayones, grietas y suciedad. Mejora el contraste y recupera la profundidad de los negros.",
        resize: `RE-ESCALADO HD: Ajusta la imagen a ${config.aspectRatio} generando contenido inteligente en los bordes y duplicando la resolución.`,
        artistic: "MEJORA CINEMATOGRÁFICA: Aplica una gradación de color profesional y mejora la iluminación global de la escena.",
        standard: "OPTIMIZACIÓN BÁSICA: Mejora ligera de nitidez y brillo."
      };

      const finalPrompt = customPrompt 
        ? `${modePrompts[config.mode]}. Instrucciones específicas del usuario: ${customPrompt}` 
        : modePrompts[config.mode];
      
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
      if (err.message.includes("API_KEY") || err.message.includes("403") || err.message.includes("key")) {
        // No bloqueamos inmediatamente con la pantalla de acceso si falló un intento
        // pero mostramos un error claro para el usuario.
        setError("Error de Clave: " + err.message);
      } else {
        setError(err.message || "Error procesando la imagen.");
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass p-12 rounded-[3.5rem] max-w-lg w-full text-center space-y-10 shadow-2xl">
          <div className="w-24 h-24 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-orange-950 uppercase tracking-tighter">Acceso Requerido</h2>
            <p className="text-orange-900/80 text-sm font-bold leading-relaxed">
              El laboratorio de Miguel Ángel Tisera está listo. <br/>
              Si ya configuraste tu clave en Netlify, asegúrate de haber redeplegado tu aplicación.
            </p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleOpenKeySelector} 
              className="w-full py-6 btn-premium rounded-[2rem] font-black text-xl active:scale-95 shadow-2xl"
            >
              Vincular Manualmente
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-white/50 text-orange-950 rounded-[1.5rem] font-black text-sm hover:bg-white/80 transition-all border border-white/40"
            >
              Refrescar Laboratorio
            </button>
          </div>
          <div className="pt-6 border-t border-orange-200 text-[10px] text-orange-900/60 uppercase tracking-[0.3em] font-black">
            Variable esperada: API_KEY
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-orange-300">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex items-center gap-6 group">
          <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-all duration-500 border-2 border-orange-100">
            <svg className="w-10 h-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-lg uppercase">TIsera Photo Lab</h1>
            <p className="text-white/80 font-black text-[10px] uppercase tracking-[0.5em] drop-shadow">Unidad Forense de Restauración HD</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-10 py-4 rounded-[1.5rem] text-xs font-black border-2 border-white/40 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all active:scale-95 shadow-lg uppercase tracking-widest">Nuevo Escaneo</button>
        )}
      </header>

      <main className="w-full max-w-6xl flex-grow pb-24">
        {!imageState.original ? (
          <div className="max-w-4xl mx-auto space-y-24">
            <div className="text-center space-y-8">
              <h2 className="text-7xl md:text-9xl font-black text-white leading-[0.8] tracking-tighter drop-shadow-2xl">
                Más definición <br/><span className="text-orange-950/40">mejores tonos</span>
              </h2>
              <p className="text-white font-bold text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                Tecnología de última generación para sanar texturas y calibrar colores. Devuelve la vida a tus memorias.
              </p>
            </div>

            <div className="glass p-2 rounded-[4rem]">
               <ImageUploader onImageSelected={handleImageSelected} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { title: "Definición HD", desc: "Regenera pestañas, piel y detalles con nitidez microscópica.", icon: "💎" },
                 { title: "Tonos Pro", desc: "Elimina el desvanecimiento y recupera la viveza original.", icon: "🎨" },
                 { title: "Sana Daños", desc: "Borra quirúrgicamente grietas y motas de polvo.", icon: "🩹" }
               ].map((f, i) => (
                 <div key={i} className="glass p-10 rounded-[3.5rem] border-b-[8px] border-orange-600 transition-all hover:-translate-y-2 group">
                   <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-500">{f.icon}</div>
                   <h3 className="font-black text-orange-950 text-xl mb-3 uppercase tracking-tighter">{f.title}</h3>
                   <p className="text-orange-900/60 text-sm leading-relaxed font-bold">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="lg:col-span-4 space-y-8">
              <div className="glass p-8 rounded-[3rem] space-y-8 border-white/60">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/40 ml-2">Modo de Procesado</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'reconstruct', label: 'Maestro', icon: '🧩' },
                      { id: 'restore', label: 'Sanar', icon: '🩹' },
                      { id: 'resize', label: 'Escalar', icon: '📐' },
                      { id: 'artistic', label: 'Tonal Pro', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all ${
                          config.mode === mode.id 
                          ? 'bg-orange-600 border-orange-500 text-white shadow-xl scale-[1.05]' 
                          : 'bg-white/50 border-white/40 text-orange-950 hover:bg-white'
                        }`}
                      >
                        <span className="text-3xl mb-1">{mode.icon}</span>
                        <span className="font-black text-[9px] uppercase tracking-[0.1em]">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/40 ml-2">Formato Final</label>
                  <div className="flex flex-wrap gap-2">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-orange-950 text-white' 
                          : 'bg-white/50 text-orange-950 hover:bg-white border-white/20'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/40 ml-2">Instrucciones</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-24 px-5 py-4 bg-white/60 border border-white/40 rounded-[2rem] focus:ring-4 focus:ring-orange-500/20 transition-all outline-none resize-none text-sm text-orange-950 font-bold placeholder:text-orange-900/30"
                    placeholder="Ej: 'Aumentar definición en los ojos'..."
                  />
                </div>

                {error && (
                  <div className="p-5 bg-red-100 border border-red-200 rounded-[2rem] text-red-700 text-[10px] font-black flex items-center gap-3 animate-shake">
                    <span className="shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-6 btn-premium rounded-[2.5rem] font-black text-xl flex items-center justify-center gap-4 transition-all ${
                    isProcessing ? 'opacity-50 cursor-not-allowed scale-95' : 'active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Restaurar Ahora</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-12">
              {imageState.enhanced ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                  <div className="p-3 glass rounded-[3.5rem] overflow-hidden">
                    <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                     <button 
                       onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                       className="w-full sm:w-auto px-12 py-5 bg-white/40 backdrop-blur-md hover:bg-white/60 text-orange-950 rounded-[2rem] font-black transition-all border border-white/50 active:scale-95 text-xs uppercase tracking-widest"
                     >
                       Re-Calibrar
                     </button>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_final_hd.png"
                      className="w-full sm:w-auto px-16 py-5 btn-premium rounded-[2rem] font-black flex items-center justify-center gap-4 active:scale-95 text-xs uppercase tracking-widest"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Descargar HD</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video rounded-[4rem] overflow-hidden glass border-8 border-white/60 bg-white/20 group">
                  <img src={imageState.original} alt="Analizando" className="w-full h-full object-contain opacity-40 blur-2xl transition-all duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8">
                    <div className="w-24 h-24 bg-orange-600/20 rounded-full flex items-center justify-center border-4 border-orange-600/40 animate-pulse">
                      <svg className="w-12 h-12 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-orange-950 tracking-tighter uppercase leading-tight">Sistema Tisera listo</h3>
                      <p className="text-orange-900/60 max-w-sm font-bold text-lg leading-relaxed mx-auto">
                        Imagen cargada correctamente. Elige el motor y pulsa el botón para iniciar la restauración.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-6 pt-10">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-grow bg-white/30"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">Historial de Sesión</h3>
                    <div className="h-[1px] flex-grow bg-white/30"></div>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-36 h-36 rounded-[2.5rem] overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 shadow-lg ${
                          imageState.enhanced === item.enhanced ? 'border-white ring-4 ring-orange-950/20' : 'border-white/40'
                        }`}
                      >
                        <img src={item.enhanced} className="w-full h-full object-cover" alt="Histórico" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-16 w-full max-w-6xl border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex flex-col items-center md:items-start space-y-4">
          <p className="text-[10px] uppercase tracking-[0.6em] text-white/50 font-black">Contacto Lab</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-3xl font-black text-white hover:text-orange-950 transition-all tracking-tighter decoration-orange-950/20 decoration-4 underline underline-offset-8">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right space-y-2">
          <p className="text-white font-black text-sm uppercase tracking-widest">TIsera Lab • Platinum v8.0</p>
          <p className="text-white/60 text-[10px] font-bold">Impulsado por Gemini 2.5 Vision AI</p>
          <p className="text-white/30 text-[9px] font-bold">© {new Date().getFullYear()} Especialistas en Restauración</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
