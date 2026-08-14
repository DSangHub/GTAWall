import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/vehicles";
import { PLACEHOLDER_IMAGE } from "@/lib/vehicles";
import { useLocation } from "wouter";

interface VehicleCardProps {
  vehicle: Vehicle;
  index: number;
}

function useCountdown(auctionDeadline: number) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const remaining = Math.max(0, auctionDeadline - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, auctionDeadline - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      setTimeLeft({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [auctionDeadline]);

  return timeLeft;
}

export default function VehicleCard({ vehicle, index }: VehicleCardProps) {
  const countdown = useCountdown(vehicle.auctionDeadline);
  const [isHovered, setIsHovered] = useState(false);
  const [, setLocation] = useLocation();

  const hasCreditApp = !!vehicle.dealerWebsiteUrl;

  const handleMakeOffer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCreditApp) {
      window.open(vehicle.dealerWebsiteUrl!, "_blank");
    }
  };

  const handleCardClick = () => {
    // Only navigate to detail page for real DB vehicles (positive IDs)
    if (vehicle.id > 0) {
      setLocation(`/vehicle/${vehicle.id}`);
    } else {
      toast.info("Sign up as a dealer to post vehicles like this!");
    }
  };

  const daysLeft = countdown.days;
  const isUrgent = daysLeft <= 2;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
        vehicle.isPremium
          ? "ring-2 ring-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.12)]"
          : "ring-1 ring-white/8"
      } bg-[#111111] hover:ring-white/20 hover:shadow-2xl hover:-translate-y-0.5`}
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "both",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium badge */}
      {vehicle.isPremium && (
        <div className="absolute top-3 right-3 z-10 bg-yellow-500 text-black text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-widest shadow-lg">
          Featured
        </div>
      )}

      {/* Urgency badge */}
      {isUrgent && !vehicle.isPremium && (
        <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
          Ending Soon
        </div>
      )}

      {/* Image with dark overlay */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={vehicle.imageUrl || PLACEHOLDER_IMAGE}
          alt={vehicle.title}
          className={`w-full h-full object-cover transition-transform duration-500 brightness-90 ${
            isHovered ? "scale-105" : "scale-100"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />

        {/* Mileage/condition overlay */}
        {vehicle.mileage && (
          <div className="absolute bottom-2 left-2 flex gap-2">
            <span className="bg-black/80 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-0.5 rounded font-medium">
              {vehicle.mileage}
            </span>
            {vehicle.condition && (
              <span className="bg-black/80 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-0.5 rounded font-medium">
                {vehicle.condition}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content — auction terminal style */}
      <div className="p-4">
        {/* Dealer badge */}
        {vehicle.dealerName && (
          <div className="flex items-center gap-2 mb-2">
            {vehicle.dealerLogoUrl ? (
              <img
                src={vehicle.dealerLogoUrl}
                alt={vehicle.dealerName}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-[9px] font-bold text-zinc-300">
                  {vehicle.dealerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[11px] text-zinc-400 font-medium truncate">
              {vehicle.dealerName}
            </span>
          </div>
        )}

        {/* Title + Price row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-sm text-white leading-tight truncate flex-1">
            {vehicle.title}
          </h3>
          <p className="text-lg font-bold text-emerald-400 font-mono whitespace-nowrap">
            ${vehicle.price.toLocaleString()}
          </p>
        </div>

        {/* COUNTDOWN — dominant element */}
        <div
          className={`rounded-lg p-3 mb-3 ${
            isUrgent
              ? "bg-red-950/50 border border-red-500/30"
              : "bg-zinc-900/80 border border-white/5"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Auction In
            </span>
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-0.5">
            <CountdownDigit value={countdown.days} label="Days" />
            <Separator />
            <CountdownDigit value={countdown.hours} label="Hrs" />
            <Separator />
            <CountdownDigit value={countdown.minutes} label="Min" />
            <Separator />
            <CountdownDigit value={countdown.seconds} label="Sec" pulse />
          </div>
        </div>

        {/* CTA — Make Offer only enabled if dealer has credit application page */}
        {hasCreditApp ? (
          <Button
            onClick={handleMakeOffer}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-red-600/20"
          >
            APPLY FOR CREDIT →
          </Button>
        ) : (
          <Button
            disabled
            className="w-full bg-zinc-800 text-zinc-500 font-bold text-sm py-2.5 rounded-lg cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            NO CREDIT APP AVAILABLE
          </Button>
        )}
      </div>
    </div>
  );
}

function CountdownDigit({
  value,
  label,
  pulse,
}: {
  value: number;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span
        className={`font-mono text-xl font-bold text-red-400 tabular-nums leading-none ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] text-zinc-500 uppercase mt-0.5 font-medium">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span className="text-red-500/60 font-mono text-lg font-bold self-start mt-0.5">
      :
    </span>
  );
}
