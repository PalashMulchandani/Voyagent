import {
  useState, useEffect, useRef, useCallback, Suspense, lazy,
} from "react";

const GlobeGL = lazy(() => import("react-globe.gl"));

/* ═══════════════════════════════════════════════════════════════
   TYPES & GLOBE DATA
══════════════════════════════════════════════════════════════════ */
interface City {
  id: string; name: string; lat: number; lng: number;
  country: string; dotColor: string;
  trip: { days: number; price: string; hotel: string; activities: string };
}
interface Arc {
  startLat: number; startLng: number; endLat: number; endLng: number; color: string;
}

const CITIES: City[] = [
  { id:"tokyo",     name:"Tokyo",     lat:35.6762,  lng:139.6503, country:"Japan",        dotColor:"#06b6d4",
    trip:{ days:5, price:"$1,840", hotel:"Shibuya Sky Hotel · ★4.7", activities:"Tsukiji Market · TeamLab Planets · Asakusa" }},
  { id:"rome",      name:"Rome",      lat:41.9028,  lng:12.4964,  country:"Italy",        dotColor:"#F97316",
    trip:{ days:4, price:"$1,320", hotel:"Hotel Campo de' Fiori · ★4.5", activities:"Colosseum · Trastevere · Vatican Museums" }},
  { id:"bali",      name:"Bali",      lat:-8.4095,  lng:115.1889, country:"Indonesia",    dotColor:"#10b981",
    trip:{ days:7, price:"$1,100", hotel:"Alaya Resort Ubud · ★4.8", activities:"Tegallalang Rice Terraces · Seminyak · Uluwatu" }},
  { id:"reykjavik", name:"Reykjavik", lat:64.1466,  lng:-21.9426, country:"Iceland",      dotColor:"#a78bfa",
    trip:{ days:5, price:"$2,100", hotel:"Ion Adventure Hotel · ★4.9", activities:"Northern Lights · Blue Lagoon · Golden Circle" }},
  { id:"capetown",  name:"Cape Town", lat:-33.9249, lng:18.4241,  country:"South Africa", dotColor:"#f59e0b",
    trip:{ days:6, price:"$1,600", hotel:"The Silo Hotel · ★4.9", activities:"Table Mountain · Cape Point · V&A Waterfront" }},
  { id:"delhi",     name:"Delhi",     lat:28.6139,  lng:77.2090,  country:"India",        dotColor:"#ec4899",
    trip:{ days:4, price:"$680",   hotel:"The Leela Palace · ★5.0", activities:"Red Fort · Qutub Minar · Chandni Chowk" }},
  { id:"barcelona", name:"Barcelona", lat:41.3851,  lng:2.1734,   country:"Spain",        dotColor:"#F97316",
    trip:{ days:5, price:"$1,450", hotel:"Hotel Arts Barcelona · ★4.8", activities:"Sagrada Família · Park Güell · El Born" }},
  { id:"kyoto",     name:"Kyoto",     lat:35.0116,  lng:135.7681, country:"Japan",        dotColor:"#06b6d4",
    trip:{ days:4, price:"$1,280", hotel:"Gion Hatanaka Ryokan · ★4.9", activities:"Fushimi Inari · Arashiyama · Nishiki Market" }},
];

const ARCS: Arc[] = [
  { startLat:35.6762,  startLng:139.6503, endLat:41.9028,  endLng:12.4964,  color:"rgba(6,182,212,0.85)"   },
  { startLat:28.6139,  startLng:77.2090,  endLat:-8.4095,  endLng:115.1889, color:"rgba(249,115,22,0.85)"  },
  { startLat:41.3851,  startLng:2.1734,   endLat:64.1466,  endLng:-21.9426, color:"rgba(167,139,250,0.85)" },
  { startLat:-33.9249, startLng:18.4241,  endLat:28.6139,  endLng:77.2090,  color:"rgba(16,185,129,0.85)"  },
  { startLat:35.0116,  startLng:135.7681, endLat:41.3851,  endLng:2.1734,   color:"rgba(245,158,11,0.85)"  },
  { startLat:35.6762,  startLng:139.6503, endLat:-33.9249, endLng:18.4241,  color:"rgba(236,72,153,0.85)"  },
  { startLat:41.9028,  startLng:12.4964,  endLat:28.6139,  endLng:77.2090,  color:"rgba(249,115,22,0.85)"  },
];

/* ═══════════════════════════════════════════════════════════════
   IMAGE REGISTRY & HELPERS
══════════════════════════════════════════════════════════════════ */
const IMG = {
  alpineRoad:  "photo-1506905925346-21bda4d32df4",
  swissAlps:   "photo-1787941464455-07b5cf4aa060",
  santorini:   "photo-1533606688076-b6683a5f6f3d",
  baliBeach:   "photo-1573790387438-4da905039392",
  mumbai:      "photo-1595658658481-d53d3f999875",
  amalfi:      "photo-1533656338503-b22f63e96cd8",
  kyotoWomen:  "photo-1493976040374-85c8e12f0c0e",
  goa:         "photo-1512343879784-a960bf40e7f2",
  seoul:       "photo-1538485399081-7191377e8241",
  jaipur:      "photo-1603262110263-fb0112e7cc33",
  patagonia:   "photo-1494783329112-4a6795291178",
  tokyoNight:  "photo-1645343182679-bf59289a9c89",
  tokyoStreet: "photo-1548148870-adbf75452257",
  lisbon:      "photo-1505819244306-ef53954f9648",
  resort:      "photo-1549294413-26f195200c16",
  resort2:     "photo-1520250497591-112f2f40a3f4",
  sagradaFam:  "photo-1728249960363-13079cc2c6f6",
  casaBatllo:  "photo-1579282240050-352db0a14c21",
  avatar1:     "photo-1614436201459-156d322d38c6",
  avatar2:     "photo-1546961342-ea5f71b193f3",
  avatar3:     "photo-1623717217554-72ca676de535",
};
const u = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format`;

/* ═══════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════ */
const SUGGESTIONS = [
  "5 days Tokyo, mid-budget, street food & culture",
  "Week in Bali, luxury, beach & wellness retreat",
  "4 days Kyoto, budget, temples & traditional Japan",
  "Rome weekend, food & history, mid-range",
  "Iceland 5 days, northern lights & adventure",
  "Barcelona long weekend, art & tapas, budget",
  "Cape Town 6 days, safari & wine country",
];

const TICKER_ITEMS = [
  "✈️  Scout found 14 flights under $350 to Tokyo",
  "🏨  Ryokan in Kyoto locked · ¥12,400/night",
  "🗺️  Building itinerary for Reykjavik right now...",
  "✅  Itinerary ready: 7 days Barcelona · $1,450",
  "⚡  Curating Bali experiences to match your style",
  "🎯  9 activities matched for Rome food-lover profile",
  "✈️  Best fare: Delhi → Bali, ₹14,200 · IndiGo",
  "🏨  Overwater villa in Bali · $310/night · verified",
  "✅  Cape Town 6-day adventure ready to book",
  "⚡  Verifier confirmed all prices are live",
];

const DESTINATIONS = [
  { name:"Santorini",  country:"Greece",      tag:"Trending",          img:IMG.santorini,  tall:true  },
  { name:"Bali",       country:"Indonesia",   tag:"3-day guide ready", img:IMG.baliBeach,  tall:false },
  { name:"Mumbai",     country:"India",       tag:"New on Voyagent",   img:IMG.mumbai,     tall:true  },
  { name:"Amalfi",     country:"Italy",       tag:"Trending",          img:IMG.amalfi,     tall:false },
  { name:"Kyoto",      country:"Japan",       tag:"5-day guide ready", img:IMG.kyotoWomen, tall:true  },
  { name:"Goa",        country:"India",       tag:"Beach season",      img:IMG.goa,        tall:false },
  { name:"Seoul",      country:"South Korea", tag:"Staff pick",        img:IMG.seoul,      tall:false },
  { name:"Jaipur",     country:"India",       tag:"Heritage trail",    img:IMG.jaipur,     tall:true  },
  { name:"Patagonia",  country:"Argentina",   tag:"Adventure",         img:IMG.patagonia,  tall:false },
  { name:"Tokyo",      country:"Japan",       tag:"7-day guide ready", img:IMG.tokyoNight, tall:true  },
  { name:"Lisbon",     country:"Portugal",    tag:"Trending",          img:IMG.lisbon,     tall:false },
];

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
══════════════════════════════════════════════════════════════════ */
function useReveal(threshold = 0.14) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════ */
function Navbar({ scrollToHero }: { scrollToHero: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > window.innerHeight * 0.82);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "py-3 shadow-md"
        : "bg-transparent py-5"
    }`}
      style={scrolled ? { background:"rgba(253,246,236,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(30,58,138,0.1)" } : {}}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        <button onClick={scrollToHero} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span style={{ fontFamily:"'Fraunces', Georgia, serif" }}
            className={`text-xl font-semibold tracking-tight transition-colors ${scrolled ? "text-[#1E3A8A]" : "text-white"}`}>
            Voyagent
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {["Features","How it works","Agents","Destinations"].map(l => (
            <button key={l}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                scrolled
                  ? "text-slate-600 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/6"
                  : "text-white/65 hover:text-white hover:bg-white/8"
              }`}>
              {l}
            </button>
          ))}
        </nav>

        <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-500 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/50 transition-all">
          Plan a trip →
        </button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO — Swiss Alps cinematic photo, bright & vivid
══════════════════════════════════════════════════════════════════ */
function HeroSection({ onSubmit }: { onSubmit: (q: string) => void }) {
  const [query, setQuery]         = useState("");
  const [chipIdx, setChipIdx]     = useState(0);
  const [chipPhase, setChipPhase] = useState<"in"|"hold"|"out">("in");
  const [isPlaying, setIsPlaying] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let hold: ReturnType<typeof setTimeout>;
    let out:  ReturnType<typeof setTimeout>;
    let next: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setChipPhase("hold");
      hold = setTimeout(() => {
        setChipPhase("out");
        out = setTimeout(() => {
          setChipIdx(i => (i + 1) % SUGGESTIONS.length);
          setChipPhase("in");
          next = setTimeout(cycle, 4000);
        }, 380);
      }, 3200);
    };
    next = setTimeout(cycle, 4000);
    return () => { clearTimeout(hold); clearTimeout(out); clearTimeout(next); };
  }, []);

  const chipStyle: React.CSSProperties = {
    animation: chipPhase === "in"  ? "chipIn .38s ease-out both" :
               chipPhase === "out" ? "chipOut .38s ease-in both" : "none",
  };

  const submit = () => { if (query.trim()) onSubmit(query); };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Background: Swiss Alps mountain road ── */}
      <div className="absolute inset-0 bg-[#1a3050]">
        <img
          src={u(IMG.alpineRoad, 1920, 1080)}
          alt="Winding alpine road through the Swiss Alps"
          className={`w-full h-full object-cover ${isPlaying ? "animate-hero-pan" : ""}`}
          style={{ transformOrigin:"center center", opacity:0.92 }}
        />
        {/* Motion-blur cinematic streaks */}
        <div className="absolute inset-0 motion-streaks pointer-events-none" />
        {/* Side vignettes — let middle mountains breathe */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"linear-gradient(90deg, rgba(10,20,60,0.45) 0%, transparent 20%, transparent 80%, rgba(10,20,60,0.35) 100%)" }} />
        {/* Top: navbar readability only */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"linear-gradient(180deg, rgba(0,0,0,0.42) 0%, transparent 28%)" }} />
        {/* Bottom: text readability — gradient sweeps up from bottom */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.48) 22%, transparent 55%)" }} />
        {/* Subtle scan-line for cinematic video feel */}
        <div className="scan-line" />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl w-full pt-24">

        {/* live badge */}
        <div className="mb-7 flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold"
          style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(12px)", border:"1px solid rgba(255,255,255,0.28)", color:"white" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live flights & hotels · AI agents · No fake results
        </div>

        {/* headline */}
        <h1 style={{ fontFamily:"'Fraunces', Georgia, serif", fontWeight:600, lineHeight:1.05, textShadow:"0 2px 32px rgba(0,0,0,0.55)" }}
          className="text-5xl md:text-7xl text-white mb-5">
          Your next trip,<br />
          <em style={{
            fontStyle:"italic",
            background:"linear-gradient(90deg,#fbbf24 0%,#F97316 55%,#fb7185 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>planned for real.</em>
        </h1>

        <p className="text-white/80 text-lg mb-10 max-w-xl leading-relaxed"
          style={{ textShadow:"0 1px 16px rgba(0,0,0,0.5)" }}>
          Tell Voyagent where you want to go. It searches live data, builds a real day-by-day itinerary, and hands you bookable flights and hotels — in minutes.
        </p>

        {/* chat input */}
        <div className="w-full max-w-2xl mb-5">
          <div className="p-1 rounded-2xl shadow-2xl shadow-black/40"
            style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.25)" }}>
            <div className="flex items-center gap-3 rounded-xl px-4 py-4" style={{ background:"rgba(255,255,255,0.95)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1E3A8A]/10 border border-[#1E3A8A]/20">
                <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <input ref={inputRef} value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="e.g. 5 days Tokyo, mid-budget, love street food..."
                className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none" />
              <button onClick={submit} disabled={!query.trim()}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-500 disabled:opacity-30 transition-all shadow-lg shadow-orange-500/40">
                Plan trip →
              </button>
            </div>
          </div>

          {/* rotating chip */}
          <div className="mt-4 h-9 flex items-center justify-center overflow-hidden">
            <button key={chipIdx}
              style={{ ...chipStyle, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.3)", backdropFilter:"blur(8px)" }}
              onClick={() => { setQuery(SUGGESTIONS[chipIdx]); inputRef.current?.focus(); }}
              className="text-xs text-white/80 hover:text-white px-4 py-1.5 rounded-full hover:bg-white/18 transition-all cursor-pointer">
              ✦ {SUGGESTIONS[chipIdx]}
            </button>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {[1, 2].map(off => (
              <span key={off} className="text-[11px] text-white/50 px-3 py-1 rounded-full truncate max-w-[190px]"
                style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)" }}>
                {SUGGESTIONS[(chipIdx + off) % SUGGESTIONS.length]}
              </span>
            ))}
          </div>
        </div>

        {/* trust row */}
        <div className="flex items-center gap-8 mt-2">
          {[{ n:"200+", l:"destinations" }, { n:"Live", l:"flight pricing" }, { n:"10 min", l:"avg plan time" }].map(s => (
            <div key={s.l} className="text-center">
              <div style={{ fontFamily:"'Fraunces', Georgia, serif", textShadow:"0 1px 12px rgba(0,0,0,0.5)" }} className="text-white font-semibold text-sm">{s.n}</div>
              <div className="text-white/55 text-xs">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Play/pause toggle (bottom-right) ── */}
      <button
        onClick={() => setIsPlaying(p => !p)}
        className="absolute bottom-14 right-8 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-white/70 hover:text-white transition-all text-[11px] font-medium"
        style={{ background:"rgba(0,0,0,0.35)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.18)" }}>
        {isPlaying ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
        <span className="font-mono tracking-wider text-[10px]">HD</span>
      </button>

      {/* ── Bottom live ticker ── */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
        <div className="py-2.5 ticker-track flex whitespace-nowrap" style={{ width:"max-content" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="text-white/55 text-xs px-8 flex-shrink-0">
              {t}<span className="text-white/15 ml-8">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float-slow">
        <span className="text-white/35 text-[10px] uppercase tracking-widest">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOW IT WORKS — cream background, 4 steps
══════════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const { ref, visible } = useReveal();

  const steps = [
    {
      n:"01", icon:"💬", color:"#F97316",
      title:"Tell Voyagent",
      body:"Type where you want to go, your budget, travel style, and dates — in plain language. No forms, no dropdowns.",
    },
    {
      n:"02", icon:"🤖", color:"#1E3A8A",
      title:"Agents get to work",
      body:"Scout hunts live flights and hotels. Curator matches experiences to your style. Planner sequences everything optimally — all simultaneously.",
    },
    {
      n:"03", icon:"✅", color:"#10b981",
      title:"Real results only",
      body:"Every flight number exists. Every hotel has rooms. A Verifier agent confirms prices are live before they reach you.",
    },
    {
      n:"04", icon:"🎒", color:"#F97316",
      title:"Book & go",
      body:"Review your personalised day-by-day plan, lock prices for 15 minutes, and book directly. Start packing.",
    },
  ];

  return (
    <section ref={ref} style={{ background:"#FDF6EC" }} className="py-28 relative overflow-hidden">
      {/* subtle decorative arc */}
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-40"
        style={{ background:"radial-gradient(circle at 100% 0%, rgba(249,115,22,0.12) 0%, transparent 65%)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className={`reveal text-center mb-16 ${visible ? "visible" : ""}`}>
          <span className="inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-6 h-px bg-[#F97316]" /> How it works <span className="w-6 h-px bg-[#F97316]" />
          </span>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl md:text-5xl font-semibold text-[#1E3A8A] leading-tight">
            From idea to itinerary<br />
            <em style={{ color:"#F97316", fontStyle:"italic" }}>in under ten minutes.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* connecting line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px"
            style={{ background:"linear-gradient(90deg, transparent, #1E3A8A20, #F97316, #1E3A8A20, transparent)" }} />

          {steps.map((s, i) => (
            <div key={s.n}
              className={`reveal flex flex-col items-start bg-white rounded-3xl p-7 shadow-sm hover:shadow-lg transition-all duration-300 group ${visible ? `visible delay-${i + 1}` : ""}`}
              style={{ border:"1px solid rgba(30,58,138,0.1)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform"
                style={{ background:`${s.color}14`, border:`1px solid ${s.color}30` }}>
                {s.icon}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color:s.color }}>{s.n}</div>
              <h3 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-lg font-semibold text-[#1E3A8A] mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.body}</p>
              <div className="mt-5 h-0.5 w-6 group-hover:w-14 transition-all duration-400 rounded-full"
                style={{ background:s.color }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AI AGENTS — dark navy (keeps contrast / drama)
══════════════════════════════════════════════════════════════════ */
function AgentsSection() {
  const { ref, visible } = useReveal();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % 3), 2800);
    return () => clearInterval(t);
  }, []);

  const agents = [
    {
      name:"Scout", emoji:"🔍", color:"#06b6d4", role:"Flight & Hotel Hunter",
      desc:"Scans hundreds of airlines and hotel providers in real-time to find the best fares and availability for your exact budget and dates.",
      tasks:["Scanning 200+ airlines","Comparing 50k+ hotels","Locking live prices"],
      log:"Checking flights DEL → NRT · 14 options found",
    },
    {
      name:"Curator", emoji:"🎯", color:"#F97316", role:"Experience Matchmaker",
      desc:"Reads your travel style and matches restaurants, activities, and hidden gems that actually fit you — no generic tourist traps.",
      tasks:["Matching your travel style","Reading 10k+ local reviews","Filtering tourist traps"],
      log:"9 Kyoto experiences matched to culture profile",
    },
    {
      name:"Planner", emoji:"🗓️", color:"#a78bfa", role:"Itinerary Architect",
      desc:"Assembles everything Scout and Curator found into a logical, paced, day-by-day schedule that balances your budget and time.",
      tasks:["Sequencing days optimally","Balancing pace & budget","Adding logical buffers"],
      log:"Day-by-day plan assembled · 87% style-match score",
    },
  ];

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" style={{ background:"#07112d" }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)", backgroundSize:"60px 60px" }} />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className={`reveal text-center mb-16 ${visible ? "visible" : ""}`}>
          <span className="inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-6 h-px bg-[#F97316]" /> Meet your AI team <span className="w-6 h-px bg-[#F97316]" />
          </span>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            Three agents. Working<br />
            <em style={{ color:"#F97316" }}>simultaneously for you.</em>
          </h2>
          <p className="text-white/45 text-base mt-4 max-w-lg mx-auto">They fire in parallel the moment you submit — no queuing, no templates, actual live search.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {agents.map((agent, i) => {
            const isActive = active === i;
            return (
              <div key={agent.name}
                className={`reveal glass rounded-3xl p-7 cursor-pointer transition-all duration-500 ${visible ? `visible delay-${i + 1}` : ""} ${isActive ? "scale-[1.025]" : "hover:bg-white/[0.055]"}`}
                style={{ border:`1px solid ${isActive ? agent.color + "70" : "rgba(255,255,255,0.07)"}`, boxShadow:isActive ? `0 0 40px ${agent.color}18` : "none" }}
                onClick={() => setActive(i)}>

                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background:`${agent.color}18`, border:`1px solid ${agent.color}35` }}>
                    {agent.emoji}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                    style={{ background:`${agent.color}18`, color:agent.color, border:`1px solid ${agent.color}35` }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background:agent.color, animation:isActive ? "pulse-ring-cyan 2s infinite" : "none" }} />
                    {isActive ? "active" : "ready"}
                  </div>
                </div>

                <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-xl font-semibold text-white mb-0.5">{agent.name}</div>
                <div className="text-xs mb-4" style={{ color:agent.color }}>{agent.role}</div>
                <p className="text-sm text-white/50 leading-relaxed mb-5">{agent.desc}</p>

                <div className="space-y-2 mb-5">
                  {agent.tasks.map((task, ti) => (
                    <div key={task} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background:isActive && ti === 0 ? `${agent.color}20` : "rgba(255,255,255,0.05)", border:`1px solid ${isActive && ti === 0 ? agent.color + "80" : "rgba(255,255,255,0.1)"}` }}>
                        {isActive && ti === 0 && <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:agent.color }} />}
                      </div>
                      <span className="text-xs text-white/45">{task}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-3" style={{ background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {[0, 1, 2].map(d => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full"
                        style={{ background:isActive ? agent.color : "rgba(255,255,255,0.2)", opacity:isActive ? 1 : 0.4, animation:isActive ? `pulse-ring-cyan ${1.2 + d * 0.2}s ease-out infinite` : "none" }} />
                    ))}
                    <span className="text-[9px] text-white/25 font-mono ml-1 uppercase tracking-wider">{isActive ? "running" : "idle"}</span>
                  </div>
                  <p className="text-[10px] font-mono leading-snug" style={{ color:isActive ? `${agent.color}dd` : "rgba(255,255,255,0.25)" }}>
                    {isActive ? agent.log : "— waiting for trigger —"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GLOBE — interactive 3D globe (UNCHANGED)
══════════════════════════════════════════════════════════════════ */
function GlobeSection() {
  const { ref, visible } = useReveal(0.1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [globeSize, setGlobeSize]       = useState(520);
  const [notifs, setNotifs]             = useState<{ id: number; text: string; color: string }[]>([]);
  const notifId = useRef(0);

  useEffect(() => {
    const update = () => setGlobeSize(Math.min(window.innerWidth * 0.7, 580));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleGlobeReady = useCallback(() => {
    const ctrl = globeRef.current?.controls();
    if (ctrl) { ctrl.autoRotate = true; ctrl.autoRotateSpeed = 0.5; }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const msgs = [
      { text:"Scout: 8 flights found to Tokyo · avg $410", color:"#06b6d4" },
      { text:"New itinerary ready: Bali 7 days · $1,100",  color:"#10b981" },
      { text:"Reykjavik hotel locked · $185/night",        color:"#a78bfa" },
      { text:"Curating activities for Rome right now...",  color:"#F97316" },
      { text:"Verifier: all prices confirmed live",        color:"#f59e0b" },
    ];
    let idx = 0;
    const t = setInterval(() => {
      const id = ++notifId.current;
      const m = msgs[idx % msgs.length];
      setNotifs(n => [...n.slice(-2), { id, text:m.text, color:m.color }]);
      idx++;
      setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 5400);
    }, 4000);
    return () => clearInterval(t);
  }, [visible]);

  const pointsData = CITIES.map(c => ({ lat:c.lat, lng:c.lng, size:0.45, color:c.dotColor, city:c }));

  return (
    <section ref={ref} className="relative py-24 overflow-hidden"
      style={{ background:"linear-gradient(180deg,#050a1a 0%,#07112d 50%,#050a1a 100%)" }}>
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div style={{ width:"640px", height:"640px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 68%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className={`reveal text-center mb-14 ${visible ? "visible" : ""}`}>
          <span className="inline-flex items-center gap-2 text-[#06b6d4] text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" />
            Happening right now
          </span>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl md:text-5xl font-semibold text-white leading-tight">
            Trips being planned<br /><em style={{ color:"#06b6d4" }}>across the globe.</em>
          </h2>
          <p className="text-white/45 text-base mt-4">Drag to rotate · click any glowing city to preview its itinerary</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 relative">
          <div className={`reveal relative flex-shrink-0 ${visible ? "visible delay-2" : ""}`}>
            <Suspense fallback={
              <div style={{ width:globeSize, height:globeSize }} className="flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-[#06b6d4]/25 border-t-[#06b6d4] animate-spin" />
              </div>
            }>
              <GlobeGL
                ref={globeRef}
                width={globeSize} height={globeSize}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                atmosphereColor="#06b6d4"
                atmosphereAltitude={0.13}
                arcsData={ARCS}
                arcColor="color"
                arcDashLength={0.5} arcDashGap={0.2} arcDashAnimateTime={2200}
                arcStroke={0.65} arcAltitude={0.22}
                pointsData={pointsData}
                pointColor="color" pointRadius="size" pointAltitude={0.012}
                pointLabel={(d: object) => {
                  const p = d as typeof pointsData[0];
                  return `<div style="font-family:Outfit,sans-serif;background:rgba(5,10,26,0.92);border:1px solid rgba(6,182,212,0.45);border-radius:10px;padding:8px 12px;color:white;font-size:12px;min-width:130px;pointer-events:none"><b style="color:white">${p.city.name}</b><br/><span style="color:rgba(255,255,255,0.5);font-size:11px">${p.city.country} · ${p.city.trip.price}</span></div>`;
                }}
                onPointClick={(p: object) => setSelectedCity((p as typeof pointsData[0]).city)}
                onGlobeReady={handleGlobeReady}
              />
            </Suspense>

            <div className="absolute top-5 right-2 space-y-2 pointer-events-none z-10" style={{ width:"210px" }}>
              {notifs.map(n => (
                <div key={n.id} className="glass rounded-xl px-3 py-2.5 animate-notif"
                  style={{ border:`1px solid ${n.color}35` }}>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background:n.color }} />
                    <span className="text-white/80 text-[11px] leading-snug">{n.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`reveal w-full lg:w-72 flex-shrink-0 ${visible ? "visible delay-3" : ""}`}>
            {selectedCity ? (
              <div key={selectedCity.id} className="glass-strong rounded-3xl p-6 transition-all duration-500"
                style={{ border:`1px solid ${selectedCity.dotColor}45` }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-white/45 text-xs font-medium uppercase tracking-widest mb-1">{selectedCity.country}</div>
                    <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-2xl font-semibold text-white leading-tight">{selectedCity.name}</div>
                  </div>
                  <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                    style={{ background:selectedCity.dotColor, boxShadow:`0 0 12px ${selectedCity.dotColor}` }} />
                </div>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
                    <span className="text-white/45 text-sm">Duration</span>
                    <span className="text-white font-medium text-sm">{selectedCity.trip.days} days</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3" style={{ borderColor:"rgba(255,255,255,0.07)" }}>
                    <span className="text-white/45 text-sm">Est. total</span>
                    <span className="font-bold text-base" style={{ color:selectedCity.dotColor }}>{selectedCity.trip.price}</span>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1.5 uppercase tracking-widest">Top hotel</div>
                    <div className="text-white text-sm">{selectedCity.trip.hotel}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1.5 uppercase tracking-widest">Highlights</div>
                    <div className="text-white/75 text-xs leading-relaxed">{selectedCity.trip.activities}</div>
                  </div>
                </div>
                <button className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background:`linear-gradient(135deg, ${selectedCity.dotColor}, #F97316)`, boxShadow:`0 6px 24px ${selectedCity.dotColor}40` }}>
                  Plan this trip →
                </button>
                <button onClick={() => setSelectedCity(null)} className="w-full mt-2 py-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
                  ← Back to all cities
                </button>
              </div>
            ) : (
              <div className="glass rounded-3xl p-6">
                <div className="text-4xl text-center mb-4">🌍</div>
                <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-white font-medium text-lg text-center mb-2">Pick a destination</div>
                <div className="text-white/40 text-xs text-center leading-relaxed mb-5">Click any glowing city on the globe — or tap one below</div>
                <div className="space-y-1.5">
                  {CITIES.map(c => (
                    <button key={c.id} onClick={() => setSelectedCity(c)}
                      className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl hover:bg-white/6 transition-all group">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"
                        style={{ background:c.dotColor, boxShadow:`0 0 8px ${c.dotColor}` }} />
                      <span className="text-sm text-white/65 group-hover:text-white flex-1">{c.name}</span>
                      <span className="text-xs font-semibold" style={{ color:c.dotColor }}>{c.trip.price}</span>
                      <svg className="w-3 h-3 text-white/25 group-hover:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`reveal flex justify-center gap-12 mt-16 ${visible ? "visible delay-4" : ""}`}>
          {[{ n:"112", l:"destinations" }, { n:"Real-time", l:"pricing" }, { n:"10 min", l:"avg plan time" }, { n:"4.9★", l:"avg trip rating" }].map(s => (
            <div key={s.l} className="text-center">
              <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-2xl font-semibold text-white">{s.n}</div>
              <div className="text-white/35 text-xs mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESTINATION GALLERY — cream bg, masonry photos
══════════════════════════════════════════════════════════════════ */
function GallerySection() {
  const { ref, visible } = useReveal(0.08);

  return (
    <section ref={ref} style={{ background:"#FDF6EC" }} className="py-28 relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-30"
        style={{ background:"radial-gradient(circle at 0% 100%, rgba(30,58,138,0.15) 0%, transparent 65%)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className={`reveal flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4 ${visible ? "visible" : ""}`}>
          <div>
            <span className="inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-3">
              <span className="w-6 h-px bg-[#F97316]" /> Where will you go?
            </span>
            <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl md:text-5xl font-semibold text-[#1E3A8A] leading-tight">
              200+ destinations,<br />
              <em style={{ color:"#F97316", fontStyle:"italic" }}>all within reach.</em>
            </h2>
          </div>
          <button className="flex-shrink-0 px-6 py-3 rounded-xl font-semibold text-sm border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-all">
            Explore all →
          </button>
        </div>

        {/* Masonry grid */}
        <div className={`reveal ${visible ? "visible" : ""}`}
          style={{ columns:"2 220px", columnGap:"12px" }}>
          {DESTINATIONS.map((d, i) => (
            <div key={d.name}
              className="relative overflow-hidden rounded-2xl cursor-pointer group mb-3 block"
              style={{ breakInside:"avoid", height: d.tall ? "340px" : "220px" }}>
              <img
                src={u(d.img, 600, d.tall ? 680 : 440)}
                alt={`${d.name}, ${d.country}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ transitionTimingFunction:"cubic-bezier(0.25,0.46,0.45,0.94)" }}
              />
              {/* gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/80" />

              {/* tag badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white animate-tag-glow"
                style={{ background:"rgba(249,115,22,0.85)", backdropFilter:"blur(6px)" }}>
                {d.tag}
              </div>

              {/* city name */}
              <div className="absolute bottom-4 left-4 right-4">
                <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-white font-semibold text-lg leading-tight">{d.name}</div>
                <div className="text-white/65 text-xs mt-0.5">{d.country}</div>
              </div>

              {/* hover: plan button */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center shadow-lg">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </div>
              </div>

              {/* invisible stagger delay */}
              <div style={{ animationDelay:`${i * 0.04}s` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ITINERARY PREVIEW — light bg, photos on day cards
══════════════════════════════════════════════════════════════════ */
function ItineraryPreviewSection() {
  const { ref, visible } = useReveal();
  const [openDay, setOpenDay] = useState<number | null>(1);

  const days = [
    {
      n:1, title:"Arrival & Shinjuku Nights",
      headerImg: IMG.tokyoNight,
      items:[
        { icon:"✈️", label:"ANA NH 804 · Delhi → Tokyo",     detail:"Dep 03:15 · Arr 14:20 JST", price:"$410", color:"#06b6d4" },
        { icon:"🏨", label:"Shibuya Sky Hotel",               detail:"★4.7 · Shinjuku · ¥12,800/night", price:"$92", color:"#a78bfa",
          img: IMG.resort2 },
        { icon:"🌆", label:"Shinjuku Golden Gai walk",        detail:"Evening · 2h · curated by Scout", price:"Free", color:"#10b981" },
      ],
    },
    {
      n:2, title:"Tsukiji, TeamLab & Harajuku",
      headerImg: IMG.tokyoStreet,
      items:[
        { icon:"🐟", label:"Tsukiji Outer Market food tour",  detail:"07:00 · 2.5h · guided walk", price:"$28", color:"#F97316" },
        { icon:"💡", label:"TeamLab Planets",                  detail:"14:00 · 2h · pre-booked skip-line", price:"$34", color:"#06b6d4" },
        { icon:"🛍️", label:"Harajuku & Omotesando",            detail:"18:00 · 2h · self-guided", price:"Free", color:"#a78bfa" },
      ],
    },
    {
      n:3, title:"Asakusa & Senso-ji · Departure",
      headerImg: IMG.kyotoWomen,
      items:[
        { icon:"⛩️", label:"Senso-ji Temple at sunrise",      detail:"07:00 · 1.5h · Asakusa district", price:"Free", color:"#f59e0b" },
        { icon:"🍜", label:"Ramen Nagi lunch",                 detail:"12:00 · Shinjuku · Curator pick", price:"$14", color:"#F97316" },
        { icon:"✈️", label:"ANA NH 803 · Tokyo → Delhi",      detail:"Dep 18:25 · Arr 22:40 IST", price:"$415", color:"#06b6d4" },
      ],
    },
  ];

  return (
    <section ref={ref} className="py-28 relative overflow-hidden" style={{ background:"white" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:"radial-gradient(ellipse at 80% 50%, rgba(249,115,22,0.05) 0%, transparent 55%)" }} />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className={`reveal flex flex-col lg:flex-row gap-16 items-start ${visible ? "visible" : ""}`}>

          {/* left panel */}
          <div className="lg:w-80 flex-shrink-0 lg:sticky lg:top-28">
            <span className="inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-6 h-px bg-[#F97316]" /> Results preview
            </span>
            <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl font-semibold text-[#1E3A8A] leading-tight mb-5">
              A real itinerary,<br />
              <em style={{ color:"#F97316", fontStyle:"italic" }}>not a template.</em>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Every flight number is real. Every hotel exists. Every activity was curated to a specific style preference — not copy-pasted.
            </p>

            <div className="rounded-2xl p-5 mb-5" style={{ background:"#FDF6EC", border:"1px solid rgba(30,58,138,0.1)" }}>
              <div className="text-[#1E3A8A]/60 text-xs mb-3 uppercase tracking-widest font-semibold">Trip summary</div>
              {[
                { l:"Tokyo, Japan",       ll:"Destination" },
                { l:"3 days / 2 nights", ll:"Duration"    },
                { l:"$1,043 est.",        ll:"Total cost"  },
                { l:"Mid-range · 1 pax",  ll:"Profile"     },
              ].map(r => (
                <div key={r.ll} className="flex justify-between py-1.5" style={{ borderBottom:"1px solid rgba(30,58,138,0.08)" }}>
                  <span className="text-slate-400 text-xs">{r.ll}</span>
                  <span className="text-[#1E3A8A] text-xs font-semibold">{r.l}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)" }}>
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-emerald-600 text-sm">Live verified pricing</span>
            </div>
          </div>

          {/* day cards */}
          <div className="flex-1 space-y-4">
            {days.map((day, di) => {
              const isOpen = openDay === day.n;
              return (
                <div key={day.n}
                  className={`reveal overflow-hidden rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 ${visible ? `visible delay-${di + 1}` : ""}`}
                  style={{ border:"1px solid rgba(30,58,138,0.12)" }}>

                  {/* photo header */}
                  <div className="relative h-36 overflow-hidden cursor-pointer" onClick={() => setOpenDay(isOpen ? null : day.n)}>
                    <img src={u(day.headerImg, 900, 280)} alt={day.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
                    <div className="absolute inset-0 flex items-center px-6 gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background:"linear-gradient(135deg,#1E3A8A,#F97316)" }}>
                        {day.n}
                      </div>
                      <div>
                        <div className="text-white/60 text-[10px] uppercase tracking-widest">Day {day.n}</div>
                        <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-white font-semibold text-lg leading-tight">{day.title}</div>
                      </div>
                      <div className="ml-auto text-white/60 text-xl">{isOpen ? "−" : "+"}</div>
                    </div>
                  </div>

                  {/* items */}
                  {isOpen && (
                    <div className="bg-white">
                      {day.items.map((item, ii) => (
                        <div key={ii}>
                          <div className="px-6 py-4 flex items-center gap-4 group hover:bg-slate-50/80 transition-colors"
                            style={{ borderBottom: ii < day.items.length - 1 ? "1px solid rgba(30,58,138,0.07)" : "none" }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                              style={{ background:`${item.color}12`, border:`1px solid ${item.color}25` }}>
                              {item.icon}
                            </div>
                            {"img" in item && item.img && (
                              <div className="w-12 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={u(item.img as string, 96, 80)} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-slate-800 truncate">{item.label}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{item.detail}</div>
                            </div>
                            <div className="text-sm font-bold flex-shrink-0 group-hover:scale-110 transition-transform"
                              style={{ color:item.color }}>{item.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button className="w-full py-4 rounded-2xl font-semibold text-white mt-2 transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background:"linear-gradient(135deg,#1E3A8A,#F97316)", boxShadow:"0 8px 32px rgba(249,115,22,0.28)" }}>
              Book this trip — $1,043 total →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURES GRID — cream/white, light cards
══════════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const { ref, visible } = useReveal();

  const features = [
    { icon:"📡", color:"#06b6d4", title:"Live flight & hotel pricing",  body:"Fares pulled from airline GDS and hotel APIs at query time — not cached results from days ago." },
    { icon:"🚫", color:"#ec4899", title:"Zero fabricated itineraries",  body:"Every hotel exists. Every flight departs. Each result is verified before it hits your screen." },
    { icon:"🧠", color:"#a78bfa", title:"Style-aware recommendations",  body:"Agents read your travel profile and adapt every result to how you actually like to travel." },
    { icon:"⚡", color:"#F97316", title:"4 agents, parallel execution",  body:"Search, curation, planning, and verification all run simultaneously — no waterfall queuing." },
    { icon:"⏱️", color:"#10b981", title:"Full plan in under 10 minutes", body:"From your first message to a day-by-day, bookable itinerary — not a weekend of tab-switching." },
    { icon:"🔒", color:"#f59e0b", title:"Prices locked before you book", body:"When you confirm, prices are live-locked for 15 minutes so you can review before committing." },
  ];

  return (
    <section ref={ref} className="py-28 relative" style={{ background:"#FDF6EC" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`reveal text-center mb-16 ${visible ? "visible" : ""}`}>
          <span className="inline-flex items-center gap-2 text-[#F97316] text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-6 h-px bg-[#F97316]" /> Why Voyagent <span className="w-6 h-px bg-[#F97316]" />
          </span>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-4xl md:text-5xl font-semibold text-[#1E3A8A] leading-tight">
            Not a chatbot.<br />
            <em style={{ color:"#F97316", fontStyle:"italic" }}>An actual travel system.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={f.title}
              className={`reveal bg-white rounded-3xl p-7 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${visible ? `visible delay-${i + 1}` : ""}`}
              style={{ border:"1px solid rgba(30,58,138,0.1)", boxShadow:"0 2px 12px rgba(30,58,138,0.05)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform"
                style={{ background:`${f.color}12`, border:`1px solid ${f.color}28` }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-lg font-semibold text-[#1E3A8A] mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
              <div className="mt-5 h-0.5 transition-all duration-400 group-hover:w-14 w-6 rounded-full"
                style={{ background:`linear-gradient(90deg, ${f.color}, transparent)` }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TESTIMONIALS — cream bg
══════════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const { ref, visible } = useReveal();

  const reviews = [
    {
      quote:"Planned my entire Bali trip in 12 minutes. Every hotel existed, every activity matched my vibe. I've never trusted an AI tool this much.",
      name:"Priya Sharma", loc:"Mumbai → Bali, 7 nights", avatar:IMG.avatar1, rating:5,
    },
    {
      quote:"I was sceptical — every AI travel tool I tried before gave me hallucinated hotels. Voyagent was different. Real prices, real rooms.",
      name:"Marcus Webb", loc:"London → Santorini, 4 nights", avatar:IMG.avatar2, rating:5,
    },
    {
      quote:"The Scout agent found a fare $180 cheaper than what I'd found manually. The Curator added a ramen spot I never would have discovered.",
      name:"Yuki Tanaka", loc:"Delhi → Kyoto, 4 nights", avatar:IMG.avatar3, rating:5,
    },
  ];

  return (
    <section ref={ref} style={{ background:"#FDF6EC" }} className="py-24 border-t border-[#1E3A8A]/8 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`reveal text-center mb-12 ${visible ? "visible" : ""}`}>
          <h2 style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-3xl md:text-4xl font-semibold text-[#1E3A8A]">
            Travellers who took the leap
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={r.name}
              className={`reveal bg-white rounded-3xl p-7 ${visible ? `visible delay-${i + 1}` : ""}`}
              style={{ border:"1px solid rgba(30,58,138,0.1)", boxShadow:"0 2px 20px rgba(30,58,138,0.06)" }}>
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length:r.rating }).map((_, s) => (
                  <svg key={s} className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={u(r.avatar, 80, 80)} alt={r.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                <div>
                  <div className="text-[#1E3A8A] font-semibold text-sm">{r.name}</div>
                  <div className="text-slate-400 text-xs">{r.loc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STATS BAND
══════════════════════════════════════════════════════════════════ */
function StatsBand() {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`reveal py-14 ${visible ? "visible" : ""}`} style={{ background:"#1E3A8A" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n:"200+", l:"destinations available" },
            { n:"$180", l:"avg saving vs manual" },
            { n:"10 min", l:"avg plan to itinerary" },
            { n:"4.9 / 5", l:"avg user rating" },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-3xl md:text-4xl font-semibold text-white mb-1">{s.n}</div>
              <div className="text-white/50 text-sm">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINAL CTA — full-bleed Bali beach photo
══════════════════════════════════════════════════════════════════ */
function CtaSection({ onSubmit }: { onSubmit: (q: string) => void }) {
  const { ref, visible } = useReveal();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = () => { if (query.trim()) onSubmit(query); };

  return (
    <section ref={ref} className="relative py-36 overflow-hidden">
      {/* Full-bleed photo */}
      <div className="absolute inset-0 bg-[#0a3020]">
        <img src={u(IMG.baliBeach, 1920, 900)} alt="Bali beach" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background:"linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.75) 100%)" }} />
      </div>

      <div className={`reveal relative z-10 max-w-3xl mx-auto px-6 text-center ${visible ? "visible" : ""}`}>
        <h2 style={{ fontFamily:"'Fraunces', Georgia, serif", fontSize:"clamp(2.5rem,6vw,4rem)", fontWeight:600, lineHeight:1.05, textShadow:"0 2px 24px rgba(0,0,0,0.5)" }}
          className="text-white mb-5">
          Stop researching.<br />
          <em style={{ background:"linear-gradient(90deg,#fbbf24,#F97316)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Start travelling.
          </em>
        </h2>
        <p className="text-white/70 text-base mb-10 max-w-md mx-auto">Your next adventure is one sentence away.</p>
        <div className="p-1 rounded-2xl shadow-2xl shadow-black/50"
          style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.25)" }}>
          <div className="flex items-center gap-3 rounded-xl px-4 py-4" style={{ background:"rgba(255,255,255,0.94)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#1E3A8A]/10 border border-[#1E3A8A]/20">
              <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </div>
            <input ref={inputRef} value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Where are you going next?"
              className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none" />
            <button onClick={submit} disabled={!query.trim()}
              className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#F97316] text-white hover:bg-orange-500 disabled:opacity-30 transition-all shadow-lg shadow-orange-500/40">
              Plan trip →
            </button>
          </div>
        </div>
        <p className="text-white/35 text-xs mt-4">No account required · Free to plan · Live pricing always on</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background:"#0d1b40", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </div>
              <span style={{ fontFamily:"'Fraunces', Georgia, serif" }} className="text-xl font-semibold text-white">Voyagent</span>
            </div>
            <p className="text-white/35 text-sm leading-relaxed">AI travel planning that actually works — live flights, real hotels, personalised itineraries in minutes.</p>
          </div>

          <div className="grid grid-cols-3 gap-10 text-sm">
            {[
              { title:"Product", links:["Plan a trip","How it works","AI agents","Pricing"] },
              { title:"Company", links:["About","Blog","Careers","Press"] },
              { title:"Legal",   links:["Privacy","Terms","Cookies","Security"] },
            ].map(col => (
              <div key={col.title}>
                <div className="text-white/25 text-[10px] uppercase tracking-widest font-semibold mb-3">{col.title}</div>
                <div className="space-y-2">
                  {col.links.map(l => (
                    <div key={l} className="text-white/40 hover:text-white/80 cursor-pointer transition-colors text-sm">{l}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6" style={{ borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-white/20 text-xs">© 2026 Voyagent, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {["M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
              "M21 2H3v1l9 9.26L21 3V2zM3.5 4.75l8.5 8.99 8.5-8.99V20H3.5V4.75z"].map((p, i) => (
              <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <svg className="w-3.5 h-3.5 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d={p} /></svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════ */
export default function App() {
  const scrollToHero = () => window.scrollTo({ top:0, behavior:"smooth" });
  const handleSubmit = useCallback((q: string) => {
    alert(`✈️ Voyagent received: "${q}"\n\nAgents Scout, Curator & Planner are now searching live data for flights, hotels and activities.`);
  }, []);

  return (
    <div style={{ fontFamily:"'Outfit',system-ui,sans-serif", background:"#FDF6EC", color:"#1e293b", overflowX:"hidden" }}>
      <Navbar scrollToHero={scrollToHero} />
      <HeroSection onSubmit={handleSubmit} />
      <HowItWorksSection />
      <AgentsSection />
      <GlobeSection />
      <GallerySection />
      <ItineraryPreviewSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StatsBand />
      <CtaSection onSubmit={handleSubmit} />
      <Footer />
    </div>
  );
}
