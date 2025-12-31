
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
    mode: 'standard'
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EnhancementHistory[]>([]);

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
      case 'restore':
        base = "Restauración profunda: Elimina todos los rayones, polvo y daños físicos. Reconstruye partes faltantes y enfoca los rasgos faciales.";
        break;
      case 'resize':
        base = `Redimensión inteligente: Adapta la composición a una relación de aspecto de ${config.aspectRatio} mientras mejoras la definición y los tonos.`;
        break;
      case 'artistic':
        base = "Mejora artística: Aplica gradación de color cinematográfica, mejora el drama de la iluminación y dale un aspecto de fotografía profesional.";
        break;
      default:
        base = "Mejora estándar: Enfoca detalles, normaliza colores y mejora la claridad general.";
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
      
      setImageState(prev => ({
        ...prev,
        enhanced: enhancedBase64
      }));

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
      setError(err.message || "Ocurrió un error durante la mejora.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageState({ original: null, enhanced: null, mimeType: null });
    setError(null);
    setCustomPrompt('');
    setConfig({ aspectRatio: "1:1", mode: 'standard' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-emerald-600">TIsera Photo Lab</h1>
            <p className="text-emerald-700/80 text-sm font-medium">Restauración • Redimensión • Mejora</p>
          </div>
        </div>
        
        {imageState.original && (
          <button 
            onClick={reset}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 transition-all active:scale-95 shadow-sm"
          >
            Nuevo Proyecto
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl">
        {!imageState.original ? (
          <div className="max-w-3xl mx-auto space-y-10 py-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-emerald-950">Restaura y Escala tus fotos</h2>
              <p className="text-emerald-800/60 text-lg max-w-xl mx-auto">Sube cualquier imagen para eliminar daños, corregir la iluminación o expandir el lienzo con IA de vanguardia.</p>
            </div>
            <ImageUploader onImageSelected={handleImageSelected} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="glass p-6 rounded-2xl space-y-4 border-l-4 border-l-emerald-500">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 </div>
                 <h3 className="font-bold text-emerald-900">Reparación de Daños</h3>
                 <p className="text-sm text-emerald-800/70">Sana automáticamente rayones, pliegues y manchas de agua de fotos antiguas.</p>
               </div>
               <div className="glass p-6 rounded-2xl space-y-4 border-l-4 border-l-teal-500">
                 <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                 </div>
                 <h3 className="font-bold text-emerald-900">Redimensión Inteligente</h3>
                 <p className="text-sm text-emerald-800/70">Cambia las relaciones de aspecto sin perder el enfoque. La IA rellena el fondo perfectamente.</p>
               </div>
               <div className="glass p-6 rounded-2xl space-y-4 border-l-4 border-l-green-500">
                 <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
                 </div>
                 <h3 className="font-bold text-emerald-900">Acabado de Estudio</h3>
                 <p className="text-sm text-emerald-800/70">Retoque avanzado, gradación de color profesional y optimización dinámica.</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Tools */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-6 rounded-3xl space-y-8 shadow-sm">
                {/* Mode Selector */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-700">Modo de Acción</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'standard', label: 'Mejorar', icon: '✨' },
                      { id: 'restore', label: 'Restaurar', icon: '🩹' },
                      { id: 'resize', label: 'Redimensionar', icon: '📐' },
                      { id: 'artistic', label: 'Cinemático', icon: '🎞️' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setConfig(prev => ({ ...prev, mode: mode.id as any }))}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          config.mode === mode.id 
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                          : 'bg-white border-emerald-100 text-emerald-700 hover:border-emerald-300'
                        }`}
                      >
                        <span className="text-xl">{mode.icon}</span>
                        <span className="font-bold text-sm">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-700">Relación de Salida</label>
                  <div className="flex flex-wrap gap-2">
                    {(["1:1", "4:3", "3:4", "16:9", "9:16"] as AspectRatio[]).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                          config.aspectRatio === ratio 
                          ? 'bg-teal-600 border-teal-400 text-white' 
                          : 'bg-white border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-700">Ajuste Fino (Prompt)</label>
                  <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-24 px-4 py-3 bg-white border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none resize-none text-sm placeholder:text-emerald-300 text-emerald-900"
                    placeholder="ej: 'Piel más cálida', 'Restaurar esquina faltante'..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-sm flex gap-3 animate-pulse">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleEnhance}
                  className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                    isProcessing 
                    ? 'bg-emerald-400 cursor-not-allowed text-white' 
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-[0.98] text-white shadow-emerald-500/20'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analizando Píxeles...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      <span>Procesar y Restaurar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Comparison / Preview */}
            <div className="lg:col-span-8 space-y-8">
              {imageState.enhanced ? (
                <div className="space-y-6">
                  <ComparisonSlider before={imageState.original} after={imageState.enhanced} />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <div className="flex gap-4">
                        <button 
                          onClick={() => setImageState(prev => ({ ...prev, enhanced: null }))}
                          className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl font-bold transition-all border border-emerald-100 shadow-sm"
                        >
                          Modificar Ajustes
                        </button>
                     </div>
                     <a 
                      href={imageState.enhanced} 
                      download="tisera_lab_resultado.png"
                      className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Descargar Resultado HD
                    </a>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden glass flex flex-col items-center justify-center bg-white/40 border-2 border-emerald-100">
                  <img src={imageState.original} alt="Original" className="w-full h-full object-contain opacity-20 blur-md grayscale transition-all duration-1000" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-emerald-500/10 rounded-full">
                       <svg className="w-12 h-12 text-emerald-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-900 uppercase tracking-widest">Laboratorio Listo</p>
                      <p className="text-emerald-700/60 text-sm">Selecciona los parámetros para comenzar</p>
                    </div>
                  </div>
                </div>
              )}

              {/* History Bar */}
              {history.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800/40">Muestras Recientes</h3>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-emerald-200">
                    {history.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setImageState({ original: item.original, enhanced: item.enhanced, mimeType: 'image/png' })}
                        className={`group relative flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                          imageState.enhanced === item.enhanced ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/10' : 'border-emerald-100 hover:border-emerald-300'
                        }`}
                      >
                        <img src={item.enhanced} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Historial" />
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                           <span className="text-[10px] font-bold text-white truncate">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 w-full max-w-6xl border-t border-emerald-100 flex flex-col md:flex-row justify-between items-center gap-6 text-emerald-800/40 text-xs font-medium">
        <div className="flex items-center gap-6">
           <a href="#" className="hover:text-emerald-700 transition-colors">Documentación</a>
           <a href="#" className="hover:text-emerald-700 transition-colors">Privacidad</a>
           <a href="#" className="hover:text-emerald-700 transition-colors">Estado API</a>
        </div>
        <p>© {new Date().getFullYear()} TIsera Photo Lab • Unidad de Preservación Digital</p>
      </footer>
    </div>
  );
};

export default App;
