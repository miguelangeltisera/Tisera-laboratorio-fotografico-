
import React from 'react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageSelected(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-emerald-800/50 rounded-2xl cursor-pointer bg-emerald-950/30 hover:bg-emerald-900/40 transition-all group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-10 h-10 mb-4 text-emerald-500 group-hover:text-emerald-400 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-emerald-100"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
          <p className="text-xs text-emerald-500/70">PNG, JPG o WebP (Máx 5MB)</p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
