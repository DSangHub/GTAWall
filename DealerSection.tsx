import { Button } from "@/components/ui/button";

interface DealerSectionProps {
  onOpenModal: () => void;
}

export default function DealerSection({ onOpenModal }: DealerSectionProps) {
  return (
    <section id="dealers" className="relative py-24 overflow-hidden bg-[#050505]">
      {/* Subtle red/gold gradient accents */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 50%, rgba(220, 38, 38, 0.5) 0%, transparent 40%),
                             radial-gradient(circle at 70% 50%, rgba(234, 179, 8, 0.3) 0%, transparent 40%)`,
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        {/* Dealer badge */}
        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-yellow-400 font-semibold text-xs tracking-[0.15em] uppercase">
            For Dealers Only
          </span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-[0.95]">
          Stop Losing Money
          <br />
          <span className="text-gradient-red">At Auction</span>
        </h2>
        <p className="text-lg text-zinc-400 mb-10 max-w-lg mx-auto">
          Post your aged inventory here. Buyers make offers before the auction
          date. You keep more profit. Zero listing fees.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onOpenModal}
            className="bg-white text-black hover:bg-zinc-100 px-10 py-5 rounded-xl text-lg font-bold transition-all duration-150 active:scale-[0.97] h-auto shadow-xl"
          >
            Post Your First Vehicle — Free
          </Button>
        </div>

        {/* Value props */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <p className="font-display text-2xl font-bold text-red-400 mb-1">
              $0
            </p>
            <p className="text-zinc-500 text-sm">To list</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <p className="font-display text-2xl font-bold text-emerald-400 mb-1">
              48hrs
            </p>
            <p className="text-zinc-500 text-sm">Avg. time to offer</p>
          </div>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5">
            <p className="font-display text-2xl font-bold text-yellow-400 mb-1">
              +12%
            </p>
            <p className="text-zinc-500 text-sm">Over auction price</p>
          </div>
        </div>
      </div>
    </section>
  );
}
