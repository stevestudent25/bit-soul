import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "⚔️ Game", href: "#game-sim" },
  { label: "World Gen", href: "#world-gen" },
  { label: "Soul System", href: "#soul-system" },
  { label: "CTF Loop", href: "#ctf-loop" },
  { label: "AI Brain", href: "#ai-brain" },
  { label: "Lore", href: "#lore" },
  { label: "Systems", href: "#all-systems" },
  { label: "Matrix", href: "#matrix" },
];

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#08081299] backdrop-blur-xl border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">
            O
          </div>
          <span className="font-black text-white tracking-tight">BIT-SOUL</span>
          <span className="text-xs text-violet-400/70 hidden sm:block">Living World CTF</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="px-3 py-1.5 text-xs font-bold text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-white/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            20 Systems
          </div>
          <button
            className="md:hidden p-2 text-white/50 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0a0a18] border-t border-white/10 px-6 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block px-3 py-2 text-sm font-bold text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

export default NavBar;
