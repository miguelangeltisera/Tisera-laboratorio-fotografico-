
import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader.tsx';
import ComparisonSlider from './components/ComparisonSlider.tsx';
import { enhanceImage } from './services/geminiService.ts';
import { ImageState, EnhancementHistory, AspectRatio, EnhancementConfig } from './types.ts';

const App: React.FC = () => {
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
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [history, setHistory] = useState<EnhancementHistory[]>([]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setError(null);
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
        reconstruct: "MEJORA MAESTRA: Nitidez y calibración de color vibrante.",
        restore: "RESTAURACIÓN: Borrado de rayones y recuperación de contraste.",
        skin_restore: "PIEL: Recupera tonos naturales y textura realista.",
        detail_reconstruct: "DETALLES: Define micro-detalles en ojos y texturas.",
        resize: `ESCALADO: Ajuste a ${config.aspectRatio}.`,
        artistic: "CINE: Gradación de color profesional.",
        standard: "ESTÁNDAR: Brillo y enfoque básico."
      };

      const finalPrompt = customPrompt 
        ? `${modePrompts[config.mode]}. ${customPrompt}` 
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
      const isQuotaError = err.message.includes("429") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED");
      setError({
        message: isQuotaError 
          ? "Cuota agotada. Por favor vincula una clave personal." 
          : "Error en el sistema de procesado.",
        isQuota: isQuotaError
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageState({ original: null, enhanced: null, mimeType: null });
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-12 selection:bg-black/10">
      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-16 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-xl font-light tracking-widest text-black uppercase">Laboratorio Fotografico Tisera</h1>
            <p className="text-black/40 font-light text-[8px] uppercase tracking-[0.4em]">Restauración de Alta Fidelidad</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-6 py-2 rounded-full text-[9px] font-light bg-black text-white hover:bg-zinc-800 transition-all active:scale-95 uppercase tracking-widest">Nueva Tarea</button>
        )}
      </header>

      <main className="w-full max-w-5xl flex-grow pb-16">
        {!imageState.original ? (
          <div className="max-w-3xl mx-auto space-y-16 animate-in fade-in duration-1000">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-5xl font-light text-black tracking-tighter leading-tight lowercase">
                más definición <span className="italic opacity-40">mejores tonos</span>
              </h2>
              <p className="text-black/50 font-light text-sm max-w-xs mx-auto leading-relaxed uppercase tracking-[0.2em]">
                Protocolos avanzados de reconstrucción microscópica.
              </p>
            </div>

            <div className="glass p-2 rounded-[2rem] shadow-sm">
               <ImageUploader onImageSelected={handleImageSelected} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { title: "Detalle", icon: "💎" },
                 { title: "Piel", icon: "👤" },
                 { title: "Color", icon: "🎨" },
                 { title: "Sanar", icon: "🩹" }
               ].map((f, i) => (
                 <div key={i} className="bg-white/40 p-5 rounded-2xl text-center border border-black/5">
                   <div className="text-xl mb-2 opacity-40">{f.icon}</div>
                   <h3 className="font-light text-black/70 text-[9px] uppercase tracking-widest">{f.title}</h3>
                 </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-6 rounded-[1.5rem] space-y-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-light uppercase tracking-widest text-black/40">Protocolo Técnico</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'reconstruct', label: 'Maestro', icon: '🧩' },
                      { id: 'skin_restore', label: 'Piel', icon: '👤' },
                      { id: 'detail_reconstruct', label: 'Detalle', icon: '🔍' },
                      { id: 'restore', label: 'Sana', icon: '🩹' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${
                          config.mode === mode.id 
                          ? 'bg-black text-white border-black' 
                          : 'bg-white/40 text-black border-black/5 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs">{mode.icon}</span>
                        <span className="font-light text-[8px] uppercase tracking-wider">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-light uppercase tracking-widest text-black/40">Especificaciones</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-20 px-4 py-3 bg-white/40 border border-black/5 rounded-xl outline-none text-[10px] font-light text-black placeholder:text-black/20"
                    placeholder="Instrucciones adicionales..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-900 border border-red-100 rounded-xl text-[8px] font-light uppercase tracking-widest">
                    {error.message}
                    {error.isQuota && (
                      <button onClick={handleOpenKeySelector} className="block mt-2 underline text-black">Cambiar Clave</button>
                    )}
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-3 bg-black text-white rounded-full font-light text-[10px] uppercase tracking-[0.2em] transition-all ${
                    isProcessing ? 'opacity-20' : 'hover:bg-zinc-800'
                  }`}
                >
                  {isProcessing ? 'Procesando...' : 'Iniciar Motor'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-10">
              {imageState.enhanced ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="p-1 glass rounded-[2rem] overflow-hidden">
                    <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  </div>
                  <div className="flex justify-center gap-4">
                     <button onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))} className="px-6 py-2 bg-white/50 text-black rounded-full text-[8px] font-light uppercase tracking-widest border border-black/5">Re-Calibrar</button>
                     <a href={imageState.enhanced} download="tisera_final.png" className="px-6 py-2 bg-black text-white rounded-full text-[8px] font-light uppercase tracking-widest">Descargar</a>
                  </div>
                </div>
              ) : (
                <div className="aspect-video rounded-[2.5rem] overflow-hidden glass flex flex-col items-center justify-center p-8 text-center border-black/5">
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <svg className="w-6 h-6 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>
                  </div>
                  <h3 className="text-sm font-light text-black/30 uppercase tracking-[0.3em]">Módulo Preparado</h3>
                </div>
              )}

              {history.length > 0 && (
                <div className="pt-6">
                  <h3 className="text-[8px] font-light uppercase tracking-[0.4em] text-black/30 mb-4 text-center">Archivo Reciente</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border transition-all ${
                          imageState.enhanced === item.enhanced ? 'border-black scale-105' : 'border-black/5 grayscale'
                        }`}
                      >
                        <img src={item.enhanced} className="w-full h-full object-cover" alt="History" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 w-full max-w-5xl border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6 text-black/30">
        <div className="text-center md:text-left">
          <p className="text-[8px] uppercase tracking-[0.3em] font-light mb-1">Miguel Ángel Tisera</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-xs font-light hover:text-black transition-all">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right">
          <p className="font-light text-[9px] uppercase tracking-widest">Tisera Lab • v15.0 Precision</p>
          <p className="text-[7px] font-light mt-1">© {new Date().getFullYear()} Soluciones de Imagen</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
