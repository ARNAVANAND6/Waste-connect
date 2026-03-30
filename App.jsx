import { useState, useRef, useCallback } from "react";

// ─── Palette & Theme ────────────────────────────────────────────────────────
const C = {
  forest: "#1a3a2a",
  emerald: "#2d6a4f",
  leaf: "#40916c",
  mint: "#74c69d",
  foam: "#d8f3dc",
  cream: "#f8fdf9",
  gold: "#e9c46a",
  amber: "#f4a261",
  clay: "#e76f51",
  charcoal: "#2d3436",
  steel: "#636e72",
  mist: "#b2bec3",
  white: "#ffffff",
};

// ─── Waste categories ────────────────────────────────────────────────────────
const WASTE_TYPES = {
  plastic: { icon: "🧴", color: "#3b82f6", points: 15, label: "Plastic" },
  glass:   { icon: "🍾", color: "#8b5cf6", points: 20, label: "Glass"   },
  paper:   { icon: "📄", color: "#f59e0b", points: 10, label: "Paper"   },
  metal:   { icon: "🥫", color: "#6b7280", points: 25, label: "Metal"   },
  organic: { icon: "🍂", color: "#10b981", points: 12, label: "Organic" },
  ewaste:  { icon: "💡", color: "#ef4444", points: 30, label: "E-Waste" },
  textile: { icon: "👕", color: "#ec4899", points: 18, label: "Textile" },
};

const PRODUCTS = [
  { id:1, name:"Bamboo Water Bottle",  price:320,  img:"🎋", cat:"Kitchen",   eco:"100% Compostable"    },
  { id:2, name:"Recycled Tote Bag",    price:180,  img:"👜", cat:"Fashion",   eco:"Upcycled Fabric"      },
  { id:3, name:"Solar Phone Charger",  price:950,  img:"☀️", cat:"Tech",      eco:"Zero Emissions"       },
  { id:4, name:"Beeswax Food Wraps",   price:240,  img:"🍯", cat:"Kitchen",   eco:"Plastic-Free"         },
  { id:5, name:"Seed Paper Notebook",  price:150,  img:"📒", cat:"Stationery","eco":"Plant After Use"     },
  { id:6, name:"Compost Starter Kit",  price:420,  img:"🌱", cat:"Garden",   eco:"Reduces Landfill"      },
];

const HISTORY = [
  { id:1, type:"plastic", date:"Today, 9:14 AM",    pts:15, status:"Collected" },
  { id:2, type:"paper",   date:"Yesterday, 3:02 PM", pts:10, status:"Collected" },
  { id:3, type:"metal",   date:"Mar 27, 11:30 AM",  pts:25, status:"Collected" },
  { id:4, type:"glass",   date:"Mar 25, 2:15 PM",   pts:20, status:"Collected" },
];

// ─── API call ────────────────────────────────────────────────────────────────
async function detectWaste(base64Image, mimeType) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a waste classification AI for the Waste Connect recycling app. 
Analyze the image and respond ONLY with a valid JSON object (no markdown, no backticks) in this exact format:
{
  "type": "plastic|glass|paper|metal|organic|ewaste|textile",
  "confidence": 0.0-1.0,
  "description": "Brief description of the waste item",
  "recyclable": true|false,
  "instructions": "One sentence on how to recycle/dispose of this item",
  "tip": "One eco-friendly tip related to this waste type"
}
If the image doesn't contain waste, return type as the closest category and confidence as 0.3.`,
      messages: [{ role:"user", content:[
        { type:"image", source:{ type:"base64", media_type: mimeType, data: base64Image }},
        { type:"text",  text: "Classify this waste item for recycling." }
      ]}],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  try { return JSON.parse(text.replace(/```json|```/g,"")); }
  catch { return { type:"plastic", confidence:0.6, description:"Recyclable item", recyclable:true, instructions:"Place in the recycling bin.", tip:"Reduce single-use plastics when possible." }; }
}

// ─── Components ──────────────────────────────────────────────────────────────
const Badge = ({ children, color = C.emerald }) => (
  <span style={{ background: color + "22", color, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600, letterSpacing:.4 }}>
    {children}
  </span>
);

const Btn = ({ children, onClick, variant="primary", size="md", disabled, style={} }) => {
  const base = { border:"none", borderRadius:12, cursor:disabled?"not-allowed":"pointer",
    fontFamily:"inherit", fontWeight:600, letterSpacing:.3, transition:"all .18s",
    opacity: disabled ? .5 : 1, ...style };
  const v = {
    primary:  { background:`linear-gradient(135deg,${C.emerald},${C.leaf})`, color:"#fff",
                padding: size==="lg" ? "14px 32px" : "10px 22px", fontSize: size==="lg"?15:13,
                boxShadow:`0 4px 16px ${C.emerald}44` },
    secondary:{ background:"transparent", color:C.emerald, border:`1.5px solid ${C.emerald}`,
                padding: size==="lg" ? "13px 31px" : "9px 21px", fontSize: size==="lg"?15:13 },
    ghost:    { background:C.foam, color:C.forest, padding: size==="lg" ? "14px 32px" : "10px 22px", fontSize: size==="lg"?15:13 },
    danger:   { background:`linear-gradient(135deg,${C.clay},#c0392b)`, color:"#fff",
                padding:"10px 22px", fontSize:13, boxShadow:`0 4px 16px ${C.clay}44` },
  };
  return <button onClick={onClick} disabled={disabled} style={{...base,...v[variant]}}>{children}</button>;
};

const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:C.white, borderRadius:20, padding:"20px 24px",
    boxShadow:"0 2px 20px rgba(0,0,0,.07)", border:`1px solid ${C.foam}`,
    cursor: onClick ? "pointer" : "default", transition:"transform .18s, box-shadow .18s",
    ...(onClick ? { ":hover":{ transform:"translateY(-2px)" } } : {}), ...style }}>
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, color=C.emerald }) => (
  <div style={{ background:`linear-gradient(135deg,${color}11,${color}08)`,
    border:`1px solid ${color}22`, borderRadius:18, padding:"18px 20px", flex:1, minWidth:120 }}>
    <div style={{ fontSize:28 }}>{icon}</div>
    <div style={{ fontSize:22, fontWeight:700, color, margin:"6px 0 2px", fontFamily:"'Sora',sans-serif" }}>{value}</div>
    <div style={{ fontSize:12, fontWeight:600, color:C.steel }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:C.mist, marginTop:2 }}>{sub}</div>}
  </div>
);

// ─── PAGES ────────────────────────────────────────────────────────────────────

function Dashboard({ user, history, onNav }) {
  const totalPts = user.points;
  const totalKg  = 12.4;
  const streak   = 7;

  return (
    <div style={{ padding:"0 0 24px" }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(145deg,${C.forest},${C.emerald})`,
        borderRadius:"0 0 36px 36px", padding:"28px 24px 36px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ color:C.mint, fontSize:13, margin:0, fontWeight:500 }}>Good morning 👋</p>
            <h2 style={{ color:"#fff", fontSize:24, margin:"4px 0 0", fontFamily:"'Sora',sans-serif" }}>{user.name}</h2>
          </div>
          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:50, width:46, height:46,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
            {user.avatar}
          </div>
        </div>
        {/* Points pill */}
        <div style={{ background:"rgba(255,255,255,.12)", borderRadius:16, padding:"16px 20px",
          marginTop:22, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ color:C.mint, fontSize:12, margin:0 }}>Your Green Points</p>
            <p style={{ color:"#fff", fontSize:32, fontWeight:700, margin:"2px 0", fontFamily:"'Sora',sans-serif" }}>
              {totalPts.toLocaleString()} pts
            </p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ color:C.mint, fontSize:12, margin:0 }}>Level</p>
            <p style={{ color:C.gold, fontSize:18, fontWeight:700, margin:"2px 0" }}>🌿 Eco Hero</p>
            <div style={{ background:"rgba(255,255,255,.2)", borderRadius:8, height:6, width:100, marginTop:4 }}>
              <div style={{ background:C.gold, width:"72%", height:"100%", borderRadius:8 }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:"0 20px" }}>
        <div style={{ display:"flex", gap:12, marginBottom:24 }}>
          <StatCard icon="♻️" label="Items Recycled" value="38"   sub="All time"   color={C.leaf}   />
          <StatCard icon="🌍" label="CO₂ Saved"      value={`${totalKg}kg`} sub="This month" color={C.emerald} />
          <StatCard icon="🔥" label="Day Streak"     value={streak}  sub="Keep it up!" color={C.clay}   />
        </div>

        {/* Quick Actions */}
        <h3 style={{ color:C.forest, fontSize:16, fontWeight:700, marginBottom:14, fontFamily:"'Sora',sans-serif" }}>
          Quick Actions
        </h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
          {[
            { icon:"📸", label:"Scan Waste",     sub:"AI detection",   nav:"scan",      grad:`${C.emerald},${C.leaf}` },
            { icon:"🛍️", label:"Eco Shop",       sub:"Redeem points",  nav:"market",    grad:`#8b5cf6,#7c3aed`        },
            { icon:"🚛", label:"Schedule Pickup", sub:"Book now",      nav:"pickup",    grad:`${C.amber},${C.clay}`    },
            { icon:"📊", label:"My Impact",       sub:"View stats",    nav:"dashboard", grad:`#0ea5e9,#0284c7`         },
          ].map(a => (
            <div key={a.nav} onClick={() => onNav(a.nav)}
              style={{ background:`linear-gradient(135deg,${a.grad})`, borderRadius:18,
                padding:"18px 16px", cursor:"pointer", transition:"transform .15s, box-shadow .15s",
                boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <div style={{ fontSize:28, marginBottom:6 }}>{a.icon}</div>
              <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>{a.label}</div>
              <div style={{ color:"rgba(255,255,255,.75)", fontSize:12, marginTop:2 }}>{a.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <h3 style={{ color:C.forest, fontSize:16, fontWeight:700, marginBottom:14, fontFamily:"'Sora',sans-serif" }}>
          Recent Activity
        </h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {history.slice(0,3).map(h => {
            const w = WASTE_TYPES[h.type];
            return (
              <div key={h.id} style={{ background:C.white, border:`1px solid ${C.foam}`,
                borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:w.color+"22",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {w.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:C.charcoal }}>{w.label}</div>
                  <div style={{ fontSize:12, color:C.steel, marginTop:1 }}>{h.date}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <Badge color={C.leaf}>+{h.pts} pts</Badge>
                  <div style={{ fontSize:11, color:C.mist, marginTop:3 }}>{h.status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScanPage({ onEarn }) {
  const [step, setStep]           = useState("idle"); // idle|preview|loading|result
  const [imgSrc, setImgSrc]       = useState(null);
  const [imgData, setImgData]     = useState(null);
  const [imgMime, setImgMime]     = useState(null);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [earned, setEarned]       = useState(false);
  const fileRef                   = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setImgMime(file.type);
    const reader = new FileReader();
    reader.onload = e => {
      const src   = e.target.result;
      const b64   = src.split(",")[1];
      setImgSrc(src);
      setImgData(b64);
      setStep("preview");
      setResult(null);
      setEarned(false);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyse = async () => {
    setStep("loading");
    setError(null);
    try {
      const r = await detectWaste(imgData, imgMime);
      setResult(r);
      setStep("result");
    } catch (e) {
      setError("Detection failed. Please try again.");
      setStep("preview");
    }
  };

  const claimPoints = () => {
    if (!result || earned) return;
    const pts = WASTE_TYPES[result.type]?.points || 10;
    onEarn(pts);
    setEarned(true);
  };

  const reset = () => { setStep("idle"); setImgSrc(null); setResult(null); setEarned(false); setError(null); };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const wt = result ? (WASTE_TYPES[result.type] || WASTE_TYPES.plastic) : null;

  return (
    <div style={{ padding:"24px 20px" }}>
      <h2 style={{ color:C.forest, fontFamily:"'Sora',sans-serif", fontSize:22, marginBottom:6 }}>AI Waste Scanner</h2>
      <p style={{ color:C.steel, fontSize:13, marginBottom:24 }}>Snap or upload a photo · Our AI identifies & sorts your waste</p>

      {step === "idle" && (
        <div>
          <div onClick={() => fileRef.current.click()}
            style={{ border:`2px dashed ${C.mint}`, borderRadius:24, padding:"48px 24px",
              textAlign:"center", cursor:"pointer", background:C.foam, transition:"background .15s",
              marginBottom:20 }}
            onMouseEnter={e=>e.currentTarget.style.background=C.mint+"22"}
            onMouseLeave={e=>e.currentTarget.style.background=C.foam}>
            <div style={{ fontSize:52, marginBottom:12 }}>📸</div>
            <p style={{ color:C.emerald, fontWeight:700, fontSize:16, margin:0 }}>Upload Waste Photo</p>
            <p style={{ color:C.steel, fontSize:13, marginTop:6 }}>JPG, PNG, WEBP supported</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
            onChange={e => handleFile(e.target.files[0])} />

          <div style={{ background:C.foam, borderRadius:16, padding:"16px 20px" }}>
            <p style={{ color:C.forest, fontWeight:600, fontSize:13, marginBottom:10 }}>🤖 Powered by YOLO-class AI</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {Object.entries(WASTE_TYPES).map(([k,v]) => (
                <span key={k} style={{ background:v.color+"22", color:v.color, borderRadius:20,
                  padding:"4px 12px", fontSize:12, fontWeight:600 }}>
                  {v.icon} {v.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {(step === "preview" || step === "loading") && imgSrc && (
        <div>
          <img src={imgSrc} alt="Waste" style={{ width:"100%", borderRadius:20, objectFit:"cover",
            maxHeight:300, marginBottom:16, border:`2px solid ${C.foam}` }} />
          {error && <p style={{ color:C.clay, fontSize:13, marginBottom:12 }}>⚠️ {error}</p>}
          <div style={{ display:"flex", gap:12 }}>
            <Btn onClick={reset} variant="secondary">← Retake</Btn>
            <Btn onClick={analyse} disabled={step==="loading"} style={{ flex:1 }} size="lg">
              {step === "loading" ? "🔍 Analysing..." : "🤖 Detect Waste"}
            </Btn>
          </div>
        </div>
      )}

      {step === "result" && result && wt && (
        <div>
          <img src={imgSrc} alt="Waste" style={{ width:"100%", borderRadius:20, objectFit:"cover",
            maxHeight:220, marginBottom:16 }} />

          {/* Result card */}
          <div style={{ background:`linear-gradient(135deg,${wt.color}11,${wt.color}06)`,
            border:`2px solid ${wt.color}44`, borderRadius:24, padding:"20px 24px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:wt.color+"22",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>
                {wt.icon}
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontWeight:700, fontSize:18, color:C.charcoal, fontFamily:"'Sora',sans-serif" }}>{wt.label}</span>
                  {result.recyclable ? <Badge color={C.leaf}>♻️ Recyclable</Badge> : <Badge color={C.clay}>⚠️ Non-Recyclable</Badge>}
                </div>
                <p style={{ color:C.steel, fontSize:13, margin:0 }}>{result.description}</p>
              </div>
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:12, color:C.steel, fontWeight:600 }}>AI Confidence</span>
                <span style={{ fontSize:12, color:wt.color, fontWeight:700 }}>{confidencePct}%</span>
              </div>
              <div style={{ background:wt.color+"22", borderRadius:8, height:8 }}>
                <div style={{ background:wt.color, width:`${confidencePct}%`, height:"100%",
                  borderRadius:8, transition:"width .6s ease" }}/>
              </div>
            </div>

            <div style={{ background:"rgba(255,255,255,.7)", borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.forest, marginBottom:4 }}>♻️ How to Dispose</p>
              <p style={{ fontSize:13, color:C.charcoal, margin:0 }}>{result.instructions}</p>
            </div>
            <div style={{ background:"rgba(255,255,255,.7)", borderRadius:14, padding:"12px 14px" }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.emerald, marginBottom:4 }}>💡 Eco Tip</p>
              <p style={{ fontSize:13, color:C.charcoal, margin:0 }}>{result.tip}</p>
            </div>
          </div>

          {/* Points claim */}
          <div style={{ background:earned ? C.foam : `linear-gradient(135deg,${C.emerald},${C.leaf})`,
            borderRadius:20, padding:"18px 20px", display:"flex", alignItems:"center",
            justifyContent:"space-between", marginBottom:16, transition:"background .4s" }}>
            <div>
              <p style={{ color: earned ? C.forest : "rgba(255,255,255,.8)", fontSize:12, margin:0, fontWeight:600 }}>
                {earned ? "Points Earned!" : "Earn for recycling"}
              </p>
              <p style={{ color: earned ? C.emerald : C.gold, fontSize:24, fontWeight:700, margin:"2px 0", fontFamily:"'Sora',sans-serif" }}>
                +{wt.points} pts
              </p>
            </div>
            {!earned
              ? <Btn onClick={claimPoints} variant="ghost">Claim 🎖️</Btn>
              : <span style={{ fontSize:28 }}>✅</span>}
          </div>

          <div style={{ display:"flex", gap:12 }}>
            <Btn onClick={reset} variant="secondary">← Scan Another</Btn>
            <Btn variant="ghost" style={{ flex:1 }}
              onClick={() => alert("Pickup scheduled! We'll collect within 24 hours.")}>
              Schedule Pickup 🚛
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Marketplace({ user, onRedeem }) {
  const [cart, setCart]       = useState([]);
  const [filter, setFilter]   = useState("All");
  const cats = ["All", "Kitchen", "Fashion", "Tech", "Stationery", "Garden"];
  const shown = filter === "All" ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);

  const inCart = id => cart.includes(id);
  const toggle = p => {
    if (user.points < p.price && !inCart(p.id)) { alert("Not enough points!"); return; }
    setCart(c => inCart(p.id) ? c.filter(x => x !== p.id) : [...c, p.id]);
  };

  const total  = cart.reduce((s,id) => s + (PRODUCTS.find(p=>p.id===id)?.price||0), 0);
  const redeem = () => {
    if (cart.length === 0) return;
    onRedeem(total);
    setCart([]);
    alert(`🎉 Order placed! You spent ${total} pts. Items will be delivered in 3-5 days.`);
  };

  return (
    <div style={{ padding:"24px 20px 80px" }}>
      <h2 style={{ color:C.forest, fontFamily:"'Sora',sans-serif", fontSize:22, marginBottom:4 }}>Eco Marketplace</h2>
      <p style={{ color:C.steel, fontSize:13, marginBottom:16 }}>Redeem your green points for sustainable products</p>

      {/* Balance */}
      <div style={{ background:`linear-gradient(135deg,${C.forest},${C.emerald})`, borderRadius:18,
        padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <p style={{ color:C.mint, fontSize:12, margin:0 }}>Available Balance</p>
          <p style={{ color:"#fff", fontSize:24, fontWeight:700, margin:"4px 0", fontFamily:"'Sora',sans-serif" }}>
            {user.points.toLocaleString()} pts
          </p>
        </div>
        {cart.length > 0 && (
          <div style={{ textAlign:"right" }}>
            <p style={{ color:C.mint, fontSize:12, margin:0 }}>Cart ({cart.length})</p>
            <p style={{ color:C.gold, fontSize:18, fontWeight:700, margin:"2px 0" }}>{total} pts</p>
            <Btn onClick={redeem} variant="ghost" size="sm">Redeem</Btn>
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, marginBottom:20 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{ background: filter===c ? C.emerald : C.foam, color: filter===c ? "#fff" : C.steel,
              border:"none", borderRadius:20, padding:"8px 16px", fontSize:13, fontWeight:600,
              cursor:"pointer", whiteSpace:"nowrap", transition:"all .15s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Products */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {shown.map(p => {
          const selected = inCart(p.id);
          const canAfford = user.points >= p.price;
          return (
            <div key={p.id}
              style={{ background:C.white, borderRadius:20, padding:"18px 16px",
                border: selected ? `2px solid ${C.emerald}` : `1px solid ${C.foam}`,
                boxShadow: selected ? `0 4px 20px ${C.emerald}33` : "0 2px 12px rgba(0,0,0,.06)",
                transition:"all .2s", cursor: canAfford ? "pointer" : "default",
                opacity: canAfford ? 1 : .6 }}
              onClick={() => toggle(p)}>
              <div style={{ fontSize:40, textAlign:"center", marginBottom:12 }}>{p.img}</div>
              <div style={{ fontWeight:700, fontSize:14, color:C.charcoal, marginBottom:4 }}>{p.name}</div>
              <Badge color={C.leaf}>{p.eco}</Badge>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
                <span style={{ fontWeight:700, color:C.emerald, fontSize:15 }}>{p.price} pts</span>
                <div style={{ width:26, height:26, borderRadius:8,
                  background: selected ? C.emerald : C.foam,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: selected ? "#fff" : C.mist, fontSize:14, transition:"all .2s" }}>
                  {selected ? "✓" : "+"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PickupPage() {
  const [date,setDate]   = useState("");
  const [time,setTime]   = useState("");
  const [type,setType]   = useState("plastic");
  const [booked,setBooked] = useState(false);

  const submit = () => {
    if (!date||!time) { alert("Select date and time first."); return; }
    setBooked(true);
  };

  if (booked) return (
    <div style={{ padding:"40px 24px", textAlign:"center" }}>
      <div style={{ fontSize:72, marginBottom:16 }}>🚛</div>
      <h2 style={{ color:C.forest, fontFamily:"'Sora',sans-serif", fontSize:24, marginBottom:8 }}>Pickup Scheduled!</h2>
      <p style={{ color:C.steel, fontSize:14, marginBottom:24 }}>
        Your waste will be collected on <strong>{date}</strong> at <strong>{time}</strong>.
        You'll earn <strong>+{WASTE_TYPES[type]?.points||10} pts</strong> once confirmed.
      </p>
      <Btn onClick={() => setBooked(false)} variant="primary" size="lg">Schedule Another</Btn>
    </div>
  );

  return (
    <div style={{ padding:"24px 20px" }}>
      <h2 style={{ color:C.forest, fontFamily:"'Sora',sans-serif", fontSize:22, marginBottom:4 }}>Schedule Pickup</h2>
      <p style={{ color:C.steel, fontSize:13, marginBottom:24 }}>We'll collect from your doorstep & you earn points!</p>

      {[
        { label:"Waste Type", comp: (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {Object.entries(WASTE_TYPES).map(([k,v]) => (
              <button key={k} onClick={()=>setType(k)}
                style={{ background: type===k ? v.color : v.color+"15",
                  color: type===k ? "#fff" : v.color, border:"none", borderRadius:20,
                  padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        )},
        { label:"Pickup Date", comp: (
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.foam}`,
              fontSize:14, fontFamily:"inherit", color:C.charcoal, background:"#fff",
              outline:"none", boxSizing:"border-box" }} />
        )},
        { label:"Preferred Time", comp: (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {["9:00 AM","11:00 AM","2:00 PM","4:00 PM","6:00 PM","8:00 PM"].map(t => (
              <button key={t} onClick={()=>setTime(t)}
                style={{ background: time===t ? C.emerald : C.foam,
                  color: time===t ? "#fff" : C.steel, border:"none", borderRadius:12,
                  padding:"10px 6px", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>
                {t}
              </button>
            ))}
          </div>
        )},
      ].map(({ label, comp }) => (
        <div key={label} style={{ marginBottom:22 }}>
          <p style={{ color:C.forest, fontWeight:700, fontSize:14, marginBottom:10 }}>{label}</p>
          {comp}
        </div>
      ))}

      <div style={{ background:C.foam, borderRadius:16, padding:"16px 18px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ color:C.steel, fontSize:13 }}>Waste Type</span>
          <span style={{ color:C.charcoal, fontSize:13, fontWeight:600 }}>{WASTE_TYPES[type]?.label}</span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          <span style={{ color:C.steel, fontSize:13 }}>Points to Earn</span>
          <Badge color={C.leaf}>+{WASTE_TYPES[type]?.points} pts</Badge>
        </div>
      </div>

      <Btn onClick={submit} variant="primary" size="lg" style={{ width:"100%" }}>
        Confirm Pickup 🚛
      </Btn>
    </div>
  );
}

function Profile({ user, history }) {
  const total = history.reduce((s,h) => s+h.pts, 0);
  return (
    <div style={{ padding:"24px 20px 40px" }}>
      {/* Avatar */}
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ width:80, height:80, borderRadius:40,
          background:`linear-gradient(135deg,${C.emerald},${C.leaf})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:36, margin:"0 auto 12px", boxShadow:`0 8px 24px ${C.emerald}44` }}>
          {user.avatar}
        </div>
        <h2 style={{ color:C.forest, fontFamily:"'Sora',sans-serif", fontSize:20, margin:"0 0 4px" }}>{user.name}</h2>
        <Badge color={C.leaf}>🌿 Eco Hero</Badge>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Points", value:user.points.toLocaleString(), icon:"⭐" },
          { label:"Pts Earned",   value:total,       icon:"🎖️" },
          { label:"Items Recycled",value:38,          icon:"♻️" },
          { label:"Days Active",  value:42,           icon:"📅" },
        ].map(s => (
          <div key={s.label} style={{ background:C.foam, borderRadius:16, padding:"16px",
            textAlign:"center", border:`1px solid ${C.mint}33` }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontWeight:700, fontSize:18, color:C.forest, fontFamily:"'Sora',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.steel, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Full history */}
      <h3 style={{ color:C.forest, fontSize:16, fontWeight:700, marginBottom:14, fontFamily:"'Sora',sans-serif" }}>
        Recycling History
      </h3>
      {history.map(h => {
        const w = WASTE_TYPES[h.type];
        return (
          <div key={h.id} style={{ background:C.white, border:`1px solid ${C.foam}`, borderRadius:16,
            padding:"14px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:w.color+"22",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
              {w.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14, color:C.charcoal }}>{w.label}</div>
              <div style={{ fontSize:12, color:C.steel, marginTop:1 }}>{h.date}</div>
            </div>
            <Badge color={C.leaf}>+{h.pts} pts</Badge>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard", icon:"🏠", label:"Home"    },
  { id:"scan",      icon:"📸", label:"Scan"    },
  { id:"pickup",    icon:"🚛", label:"Pickup"  },
  { id:"market",    icon:"🛍️", label:"Shop"    },
  { id:"profile",   icon:"👤", label:"Profile" },
];

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("dashboard");
  const [user, setUser]       = useState({ name:"Aryan Sharma", avatar:"🌿", points:1240 });
  const [history, setHistory] = useState(HISTORY);

  const earn   = pts => setUser(u => ({...u, points: u.points + pts}));
  const redeem = pts => setUser(u => ({...u, points: Math.max(0, u.points - pts)}));

  const pages = {
    dashboard: <Dashboard user={user} history={history} onNav={setPage} />,
    scan:      <ScanPage onEarn={earn} />,
    pickup:    <PickupPage />,
    market:    <Marketplace user={user} onRedeem={redeem} />,
    profile:   <Profile user={user} history={history} />,
  };

  return (
    <div style={{ maxWidth:430, margin:"0 auto", minHeight:"100vh", background:C.cream,
      fontFamily:"'Inter',sans-serif", position:"relative", paddingBottom:70 }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div style={{ background:`linear-gradient(135deg,${C.forest},${C.emerald})`,
        padding:"16px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>♻️</span>
          <span style={{ color:"#fff", fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:18,
            letterSpacing:.4 }}>Waste Connect</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6,
          background:"rgba(255,255,255,.15)", borderRadius:20, padding:"6px 12px" }}>
          <span style={{ fontSize:14 }}>⭐</span>
          <span style={{ color:C.gold, fontWeight:700, fontSize:14 }}>{user.points.toLocaleString()}</span>
        </div>
      </div>

      {/* Page content */}
      <div style={{ overflowY:"auto" }}>
        {pages[page] || pages.dashboard}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:430, background:C.white, borderTop:`1px solid ${C.foam}`,
        display:"flex", zIndex:200, paddingBottom:6, boxShadow:"0 -4px 20px rgba(0,0,0,.08)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 4px 6px",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all .15s" }}>
            <span style={{ fontSize:20, filter: page===n.id ? "none" : "grayscale(60%)",
              transform: page===n.id ? "scale(1.18)" : "scale(1)", transition:"transform .15s" }}>
              {n.icon}
            </span>
            <span style={{ fontSize:10, fontWeight: page===n.id ? 700 : 500,
              color: page===n.id ? C.emerald : C.mist, fontFamily:"inherit" }}>
              {n.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
