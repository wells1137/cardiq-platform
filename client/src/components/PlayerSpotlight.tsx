import { cn } from "@/lib/utils";

export function PlayerSpotlight({
  imageUrl,
  name,
  team,
  accent = "red",
  className = "",
  imageClassName = "",
}: {
  imageUrl?: string | null;
  name: string;
  team?: string | null;
  accent?: "red" | "amber";
  className?: string;
  imageClassName?: string;
}) {
  const image = imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=ffffff&size=400`;
  const palette = accent === "amber"
    ? {
        glow: "from-amber-400/40 via-orange-500/15 to-transparent",
        ring: "border-amber-300/25",
        shadow: "shadow-[0_25px_80px_rgba(245,158,11,0.18)]",
        text: "text-amber-200/80",
      }
    : {
        glow: "from-red-500/45 via-red-700/15 to-transparent",
        ring: "border-red-400/25",
        shadow: "shadow-[0_30px_90px_rgba(239,68,68,0.22)]",
        text: "text-red-200/80",
      };

  return (
    <div className={cn("relative isolate overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,10,14,0.96),rgba(20,6,10,0.92))]", palette.shadow, className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-95", palette.glow)} />
      <div className="absolute inset-y-0 right-0 w-[58%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_58%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.88))]" />
      <div className="absolute inset-y-0 left-6 w-px bg-white/10" />
      <div className="absolute left-10 top-8 text-[56px] font-black uppercase tracking-[0.18em] text-white/[0.06]">{(name || "PLAYER").split(" ")[0]}</div>
      <div className="absolute right-[-4%] top-[6%] h-[84%] w-[60%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_62%)] blur-2xl" />

      <div className="relative flex h-full min-h-[320px] items-end justify-between p-6">
        <div className="z-10 max-w-[46%] pb-3">
          <div className={cn("text-[10px] font-black uppercase tracking-[0.34em]", palette.text)}>{team || "Franchise Mode"}</div>
          <div className="mt-3 text-3xl font-black leading-none text-white sm:text-4xl">{name}</div>
          <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70">CardIQ Spotlight</div>
        </div>

        <div className="relative z-10 flex h-[280px] w-[54%] items-end justify-center">
          <div className={cn("absolute inset-x-[14%] bottom-1 h-[82%] rounded-full border bg-white/5 blur-[1px]", palette.ring)} />
          <div className="absolute inset-x-[18%] bottom-0 h-8 rounded-full bg-black/60 blur-xl" />
          <img
            src={image}
            alt={name}
            className={cn("relative z-10 max-h-full object-contain drop-shadow-[0_18px_60px_rgba(0,0,0,0.65)]", imageClassName)}
          />
          <div className="absolute inset-x-[10%] top-[12%] h-[48%] rounded-full bg-white/10 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
