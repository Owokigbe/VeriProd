(function(){
"use strict";

/* =====================================================================
   Registry. Test data that stands in for brand serial systems and for
   the serials Veriprod issues. A real backend replaces this section.
   ===================================================================== */
const BRANDS = {
  KP:{name:"Kaduna Pharma"}, LF:{name:"Lagoon Foods"}, HB:{name:"Harmattan Beauty"}, ZD:{name:"Zuma Drinks"}
};
const PRODUCTS = {
  P1:{brand:"KP", name:"Paracetamol 500mg tablets", unit:"box", units:"boxes", packName:"carton", nafdac:"A4-0921", category:"Medicine"},
  P2:{brand:"LF", name:"Golden Start infant formula 400g", unit:"tin", units:"tins", packName:"carton", nafdac:"B1-3307", category:"Baby food"},
  P3:{brand:"HB", name:"Shea butter body lotion 400ml", unit:"bottle", units:"bottles", packName:"carton", nafdac:"02-8814", category:"Cosmetics"},
  P4:{brand:"ZD", name:"Malt Gold 330ml", unit:"can", units:"cans", packName:"pack", nafdac:"A1-5520", category:"Drinks"},
  P5:{brand:"KP", name:"Amoxicillin 500mg capsules", unit:"box", units:"boxes", packName:"carton", nafdac:"A4-1188", category:"Medicine"}
};
/* One entry per pack. Every item inside has its own code, and the pack has a code too.
   sample: what other people have already done with the items (stands in for server history).
   clones: scan history of one item that has been copied, as [city, daysAgo]. */
const PACKS = {
  KP7Q2M:{p:"P1", size:10, batch:"KP-2609", mfg:"2026-09-02", exp:"2028-08-31", active:true, source:"brand",
          sample:{biz:{city:"Lagos", days:6}, indScan:[3], indBought:[5], used:[1,2]}},
  LF3H8N:{p:"P2", size:12, batch:"LF-2608", mfg:"2026-08-14", exp:"2027-08-13", active:true, source:"veriprod"},
  ZD2K6W:{p:"P4", size:6,  batch:"ZD-2610", mfg:"2026-10-05", exp:"2027-04-04", active:true, source:"brand",
          sample:{indScan:[4], indBought:[2]}},
  HB5T9R:{p:"P3", size:1,  batch:"HB-2607", mfg:"2026-07-21", exp:"2028-07-20", active:true, source:"veriprod"},
  HB7X3E:{p:"P3", size:12, batch:"HB-2605", mfg:"2026-05-10", exp:"2028-05-09", active:true, source:"veriprod",
          sample:{biz:{city:"Kano", days:20}},
          clones:{3:[["Kano",1],["Kano",1],["Aba",2],["Onitsha",2],["Aba",3],["Kano",3],["Onitsha",4],["Lagos",5],["Aba",5],["Kano",6]]}},
  KP9V3L:{p:"P1", size:10, batch:"KP-2610", mfg:"2026-10-11", exp:"2028-10-10", active:false, source:"brand"},
  LF8M4Q:{p:"P2", size:12, batch:"LF-2311", mfg:"2026-03-11", exp:"2027-03-10", active:true, source:"veriprod",
          recalled:"Batch LF-2311 was recalled on 4 Nov 2026 for a quality check. Do not feed it to a baby."},
  KA4C8T:{p:"P5", size:10, batch:"KP-2503", mfg:"2025-03-01", exp:"2026-03-01", active:true, source:"brand"}
};
const PRICE = {individual:500, business:2000};
const FREE_SCANS = 3, CLONE_LIMIT = 5, REWARD_POINTS = 20, MONTHLY_REWARD_CAP = 10, REDEEM_AT = 200;
const KM_PER_MI = 1.609344, RADIUS_MIN = 5, RADIUS_MAX = 100, RADIUS_MAX_KM = 160, RADIUS_DEFAULT = 20, WINDOW_DAYS = 90, DAY = 86400000;

/* Places used to name a pin, to label the simplified map and to anchor sample hotspots.
   [name, lat, lng, level (1 city or town, 2 area inside a city), group]. Coordinates are approximate. */
const PLACES = [
  ["Lagos",6.5244,3.3792,1,"Cities and towns"],["Abuja",9.0765,7.3986,1,"Cities and towns"],["Kano",12.0022,8.592,1,"Cities and towns"],["Ibadan",7.3775,3.947,1,"Cities and towns"],
  ["Port Harcourt",4.8156,7.0498,1,"Cities and towns"],["Onitsha",6.1498,6.7857,1,"Cities and towns"],["Aba",5.1066,7.3667,1,"Cities and towns"],["Benin City",6.335,5.6037,1,"Cities and towns"],
  ["Enugu",6.4413,7.4988,1,"Cities and towns"],["Kaduna",10.5105,7.4165,1,"Cities and towns"],["Jos",9.8965,8.8583,1,"Cities and towns"],["Ilorin",8.4966,4.5421,1,"Cities and towns"],
  ["Abeokuta",7.1475,3.3619,1,"Cities and towns"],["Warri",5.5167,5.75,1,"Cities and towns"],["Owerri",5.4836,7.0333,1,"Cities and towns"],["Uyo",5.0377,7.9128,1,"Cities and towns"],
  ["Calabar",4.9757,8.3417,1,"Cities and towns"],["Maiduguri",11.8333,13.15,1,"Cities and towns"],["Sokoto",13.0059,5.2476,1,"Cities and towns"],["Akure",7.2571,5.2058,1,"Cities and towns"],
  ["Osogbo",7.7827,4.5418,1,"Cities and towns"],["Asaba",6.1986,6.7337,1,"Cities and towns"],["Nnewi",6.0105,6.9103,1,"Cities and towns"],["Zaria",11.0855,7.7199,1,"Cities and towns"],
  ["Abakaliki",6.3249,8.1137,1,"Cities and towns"],["Ado-Ekiti",7.6211,5.2214,1,"Cities and towns"],["Awka",6.2101,7.0741,1,"Cities and towns"],["Bauchi",10.3158,9.8442,1,"Cities and towns"],
  ["Birnin Kebbi",12.4539,4.1975,1,"Cities and towns"],["Damaturu",11.747,11.9608,1,"Cities and towns"],["Dutse",11.7562,9.339,1,"Cities and towns"],["Gombe",10.2897,11.1673,1,"Cities and towns"],
  ["Gusau",12.1628,6.6614,1,"Cities and towns"],["Jalingo",8.8937,11.3596,1,"Cities and towns"],["Katsina",12.9908,7.6018,1,"Cities and towns"],["Lafia",8.4939,8.5153,1,"Cities and towns"],
  ["Lokoja",7.8023,6.7333,1,"Cities and towns"],["Makurdi",7.7322,8.5391,1,"Cities and towns"],["Minna",9.6139,6.5569,1,"Cities and towns"],["Umuahia",5.525,7.4922,1,"Cities and towns"],
  ["Yenagoa",4.9267,6.2676,1,"Cities and towns"],["Yola",9.2035,12.4954,1,"Cities and towns"],["Ogbomosho",8.1337,4.2401,1,"Cities and towns"],["Ile-Ife",7.4905,4.5521,1,"Cities and towns"],
  ["Ijebu-Ode",6.8194,3.9173,1,"Cities and towns"],["Sagamu",6.8432,3.6465,1,"Cities and towns"],["Ota",6.6922,3.2317,1,"Cities and towns"],["Sapele",5.8941,5.6767,1,"Cities and towns"],
  ["Okene",7.5512,6.2359,1,"Cities and towns"],["Bida",9.0833,6.0167,1,"Cities and towns"],["Funtua",11.5233,7.3081,1,"Cities and towns"],
  ["Ikeja",6.6018,3.3515,2,"Lagos areas"],["Yaba",6.5095,3.3711,2,"Lagos areas"],["Surulere",6.501,3.3569,2,"Lagos areas"],["Lagos Island",6.4541,3.3947,2,"Lagos areas"],
  ["Victoria Island",6.4281,3.4219,2,"Lagos areas"],["Lekki",6.4478,3.4723,2,"Lagos areas"],["Ajah",6.4667,3.5667,2,"Lagos areas"],["Ikorodu",6.6194,3.5105,2,"Lagos areas"],
  ["Oshodi",6.555,3.343,2,"Lagos areas"],["Mushin",6.5273,3.354,2,"Lagos areas"],["Agege",6.618,3.3209,2,"Lagos areas"],["Apapa",6.4489,3.359,2,"Lagos areas"],
  ["Festac",6.4667,3.2833,2,"Lagos areas"],["Alaba",6.4622,3.1917,2,"Lagos areas"],["Ojota",6.588,3.379,2,"Lagos areas"],["Egbeda",6.5916,3.2911,2,"Lagos areas"],
  ["Badagry",6.4316,2.8876,2,"Lagos areas"],["Epe",6.5841,3.9834,2,"Lagos areas"],["Ojo",6.4579,3.158,2,"Lagos areas"],["Ikotun",6.5486,3.2659,2,"Lagos areas"],
  ["Isolo",6.537,3.321,2,"Lagos areas"],["Ketu",6.597,3.387,2,"Lagos areas"],["Bariga",6.538,3.386,2,"Lagos areas"],["Ikoyi",6.45,3.4333,2,"Lagos areas"],
  ["Ebute Metta",6.488,3.38,2,"Lagos areas"],["Ajegunle",6.45,3.33,2,"Lagos areas"],["Ogba",6.626,3.341,2,"Lagos areas"],["Iyana Ipaja",6.609,3.296,2,"Lagos areas"],
  ["Abule Egba",6.646,3.3,2,"Lagos areas"],["Sangotedo",6.459,3.63,2,"Lagos areas"],
  ["Garki",9.0336,7.4875,2,"Abuja areas"],["Wuse",9.0667,7.4667,2,"Abuja areas"],["Kubwa",9.1549,7.322,2,"Abuja areas"],["Gwarinpa",9.1099,7.4042,2,"Abuja areas"],
  ["Nyanya",9.0227,7.5612,2,"Abuja areas"],["Maitama",9.0882,7.4934,2,"Abuja areas"],["Asokoro",9.048,7.525,2,"Abuja areas"],["Lugbe",8.975,7.378,2,"Abuja areas"],
  ["Karu",9.007,7.58,2,"Abuja areas"],["Gwagwalada",8.9431,7.0803,2,"Abuja areas"],["Jabi",9.066,7.425,2,"Abuja areas"],
  ["Sabon Gari, Kano",12.019,8.533,2,"Other city areas"],["Fagge, Kano",12.006,8.526,2,"Other city areas"],["Nassarawa, Kano",11.995,8.55,2,"Other city areas"],
  ["Bodija, Ibadan",7.435,3.914,2,"Other city areas"],["Dugbe, Ibadan",7.387,3.879,2,"Other city areas"],["Challenge, Ibadan",7.35,3.876,2,"Other city areas"],["Mokola, Ibadan",7.4,3.89,2,"Other city areas"],
  ["Diobu, Port Harcourt",4.79,6.995,2,"Other city areas"],["Rumuokoro, Port Harcourt",4.868,6.996,2,"Other city areas"],["Trans Amadi, Port Harcourt",4.81,7.04,2,"Other city areas"],["Oyigbo, Port Harcourt",4.878,7.128,2,"Other city areas"],
  ["Fegge, Onitsha",6.133,6.78,2,"Other city areas"],["Ariaria, Aba",5.116,7.333,2,"Other city areas"],["Ogui, Enugu",6.448,7.505,2,"Other city areas"],
  ["Ugbowo, Benin City",6.4,5.61,2,"Other city areas"],["Kawo, Kaduna",10.578,7.45,2,"Other city areas"],["Barnawa, Kaduna",10.479,7.435,2,"Other city areas"]
];
function distKm(la1,ln1,la2,ln2){ const R=6371, r=Math.PI/180, dLa=(la2-la1)*r, dLn=(ln2-ln1)*r;
  const a=Math.sin(dLa/2)**2 + Math.cos(la1*r)*Math.cos(la2*r)*Math.sin(dLn/2)**2; return 2*R*Math.asin(Math.sqrt(a)); }
function nearest(lat,lng,level){ let best=null, bd=Infinity; for (const p of PLACES){ if (level && p[3]!==level) continue; const d=distKm(lat,lng,p[1],p[2]); if (d<bd){bd=d;best=p;} } return {place:best, km:bd}; }
function areaName(lat,lng){ const n = nearest(lat,lng); if (n.km < 2.5) return n.place[0]; if (n.km < 20) return "near " + n.place[0];
  const c = nearest(lat,lng,1); if (c.km < 80) return "near " + c.place[0]; return lat.toFixed(3) + ", " + lng.toFixed(3); }
function cityOf(lat,lng){ const c = nearest(lat,lng,1); return c.km < 60 ? c.place[0] : null; }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtMi = km => { const m = km / KM_PER_MI; return (m < 10 ? m.toFixed(1) : Math.round(m)) + " mi"; };

/* Signed serials: 6 characters for the pack, 2 for the item, 4 for the signature.
   The signature can be checked with no data connection. */
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function hash32(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
function sig(body){ let h = hash32("veriprod-demo-key:" + body);
  let out=""; for (let i=0;i<4;i++){ out += ALPH[h % 32]; h = Math.floor(h/32) ^ (h<<7>>>0); h>>>=0; } return out; }
const itemTail = i => ALPH[Math.floor(i/32)] + ALPH[i%32];
const tailItem = t => { const a = ALPH.indexOf(t[0]), b = ALPH.indexOf(t[1]); return a<0 || b<0 ? -1 : a*32+b; };
const PACK_TAIL = "PK";
function pretty(code){ return code.slice(0,4)+"-"+code.slice(4,8)+"-"+code.slice(8,12); }
function normalize(raw){
  let s = String(raw||"").trim();
  const m = s.match(/(?:\/v\/|VP1:)([A-Za-z0-9-]+)/i); if (m) s = m[1];
  return s.toUpperCase().replace(/[^A-Z0-9]/g,"");
}
function parseCode(code){
  const body = code.slice(0,8), prefix = body.slice(0,6), tail = body.slice(6);
  if (code.length !== 12 || sig(body) !== code.slice(8)) return {signed:false};
  const pk = PACKS[prefix]; if (!pk) return {signed:true};
  if (tail === PACK_TAIL && pk.size > 1) return {signed:true, prefix, pk, carton:true, item:0};
  const i = tailItem(tail); if (i >= 1 && i <= pk.size) return {signed:true, prefix, pk, carton:false, item:i};
  return {signed:true};
}

/* ---------- state ---------- */
const BLANK = () => ({ plan:"free", scansUsed:0, bizPlan:"free", bizScansUsed:0, points:0, rewardedSerials:[], rewardsThisMonth:0, accountType:"individual", biz:null,
  home:null, locMode:null, radiusMi:RADIUS_DEFAULT, redeemed:[] });
const S = { tab:"scan", result:null, profile:BLANK(), myScans:[], myReports:[], reports:[], deliveries:[], delivery:null, doneDelivery:null,
  loc:null, liveCam:false, camOn:false, hotSort:"near", photoCb:null };
function lsGet(k, d){ try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
S.profile = Object.assign(BLANK(), lsGet("vp.profile", {}));
S.myScans = lsGet("vp.myScans", []);
S.myReports = lsGet("vp.myReports", []);
S.reports = lsGet("vp.reports", []);
S.deliveries = lsGet("vp.deliveries", []);
const isBiz = () => S.profile.accountType === "business";
function saveScans(){ lsSet("vp.myScans", S.myScans.slice(0,300)); }
function saveReports(){ const list = S.reports.slice(0,40);
  try { localStorage.setItem("vp.reports", JSON.stringify(list)); }
  catch(e){ try { localStorage.setItem("vp.reports", JSON.stringify(list.map(r => Object.assign({}, r, {photo:null})))); } catch(e2){} } }
function saveProfile(){ lsSet("vp.profile", S.profile); renderPlanChip(); }

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const naira = n => "₦" + Number(n).toLocaleString("en-NG");
const fmtDate = iso => new Date(iso).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"});
const ago = t => { const m = Math.round((Date.now()-t)/60000); if (m<1) return "just now"; if (m<60) return m+" min ago"; const h=Math.round(m/60); if (h<24) return h+" h ago"; return Math.round(h/24)+" d ago"; };
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const plural = (n, one, many) => n + " " + (n===1 ? one : (many || one + "s"));
function toast(msg){ document.querySelectorAll(".toast").forEach(t=>t.remove()); const t = document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 3200); }
const ICON = {
  scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/><path d="M7 12h10"/></svg>',
  hotspots:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  history:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  rewards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M4 13h16M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z"/></svg>',
  account:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke-linecap="round"/></svg>',
  box:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/></svg>',
  ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  bad:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0112 3.5 6.5 6.5 0 0118.5 10c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>'
};
const PIN_SVG = '<svg viewBox="0 0 32 42"><path d="M16 41S3 26.5 3 15.5A13 13 0 0116 2.5a13 13 0 0113 13C29 26.5 16 41 16 41z" fill="#b4291c" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5" fill="#fff"/></svg>';

/* ---------- ad banner (advertisers fund rewards) ---------- */
const ADS = [
  "<b>Advertise on Veriprod</b> · Reach shoppers at the shelf",
  "<b>Veriprod for Business</b> · Check every delivery before it reaches your shelf",
  "<b>Earn while you shop</b> · Answer one question after a scan for airtime",
  "<b>Seen a fake?</b> · Report it and warn your neighbours"
];
let adI = 0; function rotateAd(){ const el = $("#adMsg"); el.style.opacity=0; setTimeout(()=>{ el.innerHTML = ADS[adI++ % ADS.length]; el.style.opacity=1; }, 250); }
rotateAd(); setInterval(rotateAd, 7000);

/* ---------- location: live when allowed, a chosen spot otherwise ---------- */
let watchIds = [], lastDrawn = null, fineAt = 0;
const here = () => S.loc || S.profile.home || null;
const kmOf = mi => Math.min(RADIUS_MAX_KM, mi * KM_PER_MI);
const radiusKm = () => kmOf(S.profile.radiusMi);
const radiusLabel = mi => mi + " miles (" + Math.round(kmOf(mi)) + " km)";
/* one position for a pin: try GPS first, then the quicker network position */
function locate(){ return new Promise((res, rej) => {
  if (S.loc) return res({lat:S.loc.lat, lng:S.loc.lng});
  if (!navigator.geolocation) return rej(new Error("unsupported"));
  const ok = p => res({lat:p.coords.latitude, lng:p.coords.longitude});
  try { navigator.geolocation.getCurrentPosition(ok, e => { if (e && e.code === 1) return rej(e);
      navigator.geolocation.getCurrentPosition(ok, rej, {enableHighAccuracy:false, timeout:12000, maximumAge:300000}); },
    {enableHighAccuracy:true, timeout:9000, maximumAge:60000}); } catch(e){ rej(e); }
}); }
function setHome(lat,lng){ S.profile.home = {lat, lng, area: areaName(lat,lng)}; saveProfile(); }
function stopLive(){ if (navigator.geolocation) watchIds.forEach(id => navigator.geolocation.clearWatch(id)); watchIds = []; S.loc = null; }
/* Two watchers run side by side: the network position arrives fast and works indoors,
   GPS is slower but sharper and takes over when it has a fix. */
function startLive(byUser){
  if (!navigator.geolocation){ if (byUser){ toast("This browser can't share its location. Set your area on the map."); openHomePicker(); } return; }
  if (watchIds.length){ if (byUser) toast(S.loc ? "Live location is on: " + S.loc.area : "Still finding your location…"); return; }
  if (byUser) toast("Finding your location…");
  let first = true, dead = false; const failed = {};
  const onPos = fine => p => {
    if (dead) return;
    if (fine) fineAt = Date.now(); else if (Date.now() - fineAt < 60000) return;
    const lat = p.coords.latitude, lng = p.coords.longitude;
    S.loc = {lat, lng, area: areaName(lat,lng), at: Date.now()};
    const h = S.profile.home;
    if (S.profile.locMode !== "live" || !h || distKm(h.lat,h.lng,lat,lng) > 0.3){ S.profile.locMode = "live"; setHome(lat,lng); }
    const moved = !lastDrawn || distKm(lastDrawn.lat,lastDrawn.lng,lat,lng) > 0.15;
    if (first || moved){ lastDrawn = {lat,lng}; onLocationChange(first); }
    if (first && byUser) toast("Live location on: " + S.loc.area);
    first = false;
  };
  const onErr = fine => err => {
    if (dead) return;
    const denied = err && err.code === 1;
    if (!denied){ failed[fine] = true; if (!first || !(failed[true] && failed[false])) return; }   // wait for the other watcher, or keep going after a good fix
    dead = true; stopLive();
    if (denied){ S.profile.locMode = S.profile.home ? "manual" : null; saveProfile(); }
    if (byUser){ if (denied) openLocationHelp(); else { toast("Your location couldn't be found. Check that Location is on in your phone's settings, or set your area on the map."); openHomePicker(); } }
    else if (!document.querySelector(".overlay") && !S.camOn) render();
  };
  fineAt = 0;
  watchIds = [navigator.geolocation.watchPosition(onPos(false), onErr(false), {enableHighAccuracy:false, maximumAge:120000, timeout:25000}),
              navigator.geolocation.watchPosition(onPos(true), onErr(true), {enableHighAccuracy:true, maximumAge:30000, timeout:25000})];
}
/* shown when the browser refuses: the app cannot ask again, so the person has to unblock it */
function openLocationHelp(){
  document.querySelectorAll(".overlay").forEach(x => x.close && x.close());
  const ua = navigator.userAgent || "", ios = /iPhone|iPad|iPod/i.test(ua), android = /Android/i.test(ua);
  const iosSteps = `<li><span class="dot p">1</span><span>Open your iPhone's <b>Settings</b>, then <b>Privacy &amp; Security</b>, then <b>Location Services</b>, and switch it on.</span></li>
      <li><span class="dot p">2</span><span>In the same list tap <b>Safari Websites</b> (or the browser you use) and choose <b>While Using the App</b>.</span></li>
      <li><span class="dot p">3</span><span>Come back here, tap <b>Try again</b> and choose <b>Allow</b>.</span></li>`;
  const androidSteps = `<li><span class="dot p">1</span><span>Swipe down from the top of your phone and switch <b>Location</b> on.</span></li>
      <li><span class="dot p">2</span><span>Tap the icon at the left of the address bar, then <b>Permissions</b>, then <b>Location</b>, and choose <b>Allow</b>.</span></li>
      <li><span class="dot p">3</span><span>Come back here and tap <b>Try again</b>.</span></li>`;
  const otherSteps = `<li><span class="dot p">1</span><span>Make sure Location is switched on for this device.</span></li>
      <li><span class="dot p">2</span><span>Click the icon at the left of the address bar, find <b>Location</b> and set it to <b>Allow</b>.</span></li>
      <li><span class="dot p">3</span><span>Come back here and choose <b>Try again</b>.</span></li>`;
  const o = sheet(`<h2>Location is blocked</h2>
    <p class="small muted">Your browser is not letting Veriprod see where you are. This happens when "Block" or "Don't allow" was chosen before, or when Location is switched off on the phone. Veriprod can't ask again until it is unblocked.</p>
    <ul class="checks">${ios ? iosSteps : android ? androidSteps : otherSteps}</ul>
    <p class="notice">Opened Veriprod from inside another app, such as WhatsApp or Instagram? Open it in Chrome or Safari instead. Browsers built into other apps often can't share location.</p>
    <button class="btn primary block" id="locRetry">Try again</button>
    <button class="btn ghost block" id="locManual">Set my area on the map instead</button>`);
  o.querySelector("#locRetry").onclick = () => { o.close(); startLive(true); };
  o.querySelector("#locManual").onclick = () => { o.close(); openHomePicker(); };
}
function onLocationChange(first){
  if (document.querySelector(".overlay") || S.camOn) return;
  if (S.tab === "hotspots" && hot && !first) updateHot(false);
  else if (S.tab === "hotspots" || (first && (S.tab === "scan" || S.tab === "account"))) render();
}

/* ---------- pack status: who has scanned, bought and used each item ---------- */
function packStats(prefix){
  const pk = PACKS[prefix], sm = pk.sample || {};
  const items = Array.from({length:pk.size}, () => ({si:false, sb:false, bi:false, bb:false, used:false}));
  const each = (list, f) => (list||[]).forEach(i => { if (items[i-1]) f(items[i-1]); });
  if (sm.biz) items.forEach(x => { x.sb = true; x.bb = true; });
  each(sm.indScan, x => { x.si = true; });
  each(sm.indBought, x => { x.si = true; x.bi = true; });
  each(sm.used, x => { x.si = true; x.bi = true; x.used = true; });
  S.myScans.forEach(s => {
    if (s.pack !== prefix || s.status !== "genuine") return;
    const biz = s.accountType === "business";
    if (!s.item && !biz) return;                       // a shopper scanning the carton code says nothing about single items
    (s.item ? [items[s.item-1]] : items).forEach(x => { if (!x) return;
      if (biz){ x.sb = true; if (s.stocked) x.bb = true; }
      else { x.si = true; if (s.answer === "Bought it") x.bi = true; if (s.answer === "Already using it"){ x.bi = true; x.used = true; } } });
  });
  const count = f => items.filter(f).length;
  return { size:pk.size, items, scanInd:count(x=>x.si), scanBiz:count(x=>x.sb), scanAny:count(x=>x.si||x.sb),
    boughtInd:count(x=>x.bi), boughtBiz:count(x=>x.bb), used:count(x=>x.used), untouched:count(x=>!x.si && !x.sb) };
}
function unitLabel(r){ const p = r.product, pk = r.pk; if (!p || !pk) return "";
  if (pk.size === 1) return cap(p.unit);
  return r.carton ? `${cap(p.packName)} of ${pk.size} ${p.units}` : `${cap(p.unit)} ${r.item} of ${pk.size}`; }
const unitCount = r => r.pk ? (r.carton ? r.pk.size : 1) : 1;

/* ---------- verification (follows the board's scan check logic) ---------- */
function verify(code){
  const c = parseCode(code), checks = [];
  if (!c.signed || !c.pk){
    checks.push({s:"f", t: c.signed ? "This serial is not in any brand's registry." : "The code's signature does not match. It was never issued by a brand or by Veriprod."});
    return {status:"fake", title:"FAKE", sub:"This code was never issued", checks, code};
  }
  const pk = c.pk, product = PRODUCTS[pk.p], brand = BRANDS[product.brand];
  const base = {code, pk, prefix:c.prefix, item:c.item, carton:c.carton, product, brand, checks};
  checks.push({s:"p", t:`Issued by ${brand.name}` + (pk.source==="brand" ? " (read from the brand's serial system)" : " (serial issued by Veriprod)")});
  if (!pk.active){
    checks.push({s:"f", t:"Never activated at the factory. Genuine codes are switched on when cartons are packed."});
    return Object.assign(base, {status:"fake", title:"FAKE", sub:"This code was never activated"});
  }
  checks.push({s:"p", t:"Activated at the factory"});
  const expired = new Date(pk.exp) < new Date();
  if (pk.recalled || expired){
    checks.push({s:"w", t: pk.recalled ? pk.recalled : `Expired on ${fmtDate(pk.exp)}`});
    return Object.assign(base, {status:"warn", title:"WARNING", sub: pk.recalled ? "This batch has been recalled" : "This product has expired"});
  }
  checks.push({s:"p", t:"Not expired or recalled"});
  const hist = ((pk.clones && pk.clones[c.item]) || []).map(([city,d]) => ({city, at: Date.now() - d*DAY}));
  const cities = new Set(hist.map(h=>h.city).filter(Boolean));
  if (hist.length >= CLONE_LIMIT || cities.size >= 3){
    checks.push({s:"f", t:`Scanned ${hist.length} times in ${plural(cities.size,"city","cities")} (${[...cities].join(", ")}). One ${product.unit} should only turn up in one place.`});
    return Object.assign(base, {status:"clone", title:"LIKELY CLONE", sub:"Do not buy. This code has been copied."});
  }
  checks.push({s:"p", t: "Scan history is normal"});
  let sub = isBiz() ? "Safe to stock" : "Safe to buy";
  const sm = pk.sample || {};
  if (c.carton && !isBiz()) sub = `This is the ${product.packName} code. Scan the ${product.unit} you are buying too.`;
  else if (!c.carton && !isBiz() && (sm.used||[]).includes(c.item)){
    checks.push({s:"w", t:`Another buyer already marked this ${product.unit} as in use. Be careful if it is being sold to you as new.`});
    sub = "The code is genuine, but read the note below";
  } else if (!c.carton && !isBiz() && (sm.indBought||[]).includes(c.item)){
    checks.push({s:"w", t:`Another buyer already marked this ${product.unit} as bought. That is fine for a resale, but be careful if it is sold as new.`});
    sub = "The code is genuine, but read the note below";
  }
  return Object.assign(base, {status:"genuine", title:"GENUINE", sub});
}
function locFields(){ const h = here(); return h ? {lat:+h.lat.toFixed(2), lng:+h.lng.toFixed(2), area:h.area || areaName(h.lat,h.lng), city:cityOf(h.lat,h.lng)} : {lat:null, lng:null, area:null, city:null}; }
/* shoppers and businesses each have their own plan and their own free scans */
const planKey = () => isBiz() ? "bizPlan" : "plan", usedKey = () => isBiz() ? "bizScansUsed" : "scansUsed";
const subscribed = () => S.profile[planKey()] === "active";
const scansLeft = () => Math.max(0, FREE_SCANS - (S.profile[usedKey()] || 0));
const price = () => isBiz() ? PRICE.business : PRICE.individual;
function canScan(){ return subscribed() || scansLeft() > 0; }
/* check a code and log it; returns the result, or null when the free scans are used up */
function checkCode(raw, how, extra){
  const code = normalize(raw);
  if (code.length < 8){ toast("Type the 12-character code printed under the QR"); return null; }
  if (!canScan()){ openPaywall(); return null; }
  const P = S.profile, r = verify(code);
  r.how = how; r.at = Date.now(); r.id = rid();
  if (!subscribed()) P[usedKey()] = (P[usedKey()] || 0) + 1;
  saveProfile();
  S.myScans.unshift(Object.assign({id:r.id, code, status:r.status, productId: r.pk ? r.pk.p : null, brand: r.product ? r.product.brand : null,
    pack: r.prefix || null, item: r.item || 0, at:r.at, how, accountType:P.accountType, answer:null, stocked:false}, locFields(), extra || {}));
  saveScans();
  return r;
}
function runScan(raw, how){
  const r = checkCode(raw, how);
  if (!r){ if (how === "qr") render(); return; }        // put the scan window back, never leave a frozen camera frame
  S.result = r; S.tab = "result"; render(); window.scrollTo(0,0);
}
function renderPlanChip(){
  const P = S.profile, c = $("#planChip");
  if (subscribed()){ c.className="chip ok"; c.textContent = "Subscribed"; }
  else { const left = scansLeft(); c.className = "chip" + (left ? "" : " warn"); c.textContent = plural(left, "free scan") + " left"; }
}

/* ---------- camera scanning ---------- */
function camSupported(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  try { const fp = document.featurePolicy || document.permissionsPolicy; if (fp && fp.allowsFeature && !fp.allowsFeature("camera")) return false; } catch(e){}
  return true;
}
S.liveCam = camSupported();
const cam = {stream:null, timer:null, busy:false, canvas:document.createElement("canvas"), sel:"#camVideo", onCode:null, continuous:false, last:"", lastAt:0};
let detector = null;
try { if ("BarcodeDetector" in window) detector = new window.BarcodeDetector({formats:["qr_code"]}); } catch(e){ detector = null; }
function stopCam(){
  if (cam.timer){ clearInterval(cam.timer); cam.timer = null; }
  if (cam.stream){ cam.stream.getTracks().forEach(t=>t.stop()); cam.stream = null; }
  cam.onCode = null; S.camOn = false;
}
/* o: {sel, onCode, continuous, onReady, onFail} */
async function startCam(o){
  let timedOut = false;
  try {
    const stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}, audio:false}),
      new Promise((_, rej) => setTimeout(()=>{ timedOut = true; rej(new Error("timeout")); }, 20000))
    ]);
    if (timedOut){ stream.getTracks().forEach(t=>t.stop()); return; }
    stopCam();
    cam.stream = stream; cam.sel = o.sel; cam.onCode = o.onCode; cam.continuous = !!o.continuous; cam.last = ""; S.camOn = true;
    if (o.onReady) o.onReady();
    attachCam();
    cam.timer = setInterval(scanFrame, 200);
  } catch(e){
    stopCam(); S.liveCam = false;
    if (o.onFail) o.onFail();
    toast("The live camera isn't available. Take a photo of the code instead.");
  }
}
function attachCam(){ const v = $(cam.sel); if (v && cam.stream && v.srcObject !== cam.stream){ v.srcObject = cam.stream; const p = v.play(); if (p && p.catch) p.catch(()=>{}); } }
async function scanFrame(){
  const v = $(cam.sel); if (!v || v.readyState < 2 || cam.busy || !v.videoWidth) return;
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
    if (!found || !S.camOn || !cam.onCode) return;
    const cb = cam.onCode;
    if (cam.continuous){
      if (found === cam.last && Date.now() - cam.lastAt < 3500) return;
      cam.last = found; cam.lastAt = Date.now(); cb(found);
    } else {
      if (normalize(found).length < 8){                 // some other QR code: say so and keep looking
        if (found !== cam.last || Date.now() - cam.lastAt > 4000){ cam.last = found; cam.lastAt = Date.now(); toast("That QR code is not a Veriprod code. Look for the Veriprod QR on the pack."); }
        return; }
      stopCam(); cb(found); }
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
/* where a decoded photo goes: an open scanner sheet, the delivery in progress, or a normal scan */
function codeHandler(){ return S.photoCb || (S.tab === "delivery" ? deliveryAdd : (c => runScan(c, "qr"))); }
async function onQrFile(e){
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  toast("Reading the code…");
  try {
    const found = await decodePhoto(f);
    if (found) codeHandler()(found); else toast("No QR code found in that photo. Fill the frame with the code and try again, or type the code.");
  } catch(err){ toast(err && err.message === "noscanner" ? "The scanner didn't load. Type the code instead." : "That photo couldn't be read. Try again or type the code."); }
}
$("#qrFileCam").addEventListener("change", onQrFile);
$("#qrFilePick").addEventListener("change", onQrFile);
const CORNERS = '<span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>';
/* the scan window, shared by the home screen, a delivery and the scanner sheet */
function finderHtml(o){
  if (o.on) return `<div class="viewfinder live">${CORNERS}<video id="${o.videoId}" playsinline muted autoplay aria-label="Camera view"></video>${o.stopId ? `<button class="btn" id="${o.stopId}">${o.stopLabel || "Cancel"}</button>` : ""}</div>
      <p class="alt">${o.liveHint || "Hold the QR code inside the frame."}</p>`;
  if (S.liveCam) return `<button class="viewfinder" id="${o.startId}">${CORNERS}<span class="vf-text">${ICON.camera}<span>${o.label || "Tap to scan the QR code"}</span><span class="small" style="opacity:.8;font-weight:400">Uses your camera.</span></span></button>
      <p class="alt">Camera not working? <label for="qrFilePick">Use a photo of the code</label></p>`;
  return `<label class="viewfinder" for="qrFileCam">${CORNERS}<span class="vf-text">${ICON.camera}<span>Tap to take a photo of the QR code</span><span class="small" style="opacity:.8;font-weight:400">Get close so the code fills most of the photo.</span></span></label>
      <p class="alt">Already have a picture? <label for="qrFilePick">Choose a photo</label></p>`;
}

/* ---------- maps ---------- */
const hasMap = () => typeof L !== "undefined";
let tilesProbe = null;
function tilesAvailable(){ if (!tilesProbe) tilesProbe = new Promise(res => { const im = new Image(), t = setTimeout(()=>res(false), 5000);
  im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); }; im.src = "https://tile.openstreetmap.org/0/0/0.png"; }); return tilesProbe; }
function baseMap(el, center, zoom, noteEl){
  const map = L.map(el, {attributionControl:false, zoomControl:true, minZoom:5, maxZoom:18, zoomAnimation:false, markerZoomAnimation:false, zoomSnap:0.25}).setView(center, zoom);
  let alive = true; map.on("unload", () => { alive = false; });
  const labelLayer = L.layerGroup().addTo(map);
  const labels = PLACES.map(p => ({p, m:L.marker([p[1],p[2]], {interactive:false, keyboard:false, icon:L.divIcon({className:"plabel"+(p[3]===1?" city":""), html:"<span>"+esc(p[0].split(",")[0])+"</span>", iconSize:[0,0]})}).addTo(labelLayer)}));
  // hide labels that would overlap one already shown; cities come first in PLACES so they win
  const declutter = () => { const placed = [], z = map.getZoom();
    labels.forEach(({p,m}) => { const el = m.getElement(); if (!el) return;
      const name = p[0].split(",")[0], pt = map.latLngToContainerPoint([p[1],p[2]]), w = name.length*(p[3]===1 ? 7.4 : 6.4) + 10, h = 18;
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
  const map = hasMap() ? baseMap(mapEl, pin ? [pin.lat,pin.lng] : [9.08,8.68], pin ? 15 : 6, root.querySelector("#"+id+"Note")) : null;
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
  root.querySelector("#"+id+"Gps").onclick = () => { locate().then(p => set(p.lat, p.lng, 16)).catch(() => toast("Your location isn't available. Tap the map or pick an area.")); };
  root.querySelector("#"+id+"Jump").onchange = e => { const p = PLACES[+e.target.value]; if (e.target.value !== "" && p) set(p[1], p[2], p[3]===1 ? 11 : 13); };
  return {get:() => pin, destroy:() => { if (map){ map.stop(); map.remove(); } }};
}

/* ---------- hotspots ---------- */
function rng(seed){ let a = hash32(seed) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CATS = ["medicine","drinks","cosmetics","baby food"];
let sampleCache = null;
/* Sample reports and fake scans around known places, so hotspots can be shown before a shared server exists.
   The same places always get the same numbers. Real reports from this phone are added on top. */
function sampleSignals(){
  if (sampleCache) return sampleCache;
  const out = [], now = Date.now();
  PLACES.forEach(p => {
    const r = rng("hotspot:" + p[0]), city = p[3] === 1;
    if (r() > (city ? 0.8 : 0.62)) return;
    const n = 1 + Math.floor(r()*r()*(city ? 10 : 7)), spread = city ? 1.2 : 0.45, cat = CATS[Math.floor(r()*CATS.length)];
    for (let i=0;i<n;i++){
      const ang = r()*Math.PI*2, d = Math.sqrt(r())*spread;
      out.push({lat: p[1] + d*Math.cos(ang)/111, lng: p[2] + d*Math.sin(ang)/(111*Math.cos(p[1]*Math.PI/180)),
        at: now - 3600000 - Math.floor(r()*r()*80*DAY), kind: r() < 0.6 ? "report" : "scan", cat: r() < 0.7 ? cat : CATS[Math.floor(r()*CATS.length)]});
    }
  });
  return (sampleCache = out);
}
function signals(){
  const cutoff = Date.now() - WINDOW_DAYS*DAY, out = sampleSignals().filter(s => s.at >= cutoff), reported = new Set();
  S.reports.forEach(r => { if (r.scanId) reported.add(r.scanId);
    if (r.lat != null && r.at >= cutoff) out.push({lat:r.lat, lng:r.lng, at:r.at, kind:"report", cat:(r.category||"").toLowerCase()}); });
  S.myScans.forEach(s => { if (s.lat != null && s.at >= cutoff && (s.status === "fake" || s.status === "clone") && !reported.has(s.id))
    out.push({lat:s.lat, lng:s.lng, at:s.at, kind:"scan", cat: s.productId ? PRODUCTS[s.productId].category.toLowerCase() : ""}); });
  return out;
}
function hotspots(){
  const h = here(); if (!h) return [];
  const clusters = [], rk = radiusKm();
  signals().filter(s => distKm(h.lat,h.lng,s.lat,s.lng) <= rk).forEach(s => {
    let c = clusters.find(c => distKm(c.lat,c.lng,s.lat,s.lng) <= 2);
    if (!c){ c = {lat:s.lat, lng:s.lng, n:0, reports:0, scans:0, last:0, cats:{}}; clusters.push(c); }
    c.lat = (c.lat*c.n + s.lat)/(c.n+1); c.lng = (c.lng*c.n + s.lng)/(c.n+1); c.n++;
    if (s.kind === "report") c.reports++; else c.scans++;
    if (s.cat) c.cats[s.cat] = (c.cats[s.cat]||0) + 1;
    c.last = Math.max(c.last, s.at);
  });
  clusters.forEach(c => { c.name = cap(areaName(c.lat,c.lng)); c.km = distKm(h.lat,h.lng,c.lat,c.lng);
    const top = Object.entries(c.cats).sort((a,b)=>b[1]-a[1])[0]; c.cat = top && top[1]*2 > c.n ? top[0] : ""; });
  return clusters.sort(S.hotSort === "count" ? ((a,b) => b.n - a.n || a.km - b.km) : ((a,b) => a.km - b.km));
}
const hotDetail = c => [c.reports ? plural(c.reports,"report") : "", c.scans ? plural(c.scans,"fake scan") : "", c.cat ? "mostly " + c.cat : ""].filter(Boolean).join(" · ");
let hot = null, hotList = [];
function initHot(){
  const h = here(), el = $("#hotMap"); if (!el || !h) return;
  if (!hasMap()){ el.hidden = true; updateHot(false); return; }
  const map = baseMap(el, [h.lat,h.lng], 10, $("#hotNote"));
  const ring = L.circle([h.lat,h.lng], {radius:radiusKm()*1000, className:"ring", interactive:false}).addTo(map);
  const you = L.marker([h.lat,h.lng], {interactive:false, keyboard:false, zIndexOffset:500, icon:L.divIcon({className:"you", html:"<span></span>", iconSize:[16,16], iconAnchor:[8,8]})}).addTo(map);
  hot = {map, ring, you, layer:L.layerGroup().addTo(map)};
  updateHot(true);
}
function updateHot(fit){
  const listEl = $("#hotList"), h = here(); if (!listEl || !h) return;
  hotList = hotspots();
  if (hot){
    hot.ring.setLatLng([h.lat,h.lng]); hot.ring.setRadius(radiusKm()*1000); hot.you.setLatLng([h.lat,h.lng]);
    if (fit) hot.map.fitBounds(hot.ring.getBounds(), {padding:[6,6]});
    hot.layer.clearLayers();
    hotList.forEach(c => L.circleMarker([c.lat,c.lng], {radius:6 + 3.2*Math.sqrt(c.n), className:"hot"}).bindPopup("<b>"+esc(c.name)+"</b><br>"+esc(hotDetail(c))).addTo(hot.layer));
  }
  const shown = hotList.slice(0, 40), total = hotList.reduce((a,c)=>a+c.n, 0);
  const sum = $("#hotSum"); if (sum) sum.textContent = hotList.length ? `${plural(hotList.length,"hotspot")} · ${plural(total,"report and fake scan","reports and fake scans")}` : "";
  const where = $("#hotWhere"); if (where) where.textContent = h.area || areaName(h.lat,h.lng);
  listEl.innerHTML = shown.length ? `<div class="list">${shown.map((c,i) => `<button class="item" data-hot="${i}">
      <span class="count" aria-hidden="true">${c.n}</span>
      <span class="grow"><span class="t" style="display:block">${esc(c.name)}</span><span class="small muted">${esc(hotDetail(c))} · last ${ago(c.last)}</span></span>
      <span class="dist">${fmtMi(c.km)}</span></button>`).join("")}</div>${hotList.length > shown.length ? `<p class="small muted">Showing the first ${shown.length}. Narrow the distance to see fewer.</p>` : ""}`
    : `<div class="empty">No fakes reported within ${radiusLabel(S.profile.radiusMi)} in the last ${WINDOW_DAYS} days.<br>Widen the distance, or report one from the home screen if you see it.</div>`;
}

/* ---------- business: checking a delivery ---------- */
function deliveryLine(r){ return {id:r.id, code:r.code, status:r.status, title:r.title, name: r.product ? r.product.name : "Unknown product", label: unitLabel(r), count: unitCount(r),
  pack: r.prefix || null, carton: !!r.carton}; }
function deliveryAdd(raw){
  const d = S.delivery; if (!d) return;
  const code = normalize(raw);
  if (d.lines.some(l => l.code === code)){ toast("Already in this delivery"); return; }
  const c = parseCode(code);
  if (c.pk && !c.carton && d.lines.some(l => l.pack === c.prefix && l.carton)){ toast(`Already counted with its ${PRODUCTS[c.pk.p].packName}`); return; }
  if (!canScan()){ stopCam(); render(); openPaywall(); return; }
  const r = checkCode(code, "delivery", {deliveryId:d.id}); if (!r) return;
  if (r.carton) d.lines = d.lines.filter(l => l.pack !== r.prefix);     // the carton covers items scanned from it earlier
  d.lines.unshift(deliveryLine(r));
  try { if (navigator.vibrate) navigator.vibrate(r.status === "genuine" ? 60 : [80,60,80]); } catch(e){}
  toast(r.title + ": " + (r.product ? r.product.name : "unknown product"));
  updateDelivery();
}
const delTotals = d => ({ ok: d.lines.filter(l=>l.status==="genuine").reduce((a,l)=>a+l.count,0), bad: d.lines.filter(l=>l.status!=="genuine").length });
function delListHtml(d){
  if (!d.lines.length) return `<div class="empty">Nothing scanned yet. Scan each carton's code, or single items if the carton is open.</div>`;
  const t = delTotals(d);
  return `<div class="row"><div class="kpi"><div class="n" style="color:var(--good)">${t.ok}</div><div class="l">Items verified</div></div>
    <div class="kpi"><div class="n" style="color:${t.bad ? "var(--bad)" : "inherit"}">${t.bad}</div><div class="l">Codes flagged</div></div></div>
    <div class="list">${d.lines.map(l => `<div class="item"><div class="grow"><div class="t">${esc(l.name)}</div>
      <div class="small muted">${l.label ? esc(l.label) + " · " : ""}<span class="mono">${pretty(l.code)}</span></div></div>${statusChip(l.status)}</div>`).join("")}</div>`;
}
function updateDelivery(){ const el = $("#delList"), d = S.delivery; if (el && d) el.innerHTML = delListHtml(d);
  const f = $("#delFinish"); if (f && d) f.disabled = !d.lines.length; }
function finishDelivery(){
  const d = S.delivery; if (!d || !d.lines.length) return;
  stopCam();
  const okIds = new Set(d.lines.filter(l=>l.status==="genuine").map(l=>l.id));
  S.myScans.forEach(s => { if (okIds.has(s.id)) s.stocked = true; }); saveScans();
  const t = delTotals(d), done = {id:d.id, supplier:d.supplier.trim().slice(0,80), at:Date.now(), ok:t.ok, bad:t.bad, lines:d.lines};
  S.deliveries.unshift(done); lsSet("vp.deliveries", S.deliveries.slice(0,60));
  S.delivery = null; S.doneDelivery = done; S.tab = "deliveryDone"; render(); window.scrollTo(0,0);
}
function bizStats(){
  const since = Date.now() - 30*DAY, mine = S.myScans.filter(s => s.accountType === "business" && s.at >= since);
  return { items: mine.reduce((a,s) => a + (s.item || !s.pack ? 1 : PACKS[s.pack] ? PACKS[s.pack].size : 1), 0),
    flagged: mine.filter(s => s.status !== "genuine").length, deliveries: S.deliveries.filter(d => d.at >= since).length };
}

/* ---------- views ---------- */
function locationNudge(){
  if (here() || isBiz()) return "";
  return `<section class="card" aria-labelledby="h-loc"><h3 id="h-loc">Turn on your location</h3>
    <p class="small muted">Veriprod uses it to warn you about fakes reported near you and to tag your scans with a rough area.</p>
    <div class="row"><button class="btn primary" id="useGps">${ICON.pin} Turn on location</button><button class="btn ghost" id="pickHome">Set it on the map</button></div></section>`;
}
function vScan(){
  const P = S.profile, biz = isBiz();
  const finder = finderHtml({on:S.camOn, videoId:"camVideo", startId:"camStart", stopId:"camStop"});
  let top = "";
  if (biz){ const b = bizStats();
    top = `<section class="card" aria-labelledby="h-biz">
      <div><h2 id="h-biz">${esc(P.biz ? P.biz.name : "Your business")}</h2><p class="small muted">${esc(P.biz ? P.biz.type : "Business")}${P.biz && P.biz.cac ? " · " + esc(P.biz.cac) : ""}</p></div>
      <div>${verChip()}</div>
      <div class="kpis"><div class="kpi"><div class="n">${b.items}</div><div class="l">Items checked, 30 days</div></div>
        <div class="kpi"><div class="n" style="color:${b.flagged ? "var(--bad)" : "inherit"}">${b.flagged}</div><div class="l">Codes flagged</div></div>
        <div class="kpi"><div class="n">${b.deliveries}</div><div class="l">Deliveries</div></div></div>
      <button class="btn primary block" id="delStart">${ICON.box} Check a delivery</button>
      <p class="small muted">Scan cartons as stock arrives. Genuine items go into your stock record, and anything flagged can be reported to the brand with your supplier's name.</p>
    </section>`; }
  return `${top}
  <section class="scanhero" aria-labelledby="h-scan">
    <h2 id="h-scan">${biz ? "Check a single item" : "Check it before you pay"}</h2>
    <p style="opacity:.9">${biz ? "Scan one carton or one item, such as when a customer asks about it." : "Scan the Veriprod QR on the pack. Medicine, baby food, drinks and cosmetics from partner brands."}</p>
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
  ${locationNudge()}
  <section class="card" aria-labelledby="h-rep">
    <h3 id="h-rep">Seen a product that looks fake?</h3>
    <p class="small muted">Scan it or describe it, add a photo and drop a pin on the map. Reports go to the brand and NAFDAC.</p>
    <button class="btn danger block" id="homeReport">${ICON.flag} Report a product</button>
  </section>`;
}

function packCard(r){
  const pk = r.pk, p = r.product; if (!pk || pk.size < 2) return "";
  const st = packStats(r.prefix);
  const cls = x => x.used ? "used" : x.bi ? "bought" : x.si ? "scanned" : (x.sb || x.bb) ? "stock" : "";
  const state = x => x.used ? "used" : x.bi ? "bought by a shopper" : x.si ? "scanned by a shopper" : (x.sb || x.bb) ? "in a shop's stock" : "not scanned yet";
  return `<section class="card" aria-labelledby="h-pack">
    <div><h3 id="h-pack">${cap(p.packName)} of ${pk.size} ${p.units}</h3>
      <p class="small muted">${r.carton ? `You scanned the ${p.packName} code. Each ${p.unit} inside has its own code.` : `You scanned ${p.unit} ${r.item}. Each ${p.unit} in the ${p.packName} has its own code.`}</p></div>
    <div class="units" role="list" aria-label="${cap(p.units)} in this ${p.packName}">${st.items.map((x,i) => `<span role="listitem" class="unit ${cls(x)}${!r.carton && r.item === i+1 ? " me" : ""}" aria-label="${cap(p.unit)} ${i+1}: ${state(x)}${!r.carton && r.item === i+1 ? " (this one)" : ""}">${i+1}</span>`).join("")}</div>
    <div class="legend"><span><i class="k-none"></i>Not scanned</span><span><i class="k-stock"></i>In a shop's stock</span><span><i class="k-scanned"></i>Scanned by a shopper</span><span><i class="k-bought"></i>Bought</span><span><i class="k-used"></i>Used</span></div>
    <table class="ptable">
      <thead><tr><th scope="col">Out of ${st.size}</th><th scope="col">Shoppers</th><th scope="col">Businesses</th></tr></thead>
      <tbody><tr><th scope="row">Scanned</th><td>${st.scanInd}</td><td>${st.scanBiz}</td></tr>
      <tr><th scope="row">Purchased</th><td>${st.boughtInd}</td><td>${st.boughtBiz}</td></tr>
      <tr><th scope="row">Used</th><td>${st.used}</td><td class="muted">n/a</td></tr></tbody>
    </table>
    <p class="small muted">${st.untouched ? `${plural(st.untouched, p.unit, p.units)} not scanned by anyone yet.` : `Every ${p.unit} has been scanned at least once.`}
      ${st.size - st.boughtInd > 0 ? `${st.size - st.boughtInd} of ${st.size} not yet bought by a shopper.` : `All ${st.size} have been bought.`}</p>
  </section>`;
}

function vResult(){
  const r = S.result; if (!r) return vScan();
  const cls = r.status==="genuine" ? "good" : r.status==="warn" ? "warn" : "bad";
  const icon = r.status==="genuine" ? ICON.ok : r.status==="warn" ? ICON.warn : ICON.bad;
  const P = S.profile, rec = S.myScans.find(s=>s.id===r.id), noun = r.product ? (r.carton ? r.product.packName : r.product.unit) : "pack";
  let follow = "";
  if (r.status === "genuine" && isBiz()){
    follow = rec && rec.answer
      ? `<section class="card"><h3>${rec.stocked ? "Added to your stock" : "Logged as a check"}</h3><p class="small muted">${rec.stocked ? `This ${noun} now counts as bought by a business.` : "Nothing was added to your stock."}</p></section>`
      : `<section class="card" aria-labelledby="h-q"><h3 id="h-q">Is this ${noun} going into your stock?</h3>
          <p class="small muted">Business scans don't earn rewards. They keep the brand's record of who holds each ${noun} accurate.</p>
          <div class="qopts"><button class="btn ghost" data-stock="1">Yes, we bought it</button><button class="btn ghost" data-stock="0">No, just checking</button></div></section>`;
  } else if (r.status === "genuine" && r.carton){
    follow = "";
  } else if (r.status === "genuine"){
    if (rec && rec.answer){
      follow = `<section class="card"><h3>Thanks for answering</h3><p class="small muted">You said: <b>${esc(rec.answer)}</b>. ${rec.rewarded ? `+${REWARD_POINTS} points added.` : "No points this time (one reward per item, " + MONTHLY_REWARD_CAP + " a month)."}</p></section>`;
    } else {
      const canReward = !P.rewardedSerials.includes(r.code) && P.rewardsThisMonth < MONTHLY_REWARD_CAP;
      follow = `<section class="card" aria-labelledby="h-q">
        <h3 id="h-q">Quick question${canReward ? ` · earn ${REWARD_POINTS} points` : ""}</h3>
        <p class="small muted">What did you do with this ${noun}? It helps the brand see where genuine stock sells.</p>
        <div class="qopts">
          <button class="btn ghost" data-ans="Bought it">I bought it</button>
          <button class="btn ghost" data-ans="Did not buy it">I didn't buy it</button>
          <button class="btn ghost" data-ans="Already using it">I'm already using it</button>
        </div></section>`;
    }
  } else {
    follow = `<section class="card" aria-labelledby="h-rep">
      <h3 id="h-rep">${r.status==="warn" ? "Report where you found it" : isBiz() ? "Report this supplier" : "Report this seller"}</h3>
      <p class="small muted">Your report goes to ${r.brand ? esc(r.brand.name) : "the brand"} and NAFDAC with a photo and a pin on the map.</p>
      <button class="btn danger block" id="openReport">${ICON.flag} Report with photo and pin</button></section>`;
  }
  const pk = r.pk;
  return `
  <section class="verdict ${cls}" aria-live="polite">
    <div class="big">${icon}<span>${r.title}</span></div>
    <p><b>${esc(r.sub)}</b></p>
    <span class="mono small" style="color:var(--ink);opacity:.75">${pretty(r.code.padEnd(12,"·"))}</span>
  </section>
  ${r.product ? `<section class="card"><div><h3>${esc(r.product.name)}</h3>${unitLabel(r) ? `<p class="small muted">${esc(unitLabel(r))}</p>` : ""}</div>
    <dl class="kv"><dt>Brand</dt><dd>${esc(r.brand.name)}</dd><dt>Category</dt><dd>${esc(r.product.category)}</dd>
    <dt>NAFDAC no.</dt><dd class="mono">${esc(r.product.nafdac)}</dd><dt>Batch</dt><dd class="mono">${esc(pk.batch)}</dd>
    <dt>Made</dt><dd>${fmtDate(pk.mfg)}</dd><dt>Expires</dt><dd>${fmtDate(pk.exp)}</dd></dl></section>` : ""}
  ${r.status === "genuine" || r.status === "warn" ? packCard(r) : ""}
  <section class="card"><h3>What we checked</h3>
    <ul class="checks">${r.checks.map(c=>`<li><span class="dot ${c.s}">${c.s==="p"?"✓":c.s==="f"?"✕":"!"}</span><span>${esc(c.t)}</span></li>`).join("")}</ul></section>
  ${follow}
  <button class="btn primary block" id="scanAgain">${isBiz() ? "Check another item" : "Scan another product"}</button>`;
}

function statusChip(s){ return s==="genuine" ? '<span class="chip ok">Genuine</span>' : s==="warn" ? '<span class="chip warn">Warning</span>' : s==="clone" ? '<span class="chip bad">Likely clone</span>' : s==="reported" ? '<span class="chip">Reported</span>' : '<span class="chip bad">Fake</span>'; }

function vDelivery(){
  const d = S.delivery; if (!d) return vScan();
  return `<div><h2>Check a delivery</h2><p class="small muted" style="margin-top:6px">Scan every carton, or single items from an open carton. The camera stays on between scans.</p></div>
  <label class="field" for="delSupplier">Supplier or distributor (optional)<input type="text" id="delSupplier" value="${esc(d.supplier)}" placeholder="Who delivered this stock?" maxlength="80"></label>
  <section class="scanhero compact">
    ${finderHtml({on:S.camOn, videoId:"camVideo", startId:"delCam", stopId:"camPause", stopLabel:"Pause camera", label:"Tap to start scanning", liveHint:"Hold each code inside the frame. It is added to the list below as soon as it is read."})}
  </section>
  <form class="codeentry" id="delForm" autocomplete="off">
    <input type="text" id="delCode" placeholder="Or type a code" aria-label="Type a code" maxlength="16">
    <button class="btn" type="submit">Add</button>
  </form>
  <section class="card" id="delList" aria-live="polite">${delListHtml(d)}</section>
  <button class="btn primary block" id="delFinish" ${d.lines.length ? "" : "disabled"}>Finish delivery</button>
  <button class="btn ghost block" id="delCancel">Cancel this delivery</button>`;
}
function deliveryDetail(d, live){
  const bad = d.lines.filter(l => l.status !== "genuine"), ok = d.lines.filter(l => l.status === "genuine");
  return `<section class="verdict ${d.bad ? "bad" : "good"}">
      <div class="big">${d.bad ? ICON.warn : ICON.ok}<span>${d.bad ? plural(d.bad,"code") + " flagged" : "All clear"}</span></div>
      <p><b>${plural(d.ok,"item")} verified${d.supplier ? " from " + esc(d.supplier) : ""}${live ? " and added to your stock" : ""}.</b></p>
      <span class="small" style="color:var(--ink);opacity:.75">${new Date(d.at).toLocaleString("en-NG",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></section>
    ${bad.length ? `<section class="card"><div><h3>Do not put these on the shelf</h3><p class="small muted">Keep them aside and report the supplier. The brand and NAFDAC get the code, your location and the supplier's name.</p></div>
      <div class="list">${bad.map(l => `<div class="item"><div class="grow"><div class="t">${esc(l.name)}</div><div class="small muted"><span class="mono">${pretty(l.code)}</span></div></div>${statusChip(l.status)}</div>`).join("")}</div>
      <button class="btn danger block" data-delreport="${esc(d.id)}">${ICON.flag} Report this supplier</button></section>` : ""}
    ${ok.length ? `<section class="card"><h3>In your stock</h3><div class="list">${ok.map(l => `<div class="item"><div class="grow"><div class="t">${esc(l.name)}</div>
      <div class="small muted">${l.label ? esc(l.label) + " · " : ""}<span class="mono">${pretty(l.code)}</span></div></div><span class="chip ok">${plural(l.count,"item")}</span></div>`).join("")}</div></section>` : ""}`;
}
function vDeliveryDone(){
  const d = S.doneDelivery; if (!d) return vScan();
  return `<h2>Delivery checked</h2>${deliveryDetail(d, true)}<button class="btn primary block" id="scanAgain">Done</button>`;
}

function vHotspots(){
  const h = here(), P = S.profile;
  if (!h) return `<h2>Hotspots near you</h2>
    <section class="card"><h3>Where are you?</h3>
      <p class="small muted">Turn on your location to see where fakes have been reported around you, as you move.</p>
      <button class="btn primary block" id="useGps">${ICON.pin} Turn on location</button>
      <button class="btn ghost block" id="pickHome">Set it on the map instead</button></section>`;
  const live = !!S.loc;
  return `<div><h2>Hotspots near you</h2>
    <p class="small muted" style="margin-top:6px">${live ? '<span class="livedot" aria-hidden="true"></span>Live location: ' : "Location set to "}<b id="hotWhere">${esc(h.area || "")}</b>.
      ${live ? `<button class="link" id="pickHome">Use a fixed spot</button>` : `<button class="link" id="useGps">Use live location</button> or <button class="link" id="pickHome">move the pin</button>`}</p></div>
  <section class="card">
    <label class="field" for="radius"><span>Show fakes within <b id="radLbl">${radiusLabel(P.radiusMi)}</b></span>
      <input type="range" id="radius" min="${RADIUS_MIN}" max="${RADIUS_MAX}" step="5" value="${P.radiusMi}"></label>
    <div class="scale small muted"><span>${RADIUS_MIN} mi</span><span>${RADIUS_MAX} mi (${RADIUS_MAX_KM} km)</span></div>
  </section>
  <div class="map tall" id="hotMap" aria-label="Map of hotspots around you"></div>
  <p class="small muted" id="hotNote" hidden>Simplified map. Street detail could not load here.</p>
  <div class="row" style="align-items:center"><p class="small muted" id="hotSum" style="flex:1 1 150px"></p>
    <div class="seg" role="group" aria-label="Sort hotspots" style="flex:0 1 220px"><button data-sort="near" aria-pressed="${S.hotSort==="near"}">Nearest</button><button data-sort="count" aria-pressed="${S.hotSort==="count"}">Most reports</button></div></div>
  <section class="card" id="hotList" aria-label="Hotspot areas"></section>
  <p class="small muted">Reports and fake scans from the last ${WINDOW_DAYS} days. Sellers are never named here.</p>`;
}

function scanRows(list){ return `<div class="list">${list.map(s=>{ const p = s.productId && PRODUCTS[s.productId], pk = s.pack && PACKS[s.pack];
    const what = p && pk && pk.size > 1 ? (s.item ? `${cap(p.unit)} ${s.item} of ${pk.size}` : `${cap(p.packName)} of ${pk.size}`) : "";
    return `<div class="item"><div class="grow"><div class="t">${esc(p ? p.name : "Unknown product")}</div>
      <div class="small muted">${what ? esc(what) + " · " : ""}<span class="mono">${pretty(s.code)}</span> · ${esc(s.area ? cap(s.area) : "No location")} · ${ago(s.at)}</div></div>${statusChip(s.status)}</div>`; }).join("")}</div>`; }
function reportRows(){ const L2 = S.myReports;
  return L2.length ? `<div class="list">${L2.map(r=>`<div class="item"><div class="grow"><div class="t">${esc(r.productName || "Unknown product")}</div>
      <div class="small muted">${esc(cap(r.area || "No pin"))} · ${ago(r.at)}</div></div><span class="chip ok">Sent</span></div>`).join("")}</div>`
    : `<div class="empty">No reports yet. Report a suspicious product from the home screen.</div>`; }
function vHistory(){
  if (isBiz()){
    const singles = S.myScans.filter(s => s.accountType === "business" && !s.deliveryId);
    return `<h2>Deliveries</h2>
    <section class="card">${S.deliveries.length ? `<div class="list">${S.deliveries.map(d => `<button class="item" data-delivery="${esc(d.id)}">
        <span class="grow"><span class="t" style="display:block">${esc(d.supplier || "Supplier not named")}</span><span class="small muted">${plural(d.ok,"item")} verified · ${ago(d.at)}</span></span>
        ${d.bad ? `<span class="chip bad">${d.bad} flagged</span>` : `<span class="chip ok">All clear</span>`}</button>`).join("")}</div>`
      : `<div class="empty">No deliveries checked yet. Start one from the Stock tab when goods arrive.</div>`}</section>
    <h2>Single checks</h2>
    <section class="card">${singles.length ? scanRows(singles) : `<div class="empty">Single item checks will show here.</div>`}</section>
    <h2>My reports</h2><section class="card">${reportRows()}</section>`;
  }
  const L1 = S.myScans.filter(s => s.accountType !== "business");
  return `<h2>My scans</h2>
  <section class="card">${L1.length ? scanRows(L1) : `<div class="empty">Nothing scanned yet. Your checks will show here.</div>`}</section>
  <h2>My reports</h2><section class="card">${reportRows()}</section>`;
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
    <ul class="checks"><li><span class="dot p">1</span><span>Scan an item before you pay.</span></li>
    <li><span class="dot p">2</span><span>Answer the quick question after a genuine result: ${REWARD_POINTS} points.</span></li>
    <li><span class="dot p">3</span><span>One reward per item, up to ${MONTHLY_REWARD_CAP} a month (${P.rewardsThisMonth} used).</span></li></ul>
    <p class="notice">Rewards are paid from advertising on the app. Airtime and data top-ups are simulated for now.</p>
  </section>
  ${P.redeemed.length ? `<section class="card"><h3>Cashed out</h3><div class="list">${P.redeemed.map(r=>`<div class="item"><div class="grow"><div class="t">${naira(r.amount)} ${esc(r.kind.toLowerCase())}</div><div class="small muted">${ago(r.at)}</div></div><span class="chip ok">Sent (simulated)</span></div>`).join("")}</div></section>` : ""}`;
}

function vAccount(){
  const P = S.profile, h = here(), live = !!S.loc;
  return `<h2>Account</h2>
  <section class="card"><h3>Subscription</h3>
    ${subscribed() ? `<p><span class="chip ok">Active</span> ${isBiz() ? "Business plan: unlimited delivery and item checks" : "Unlimited scans"} for ${naira(price())} a month.</p><button class="btn ghost" id="cancelSub">Cancel subscription</button>`
     : `<p>${scansLeft()} of ${FREE_SCANS} free scans left.${isBiz() ? " The business plan covers every delivery and item check." : ""}</p><button class="btn primary" id="openPay">Subscribe for ${naira(price())} a month</button>`}
  </section>
  <section class="card"><h3>Account type</h3>
    <div class="seg" role="group" aria-label="Account type">
      <button data-acct="individual" aria-pressed="${P.accountType==="individual"}">Individual</button>
      <button data-acct="business" aria-pressed="${P.accountType==="business"}">Business</button></div>
    ${isBiz() ? `<p class="small muted"><b>${esc(P.biz ? P.biz.name : "")}</b>${P.biz ? " · " + esc(P.biz.type) + " · CAC " + esc(P.biz.cac || "") : ""}. Check deliveries, keep a stock record and report suppliers. Business scans don't earn rewards.</p>
        <button class="btn ghost" id="editBiz">Edit business details</button>`
      : `<p class="small muted">For shoppers checking before they buy. Earn rewards for answering a question after a scan. Shops, pharmacies and distributors should switch to Business.</p>`}
  </section>
  ${isBiz() ? verCard() : ""}
  <section class="card"><h3>My location</h3>
    <p class="small muted">${live ? `<span class="livedot" aria-hidden="true"></span>Live location is on: <b>${esc(h.area)}</b>.` : h ? `Set to <b>${esc(h.area)}</b>.` : "Not set."} ${isBiz() ? "It tags your checks and reports with your shop's area." : "It is used for hotspots near you."} Scans send only a rough area.</p>
    <div class="row">${live ? `<button class="btn ghost" id="pickHome">Use a fixed spot instead</button>` : `<button class="btn ghost" id="useGps">Use live location</button><button class="btn ghost" id="pickHome">Set it on the map</button>`}</div></section>
  <section class="card"><h3>About</h3>
    <p class="small muted">Veriprod is a prototype. The brands, products, codes and hotspots shown are test data. Payments, airtime, USSD, NAFDAC reports and inspection bookings are simulated.</p>
    <button class="btn ghost" id="resetData">Reset my data on this app</button></section>`;
}

/* ---------- sheets ---------- */
function sheet(html){ const o = document.createElement("div"); o.className="overlay"; o.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  o.close = () => { if (o.onclose) o.onclose(); o.remove(); };
  o.addEventListener("click", e => { if (e.target === o || e.target.closest("[data-close]")) o.close(); }); document.body.appendChild(o); return o; }
function openPaywall(){
  if (document.querySelector("#confirmPay")) return;
  const o = sheet(`<h2>You've used your ${FREE_SCANS} free scans</h2>
    <p class="muted">${isBiz() ? `The business plan is ${naira(price())} a month for unlimited delivery and item checks.` : `Keep checking for ${naira(price())} a month, with unlimited checks on every partner product.`}</p>
    <ul class="checks"><li><span class="dot p">✓</span><span>Unlimited QR, typed and USSD checks</span></li><li><span class="dot p">✓</span><span>${isBiz() ? "Check whole deliveries and keep a stock record" : "Earn airtime and data for quick questions"}</span></li><li><span class="dot p">✓</span><span>Report fakes straight to brands and NAFDAC</span></li></ul>
    <label class="field" for="payMethod">Pay with<select id="payMethod"><option>Card</option><option>Bank transfer</option><option>Airtime</option></select></label>
    <button class="btn primary block" id="confirmPay">Pay ${naira(price())} (simulated, no charge)</button>
    <button class="btn ghost block" data-close>Not now</button>`);
  o.querySelector("#confirmPay").onclick = () => { S.profile[planKey()] = "active"; saveProfile(); o.close(); toast("Subscribed. Unlimited scans unlocked."); if (S.tab !== "delivery") render(); };
}
function openHomePicker(){
  if (document.querySelector("#homeMap")) return;
  const o = sheet(`<h2>Where are you?</h2>
    <p class="small muted">Drop a pin on your area. Hotspots are shown around it until you turn live location on.</p>
    ${pinControls("home")}
    <p class="err" id="homeErr" hidden>Drop a pin first.</p>
    <button class="btn primary block" id="saveHome">Save location</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  const pc = wirePin(o, "home", here()); o.onclose = pc.destroy;
  o.querySelector("#saveHome").onclick = () => { const p = pc.get(); if (!p){ o.querySelector("#homeErr").hidden = false; return; }
    stopLive(); S.profile.locMode = "manual"; setHome(p.lat, p.lng); o.close(); toast("Location set: " + S.profile.home.area); render(); };
}
/* CAC numbers: RC for companies, BN for business names, IT for incorporated trustees, then the digits */
function cleanCac(v){ const m = String(v||"").toUpperCase().replace(/[\s.\-\/]/g,"").match(/^(RC|BN|IT)?(\d{4,8})$/); return m ? (m[1] || "RC") + " " + m[2] : null; }
function openBizSetup(){
  const b = S.profile.biz || {name:"", type:"Pharmacy", cac:""}, types = ["Pharmacy","Supermarket","Shop or kiosk","Distributor or wholesaler","Clinic or hospital"];
  const o = sheet(`<h2>Your business</h2>
    <p class="small muted">A business account checks deliveries and keeps a stock record. Its scans are counted separately from shoppers' scans. The plan is ${naira(PRICE.business)} a month after ${FREE_SCANS} free scans.</p>
    <label class="field" for="bizName">Business name<input type="text" id="bizName" value="${esc(b.name)}" placeholder="Name on your CAC certificate" maxlength="60"></label>
    <label class="field" for="bizCac">CAC registration number<input type="text" id="bizCac" class="mono" value="${esc(b.cac || "")}" placeholder="RC 1234567" maxlength="14" autocapitalize="characters">
      <span class="small muted">The RC, BN or IT number on your CAC certificate. An inspector checks it when you get verified.</span></label>
    <label class="field" for="bizType">Type of business<select id="bizType">${types.map(t=>`<option ${t===b.type?"selected":""}>${t}</option>`).join("")}</select></label>
    <p class="err" id="bizErr" hidden></p>
    <button class="btn primary block" id="saveBiz">Save</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  o.querySelector("#saveBiz").onclick = () => { const name = o.querySelector("#bizName").value.trim().slice(0,60), cac = cleanCac(o.querySelector("#bizCac").value), err = o.querySelector("#bizErr");
    if (!name){ err.textContent = "Add your business name."; err.hidden = false; return; }
    if (!cac){ err.textContent = "Enter the CAC number from your certificate: RC, BN or IT followed by the digits."; err.hidden = false; return; }
    const changed = S.profile.biz && S.profile.biz.cac && S.profile.biz.cac !== cac;
    S.profile.biz = Object.assign({}, S.profile.biz, {name, cac, type:o.querySelector("#bizType").value});
    if (changed) S.profile.biz.verified = false;        // a different registration has to be checked again
    S.profile.accountType = "business"; saveProfile(); o.close(); S.tab = "scan"; render(); toast("Business account is on"); };
}

/* ---------- business: getting Veriprod verified ---------- */
const verState = () => { const b = S.profile.biz; return !b ? "none" : b.verified ? "verified" : b.inspection ? "booked" : "none"; };
const SLOTS = {am:"morning, 9am to 12pm", pm:"afternoon, 12pm to 4pm"};
const dayLabel = d => new Date(d + "T00:00").toLocaleDateString("en-NG", {weekday:"short", day:"numeric", month:"short"});
const isoDay = t => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };
function verChip(){ const st = verState();
  return st === "verified" ? '<span class="chip ok">Veriprod verified</span>' : st === "booked" ? '<span class="chip">Inspection booked</span>' : '<span class="chip warn">Not verified yet</span>'; }
function verCard(){
  const st = verState(), i = S.profile.biz && S.profile.biz.inspection;
  if (st === "verified") return `<section class="card" id="verCard"><h3>Veriprod verified</h3><p>${verChip()}</p><p class="small muted">An inspector has checked your CAC registration, premises and stock.</p></section>`;
  if (st === "booked") return `<section class="card" id="verCard"><h3>Veriprod verified</h3><p>${verChip()}</p>
    <p class="small muted">An inspector visits on <b>${dayLabel(i.date)}</b> in the ${SLOTS[i.slot]}, at <b>${esc(i.address)}</b>. They will ask for ${esc(i.contact)}. Have your CAC certificate ready. Your badge shows here after the visit.</p>
    <div class="row"><button class="btn ghost" data-inspect="open">Change the booking</button><button class="btn ghost" data-inspect="cancel">Cancel inspection</button></div></section>`;
  return `<section class="card" id="verCard"><h3>Get Veriprod verified</h3><p>${verChip()}</p>
    <p class="small muted">A Veriprod inspector visits your premises, checks your CAC certificate and scans a sample of your stock. Verified businesses carry a badge that shoppers and brands can trust.</p>
    <button class="btn primary block" data-inspect="open">Schedule an inspection</button></section>`;
}
function openInspection(){
  const b = S.profile.biz; if (!b) return;
  const i = b.inspection || {}, min = isoDay(Date.now() + 2*DAY), h = here();
  const o = sheet(`<h2>Schedule an inspection</h2>
    <p class="small muted">Pick a day for a Veriprod inspector to visit <b>${esc(b.name)}</b> (CAC ${esc(b.cac)}). Visits run Monday to Saturday and take about an hour.</p>
    <div class="row"><label class="field" for="insDate">Day<input type="date" id="insDate" min="${min}" value="${esc(i.date && i.date >= min ? i.date : "")}"></label>
      <label class="field" for="insSlot">Time<select id="insSlot"><option value="am" ${i.slot==="pm"?"":"selected"}>Morning, 9am to 12pm</option><option value="pm" ${i.slot==="pm"?"selected":""}>Afternoon, 12pm to 4pm</option></select></label></div>
    <label class="field" for="insAddr">Address of the premises<input type="text" id="insAddr" value="${esc(i.address || "")}" placeholder="Street, area and city${h && h.area ? " (you are in " + esc(cap(h.area)) + ")" : ""}" maxlength="140"></label>
    <label class="field" for="insContact">Who should the inspector ask for?<input type="text" id="insContact" value="${esc(i.contact || "")}" placeholder="Full name" maxlength="60"></label>
    <label class="field" for="insPhone">Phone number<input type="tel" id="insPhone" value="${esc(i.phone || "")}" placeholder="0801 234 5678" maxlength="17" inputmode="tel"></label>
    <div><h3>What the inspector checks</h3></div>
    <ul class="checks"><li><span class="dot p">1</span><span>Your CAC certificate matches the number on your account.</span></li>
      <li><span class="dot p">2</span><span>The premises are where you say they are and are fit for the products you sell.</span></li>
      <li><span class="dot p">3</span><span>A sample of your stock scans as genuine.</span></li></ul>
    <p class="err" id="insErr" hidden></p>
    <button class="btn primary block" id="saveIns">${b.inspection ? "Save the booking" : "Book the inspection"}</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  o.querySelector("#saveIns").onclick = () => {
    const v = id => o.querySelector(id).value.trim(), err = o.querySelector("#insErr"), fail = m => { err.textContent = m; err.hidden = false; };
    const date = v("#insDate"), address = v("#insAddr").slice(0,140), contact = v("#insContact").slice(0,60), phone = v("#insPhone").replace(/[^\d+]/g,"");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("Pick a day for the visit.");
    if (date < min) return fail("Pick a day from " + dayLabel(min) + " onwards, so an inspector can be assigned.");
    if (new Date(date + "T00:00").getDay() === 0) return fail("Inspectors don't visit on Sundays. Pick another day.");
    if (address.length < 8) return fail("Add the full address of the premises.");
    if (!contact) return fail("Add the name of the person the inspector should ask for.");
    if (phone.replace(/\D/g,"").length < 10) return fail("Add a phone number the inspector can reach.");
    b.inspection = {date, slot:o.querySelector("#insSlot").value, address, contact, phone, bookedAt:Date.now()};
    saveProfile(); o.close(); render(); toast("Inspection booked for " + dayLabel(date));
  };
}
/* pinned above the tab bar for every business that is not verified yet */
function renderNudge(){
  let n = $("#nudge"); const bar = $("#tabs");
  if (!n){ n = document.createElement("div"); n.id = "nudge"; bar.parentNode.insertBefore(n, bar); }
  const st = isBiz() && S.tab !== "delivery" ? verState() : "verified", show = st !== "verified";
  n.hidden = !show; document.body.classList.toggle("has-nudge", show);
  if (!show){ n.innerHTML = ""; return; }
  n.innerHTML = st === "booked" ? `<span><b>Inspection booked</b> for ${dayLabel(S.profile.biz.inspection.date)}. Your badge follows the visit.</span><button class="btn ghost" data-inspect="view">View</button>`
    : `<span><b>Not verified yet.</b> Get the Veriprod verified badge.</span><button class="btn" data-inspect="open">Schedule an inspection</button>`;
}
/* a scanner in a sheet, for places that need one code back (the report form) */
function openScanner(onCode){
  stopCam();
  const o = sheet(`<h2>Scan the code</h2><section class="scanhero compact" id="scanBox"></section><button class="btn ghost block" data-close>Cancel</button>`);
  const box = o.querySelector("#scanBox"), done = c => { o.close(); onCode(c); };
  const draw = on => { box.innerHTML = finderHtml({on, videoId:"sheetVideo", startId:"sheetCam"}); };
  S.photoCb = done; o.onclose = () => { stopCam(); S.photoCb = null; };
  draw(false);
  const go = () => startCam({sel:"#sheetVideo", onCode:done, onReady:() => draw(true), onFail:() => draw(false)});
  box.addEventListener("click", e => { if (e.target.closest("#sheetCam")) go(); });
  if (S.liveCam) go();
}
/* o: {result} from a scan result, or {prefill:{code, productName, seller}} */
function openReport(o0){
  const opt = o0 || {}, r = opt.result || null, pre = opt.prefill || {};
  if (S.camOn && S.tab !== "delivery"){ stopCam(); render(); }
  const o = sheet(`<h2>${r ? (isBiz() ? "Report this supplier" : "Report this seller") : "Report a product"}</h2>
    ${r ? `<p class="small muted">${r.product ? esc(r.product.name) : "Unknown product"} · <span class="mono">${pretty(r.code)}</span></p>`
        : `<button type="button" class="btn primary block" id="repScanBtn">${ICON.scan} Scan the product's code</button>
           <p class="small" id="repScanOut" aria-live="polite" hidden></p>
           <label class="field" for="repProduct">Product name<input type="text" id="repProduct" value="${esc(pre.productName||"")}" placeholder="Name on the pack" maxlength="120"></label>
           <label class="field" for="repCode">Code on the pack (optional if it has none)<input type="text" id="repCode" class="mono" value="${pre.code ? pretty(pre.code) : ""}" placeholder="XXXX-XXXX-XXXX" maxlength="16"></label>`}
    <label class="btn ghost block" for="repPhoto" style="cursor:pointer">${ICON.camera} Add a photo of the product</label>
    <input type="file" id="repPhoto" class="vh" accept="image/*" tabindex="-1">
    <img id="repPrev" class="photo-prev" alt="Photo preview" hidden>
    <div><h3>Where did you see it?</h3><p class="small muted">${here() ? "The pin starts where you are. Move it to the shop or market if needed." : "Drop a pin on the shop or market."}</p></div>
    ${pinControls("rep")}
    <label class="field" for="repSeller">${isBiz() ? "Supplier or distributor" : "Shop or seller name"} (optional)<input type="text" id="repSeller" value="${esc(pre.seller||"")}" placeholder="${isBiz() ? "Who supplied it?" : "Shop name or stall number"}" maxlength="120"></label>
    <label class="field" for="repNotes">What did you notice? (optional)<textarea id="repNotes" placeholder="Price, packaging, seal..." maxlength="500"></textarea></label>
    <p class="err" id="repErr" hidden></p>
    <button class="btn danger block" id="sendRep">Send report</button>
    <button class="btn ghost block" data-close>Cancel</button>`);
  const pc = wirePin(o, "rep", here()); o.onclose = pc.destroy;
  let photo = null;
  const showCheck = code => { const out = o.querySelector("#repScanOut"), v = verify(code); if (!out) return v;
    out.hidden = false; out.innerHTML = `Code read: <span class="mono">${pretty(code.padEnd(12,"·"))}</span> ${statusChip(v.status)}${v.product ? " " + esc(v.product.name) : ""}`; return v; };
  const scanBtn = o.querySelector("#repScanBtn");
  if (scanBtn) scanBtn.onclick = () => openScanner(raw => { const code = normalize(raw), v = showCheck(code);
    o.querySelector("#repCode").value = pretty(code.padEnd(12,"·")).replace(/·/g,"");
    const name = o.querySelector("#repProduct"); if (v.product && !name.value.trim()) name.value = v.product.name; });
  if (pre.code && !r) showCheck(pre.code);
  o.querySelector("#repPhoto").onchange = async e => { const f = e.target.files[0]; if (!f) return; photo = await shrink(f, 520); const im = o.querySelector("#repPrev"); if (photo){ im.src = photo; im.hidden = false; } };
  o.querySelector("#sendRep").onclick = () => {
    const err = o.querySelector("#repErr"), pin = pc.get(); err.hidden = true;
    const name = r ? (r.product ? r.product.name : "Unknown product") : o.querySelector("#repProduct").value.trim().slice(0,120);
    if (!name){ err.textContent = "Scan the code or add the product name."; err.hidden = false; return; }
    if (!pin){ err.textContent = "Drop a pin where you saw it."; err.hidden = false; return; }
    const code = r ? r.code : normalize(o.querySelector("#repCode").value), v = r || (code ? verify(code) : null);
    const rep = {id:rid(), scanId: r ? r.id : (pre.scanId || null), code: code || null, status: v ? v.status : "reported", productName:name,
      brand: v && v.product ? v.product.brand : null, productId: v && v.pk ? v.pk.p : null, category: v && v.product ? v.product.category : "",
      seller:o.querySelector("#repSeller").value.trim().slice(0,120), notes:o.querySelector("#repNotes").value.trim().slice(0,500),
      by:S.profile.accountType, lat:+pin.lat.toFixed(5), lng:+pin.lng.toFixed(5), area:areaName(pin.lat,pin.lng), photo, at:Date.now()};
    S.reports.unshift(rep); saveReports();
    S.myReports.unshift({id:rep.id, productName:name, area:rep.area, at:rep.at}); lsSet("vp.myReports", S.myReports.slice(0,50));
    o.close(); toast("Report sent. Thank you for keeping your market safe."); if (S.tab !== "delivery") render();
  };
}
function shrink(file, maxW){ return new Promise(res => { const img = new Image(); img.onload = () => { const s = Math.min(1, maxW/img.width); const c = document.createElement("canvas");
  c.width = Math.round(img.width*s); c.height = Math.round(img.height*s); c.getContext("2d").drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg",0.7)); };
  img.onerror = () => res(null); img.src = URL.createObjectURL(file); }); }

/* ---------- render ---------- */
const tabsFor = () => isBiz() ? [["scan","Stock","box"],["history","Deliveries","history"],["account","Account","account"]]
  : [["scan","Scan","scan"],["hotspots","Hotspots","hotspots"],["history","History","history"],["rewards","Rewards","rewards"],["account","Account","account"]];
const CAM_TABS = ["scan","delivery"];
function render(){
  if (hot){ hot.map.stop(); hot.map.remove(); hot = null; }
  if (S.camOn && !CAM_TABS.includes(S.tab)) stopCam();
  if (isBiz() && (S.tab === "hotspots" || S.tab === "rewards")) S.tab = "scan";      // businesses have neither
  const map = {scan:vScan, result:vResult, delivery:vDelivery, deliveryDone:vDeliveryDone, hotspots:vHotspots, history:vHistory, rewards:vRewards, account:vAccount};
  $("#view").innerHTML = (map[S.tab] || vScan)();
  const active = ["result","delivery","deliveryDone"].includes(S.tab) ? "scan" : S.tab, tabs = tabsFor();
  const bar = $("#tabs"); bar.style.gridTemplateColumns = `repeat(${tabs.length},1fr)`;
  bar.innerHTML = tabs.map(([k,l,ic]) => `<button data-tab="${k}" ${k===active?'aria-current="page"':""}>${ICON[ic]}<span>${l}</span></button>`).join("");
  if (S.camOn) attachCam();
  if (S.tab === "hotspots" && here()) initHot();
  renderPlanChip(); renderNudge();
}
function leaveDelivery(){ if (S.delivery && S.delivery.lines.length){ S.delivery = null; toast("Delivery cancelled. The scans stay in your history."); } else S.delivery = null; }

document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.tab){ if (S.tab === "delivery") leaveDelivery(); S.tab = t.dataset.tab; render(); window.scrollTo(0,0); return; }
  if (t.dataset.inspect){ const a = t.dataset.inspect;
    if (a === "open") openInspection();
    else if (a === "view"){ S.tab = "account"; render(); const c = $("#verCard"); if (c) c.scrollIntoView({block:"center"}); }
    else if (a === "cancel" && S.profile.biz){ delete S.profile.biz.inspection; saveProfile(); render(); toast("Inspection cancelled"); }
    return; }
  if ((t.id === "camStart" || t.id === "delCam") && !canScan()){ openPaywall(); return; }
  if (t.id === "camStart"){ startCam({sel:"#camVideo", onCode:c => runScan(c,"qr"), onReady:() => { S.tab = "scan"; render(); }, onFail:render}); return; }
  if (t.id === "camStop" || t.id === "camPause"){ stopCam(); render(); return; }
  if (t.id === "scanAgain"){ S.tab = "scan"; S.doneDelivery = null; render(); window.scrollTo(0,0); return; }
  if (t.id === "homeReport"){ openReport(); return; }
  if (t.id === "openReport"){ openReport({result:S.result}); return; }
  if (t.id === "openPay"){ openPaywall(); return; }
  if (t.id === "useGps"){ startLive(true); return; }
  if (t.id === "pickHome"){ openHomePicker(); return; }
  if (t.id === "editBiz"){ openBizSetup(); return; }
  if (t.id === "delStart"){ stopCam(); S.delivery = {id:rid(), supplier:"", lines:[]}; S.tab = "delivery"; render(); window.scrollTo(0,0); return; }
  if (t.id === "delCam"){ startCam({sel:"#camVideo", continuous:true, onCode:deliveryAdd, onReady:render, onFail:render}); return; }
  if (t.id === "delFinish"){ finishDelivery(); return; }
  if (t.id === "delCancel"){ stopCam(); leaveDelivery(); S.tab = "scan"; render(); window.scrollTo(0,0); return; }
  if (t.dataset.delivery){ const d = S.deliveries.find(x => x.id === t.dataset.delivery); if (d) sheet(`<h2>${esc(d.supplier || "Delivery")}</h2>${deliveryDetail(d, false)}<button class="btn ghost block" data-close>Close</button>`); return; }
  if (t.dataset.delreport){ const d = S.deliveries.find(x => x.id === t.dataset.delreport), l = d && d.lines.find(l => l.status !== "genuine");
    if (l){ const top = t.closest(".overlay"); if (top) top.close(); openReport({prefill:{scanId:l.id, code:l.code, productName:l.name === "Unknown product" ? "" : l.name, seller:d.supplier}}); } return; }
  if (t.dataset.sort){ S.hotSort = t.dataset.sort; document.querySelectorAll("[data-sort]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sort === S.hotSort))); updateHot(false); return; }
  if (t.dataset.hot && hot){ const c = hotList[+t.dataset.hot]; if (c){ hot.map.setView([c.lat,c.lng], 14, {animate:false}); $("#hotMap").scrollIntoView({block:"center", behavior:"smooth"}); } return; }
  if (t.id === "cancelSub"){ S.profile[planKey()] = "free"; saveProfile(); render(); toast("Subscription cancelled"); return; }
  if (t.id === "resetData"){ const keep = {home:S.profile.home, locMode:S.profile.locMode, radiusMi:S.profile.radiusMi};
    S.profile = Object.assign(BLANK(), keep); S.myScans = []; S.myReports = []; S.reports = []; S.deliveries = []; S.delivery = null;
    saveScans(); lsSet("vp.myReports",[]); saveReports(); lsSet("vp.deliveries",[]); saveProfile(); S.tab = "account"; render(); toast("Your data on this app was reset"); return; }
  if (t.dataset.acct){
    if (t.dataset.acct === "business" && !(S.profile.biz && S.profile.biz.cac)){ openBizSetup(); return; }
    S.profile.accountType = t.dataset.acct; saveProfile(); render(); return; }
  if (t.dataset.redeem){ const P = S.profile; if (P.points < REDEEM_AT) return; P.points -= REDEEM_AT; P.redeemed.unshift({kind:t.dataset.redeem, amount:REDEEM_AT, at:Date.now()}); saveProfile(); render(); toast(`${naira(REDEEM_AT)} ${t.dataset.redeem.toLowerCase()} sent (simulated)`); return; }
  if (t.dataset.stock){ const r = S.result, rec = r && S.myScans.find(s=>s.id===r.id); if (!rec) return;
    rec.stocked = t.dataset.stock === "1"; rec.answer = rec.stocked ? "Stocked" : "Checked only"; saveScans(); render(); if (rec.stocked) toast("Added to your stock"); return; }
  if (t.dataset.ans){
    const r = S.result, P = S.profile, rec = r && S.myScans.find(s=>s.id===r.id); if (!rec) return;
    rec.answer = t.dataset.ans;
    const can = !P.rewardedSerials.includes(r.code) && P.rewardsThisMonth < MONTHLY_REWARD_CAP;
    if (can){ P.points += REWARD_POINTS; P.rewardedSerials.push(r.code); P.rewardsThisMonth++; rec.rewarded = true; toast(`+${REWARD_POINTS} points`); }
    saveScans(); saveProfile(); render();
    return;
  }
});
document.addEventListener("submit", e => {
  if (e.target.id === "codeForm"){ e.preventDefault(); runScan($("#codeInput").value, "typed"); }
  if (e.target.id === "delForm"){ e.preventDefault(); const i = $("#delCode"); if (normalize(i.value).length >= 8){ deliveryAdd(i.value); i.value = ""; } else toast("Type the 12-character code"); }
});
document.addEventListener("input", e => {
  if (e.target.id === "radius"){ S.profile.radiusMi = +e.target.value; $("#radLbl").textContent = radiusLabel(S.profile.radiusMi); updateHot(true); }
  if (e.target.id === "delSupplier" && S.delivery) S.delivery.supplier = e.target.value;
});
document.addEventListener("change", e => { if (e.target.id === "radius") saveProfile(); });

if (S.profile.accountType === "business" && !(S.profile.biz && S.profile.biz.cac)) S.profile.accountType = "individual";   // business accounts need a CAC number
S.profile.radiusMi = Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, +S.profile.radiusMi || RADIUS_DEFAULT));
render();
if (S.profile.locMode === "live") startLive(false);

/* ---------- offline support ---------- */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){ try { navigator.serviceWorker.register("sw.js").catch(()=>{}); } catch(e){} }
})();
