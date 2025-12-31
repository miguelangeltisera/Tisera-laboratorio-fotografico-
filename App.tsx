
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
    const checkAuth = async () => {
      // Intentamos detectar la clave de Netlify (process.env.API_KEY)
      const envKey = process.env.API_KEY;
      if (envKey && envKey.length > 10) {
        setHasKey(true);
        return;
      }

      // Si no está en el env, revisamos si el usuario seleccionó una vía aistudio
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(false);
      }
    };
    checkAuth();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setError(null);
    } else {
      setError("Variable API_KEY no detectada. Por favor, añádela en el panel de Netlify.");
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
      if (err.message.includes("API_KEY")) {
        setHasKey(false);
        setError("Error de autenticación. Verifica que la API KEY en Netlify sea correcta.");
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-orange-50">
        <div className="glass p-12 rounded-[3.5rem] max-w-lg w-full text-center space-y-10 shadow-2xl border-orange-200">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 shadow-inner">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-orange-950 uppercase tracking-tighter">Acceso Requerido</h2>
            <p className="text-orange-800/70 text-sm font-medium leading-relaxed">
              El laboratorio de Miguel Ángel Tisera está listo, pero falta la llave de seguridad (API KEY). Por favor, actívala para comenzar.
            </p>
          </div>
          <button 
            onClick={handleOpenKeySelector} 
            className="w-full py-6 orange-gradient text-white rounded-[2rem] font-black text-xl hover:brightness-110 transition-all shadow-xl shadow-orange-500/30 active:scale-95"
          >
            Activar Laboratorio
          </button>
          <div className="pt-6 border-t border-orange-100 text-[10px] text-orange-900/40 uppercase tracking-[0.3em] font-black">
            Verifica tus variables de entorno en Netlify
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-orange-200">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
        <div className="flex items-center gap-6 group">
          <div className="w-20 h-20 orange-gradient rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 transform -rotate-3 group-hover:rotate-0 transition-all duration-500">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-orange-950 uppercase">TIsera Photo Lab</h1>
            <p className="text-orange-600 font-black text-[10px] uppercase tracking-[0.5em] opacity-80">Unidad Forense de Restauración HD</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-10 py-4 rounded-[1.5rem] text-xs font-black border-2 border-orange-200 bg-white hover:bg-orange-50 text-orange-950 transition-all active:scale-95 shadow-lg uppercase tracking-widest">Nuevo Proyecto</button>
        )}
      </header>

      <main className="w-full max-w-6xl flex-grow">
        {!imageState.original ? (
          <div className="max-w-4xl mx-auto space-y-24">
            <div className="text-center space-y-8">
              <h2 className="text-7xl md:text-9xl font-black text-orange-950 leading-[0.8] tracking-tighter">
                Más definición <br/><span className="text-orange-500">mejores tonos</span>
              </h2>
              <p className="text-orange-800/60 text-xl font-bold max-w-2xl mx-auto leading-relaxed">
                Nuestra IA regenera texturas y calibra los colores para devolverle la vida a tus memorias con calidad de exposición.
              </p>
            </div>

            <div className="relative group p-1 bg-white rounded-[4rem] shadow-2xl">
               <div className="absolute -inset-6 bg-gradient-to-r from-orange-400 to-amber-500 rounded-[5rem] blur-3xl opacity-10 group-hover:opacity-30 transition duration-1000"></div>
               <div className="relative">
                 <ImageUploader onImageSelected={handleImageSelected} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
               {[
                 { title: "Definición HD", desc: "Regenera pestañas, piel y detalles con nitidez microscópica.", icon: "💎" },
                 { title: "Tonos Pro", desc: "Elimina el desvanecimiento y recupera la viveza del color original.", icon: "🎨" },
                 { title: "Sana Daños", desc: "Borra quirúrgicamente grietas, rayones y motas de polvo.", icon: "🩹" }
               ].map((f, i) => (
                 <div key={i} className="glass p-12 rounded-[3.5rem] border-b-[16px] border-orange-600/5 hover:border-orange-500 transition-all hover:-translate-y-4 group">
                   <div className="text-6xl mb-8 transform group-hover:scale-125 transition-transform duration-500">{f.icon}</div>
                   <h3 className="font-black text-orange-950 text-2xl mb-4 uppercase tracking-tighter">{f.title}</h3>
                   <p className="text-orange-800/50 text-sm leading-relaxed font-bold">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start animate-in fade-in zoom-in-95 duration-700">
            <div className="lg:col-span-4 space-y-10">
              <div className="glass p-10 rounded-[3.5rem] space-y-10 shadow-2xl border-white">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Modo del Motor</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'reconstruct', label: 'Maestro', icon: '🧩' },
                      { id: 'restore', label: 'Sanar', icon: '🩹' },
                      { id: 'resize', label: 'Escalar', icon: '📐' },
                      { id: 'artistic', label: 'Tonal Pro', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all ${
                          config.mode === mode.id 
                          ? 'orange-gradient border-orange-400 text-white shadow-2xl scale-[1.08]' 
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
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Formato Final</label>
                  <div className="flex flex-wrap gap-3">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black border-2 transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-orange-950 border-orange-800 text-white shadow-lg' 
                          : 'bg-white border-orange-50 text-orange-950 hover:bg-orange-100'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-950/30 ml-2">Nota Técnica</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-32 px-7 py-6 bg-white border-2 border-orange-50 rounded-[2.5rem] focus:ring-8 focus:ring-orange-500/10 transition-all outline-none resize-none text-sm placeholder:text-orange-100 text-orange-950 font-bold shadow-inner"
                    placeholder="Ej: 'Aclarar zona de sombras', 'Más detalle en los ojos'..."
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
                    ? 'bg-orange-200 cursor-not-allowed text-white scale-95 opacity-50' 
                    : 'orange-gradient hover:brightness-110 text-white shadow-2xl shadow-orange-600/40 active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Restaurar Ahora</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-16">
              {imageState.enhanced ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                  <div className="p-3 bg-white rounded-[4.5rem] shadow-[0_60px_100px_-20px_rgba(234,88,12,0.15)] border border-orange-50 overflow-hidden">
                    <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-10">
                     <button 
                       onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                       className="w-full sm:w-auto px-16 py-7 bg-white hover:bg-orange-50 text-orange-950 rounded-[2.5rem] font-black transition-all border-2 border-orange-100 shadow-xl active:scale-95 uppercase tracking-widest text-xs"
                     >
                       Re-Ajustar IA
                     </button>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_final_hd.png"
                      className="w-full sm:w-auto px-20 py-7 bg-orange-950 text-white rounded-[2.5rem] font-black flex items-center justify-center gap-5 transition-all hover:bg-black shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 uppercase tracking-widest text-xs"
                    >
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span>Descargar HD</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[4/3] rounded-[5rem] overflow-hidden glass border-8 border-white shadow-[0_40px_80px_-15px_rgba(154,52,18,0.15)] bg-orange-50/30 group">
                  <img src={imageState.original} alt="Scan" className="w-full h-full object-contain opacity-20 blur-3xl transition-all duration-1000 group-hover:opacity-30 group-hover:blur-2xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center space-y-10">
                    <div className="w-32 h-32 bg-orange-600/10 rounded-full flex items-center justify-center border-4 border-orange-600/20 animate-pulse">
                      <svg className="w-16 h-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-5xl font-black text-orange-950 tracking-tighter uppercase leading-tight">Imagen Escaneada</h3>
                      <p className="text-orange-800/60 max-w-sm font-bold text-xl leading-relaxed">
                        Sistema Tisera Lab en espera. Elige el modo y pulsa 'Restaurar Ahora'.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-8 pt-8 px-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-grow bg-orange-200/30"></div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.8em] text-orange-900/20">Archivo del Lab</h3>
                    <div className="h-[2px] flex-grow bg-orange-200/30"></div>
                  </div>
                  <div className="flex gap-10 overflow-x-auto pb-10 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-48 h-48 rounded-[4rem] overflow-hidden border-4 transition-all shadow-xl hover:scale-110 active:scale-95 ${
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

      <footer className="mt-48 py-24 w-full max-w-6xl border-t-8 border-orange-100/30 flex flex-col md:flex-row justify-between items-center gap-16 text-orange-900">
        <div className="flex flex-col items-center md:items-start space-y-6">
          <p className="text-[12px] uppercase tracking-[0.8em] opacity-30 font-black">Línea Directa Tisera</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-4xl font-black hover:text-orange-600 transition-all active:scale-95 underline decoration-orange-300 decoration-8 underline-offset-[16px] tracking-tighter">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right space-y-3 bg-white/50 p-10 rounded-[3rem] border border-orange-100 shadow-sm">
          <p className="opacity-40 text-[12px] font-black uppercase tracking-[0.5em]">TIsera Photo Lab • Platinum v7.0</p>
          <p className="text-orange-600 text-lg font-black">Powered by Gemini 2.5 Vision AI</p>
          <p className="opacity-20 text-[11px] font-bold italic tracking-tighter">© {new Date().getFullYear()} Especialistas en Preservación de Memorias</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
