import React from "react";

interface CardFrameProps {
  card: any;
  className?: string;
  imageClassName?: string;
}

export function CardFrame({ card, className = "", imageClassName = "" }: CardFrameProps) {
  let frameClass = "bg-muted/30";
  let decoClass = "";
  let brandName = card.brand || "";
  
  if (brandName.includes("Prizm")) {
    frameClass = "bg-gradient-to-tr from-slate-200 via-zinc-100 to-slate-300 border-[4px] sm:border-[6px] border-slate-300 shadow-[inset_0_0_20px_rgba(255,255,255,1)]";
    decoClass = "absolute bottom-2 left-2 text-[10px] font-black text-slate-400 uppercase tracking-widest italic drop-shadow-sm";
  } else if (brandName.includes("Select")) {
    frameClass = "bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 border-[3px] sm:border-[4px] border-black/80";
    decoClass = "absolute top-2 right-2 text-[8px] font-black text-white/90 bg-black/50 px-1.5 py-0.5 rounded tracking-wide";
  } else if (brandName.includes("National Treasures") || brandName.includes("NT")) {
    frameClass = "bg-[#faf9f6] border-[4px] sm:border-[8px] border-[#d4af37] shadow-inner";
    decoClass = "absolute bottom-3 right-3 text-[12px] font-serif font-bold text-[#d4af37]";
  } else {
    frameClass = "bg-gradient-to-b from-muted to-muted/50 border border-border/50";
    decoClass = "hidden";
  }
  
  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-end rounded-lg ${frameClass} ${className}`}>
      {/* Dynamic Background Patterns depending on set */}
      {brandName.includes("Prizm") && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.7)_50%,transparent_75%)] bg-[length:200%_200%] opacity-60"></div>
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
        </>
      )}
      {brandName.includes("Select") && (
         <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_10%,_transparent_50%)]"></div>
      )}
      {brandName.includes("National Treasures") && (
         <div className="absolute top-3 left-3 right-3 bottom-3 border border-[#d4af37]/30 pointer-events-none rounded-sm"></div>
      )}

      {/* 
        对于 Prizm/NT，使用含 Alpha 的实物贴图风格，人像稍微放大凸出 
      */}
      <img 
        src={card.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.playerName || 'Card')}&background=random&size=200`}
        alt={card.playerName}
        className={`object-contain drop-shadow-2xl z-10 w-[85%] h-[85%] mb-2 ${imageClassName}`}
      />
      
      {/* Decorative text badge based on series */}
      {brandName && (
         <div className={`${decoClass} z-20`}>
           {brandName.includes('Prizm') ? 'PRIZM' : (brandName.includes('Select') ? 'SELECT' : (brandName.includes('National Treasures') ? 'NT' : ''))}
         </div>
      )}
    </div>
  );
}
