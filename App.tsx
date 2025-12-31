
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
    mode: 'restore'
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EnhancementHistory[]>([]);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else if (!process.env.API_KEY) {
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
      alert("Error: Configura la API_KEY en Netlify o selecciona una clave en AI Studio.");
    }
  };

  const handleImageSelected = useCallback((base64: string, mimeType: string) => {
    setImageState({
      original: base64,
      enhanced: null,
      mimeType: mimeType
    });
    setError(null);
  }, []);

  const getEffectivePrompt = () => {
    let base = "";
    switch (config.mode) {
      case 'reconstruct':
        base = "RECONSTRUCCIÓN ESTRUCTURAL AVANZADA: Utiliza IA generativa para rellenar huecos, áreas faltantes o bordes incompletos. Crea contenido nuevo que sea 100% coherente con la iluminación, textura y perspectiva original. Reconstruye rostros, paisajes o estructuras con precisión forense.";
        break;
      case 'restore':
        base = "RESTAURACIÓN PROFESIONAL: Elimina rasguños, grietas, manchas y daños físicos. Recupera el detalle de rostros y la nitidez de la textura original.";
        break;
      case 'resize':
        base = `ESCALADO INTELIGENTE: Expande la imagen a ${config.aspectRatio} generando nuevo fondo coherente y aumentando la resolución a 4K sin pérdida de calidad.`;
        break;
      case 'artistic':
        base = "MEJORA ARTÍSTICA: Aplica gradación de color profesional, iluminación de estudio y un acabado estético de alta definición.";
        break;
      default:
        base = "MEJORA ESTÁNDAR: Optimiza contraste, brillo y nitidez general.";
    }
    return customPrompt ? `${base} Instrucciones adicionales: ${customPrompt}` : base;
  };

  const handleEnhance = async () => {
    if (!imageState.original || !imageState.mimeType) return;
    setIsProcessing(true);
    setError(null);

    try {
      const finalPrompt = getEffectivePrompt();
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
      setHistory(prev => [newEntry, ...prev].slice(0, 10));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("API Key")) setHasKey(false);
      setError(err.message || "Error al procesar la imagen.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageState({ original: null, enhanced: null, mimeType: null });
    setError(null);
    setCustomPrompt('');
  };

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#ecfdf5] text-emerald-900 font-sans">
        <div className="glass p-10 rounded-3xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-bold">Laboratorio Bloqueado</h2>
          <p className="text-emerald-700/70 text-sm">Configura tu API_KEY en Netlify o selecciona una clave válida para iniciar la restauración.</p>
          <button onClick={handleOpenKeySelector} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg">Activar IA</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-emerald-950">TIsera Photo Lab</h1>
            <p className="text-emerald-700/60 text-xs font-bold uppercase tracking-widest">IA de Reconstrucción & Restauración</p>
          </div>
        </div>
        
        {imageState.original && (
          <button onClick={reset} className="px-6 py-3 rounded-2xl text-sm font-bold border-2 border-emerald-100 bg-white hover:bg-emerald-50 text-emerald-800 transition-all shadow-sm">Nuevo Proyecto</button>
        )}
      </header>

      <main className="w-full max-w-6xl flex-grow">
        {!imageState.original ? (
          <div className="max-w-4xl mx-auto space-y-12 py-10">
            <div className="text-center space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-emerald-950 leading-tight">Restaura y Escala<br/><span className="text-emerald-600">tus recuerdos</span></h2>
              <p className="text-emerald-800/60 text-lg max-w-2xl mx-auto">Especialistas en eliminación de daños físicos y reconstrucción de partes faltantes con IA de grado profesional.</p>
            </div>

            <ImageUploader onImageSelected={handleImageSelected} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="glass p-8 rounded-3xl space-y-4 border-b-4 border-emerald-500">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                 </div>
                 <h3 className="font-black text-emerald-950">Reconstrucción</h3>
                 <p className="text-sm text-emerald-800/70">Rellena huecos o partes perdidas de la imagen con coherencia absoluta.</p>
               </div>
               <div className="glass p-8 rounded-3xl space-y-4 border-b-4 border-teal-500">
                 <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <h3 className="font-black text-emerald-950">Sana Rayones</h3>
                 <p className="text-sm text-emerald-800/70">Elimina pliegues, grietas y suciedad física sin alterar la textura original.</p>
               </div>
               <div className="glass p-8 rounded-3xl space-y-4 border-b-4 border-green-500">
                 <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <h3 className="font-black text-emerald-950">Definición HD</h3>
                 <p className="text-sm text-emerald-800/70">Aumenta el detalle y restaura los colores naturales de forma inteligente.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-4 space-y-8">
              <div className="glass p-8 rounded-3xl space-y-8 shadow-sm">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/40">Laboratorio de Control</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'reconstruct', label: 'Reconstruir', icon: '🧩' },
                      { id: 'restore', label: 'Restaurar', icon: '🩹' },
                      { id: 'resize', label: 'Escalar', icon: '📐' },
                      { id: 'artistic', label: 'Cinemático', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          config.mode === mode.id 
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' 
                          : 'bg-white border-emerald-100 text-emerald-800 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-xl">{mode.icon}</span>
                        <span className="font-bold text-sm">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/40">Relación de Aspecto</label>
                  <div className="flex flex-wrap gap-2">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-teal-600 border-teal-400 text-white' 
                          : 'bg-white border-emerald-100 text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-emerald-900/40">Notas de Restauración</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-28 px-4 py-3 bg-white border-2 border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none text-sm placeholder:text-emerald-200 text-emerald-900 shadow-inner"
                    placeholder="ej: 'Reconstruir la esquina inferior derecha', 'Mejorar nitidez de los ojos'..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-pulse flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-4 transition-all ${
                    isProcessing 
                    ? 'bg-emerald-300 cursor-not-allowed text-white scale-95' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {isProcessing ? (
                    <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Procesar en Laboratorio</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              {imageState.enhanced ? (
                <div className="space-y-6">
                  <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <button 
                       onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                       className="px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl font-black transition-all border-2 border-emerald-100"
                     >
                       Ajustar Parámetros
                     </button>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_laboratorio_hd.png"
                      className="w-full sm:w-auto px-10 py-4 bg-emerald-950 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all hover:bg-black shadow-2xl"
                    >
                      Exportar Resultado
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden glass border-4 border-emerald-100 bg-white/40 group">
                  <img src={imageState.original} alt="Cargada" className="w-full h-full object-contain opacity-40 blur-md transition-all duration-1000 group-hover:blur-none group-hover:opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-emerald-900 mb-2">Unidad de Preservación Lista</h3>
                    <p className="text-emerald-800/60 max-w-sm">Los algoritmos han sido calibrados. Pulsa el botón para iniciar la reconstrucción sintética.</p>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-900/20 ml-2">Historial de Procesos</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`flex-shrink-0 w-28 h-28 rounded-3xl overflow-hidden border-4 transition-all ${
                          imageState.enhanced === item.enhanced ? 'border-emerald-500 scale-105' : 'border-white hover:border-emerald-200 shadow-sm'
                        }`}
                      >
                        <img src={item.enhanced} className="w-full h-full object-cover" alt="Historial" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-24 py-12 w-full max-w-6xl border-t-2 border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-8 text-emerald-900 font-bold">
        <div className="flex flex-col items-center md:items-start">
          <p className="text-xs uppercase tracking-[0.4em] opacity-30 mb-2">Contacto Soporte</p>
          <a href="mailto:miguelangeltisera@gmail.com" className="text-lg hover:text-emerald-600 transition-colors">miguelangeltisera@gmail.com</a>
        </div>
        <div className="text-center md:text-right">
          <p className="opacity-40 text-[10px] uppercase tracking-[0.2em]">TIsera Photo Lab © {new Date().getFullYear()}</p>
          <p className="text-emerald-600 text-xs">Desarrollado con Tecnología Gemini Flash Image 2.5</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
