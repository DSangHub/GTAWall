import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onOpenModal: () => void;
}

export default function Hero({ onOpenModal }: HeroProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    let scale = 1;
    const interval = setInterval(() => {
      scale += 0.0002;
      if (scale > 1.08) scale = 1;
      img.style.transform = `scale(${scale})`;
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background image with Ken Burns */}
      <img
        ref={imgRef}
        src="/manus-storage/hero-banner_7a986706.jpg"
        alt="GTA Wall Hero"
        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-[50ms] ease-linear"
      />

      {/* Multi-layer gradient overlays for cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#09090b]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      {/* Red accent glow at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-red-600/5 blur-[100px] rounded-full" />

      {/* Content */}
      <div className="relative max-w-5xl mx-auto text-center px-6 z-10">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 bg-red-600/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-8">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 font-semibold text-xs tracking-[0.15em] uppercase">
            Live Now — Vehicles Expiring Daily
          </span>
        </div>

        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-4 leading-[0.9]">
          <span style={{ fontFamily: "'UnifrakturCook', cursive" }} className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl block mb-2">
            Going To Auction
          </span>
          <span className="text-gradient-red text-3xl sm:text-4xl md:text-5xl">5 Days. Then It's Gone.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl mx-auto">
          Dealers post vehicles Going to auction. You buy them first — at a
          discount. Clock's ticking.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#wall"
            className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all duration-150 active:scale-[0.97] shadow-xl shadow-red-600/30"
          >
            Browse the Wall
          </a>
          <Button
            onClick={onOpenModal}
            variant="outline"
            className="border-2 border-white/30 text-white hover:bg-white hover:text-black px-10 py-4 rounded-xl text-lg font-semibold transition-all duration-200 h-auto backdrop-blur-sm"
          >
            I'm a Dealer →
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-14 flex items-center justify-center gap-8 text-zinc-500 text-sm">
          <span className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">500+</span> vehicles listed
          </span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">120+</span> active dealers
          </span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full hidden sm:block" />
          <span className="hidden sm:flex items-center gap-2">
            <span className="text-emerald-400 font-bold">$2.4M</span> in offers
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white"
        >
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
}
