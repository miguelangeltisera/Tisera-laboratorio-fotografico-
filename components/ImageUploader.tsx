
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
      <label className="flex flex-col items-center justify-center w-full h-96 border-4 border-dashed border-orange-200 rounded-[3.5rem] cursor-pointer bg-orange-50/20 hover:bg-orange-100/30 transition-all group overflow-hidden">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
            <svg className="w-12 h-12 text-orange-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
          </div>
          <p className="mb-3 text-2xl text-orange-950 font-black tracking-tighter uppercase">Importar Scan</p>
          <p className="text-xs text-orange-600/60 font-black uppercase tracking-widest">JPG • PNG • WebP (Máx 5MB)</p>
        </div>
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default ImageUploader;
