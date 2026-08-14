import { trpc } from "@/lib/trpc";

interface ExpiredVehicle {
  id: number;
  title: string;
  price: number;
  auctionDeadline: number;
  imageUrl: string | null;
  mileage: string | null;
  condition: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  dealerName: string | null;
}

export default function GoneToAuction() {
  const { data: expiredVehicles = [], isLoading } = trpc.vehicles.expired.useQuery();

  if (isLoading || expiredVehicles.length === 0) return null;

  return (
    <section className="py-16 bg-[#050505] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
                Expired
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-zinc-400">
              Gone to Auction
            </h2>
          </div>
          <span className="text-zinc-600 text-xs font-mono">
            {expiredVehicles.length} sold at auction
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-zinc-500 text-sm mb-6 max-w-2xl">
          These vehicles have left the wall and gone to auction. You missed them — don't let it happen again.
        </p>

        {/* Expired vehicle grid — greyed out, no interaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {expiredVehicles.map((vehicle: ExpiredVehicle) => (
            <ExpiredCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExpiredCard({ vehicle }: { vehicle: ExpiredVehicle }) {
  const daysAgo = Math.floor((Date.now() - vehicle.auctionDeadline) / (1000 * 60 * 60 * 24));

  return (
    <div className="relative rounded-lg bg-[#0a0a0a] ring-1 ring-white/5 overflow-hidden opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%] transition-all duration-300">
      {/* GONE badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className="bg-red-900/80 text-red-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
          Gone
        </span>
      </div>

      {/* Image */}
      <div className="h-28 bg-zinc-900 overflow-hidden">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-xs font-semibold text-zinc-400 truncate">{vehicle.title}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-sm font-bold text-zinc-500 font-mono">
            ${vehicle.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-600">
            {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
          </span>
        </div>
        {vehicle.dealerName && (
          <p className="text-[10px] text-zinc-600 mt-1 truncate">
            Dealer: {vehicle.dealerName}
          </p>
        )}
      </div>

      {/* Strikethrough overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full h-[1px] bg-red-500/30 rotate-[-5deg]" />
      </div>
    </div>
  );
}
