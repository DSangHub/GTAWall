import { useState, useMemo, useCallback } from "react";
import VehicleCard from "@/components/VehicleCard";
import type { Vehicle } from "@/lib/vehicles";
import { getInitialVehicles } from "@/lib/vehicles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RadiusFilter = "any" | "25" | "50";

/** Haversine distance in miles between two lat/lng points */
function getDistanceMiles(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface VehicleWallProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
  onOpenAlertModal?: () => void;
}

type SortOption = "ending_soonest" | "newest" | "price_low" | "price_high";
type ConditionFilter = "all" | "Excellent" | "Like New" | "Very Good" | "Good" | "Fair";

export default function VehicleWall({ vehicles, isLoading, onOpenAlertModal }: VehicleWallProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("ending_soonest");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [showFilters, setShowFilters] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<RadiusFilter>("any");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (userLocation) return; // Already have it
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        toast.error("Unable to get your location. Please allow location access.");
        setLocationLoading(false);
        setRadiusFilter("any");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [userLocation]);

  const handleRadiusChange = (value: RadiusFilter) => {
    setRadiusFilter(value);
    if (value !== "any" && !userLocation) {
      requestLocation();
    }
  };

  // Show sample vehicles while loading or if no DB vehicles yet
  const rawVehicles = vehicles.length > 0 ? vehicles : (isLoading ? [] : getInitialVehicles());

  // Apply search, filter, and sort
  const displayVehicles = useMemo(() => {
    let filtered = rawVehicles;

    // Search by keyword (title, make, model)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.make && v.make.toLowerCase().includes(q)) ||
          (v.model && v.model.toLowerCase().includes(q))
      );
    }

    // Filter by condition
    if (conditionFilter !== "all") {
      filtered = filtered.filter((v) => v.condition === conditionFilter);
    }

    // Filter by price range
    filtered = filtered.filter(
      (v) => v.price >= priceRange[0] && v.price <= priceRange[1]
    );

    // Filter by geo radius
    if (radiusFilter !== "any" && userLocation) {
      const maxMiles = parseInt(radiusFilter);
      filtered = filtered.filter((v) => {
        if (!v.dealerLatitude || !v.dealerLongitude) return false; // Exclude if no location set
        const dist = getDistanceMiles(
          userLocation.lat, userLocation.lng,
          v.dealerLatitude, v.dealerLongitude
        );
        return dist <= maxMiles;
      });
    }

    // Sort
    switch (sortBy) {
      case "ending_soonest":
        filtered = [...filtered].sort((a, b) => a.auctionDeadline - b.auctionDeadline);
        break;
      case "newest":
        filtered = [...filtered].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "price_low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
    }

    return filtered;
  }, [rawVehicles, searchQuery, sortBy, conditionFilter, priceRange, radiusFilter, userLocation]);

  return (
    <section id="wall" className="py-16 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header — auction terminal style */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
              <span className="text-red-400 text-xs font-bold uppercase tracking-[0.2em]">
                Live
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              GTA Wall
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-xs font-semibold bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
              ★ Premium Boosted
            </span>
            <span className="text-zinc-500 text-xs font-mono">
              {displayVehicles.length} active
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#111] border-white/10 text-white placeholder:text-zinc-600 h-11 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-11 px-4 bg-[#111] border border-white/10 rounded-md text-white text-sm focus:border-red-500 focus:ring-red-500/20 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="ending_soonest">Ending Soonest</option>
              <option value="newest">Newest Listed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* Distance radius - always visible */}
            <div className="relative flex items-center gap-1.5">
              <svg className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <select
                value={radiusFilter}
                onChange={(e) => handleRadiusChange(e.target.value as RadiusFilter)}
                className="h-11 pl-9 pr-4 bg-[#111] border border-white/10 rounded-md text-white text-sm focus:border-red-500 focus:ring-red-500/20 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="any">Any Distance</option>
                <option value="25">25 Miles</option>
                <option value="50">50 Miles</option>
              </select>
              {locationLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-red-400 rounded-full animate-spin flex-shrink-0" />
              )}
              {radiusFilter !== "any" && userLocation && (
                <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
              )}
              {radiusFilter !== "any" && !userLocation && !locationLoading && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" title="Allow location access" />
              )}
            </div>

            {/* Filter toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 border-white/10 text-white hover:bg-white/5 ${showFilters ? "bg-white/5 border-red-500/50" : ""}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </Button>

            {/* Alert subscription button */}
            {onOpenAlertModal && (
              <Button
                variant="outline"
                onClick={onOpenAlertModal}
                className="h-11 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Get Alerts
              </Button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-wrap gap-4 items-end">
              {/* Condition filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Condition
                </label>
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value as ConditionFilter)}
                  className="w-full h-9 px-3 bg-[#0a0a0a] border border-white/10 rounded-md text-white text-sm focus:border-red-500 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Conditions</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Like New">Like New</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* Price range */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Min Price
                </label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={priceRange[0] || ""}
                  onChange={(e) =>
                    setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
                  }
                  className="h-9 bg-[#0a0a0a] border-white/10 text-white placeholder:text-zinc-600 text-sm"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-1.5">
                  Max Price
                </label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={priceRange[1] === 999999 ? "" : priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value) || 999999])
                  }
                  className="h-9 bg-[#0a0a0a] border-white/10 text-white placeholder:text-zinc-600 text-sm"
                />
              </div>



              {/* Reset button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConditionFilter("all");
                  setPriceRange([0, 999999]);
                  setSearchQuery("");
                  setRadiusFilter("any");
                }}
                className="h-9 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Reset All
              </Button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-[#111111] ring-1 ring-white/8 overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-zinc-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-8 bg-zinc-800 rounded" />
                  <div className="h-10 bg-zinc-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vehicle grid — tighter gaps for density */}
        {!isLoading && displayVehicles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayVehicles.map((vehicle, index) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayVehicles.length === 0 && rawVehicles.length > 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg mb-2">
              No vehicles match your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setConditionFilter("all");
                setPriceRange([0, 999999]);
              }}
              className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Empty state — no vehicles at all */}
        {!isLoading && displayVehicles.length === 0 && rawVehicles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg">
              No vehicles on the wall yet. Be the first dealer to post!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
