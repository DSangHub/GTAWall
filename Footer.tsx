export default function Footer() {
  return (
    <footer className="bg-[#030303] border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/manus-storage/logo_3c487b38.png"
              alt="GTA WALL"
              className="h-9 w-auto"
            />
            <span className="text-zinc-600 text-xs">|</span>
            <span className="text-zinc-500 text-xs font-medium">
              The Pre-Auction Marketplace
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#wall" className="hover:text-white transition-colors">
              Live Wall
            </a>
            <a href="#dealers" className="hover:text-white transition-colors">
              For Dealers
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="/disclaimer" className="hover:text-white transition-colors">
              Disclaimer
            </a>
            <a href="/contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-700 text-xs">
            © {new Date().getFullYear()} GTA Wall — Going To Auction. All rights
            reserved.
          </p>
          <p className="text-zinc-700 text-xs">
            Skip the auction. Buy direct.
          </p>
        </div>
      </div>
    </footer>
  );
}
