
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
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-black/5 rounded-[2rem] cursor-pointer bg-white/40 hover:bg-white transition-all group overflow-hidden">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
            <svg className="w-6 h-6 text-black/30" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>
          <p className="mb-2 text-sm text-black font-light tracking-[0.2em] uppercase">Importar Scan</p>
          <p className="text-[9px] text-black/30 font-light uppercase tracking-widest">JPG • PNG • WebP</p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
