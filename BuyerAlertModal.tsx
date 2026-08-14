import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BuyerAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BuyerAlertModal({ isOpen, onClose }: BuyerAlertModalProps) {
  const [email, setEmail] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");

  const subscribeMutation = trpc.alerts.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Alert created!", {
        description: "You'll be notified when matching vehicles are posted.",
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create alert");
    },
  });

  const resetForm = () => {
    setEmail("");
    setMake("");
    setModel("");
    setMaxPrice("");
    setMinYear("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    subscribeMutation.mutate({
      email: email.trim(),
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      minYear: minYear ? parseInt(minYear) : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Get Vehicle Alerts</h2>
          <p className="text-zinc-400 text-sm mt-1">
            We'll notify you when vehicles matching your criteria hit the wall.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="alert-email" className="text-zinc-300 text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="alert-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="alert-make" className="text-zinc-300 text-sm font-medium">
                Make
              </Label>
              <Input
                id="alert-make"
                placeholder="e.g. Ford"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 h-11"
              />
            </div>
            <div>
              <Label htmlFor="alert-model" className="text-zinc-300 text-sm font-medium">
                Model
              </Label>
              <Input
                id="alert-model"
                placeholder="e.g. F-150"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="alert-price" className="text-zinc-300 text-sm font-medium">
                Max Price
              </Label>
              <Input
                id="alert-price"
                type="number"
                placeholder="e.g. 30000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 h-11"
              />
            </div>
            <div>
              <Label htmlFor="alert-year" className="text-zinc-300 text-sm font-medium">
                Min Year
              </Label>
              <Input
                id="alert-year"
                type="number"
                placeholder="e.g. 2020"
                value={minYear}
                onChange={(e) => setMinYear(e.target.value)}
                className="mt-1.5 bg-[#1a1a1a] border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500/20 h-11"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Leave filters empty to get notified about all new vehicles.
          </p>

          <Button
            type="submit"
            disabled={subscribeMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-150 active:scale-[0.97] h-auto disabled:opacity-50"
          >
            {subscribeMutation.isPending ? "Setting up..." : "Create Alert"}
          </Button>
        </form>
      </div>
    </div>
  );
}
