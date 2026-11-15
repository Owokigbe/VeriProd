(function(){
"use strict";
/* ---------- Brand serial registry. Example brands until real partners join; stands in for brand APIs and our issued serials. ---------- */
const BRANDS = {
  KP:{name:"Kaduna Pharma (example)"}, LF:{name:"Lagoon Foods (example)"}, HB:{name:"Harmattan Beauty (example)"}, ZD:{name:"Zuma Drinks (example)"}
};
const PRODUCTS = {
  P1:{brand:"KP",name:"Paracetamol 500mg tablets, 96 pack",nafdac:"A4-0921 (example)",category:"Medicine"},
  P2:{brand:"LF",name:"Golden Start infant formula 400g",nafdac:"B1-3307 (example)",category:"Baby food"},
  P3:{brand:"HB",name:"Shea butter body lotion 400ml",nafdac:"02-8814 (example)",category:"Cosmetics"},
  P4:{brand:"ZD",name:"Malt Gold 330ml, 6 pack",nafdac:"A1-5520 (example)",category:"Drinks"},
  P5:{brand:"KP",name:"Amoxicillin 500mg capsules, 21 pack",nafdac:"A4-1188 (example)",category:"Medicine"}
};
// prior: scan history the registry already holds for a serial [city, daysAgo]
const UNITS = {
  KP7Q2M4X:{p:"P1",batch:"KP-2609",mfg:"2026-09-02",exp:"2028-08-31",active:true,source:"brand"},
  LF3H8N2C:{p:"P2",batch:"LF-2608",mfg:"2026-08-14",exp:"2027-08-13",active:true,source:"veriprod"},
  HB5T9R1D:{p:"P3",batch:"HB-2607",mfg:"2026-07-21",exp:"2028-07-20",active:true,source:"veriprod"},
  ZD2K6W8P:{p:"P4",batch:"ZD-2610",mfg:"2026-10-05",exp:"2027-04-04",active:true,source:"brand"},
  KP9V3L7A:{p:"P1",batch:"KP-2610",mfg:"2026-10-11",exp:"2028-10-10",active:false,source:"brand"},
  LF8M4Q6Z:{p:"P2",batch:"LF-2311",mfg:"2026-03-11",exp:"2027-03-10",active:true,recalled:"Batch LF-2311 recalled on 4 Nov 2026 for a quality check. Do not feed to a baby.",source:"veriprod"},
  KA4C8T2B:{p:"P5",batch:"KP-2503",mfg:"2025-03-01",exp:"2026-03-01",active:true,source:"brand"},
  HB1X7Y3E:{p:"P3",batch:"HB-2605",mfg:"2026-05-10",exp:"2028-05-09",active:true,source:"veriprod",
    prior:[["Kano",1],["Kano",1],["Aba",2],["Onitsha",2],["Aba",3],["Kano",3],["Onitsha",4],["Lagos",5],["Aba",5],["Kano",6]]}
};
const FREE_SCANS = 3, CLONE_LIMIT = 5, REWARD_POINTS = 20, MONTHLY_REWARD_CAP = 10, REDEEM_AT = 200;
const RADIUS_MI = 20, KM_PER_MI = 1.609344, RADIUS_KM = RADIUS_MI * KM_PER_MI, WINDOW_DAYS = 90;

/* Places used to name a pin and to label the simplified map. [name, lat, lng, level(1 city, 2 area), group] Coordinates are approximate. */
const PLACES = [
  ["Lagos",6.5244,3.3792,1,"Cities"],["Abuja",9.0765,7.3986,1,"Cities"],["Kano",12.0022,8.592,1,"Cities"],["Ibadan",7.3775,3.947,1,"Cities"],
  ["Port Harcourt",4.8156,7.0498,1,"Cities"],["Onitsha",6.1498,6.7857,1,"Cities"],["Aba",5.1066,7.3667,1,"Cities"],["Benin City",6.335,5.6037,1,"Cities"],
  ["Enugu",6.4413,7.4988,1,"Cities"],["Kaduna",10.5105,7.4165,1,"Cities"],["Jos",9.8965,8.8583,1,"Cities"],["Ilorin",8.4966,4.5421,1,"Cities"],
  ["Abeokuta",7.1475,3.3619,1,"Cities"],["Warri",5.5167,5.75,1,"Cities"],["Owerri",5.4836,7.0333,1,"Cities"],["Uyo",5.0377,7.9128,1,"Cities"],
  ["Calabar",4.9757,8.3417,1,"Cities"],["Maiduguri",11.8333,13.15,1,"Cities"],["Sokoto",13.0059,5.2476,1,"Cities"],["Akure",7.2571,5.2058,1,"Cities"],
  ["Osogbo",7.7827,4.5418,1,"Cities"],["Asaba",6.1986,6.7337,1,"Cities"],["Nnewi",6.0105,6.9103,1,"Cities"],["Zaria",11.0855,7.7199,1,"Cities"],
  ["Ikeja",6.6018,3.3515,2,"Lagos areas"],["Yaba",6.5095,3.3711,2,"Lagos areas"],["Surulere",6.501,3.3569,2,"Lagos areas"],["Lagos Island",6.4541,3.3947,2,"Lagos areas"],
  ["Victoria Island",6.4281,3.4219,2,"Lagos areas"],["Lekki",6.4478,3.4723,2,"Lagos areas"],["Ajah",6.4667,3.5667,2,"Lagos areas"],["Ikorodu",6.6194,3.5105,2,"Lagos areas"],
  ["Oshodi",6.555,3.343,2,"Lagos areas"],["Mushin",6.5273,3.354,2,"Lagos areas"],["Agege",6.618,3.3209,2,"Lagos areas"],["Apapa",6.4489,3.359,2,"Lagos areas"],
  ["Festac",6.4667,3.2833,2,"Lagos areas"],["Alaba",6.4622,3.1917,2,"Lagos areas"],["Ojota",6.588,3.379,2,"Lagos areas"],["Egbeda",6.5916,3.2911,2,"Lagos areas"],
  ["Badagry",6.4316,2.8876,2,"Lagos areas"],["Epe",6.5841,3.9834,2,"Lagos areas"],
  ["Garki",9.0336,7.4875,2,"Abuja areas"],["Wuse",9.0667,7.4667,2,"Abuja areas"],["Kubwa",9.1549,7.322,2,"Abuja areas"],["Gwarinpa",9.1099,7.4042,2,"Abuja areas"],["Nyanya",9.0227,7.5612,2,"Abuja areas"]
];
function distKm(la1,ln1,la2,ln2){ const R=6371, r=Math.PI/180, dLa=(la2-la1)*r, dLn=(ln2-ln1)*r;
  const a=Math.sin(dLa/2)**2 + Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLn/2)**2; return 2*R*Math.asin(Math.sqrt(a)); }
function nearest(lat,lng,level){ let best=null, bd=Infinity; for (const p of PLACES){ if (level && p[3]!==level) continue; const d=distKm(lat,lng,p[1],p[2]); if (d<bd){bd=d;best=p;} } return {place:best, km:bd}; }
function areaName(lat,lng){ const n = nearest(lat,lng); if (n.km < 2.5) return n.place[0]; if (n.km < 20) return "near " + n.place[0];
  const c = nearest(lat,lng,1); if (c.km < 80) return "near " + c.place[0]; return lat.toFixed(3) + ", " + lng.toFixed(3); }
function cityOf(lat,lng){ const c = nearest(lat,lng,1); return c.km < 60 ? c.place[0] : null; }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const miles = km => { const m = km / KM_PER_MI; return (m < 10 ? m.toFixed(1) : Math.round(m)) + " mi"; };

/* signed serial: 8-char body + 4-char signature. The signature can be checked without data. */
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function sig(body){ let h = 2166136261; const s = "veriprod-demo-key:" + body;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let out=""; for (let i=0;i<4;i++){ out += ALPH[h % 32]; h = Math.floor(h/32) ^ (h<<7>>>0); h>>>=0; } return out; }
function fullCode(body){ return body + sig(body); }
function pretty(code){ return code.slice(0,4)+"-"+code.slice(4,8)+"-"+code.slice(8,12); }
function normalize(raw){
  let s = String(raw||"").trim();
  const m = s.match(/(?:\/v\/|VP1:)([A-Za-z0-9-]+)/i); if (m) s = m[1];
  return s.toUpperCase().replace(/[^A-Z0-9]/g,"");
}

/* ---------- state ---------- */
const BLANK = () => ({ plan:"free", scansUsed:0, points:0, rewardedSerials:[], rewardsThisMonth:0, accountType:"individual", home:null, redeemed:[] });
const S = { tab:"scan", result:null, db:null, uid:null, profile:BLANK(), myScans:[], myReports:[], allScans:[], reports:[], liveCam:false, camOn:false, dataNote:"" };
function lsGet(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
S.profile = Object.assign(S.profile, lsGet("vp.profile", {}));
S.myScans = lsGet("vp.myScans", []);
S.myReports = lsGet("vp.myReports", []);
S.reports = lsGet("vp.reports", []); // kept on this device until the shared store answers
function saveLocalReports(){ const list = S.reports.slice(0,40);
  try { localStorage.setItem("vp.reports", JSON.stringify(list)); }
  catch(e){ try { localStorage.setItem("vp.reports", JSON.stringify(list.map(r => Object.assign({}, r, {photo:null})))); } catch(e2){} } }

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const naira = n => "₦" + Number(n).toLocaleString("en-NG");
const fmtDate = iso => new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"});
const ago = t => { const m = Math.round((Date.now()-t)/60000); if (m<1) return "just now"; if (m<60) return m+" min ago"; const h=Math.round(m/60); if (h<24) return h+" h ago"; return Math.round(h/24)+" d ago"; };
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const plural = (n, w) => n + " " + w + (n===1 ? "" : "s");
function toast(msg){ document.querySelectorAll(".toast").forEach(t=>t.remove()); const t = document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 3200); }
const ICON = {
  scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/></svg>',
  hotspots:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 4.800-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  history:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  rewards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M4 13h16M12 9c-2-4-6-4-6-1.500S10 9 12 9zm0 0c2-4 6-4 6-1.500S14 9 12 9z"/></svg>',
  account:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.500-4 4.500-6 8-6s6.500 2 8 6" stroke-linecap="round"/></svg>',
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.500 12.500l3 3 6-6.500"/></svg>',
  bad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8.500 8.500l7 7M15.500 8.500l-7 7"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.500v.010"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.500"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>'
};
const PIN_SVG = '<svg viewBox="0 0 32 42"><path d="M16 41S3 26.500 3 15.500A13 13 0 0116 2.500a13 13 0 0113 13C29 26.500 16 41 16 41z" fill="#b4291c" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.500" r="5" fill="#fff"/></svg>';

/* ---------- ads (advertisers fund rewards) ---------- */
const ADS = [
  "<b>Mama's Kitchen Rice</b> · 10% off 50kg bags this week",
  "<b>QuickCredit</b> · Top up airtime in 2 taps",
  "<b>FreshMart</b> · Every pack on our shelves scans genuine",
  "<b>SwiftRide</b> · First trip free in Abuja"
];
let adI = 0; function rotateAd(){ const el = $("#adMsg"); el.style.opacity=0; setTimeout(()=>{ el.innerHTML = ADS[adI++ % ADS.length] + ' <span style="opacity:.6">(example ad)</span>'; el.style.opacity=1; }, 250); }
rotateAd(); setInterval(rotateAd, 7000);

/* ---------- location ---------- */
function locate(){ return new Promise((res, rej) => {
  if (!navigator.geolocation) return rej(new Error("unsupported"));
  const t = setTimeout(()=>rej(new Error("timeout")), 9000);
  try { navigator.geolocation.getCurrentPosition(p => { clearTimeout(t); res({lat:p.coords.latitude, lng:p.coords.longitude}); },
    e => { clearTimeout(t); rej(e); }, {enableHighAccuracy:true, timeout:8000, maximumAge:60000}); } catch(e){ clearTimeout(t); rej(e); }
}); }
function setHome(lat,lng){ S.profile.home = {lat, lng, area: areaName(lat,lng)}; saveProfile(); }

/* ---------- verification (follows the board's scan check logic) ---------- */
function historyFor(code){
  const body = code.slice(0,8), u = UNITS[body];
  const prior = (u && u.prior || []).map(([city,d]) => ({city, at: Date.now() - d*86400000}));
  const live = S.allScans.filter(s => s.code === code && s.uid !== (S.uid || "me"));
  return prior.concat(live);
}
function verify(code){
  const body = code.slice(0,8), signature = code.slice(8);
  const checks = [];
  const okSig = code.length === 12 && sig(body) === signature;
  const unit = okSig ? UNITS[body] : null;
  if (!unit){
    checks.push({s:"f", t: okSig ? "Serial is not in any brand registry" : "Code signature does not match. This code was never issued by a brand or by Veriprod."});
    return {status:"fake", title:"FAKE", sub:"This code was never issued", checks, code};
  }
  const product = PRODUCTS[unit.p], brand = BRANDS[product.brand];
  checks.push({s:"p", t:`Issued by ${brand.name}` + (unit.source==="brand" ? " (read through the brand's serial system)" : " (serial issued by Veriprod)")});
  if (!unit.active){
    checks.push({s:"f", t:"Never activated at the factory. Genuine codes are switched on when cartons are packed."});
    return {status:"fake", title:"FAKE", sub:"This code was never activated", checks, unit, product, brand, code};
  }
  checks.push({s:"p", t:"Activated at the factory"});
  const expired = new Date(unit.exp) < new Date();
  if (unit.recalled || expired){
    checks.push({s:"w", t: unit.recalled ? unit.recalled : `Expired on ${fmtDate(unit.exp)}`});
    return {status:"warn", title:"WARNING", sub: unit.recalled ? "This batch has been recalled" : "This product has expired", checks, unit, product, brand, code};
  }
  checks.push({s:"p", t:"Not expired or recalled"});
  const hist = historyFor(code); const cities = new Set(hist.map(h=>h.city).filter(Boolean));
  if (hist.length >= CLONE_LIMIT || cities.size >= 3){
    checks.push({s:"f", t:`Scanned ${hist.length} times in ${plural(cities.size,"city").replace("citys","cities")} (${[...cities].join(", ")}). One pack should only be scanned in one place.`});
    return {status:"clone", title:"LIKELY CLONE", sub:"Do not buy. This code has been copied.", checks, unit, product, brand, code, hist};
  }
  checks.push({s:"p", t: hist.length ? `Scan history normal (${plural(hist.length,"earlier scan")})` : "First time this pack has been scanned"});
  return {status:"genuine", title:"GENUINE", sub:"Safe to buy", checks, unit, product, brand, code};
}

async function runScan(raw, how){
  const code = normalize(raw);
  if (code.length < 8){ toast("Type the 12-character code printed under the QR"); return; }
  const P = S.profile;
  if (P.plan !== "active" && P.scansUsed >= FREE_SCANS){ openPaywall(); return; }
  const r = verify(code);
  r.how = how; r.at = Date.now(); r.id = rid();
  S.result = r;
  if (P.plan !== "active"){ P.scansUsed++; }
  saveProfile();
  const h = P.home;
  const rec = {id:r.id, code, status:r.status, productId: r.unit ? r.unit.p : null, brand: r.product ? r.product.brand : null,
    lat: h ? +h.lat.toFixed(2) : null, lng: h ? +h.lng.toFixed(2) : null, area: h ? h.area : null, city: h ? cityOf(h.lat,h.lng) : null,
    at:r.at, how, accountType:P.accountType, answer:null};
  S.myScans.unshift(rec); lsSet("vp.myScans", S.myScans.slice(0,100));
  S.tab = "result"; render(); window.scrollTo(0,0);
  if (S.db){
    try { await S.db.collection("scans").doc(r.id).set(Object.assign({uid:S.uid||"anon"}, rec)); }
    catch(e){ console.warn("scan not saved", e); }
  }
}

/* ---------- profile persistence ---------- */
let profileWrite = Promise.resolve();
function saveProfile(){
  lsSet("vp.profile", S.profile); renderPlanChip();
  if (S.db && S.uid){
    const data = JSON.parse(JSON.stringify(S.profile));
    profileWrite = profileWrite.then(()=>S.db.doc("data/users/"+S.uid+"/profile").set(data)).catch(e=>console.warn(e));
  }
}
function renderPlanChip(){
  const P = S.profile, c = $("#planChip");
  if (P.plan === "active"){ c.className="chip ok"; c.textContent = "Subscribed"; }
  else { const left = Math.max(0, FREE_SCANS - P.scansUsed); c.className = "chip" + (left ? "" : " warn"); c.textContent = plural(left, "free scan") + " left"; }
}

/* ---------- camera scanning ---------- */
function camSupported(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  try { const fp = document.featurePolicy || document.permissionsPolicy; if (fp && fp.allowsFeature && !fp.allowsFeature("camera")) return false; } catch(e){}
  return true;
}
S.liveCam = camSupported();
const cam = {stream:null, timer:null, busy:false, canvas:document.createElement("canvas")};
let detector = null;
try { if ("BarcodeDetector" in window) detector = new window.BarcodeDetector({formats:["qr_code"]}); } catch(e){ detector = null; }
function stopCam(){
  if (cam.timer){ clearInterval(cam.timer); cam.timer = null; }
  if (cam.stream){ cam.stream.getTracks().forEach(t=>t.stop()); cam.stream = null; }
  S.camOn = false;
}
async function startCam(){
  let timedOut = false;
  try {
    const stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}, audio:false}),
      new Promise((_, rej) => setTimeout(()=>{ timedOut = true; rej(new Error("timeout")); }, 20000))
    ]);
    if (timedOut){ stream.getTracks().forEach(t=>t.stop()); return; }
    cam.stream = stream; S.camOn = true; S.tab = "scan"; render();
    cam.timer = setInterval(scanFrame, 200);
  } catch(e){
    stopCam(); S.liveCam = false; render();
    toast("Live camera isn't available here. Tap again to take a photo of the code.");
  }
}
function attachCam(){ const v = $("#camVideo"); if (v && cam.stream && v.srcObject !== cam.stream){ v.srcObject = cam.stream; const p = v.play(); if (p && p.catch) p.catch(()=>{}); } }
async function scanFrame(){
  const v = $("#camVideo"); if (!v || v.readyState < 2 || cam.busy || !v.videoWidth) return;
  cam.busy = true;
  try {
    let found = null;
    if (detector){ try { const r = await detector.detect(v); if (r && r[0]) found = r[0].rawValue; } catch(e){} }
    if (!found && typeof jsQR === "function"){
      const s = Math.min(1, 720/Math.max(v.videoWidth, v.videoHeight)), c = cam.canvas;
      c.width = Math.round(v.videoWidth*s); c.height = Math.round(v.videoHeight*s);
      const ctx = c.getContext("2d", {willReadFrequently:true}); ctx.drawImage(v,0,0,c.width,c.height);
      const q = jsQR(ctx.getImageData(0,0,c.width,c.height).data, c.width, c.height, {inversionAttempts:"dontInvert"});
      if (q && q.data) found = q.data;
    }
    if (found && S.camOn){ stopCam(); runScan(found, "qr"); }
  } finally { cam.busy = false; }
}
/* decode a QR from a photo: native detector first, then jsQR at several sizes and crops */
async function decodePhoto(file){
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  try {
    if (detector){ try { const r = await detector.detect(img); if (r && r[0] && r[0].rawValue) return r[0].rawValue; } catch(e){} }
    if (typeof jsQR !== "function") throw new Error("noscanner");
    const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement("canvas"), ctx = c.getContext("2d", {willReadFrequently:true});
    const tries = [[0,0,1,1,1000],[0,0,1,1,600],[.15,.15,.7,.7,900],[0,0,1,1,1600],[.25,.25,.5,.5,800],[0,0,.6,.6,800],[.4,0,.6,.6,800],[0,.4,.6,.6,800],[.4,.4,.6,.6,800]];
    for (const [fx,fy,fw,fh,maxSide] of tries){
      const sx = W*fx, sy = H*fy, sw = W*fw, sh = H*fh, s = Math.min(1, maxSide/Math.max(sw,sh));
      c.width = Math.max(1, Math.round(sw*s)); c.height = Math.max(1, Math.round(sh*s));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      const q = jsQR(ctx.getImageData(0,0,c.width,c.height).data, c.width, c.height, {inversionAttempts:"attemptBoth"});
      if (q && q.data) return q.data;
    }
    return null;
  } finally { URL.revokeObjectURL(img.src); }
}
async function onQrFile(e){
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  toast("Reading the code…");
  try {
    const found = await decodePhoto(f);
    if (found) runScan(found, "qr"); else toast("No QR code found in that photo. Fill the frame with the code and try again, or type the code.");
  } catch(err){ toast(err && err.message === "noscanner" ? "The scanner didn't load. Type the code instead." : "That photo couldn't be read. Try again or type the code."); }
}
$("#qrFileCam").addEventListener("change", onQrFile);
$("#qrFilePick").addEventListener("change", onQrFile);

/* ---------- maps ---------- */
const hasMap = () => typeof L !== "undefined";
let tilesProbe = null;
function tilesAvailable(){ if (!tilesProbe) tilesProbe = new Promise(res => { const im = new Image(), t = setTimeout(()=>res(false), 5000);
  im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = "https://tile.openstreetmap.org/0/0/0.png"; }); return tilesProbe; }
function baseMap(el, center, zoom, noteEl){
  const map = L.map(el, {attributionControl:false, zoomControl:true, minZoom:5, maxZoom:18, zoomAnimation:false, markerZoomAnimation:false, zoomSnap:0.25}).setView(center, zoom);
  let alive = true; map.on("unload", () => { alive = false; });
  const labelLayer = L.layerGroup().addTo(map);
  const labels = PLACES.map(p => ({p, m:L.marker([p[1],p[2]], {interactive:false, keyboard:false, icon:L.divIcon({className:"plabel"+(p[3]===1?" city":""), html:"<span>"+esc(p[0])+"</span>", iconSize:[0,0]})}).addTo(labelLayer)}));
  // hide labels that would overlap one already shown; cities come first in PLACES so they win
  const declutter = () => { const placed = [], z = map.getZoom();
    labels.forEach(({p,m}) => { const el = m.getElement(); if (!el) return;
      const pt = map.latLngToContainerPoint([p[1],p[2]]), w = p[0].length*(p[3]===1 ? 7.4 : 6.4) + 10, h = 18;
      const box = [pt.x-w/2, pt.y-h/2, pt.x+w/2, pt.y+h/2];
      const hide = (p[3]===2 && z < 8) || placed.some(b => box[0]<b[2] && box[2]>b[0] && box[1]<b[3] && box[3]>b[1]);
      el.style.display = hide ? "none" : ""; if (!hide) placed.push(box); }); };
  map.on("zoomend moveend resize", declutter); declutter();
  tilesAvailable().then(ok => { if (!alive) return;
    if (ok){ L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19}).addTo(map); L.control.attribution({prefix:false}).addAttribution("© OpenStreetMap contributors").addTo(map);
      map.off("zoomend moveend resize", declutter); labelLayer.remove(); if (noteEl) noteEl.hidden = true; }
    else if (noteEl) noteEl.hidden = false; });
  return map;
}
const placeOptions = () => { const groups = {}; PLACES.forEach((p,i) => (groups[p[4]] = groups[p[4]] || []).push([i,p[0]]));
  return Object.entries(groups).map(([g,list]) => `<optgroup label="${esc(g)}">${list.sort((a,b)=>a[1].localeCompare(b[1])).map(([i,n])=>`<option value="${i}">${esc(n)}</option>`).join("")}</optgroup>`).join(""); };
function pinControls(id){ return `
  <div class="map" id="${id}Map"></div>
  <p class="small muted" id="${id}Note" hidden>Simplified map. Street detail could not load here.</p>
  <p class="small" id="${id}Lbl" aria-live="polite"></p>
  <div class="row"><button type="button" class="btn ghost" id="${id}Gps">Use my location</button>
  <select id="${id}Jump" aria-label="Jump to an area"><option value="">Jump to an area…</option>${placeOptions()}</select></div>`; }
function wirePin(root, id, start){
  let pin = start ? {lat:start.lat, lng:start.lng} : null, marker = null;
  const lbl = root.querySelector("#"+id+"Lbl"), mapEl = root.querySelector("#"+id+"Map");
  const map = hasMap() ? baseMap(mapEl, pin ? [pin.lat,pin.lng] : [9.08,8.68], pin ? 12 : 6, root.querySelector("#"+id+"Note")) : null;
  if (!map) mapEl.hidden = true;
  function set(lat, lng, zoom){
    pin = {lat, lng};
    if (map){
      if (!marker){ marker = L.marker([lat,lng], {draggable:true, keyboard:false, icon:L.divIcon({className:"pin", html:PIN_SVG, iconSize:[32,42], iconAnchor:[16,41]})}).addTo(map);
        marker.on("dragend", () => { const p = marker.getLatLng(); set(p.lat, p.lng); }); }
      else marker.setLatLng([lat,lng]);
      if (zoom) map.setView([lat,lng], Math.max(map.getZoom(), zoom), {animate:false});
    }
    lbl.innerHTML = "Pin dropped: <b>" + esc(cap(areaName(lat,lng))) + "</b>. Tap the map or drag the pin to move it.";
  }
  if (pin) set(pin.lat, pin.lng); else lbl.textContent = map ? "Tap the map to drop a pin." : "Pick an area or use your location.";
  if (map) map.on("click", e => set(e.latlng.lat, e.latlng.lng));
  root.querySelector("#"+id+"Gps").onclick = () => { locate().then(p => set(p.lat, p.lng, 14)).catch(() => toast("Your location isn't available here. Tap the map or pick an area.")); };
  root.querySelector("#"+id+"Jump").onchange = e => { const p = PLACES[+e.target.value]; if (e.target.value !== "" && p) set(p[1], p[2], p[3]===1 ? 11 : 13); };
  return {get:() => pin, destroy:() => { if (map){ map.stop(); map.remove(); } }};
}

/* ---------- hotspots ---------- */
function signals(){
  const cutoff = Date.now() - WINDOW_DAYS*86400000, out = [], reportedScans = new Set();
  S.reports.forEach(r => { if (r.scanId) reportedScans.add(r.scanId);
    if (r.lat != null && r.at >= cutoff) out.push({lat:r.lat, lng:r.lng, at:r.at, kind:"report", example:!!r.example}); });
  const scans = S.db ? S.allScans : S.myScans;
  scans.forEach(s => { if (s.lat != null && s.at >= cutoff && (s.status === "fake" || s.status === "clone") && !reportedScans.has(s.id)) out.push({lat:s.lat, lng:s.lng, at:s.at, kind:"scan"}); });
  return out;
}
function hotspots(){
  const h = S.profile.home; if (!h) return [];
  const clusters = [];
  signals().filter(s => distKm(h.lat,h.lng,s.lat,s.lng) <= RADIUS_KM).forEach(s => {
    let c = clusters.find(c => distKm(c.lat,c.lng,s.lat,s.lng) <= 2);
    if (!c){ c = {lat:s.lat, lng:s.lng, n:0, reports:0, scans:0, last:0, example:true}; clusters.push(c); }
    c.lat = (c.lat*c.n + s.lat)/(c.n+1); c.lng = (c.lng*c.n + s.lng)/(c.n+1); c.n++;
    if (s.kind === "report") c.reports++; else c.scans++;
    c.last = Math.max(c.last, s.at); if (!s.example) c.example = false;
  });
  clusters.forEach(c => { c.name = cap(areaName(c.lat,c.lng)); c.km = distKm(h.lat,h.lng,c.lat,c.lng); });
  return clusters.sort((a,b) => b.n - a.n || a.km - b.km);
}
const hotDetail = c => [c.reports ? plural(c.reports,"report") : "", c.scans ? plural(c.scans,"fake scan") : ""].filter(Boolean).join(" · ");
let hot = null;
function initHot(){
  const h = S.profile.home, el = $("#hotMap"); if (!el) return;
  if (!hasMap()){ el.hidden = true; updateHot(); return; }
  const map = baseMap(el, [h.lat,h.lng], 10, $("#hotNote"));
  const ring = L.circle([h.lat,h.lng], {radius:RADIUS_KM*1000, className:"ring", interactive:false}).addTo(map);
  map.fitBounds(ring.getBounds(), {padding:[6,6]});
  L.marker([h.lat,h.lng], {interactive:false, keyboard:false, icon:L.divIcon({className:"you", html:"<span></span>", iconSize:[16,16], iconAnchor:[8,8]})}).addTo(map);
  hot = {map, layer:L.layerGroup().addTo(map), list:[]};
  updateHot();
}
function updateHot(){
  const listEl = $("#hotList"); if (!listEl) return;
  const list = hotspots();
  if (hot){ hot.layer.clearLayers(); hot.list = list;
    list.forEach(c => L.circleMarker([c.lat,c.lng], {radius:7 + 4*Math.sqrt(c.n), className:"hot"}).bindPopup("<b>"+esc(c.name)+"</b><br>"+esc(hotDetail(c))).addTo(hot.layer)); }
  listEl.innerHTML = list.length ? `<div class="list">${list.map((c,i) => `<button class="item" data-hot="${i}">
      <span class="count" aria-hidden="true">${c.n}</span>
      <span class="grow"><span class="t" style="display:block">${esc(c.name)}</span><span class="small muted">${esc(hotDetail(c))} · last ${ago(c.last)}${c.example ? " · example data" : ""}</span></span>
      <span class="dist">${miles(c.km)}</span></button>`).join("")}</div>`
    : `<div class="empty">No fakes reported within ${RADIUS_MI} miles in the last ${WINDOW_DAYS} days.<br>If you see one, report it from the home screen.</div>`;
  const note = $("#hotData"); if (note){ note.hidden = !S.dataNote; note.textContent = S.dataNote; }
}

/* ---------- views ---------- */
function vScan(){
  const corners = '<span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>';
  let finder;
  if (S.camOn) finder = `<div class="viewfinder live">${corners}<video id="camVideo" playsinline muted autoplay aria-label="Camera view"></video><button class="btn" id="camStop">Cancel</button></div>
      <p class="alt">Hold the QR code inside the frame.</p>`;
  else if (S.liveCam) finder = `<button class="viewfinder" id="camStart">${corners}<span class="vf-text">${ICON.camera}<span>Tap to scan the QR code</span><span class="small" style="opacity:.8;font-weight:400">Uses your camera.</span></span></button>
      <p class="alt">Camera not working? <label for="qrFilePick">Use a photo of the code</label></p>`;
  else finder = `<label class="viewfinder" for="qrFileCam">${corners}<span class="vf-text">${ICON.camera}<span>Tap to take a photo of the QR code</span><span class="small" style="opacity:.8;font-weight:400">Get close so the code fills most of the photo.</span></span></label>
      <p class="alt">Already have a picture? <label for="qrFilePick">Choose a photo</label></p>`;
  return `
  <section class="scanhero" aria-labelledby="h-scan">
    <h2 id="h-scan">Check it before you pay</h2>
    <p style="opacity:.9">Scan the Veriprod QR on the pack. Medicine, baby food, drinks and cosmetics from partner brands.</p>
    ${finder}
  </section>
  <section class="card" aria-labelledby="h-type">
    <h3 id="h-type">No camera or no data?</h3>
    <form class="codeentry" id="codeForm" autocomplete="off">
      <input type="text" id="codeInput" placeholder="XXXX-XXXX-XXXX" aria-label="Code printed under the QR" maxlength="16">
      <button class="btn primary" type="submit">Check</button>
    </form>
    <p class="small muted">Type the 12-character code printed under the QR. Without data, dial <span class="mono">*000*code#</span> on any phone.</p>
  </section>
  <section class="card" aria-labelledby="h-rep">
    <h3 id="h-rep">Seen a product that looks fake?</h3>
    <p class="small muted">Report it with a photo and a pin on the map, even if it has no code. Reports go to the brand and NAFDAC.</p>
    <button class="btn danger block" id="homeReport">${ICON.flag} Report a product</button>
  </section>`;
}

function vResult(){
  const r = S.result; if (!r) return vScan();
  const cls = r.status==="genuine" ? "good" : r.status==="warn" ? "warn" : "bad";
  const icon = r.status==="genuine" ? ICON.ok : r.status==="warn" ? ICON.warn : ICON.bad;
  const P = S.profile;
  const rec = S.myScans.find(s=>s.id===r.id);
  let follow = "";
  if (r.status === "genuine"){
    if (P.accountType === "business"){
      follow = `<section class="card"><h3>Logged as a stock check</h3><p class="small muted">Business accounts verify stock without earning rewards, so shop scans don't count as purchases.</p></section>`;
    } else if (rec && rec.answer){
      follow = `<section class="card"><h3>Thanks for answering</h3><p class="small muted">You said: <b>${esc(rec.answer)}</b>. ${rec.rewarded ? `+${REWARD_POINTS} points added.` : "No points this time (one reward per pack, " + MONTHLY_REWARD_CAP + " a month)."}</p></section>`;
    } else {
      const canReward = !P.rewardedSerials.includes(r.code) && P.rewardsThisMonth < MONTHLY_REWARD_CAP;
      follow = `<section class="card" aria-labelledby="h-q">
        <h3 id="h-q">Quick question${canReward ? ` · earn ${REWARD_POINTS} points` : ""}</h3>
        <p class="small muted">What did you do with this pack? It helps the brand spot where genuine stock sells.</p>
        <div class="qopts">
          <button class="btn ghost" data-ans="Bought it">I bought it</button>
          <button class="btn ghost" data-ans="Did not buy it">I didn't buy it</button>
          <button class="btn ghost" data-ans="Already using it">I'm already using it</button>
        </div></section>`;
    }
  } else {
    follow = `<section class="card" aria-labelledby="h-rep">
      <h3 id="h-rep">${r.status==="warn" ? "Report where you found it" : "Report this seller"}</h3>
      <p class="small muted">Your report goes to ${r.brand ? esc(r.brand.name) : "the brand"} and NAFDAC with a photo and a pin on the map.</p>
      <button class="btn danger block" id="openReport">${ICON.flag} Report with photo and pin</button></section>`;
  }
  return `
  <section class="verdict ${cls}" aria-live="polite">
    <div class="big">${icon}<span>${r.title}</span></div>
    <p><b>${esc(r.sub)}</b></p>
    <span class="mono small" style="color:var(--ink);opacity:.75">${pretty(r.code.padEnd(12,"·"))}</span>
  </section>
  ${r.product ? `<section class="card"><h3>${esc(r.product.name)}</h3>
    <dl class="kv"><dt>Brand</dt><dd>${esc(r.brand.name)}</dd><dt>Category</dt><dd>${esc(r.product.category)}</dd>
    <dt>NAFDAC no.</dt><dd class="mono">${esc(r.product.nafdac)}</dd><dt>Batch</dt><dd class="mono">${esc(r.unit.batch)}</dd>
    <dt>Made</dt><dd>${fmtDate(r.unit.mfg)}</dd><dt>Expires</dt><dd>${fmtDate(r.unit.exp)}</dd></dl></section>` : ""}
  <section class="card"><h3>What we checked</h3>
    <ul class="checks">${r.checks.map(c=>`<li><span class="dot ${c.s}">${c.s==="p"?"✓":c.s==="f"?"✕":"!"}</span><span>${esc(c.t)}</span></li>`).join("")}</ul></section>
  ${follow}
  <button class="btn primary block" id="scanAgain">Scan another product</button>`;
}

function statusChip(s){ return s==="genuine" ? '<span class="chip ok">Genuine</span>' : s==="warn" ? '<span class="chip warn">Warning</span>' : s==="clone" ? '<span class="chip bad">Likely clone</span>' : s==="reported" ? '<span class="chip">Reported</span>' : '<span class="chip bad">Fake</span>'; }

function vHotspots(){
  const h = S.profile.home;
  if (!h) return `<h2>Hotspots near you</h2>
    <section class="card"><h3>Where are you?</h3>
      <p class="small muted">Set your location to see where fakes have been reported within ${RADIUS_MI} miles of you.</p>
      <button class="btn primary block" id="useGps">Use my location</button>
      <button class="btn ghost block" id="pickHome">Set it on the map</button></section>`;
  return `<div><h2>Hotspots near you</h2>
    <p class="small muted" style="margin-top:6px">Fakes reported or scanned within ${RADIUS_MI} miles of <b>${esc(h.area)}</b> in the last ${WINDOW_DAYS} days. <button class="link" id="pickHome">Change location</button></p></div>
  <div class="map tall" id="hotMap" aria-label="Map of hotspots within ${RADIUS_MI} miles"></div>
  <p class="small muted" id="hotNote" hidden>Simplified map. Street detail could not load here.</p>
  <section class="card" id="hotList" aria-label="Hotspot areas"></section>
  <p class="notice" id="hotData" hidden></p>`;
}

function vHistory(){
  const L1 = S.myScans, L2 = S.myReports;
  return `<h2>My scans</h2>
  <section class="card">${L1.length ? `<div class="list">${L1.map(s=>{ const p = s.productId && PRODUCTS[s.productId];
    return `<div class="item"><div class="grow"><div class="t">${esc(p ? p.name : "Unknown product")}</div>
      <div class="small muted"><span class="mono">${pretty(s.code)}</span> · ${esc(s.area ? cap(s.area) : "Location not set")} · ${ago(s.at)}</div></div>${statusChip(s.status)}</div>`; }).join("")}</div>`
    : `<div class="empty">Nothing scanned yet. Your checks will show here.</div>`}</section>
  <h2>My reports</h2>
  <section class="card">${L2.length ? `<div class="list">${L2.map(r=>`<div class="item"><div class="grow"><div class="t">${esc(r.productName || "Unknown product")}</div>
      <div class="small muted">${esc(cap(r.area || "No pin"))} · ${ago(r.at)}</div></div><span class="chip ok">Sent</span></div>`).join("")}</div>`
    : `<div class="empty">No reports yet. Report a suspicious product from the home screen.</div>`}</section>`;
}

function vRewards(){
  const P = S.profile, pct = Math.min(100, Math.round(P.points / REDEEM_AT * 100));
  return `<h2>Rewards</h2>
  <section class="card">
    <div class="row" style="align-items:flex-end"><div><div class="muted small">Your points</div><div class="price" style="font-variant-numeric:tabular-nums">${P.points}</div></div>
    <div class="small muted" style="text-align:right">1 point = ₦1<br>Cash out from ${REDEEM_AT}</div></div>
    <div class="bar"><div class="track"><div class="fill" style="width:${pct}%;background:var(--brand)"></div></div></div>
    <div class="row">
      <button class="btn primary" data-redeem="Airtime" ${P.points<REDEEM_AT?"disabled":""}>Get ₦${REDEEM_AT} airtime</button>
      <button class="btn ghost" data-redeem="Data" ${P.points<REDEEM_AT?"disabled":""}>Get ₦${REDEEM_AT} data</button>
    </div>
  </section>
  <section class="card"><h3>How to earn</h3>
    <ul class="checks"><li><span class="dot p">1</span><span>Scan a pack before you pay.</span></li>
    <li><span class="dot p">2</span><span>Answer the quick question after a genuine result: ${REWARD_POINTS} points.</span></li>
    <li><span class="dot p">3</span><span>One reward per pack, up to ${MONTHLY_REWARD_CAP} a month (${P.rewardsThisMonth} used). Business accounts don't earn rewards.</span></li></ul>
    <p class="notice">Rewards are paid from advertising on the app. Airtime and data top-ups are simulated for now.</p>
  </section>
  ${P.redeemed.length ? `<section class="card"><h3>Cashed out</h3><div class="list">${P.redeemed.map(r=>`<div class="item"><div class="grow"><div class="t">${naira(r.amount)} ${esc(r.kind.toLowerCase())}</div><div class="small muted">${ago(r.at)}</div></div><span class="chip ok">Sent (simulated)</span></div>`).join("")}</div></section>` : ""}`;
}

function vAccount(){
  const P = S.profile, h = P.home;
  return `<h2>Account</h2>
  <section class="card"><h3>Subscription</h3>
    ${P.plan==="active" ? `<p><span class="chip ok">Active</span> Unlimited scans for ${naira(500)} a month.</p><button class="btn ghost" id="cancelSub">Cancel subscription</button>`
     : `<p>${Math.max(0,FREE_SCANS-P.scansUsed)} of ${FREE_SCANS} free scans left.</p><button class="btn primary" id="openPay">Subscribe for ${naira(500)} a month</button>`}
  </section>
  <section class="card"><h3>Account type</h3>
    <div class="seg" role="group" aria-label="Account type">
      <button data-acct="individual" aria-pressed="${P.accountType==="individual"}">Individual</button>
      <button data-acct="business" aria-pressed="${P.accountType==="business"}">Business</button></div>
    <p class="small muted">${P.accountType==="business" ? "For shops and pharmacies checking stock. Scans are logged as stock checks and don't earn rewards." : "For shoppers checking before they buy. Earn rewards for answering post-scan questions."}</p>
  </section>
  <section class="card"><h3>My location</h3>
    <p class="small muted">${h ? `Set to <b>${esc(h.area)}</b>. Used for hotspots near you. Scans send only a rough location.` : "Not set. Set it to see hotspots near you."}</p>
    <div class="row"><button class="btn ghost" id="useGps">Use my location</button><button class="btn ghost" id="pickHome">Set it on the map</button></div></section>
  <section class="card"><h3>About this prototype</h3>
    <p class="small muted">Brands, products and codes are made-up examples for testing. Payments, airtime, USSD and NAFDAC reports are simulated. Each code carries a signature, so a forged code fails even without data.</p>
    <button class="btn ghost" id="resetDemo">Reset my data on this app</button></section>`;
}

/* ---------- sheets ---------- */
function sheet(html){ const o = document.createElement("div"); o.className="overlay"; o.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  o.close = () => { if (o.onclose) o.onclose(); o.remove(); };
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) o.close(); }); document.body.appendChild(o); return o; }
function openPaywall(){
  const o = sheet(`<h2>Keep checking for ${naira(500)} a month</h2>
    <p class="muted">You've used your ${FREE_SCANS} free scans. Subscribe for unlimited checks on every partner product.</p>
    <ul class="checks"><li><span class="dot p">✓</span><span>Unlimited QR, typed and USSD checks</span></li><li><span class="dot p">✓</span><span>Earn airtime and data for quick questions</span></li><li><span class="dot p">✓</span><span>Report fakes straight to brands and NAFDAC</span></li></ul>
    <label class="field" for="payMethod">Pay with<select id="payMethod"><option>Card</option><option>Bank transfer</option><option>Airtime</option></select></label>
    <button class="btn primary block" id="confirmPay">Pay ${naira(500)} (simulated, no charge)</button>
    <button class="btn ghost block" data-close>Not now</button>`);
  o.querySelector("#confirmPay").onclick = () => { S.profile.plan = "active"; saveProfile(); o.close(); toast("Subscribed. Unlimited scans unlocked."); render(); };
}
function openHomePicker(){
  const o = sheet(`<h2>Where are you?</h2>
    <p class="small muted">Drop a pin on your area. Hotspots are shown within ${RADIUS_MI} miles of it.</p>
    ${pinControls("home")}
    <p class="err" id="homeErr" hidden>Drop a pin first.</p>
    <button class="btn primary block" id="saveHome">Save location</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  const pc = wirePin(o, "home", S.profile.home); o.onclose = pc.destroy;
  o.querySelector("#saveHome").onclick = () => { const p = pc.get(); if (!p){ o.querySelector("#homeErr").hidden = false; return; }
    setHome(p.lat, p.lng); o.close(); toast("Location set: " + S.profile.home.area); render(); };
}
function openReport(fromResult){
  const r = fromResult ? S.result : null;
  const o = sheet(`<h2>${r ? "Report this seller" : "Report a product"}</h2>
    ${r ? `<p class="small muted">${r.product ? esc(r.product.name) : "Unknown product"} · <span class="mono">${pretty(r.code)}</span></p>`
        : `<label class="field" for="repProduct">Product name<input type="text" id="repProduct" placeholder="e.g. Paracetamol 500mg tablets" maxlength="120"></label>
           <label class="field" for="repCode">Code on the pack (optional)<input type="text" id="repCode" class="mono" placeholder="XXXX-XXXX-XXXX" maxlength="16"></label>`}
    <label class="btn ghost block" for="repPhoto" style="cursor:pointer">${ICON.camera} Add a photo of the product</label>
    <input type="file" id="repPhoto" class="vh" accept="image/*" tabindex="-1">
    <img id="repPrev" class="photo-prev" alt="Photo preview" hidden>
    <div><h3>Where did you see it?</h3><p class="small muted">Drop a pin on the shop or market.</p></div>
    ${pinControls("rep")}
    <label class="field" for="repSeller">Shop or seller name (optional)<input type="text" id="repSeller" placeholder="e.g. stall 14, main gate" maxlength="120"></label>
    <label class="field" for="repNotes">What did you notice? (optional)<textarea id="repNotes" placeholder="Price, packaging, seal..." maxlength="500"></textarea></label>
    <p class="err" id="repErr" hidden></p>
    <button class="btn danger block" id="sendRep">Send report</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  const pc = wirePin(o, "rep", S.profile.home); o.onclose = pc.destroy;
  let photo = null;
  o.querySelector("#repPhoto").onchange = async e => { const f = e.target.files[0]; if (!f) return; photo = await shrink(f, 520); const im = o.querySelector("#repPrev"); if (photo){ im.src = photo; im.hidden = false; } };
  o.querySelector("#sendRep").onclick = async () => {
    const err = o.querySelector("#repErr"), pin = pc.get(); err.hidden = true;
    const name = r ? (r.product ? r.product.name : "Unknown product") : o.querySelector("#repProduct").value.trim().slice(0,120);
    if (!name){ err.textContent = "Add the product name."; err.hidden = false; return; }
    if (!pin){ err.textContent = "Drop a pin where you saw it."; err.hidden = false; return; }
    const code = r ? r.code : normalize(o.querySelector("#repCode").value);
    const rep = {id:rid(), scanId: r ? r.id : null, code: code || null, status: r ? r.status : "reported", productName:name,
      brand: r && r.product ? r.product.brand : null, productId: r && r.unit ? r.unit.p : null,
      seller:o.querySelector("#repSeller").value.trim().slice(0,120), notes:o.querySelector("#repNotes").value.trim().slice(0,500),
      lat:+pin.lat.toFixed(5), lng:+pin.lng.toFixed(5), area:areaName(pin.lat,pin.lng), photo, at:Date.now(), uid:S.uid||"anon"};
    o.querySelector("#sendRep").disabled = true;
    let saved = false;
    if (S.db){ try { await S.db.collection("reports").doc(rep.id).set(rep); saved = true; } catch(e){ console.warn(e); } }
    if (!saved){ S.reports.unshift(rep); saveLocalReports(); }
    S.myReports.unshift({id:rep.id, productName:name, area:rep.area, at:rep.at}); lsSet("vp.myReports", S.myReports.slice(0,50));
    o.close(); toast("Report sent. Thank you for keeping your market safe."); render();
  };
}
function shrink(file, maxW){ return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, maxW/img.width); const c = document.createElement("canvas");
  c.width = Math.round(img.width*s); c.height = Math.round(img.height*s); c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg",0.7)); };
  img.onerror = () => res(null); img.src = URL.createObjectURL(file); }); }

/* ---------- render ---------- */
const TABS = [["scan","Scan"],["hotspots","Hotspots"],["history","History"],["rewards","Rewards"],["account","Account"]];
function render(){
  if (hot){ hot.map.stop(); hot.map.remove(); hot = null; }
  if (S.camOn && S.tab !== "scan") stopCam();
  const map = {scan:vScan, result:vResult, hotspots:vHotspots, history:vHistory, rewards:vRewards, account:vAccount};
  $("#view").innerHTML = (map[S.tab] || vScan)();
  const active = S.tab === "result" ? "scan" : S.tab;
  $("#tabs").innerHTML = TABS.map(([k,l]) => `<button data-tab="${k}" ${k===active?'aria-current="page"':""}>${ICON[k]}<span>${l}</span></button>`).join("");
  if (S.tab === "scan" && S.camOn) attachCam();
  if (S.tab === "hotspots" && S.profile.home) initHot();
  renderPlanChip();
}
function useGps(){ toast("Finding your location…");
  locate().then(p => { setHome(p.lat, p.lng); toast("Location set: " + S.profile.home.area); render(); })
    .catch(() => { toast("Your location isn't available here. Set it on the map."); openHomePicker(); }); }

document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.tab){ S.tab = t.dataset.tab; render(); window.scrollTo(0,0); return; }
  if (t.id === "camStart"){ startCam(); return; }
  if (t.id === "camStop"){ stopCam(); render(); return; }
  if (t.id === "scanAgain"){ S.tab = "scan"; render(); window.scrollTo(0,0); return; }
  if (t.id === "homeReport"){ openReport(false); return; }
  if (t.id === "openReport"){ openReport(true); return; }
  if (t.id === "openPay"){ openPaywall(); return; }
  if (t.id === "useGps"){ useGps(); return; }
  if (t.id === "pickHome"){ openHomePicker(); return; }
  if (t.dataset.hot && hot){ const c = hot.list[+t.dataset.hot]; if (c){ hot.map.setView([c.lat,c.lng], 13, {animate:false}); $("#hotMap").scrollIntoView({block:"center", behavior:"smooth"}); } return; }
  if (t.id === "cancelSub"){ S.profile.plan = "free"; saveProfile(); render(); toast("Subscription cancelled"); return; }
  if (t.id === "resetDemo"){ S.profile = BLANK(); S.myScans = []; S.myReports = []; lsSet("vp.myScans",[]); lsSet("vp.myReports",[]); if (!S.db){ S.reports = []; saveLocalReports(); } saveProfile(); render(); toast("Your data on this app was reset"); return; }
  if (t.dataset.acct){ S.profile.accountType = t.dataset.acct; saveProfile(); render(); return; }
  if (t.dataset.redeem){ const P = S.profile; if (P.points < REDEEM_AT) return; P.points -= REDEEM_AT; P.redeemed.unshift({kind:t.dataset.redeem, amount:REDEEM_AT, at:Date.now()}); saveProfile(); render(); toast(`${naira(REDEEM_AT)} ${t.dataset.redeem.toLowerCase()} sent (simulated)`); return; }
  if (t.dataset.ans){
    const r = S.result, P = S.profile, rec = S.myScans.find(s=>s.id===r.id); if (!rec) return;
    rec.answer = t.dataset.ans;
    const can = !P.rewardedSerials.includes(r.code) && P.rewardsThisMonth < MONTHLY_REWARD_CAP;
    if (can){ P.points += REWARD_POINTS; P.rewardedSerials.push(r.code); P.rewardsThisMonth++; rec.rewarded = true; toast(`+${REWARD_POINTS} points`); }
    lsSet("vp.myScans", S.myScans); saveProfile(); render();
    if (S.db) S.db.collection("scans").doc(r.id).update({answer: rec.answer}).catch(err=>console.warn(err));
    return;
  }
});
document.addEventListener("submit", e => { if (e.target.id==="codeForm"){ e.preventDefault(); runScan($("#codeInput").value, "typed"); } });

render();

/* ---------- shared store: scans and reports, for clone checks and hotspots ---------- */
let booted = false;
async function boot(){
  if (booted || !window.claude || !window.claude.use) return; booted = true;
  try {
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db) return;
    S.db = db; S.uid = user ? await user.id() : null;
    if (S.uid){
      try { const snap = await db.doc("data/users/"+S.uid+"/profile").get();
        if (snap.exists){ S.profile = Object.assign(BLANK(), S.profile, snap.data()); lsSet("vp.profile", S.profile); } else saveProfile(); } catch(e){}
    }
    const refresh = () => { if (S.tab === "hotspots") updateHot(); };
    const timer = setTimeout(()=>{ S.dataNote = "Live reports can't be reached yet. Showing what is saved on this phone."; refresh(); }, 10000);
    db.collection("scans").orderBy("at","desc").limit(500).onSnapshot(q => { S.allScans = q.docs.map(d => d.data()); refresh(); }, err => console.warn(err));
    db.collection("reports").orderBy("at","desc").limit(300).onSnapshot(q => {
      if (!q.metadata.fromCache){ clearTimeout(timer); S.dataNote = ""; }
      S.reports = q.docs.map(d => d.data()); refresh();
    }, err => { clearTimeout(timer); console.warn(err); });
    if (!document.querySelector(".overlay") && !S.camOn) render();
  } catch(e){ console.warn("store unavailable", e); }
}
boot(); setTimeout(boot, 1200);

/* ---------- offline support ---------- */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){ try { navigator.serviceWorker.register("sw.js").catch(()=>{}); } catch(e){} }
})();
