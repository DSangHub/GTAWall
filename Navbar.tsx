import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface NavbarProps {
  onOpenModal: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

export default function Navbar({ onOpenModal, isAuthenticated, userName }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl py-3"
          : "bg-gradient-to-b from-black/60 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Brand mark */}
        <a href="#" className="flex items-center gap-3 group">
          <img
            src="/manus-storage/logo_3c487b38.png"
            alt="GTA WALL — Going To Auction"
            className={`w-auto transition-all duration-300 ${
              scrolled ? "h-9" : "h-12"
            }`}
          />
        </a>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <a
            href="#wall"
            className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors relative group"
          >
            Live Wall
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all group-hover:w-full" />
          </a>
          <a
            href="#dealers"
            className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors relative group"
          >
            For Dealers
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all group-hover:w-full" />
          </a>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <a
                href="/dashboard"
                className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                My Listings
              </a>
              <span className="text-xs text-zinc-500 hidden md:block">
                {userName}
              </span>
              <Button
                onClick={onOpenModal}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-red-600/25"
              >
                Post Vehicle
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href={getLoginUrl()}
                className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </a>
              <Button
                onClick={onOpenModal}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-150 active:scale-[0.97] shadow-lg shadow-red-600/25"
              >
                Post Vehicle Free
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
