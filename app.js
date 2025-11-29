/* app.js - Nominatim + Open-Meteo (NO API KEY) 
   - Client-only, no PHP needed.
   - Works when served via a static server (see note).
*/

const cityInput = document.getElementById("cityInput");
const suggestions = document.getElementById("suggestions");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const refreshBtn = document.getElementById("refreshBtn");
const samplesBtn = document.getElementById("samplesBtn");
const currentEl = document.getElementById("current");
const forecastGrid = document.getElementById("forecastGrid");
const favoritesEl = document.getElementById("favorites");
const unitBtn = document.getElementById("unitBtn");
const themeBtn = document.getElementById("themeBtn");

let isCelsius = true;
let currentCity = null;
let currentCoords = null;
let lastData = null;
let autoInterval = null;

const unitStr = () => isCelsius ? "°C" : "°F";
const conv = c => isCelsius ? Math.round(c) : Math.round(c * 9/5 + 32);

function showStatus(msg){ currentEl.innerHTML = `<p class="small">${msg}</p>`; }
function showError(msg){ currentEl.innerHTML = `<p class="small" style="color:crimson">${msg}</p>`; }
function debug(...a){ console.log("[wdash]", ...a); }

/* --- Nominatim geocoding (no key) --- */
async function nominatimSearch(q){
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`;
  try{
    const res = await fetch(url, { headers: { "Accept-Language": "en" }});
    if(!res.ok) return { ok:false, status:res.status, text: await res.text() };
    const data = await res.json();
    return { ok:true, data };
  } catch(e){
    return { ok:false, reason: e.message };
  }
}

/* --- Open-Meteo weather (no key) --- */
async function openMeteoByCoords(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=5`;
  try{
    const res = await fetch(url);
    if(!res.ok) return { ok:false, status:res.status, text: await res.text() };
    const data = await res.json();
    return { ok:true, data };
  } catch(e){ return { ok:false, reason:e.message }; }
}

function getHumidityFromHourly(hourly){
  if(!hourly || !hourly.time || !hourly.relativehumidity_2m) return null;
  const times = hourly.time; const hum = hourly.relativehumidity_2m;
  const now = Date.now();
  let best = 0, bestDiff = Infinity;
  for(let i=0;i<times.length;i++){
    const t = new Date(times[i]).getTime();
    const d = Math.abs(t-now);
    if(d < bestDiff){ bestDiff = d; best = i; }
  }
  return hum[best];
}

const wcMap = {0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Moderate drizzle",55:"Dense drizzle",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",71:"Slight snow",73:"Moderate snow",75:"Heavy snow",80:"Rain showers",81:"Heavy rain showers",95:"Thunderstorm",99:"Thunderstorm hail"};
function wcDesc(code){ return wcMap[code] || "Unknown"; }

/* --- render --- */
function renderFromOpenMeteo(om, name){
  lastData = { source:"om", data:om };
  currentCity = name || currentCity || "Location";
  if(om.latitude) currentCoords = { lat:om.latitude, lon:om.longitude };

  const cw = om.current_weather || {};
  const temp = conv(cw.temperature ?? NaN);
  const wind = cw.windspeed ?? "-";
  const wc = cw.weathercode;
  const hum = getHumidityFromHourly(om.hourly) ?? "-";
  const desc = wcDesc(wc);

  currentEl.innerHTML = `
    <div class="info">
      <h2 style="margin:0">${currentCity}</h2>
      <p class="small">Updated: ${cw.time ? new Date(cw.time).toLocaleString() : new Date().toLocaleString()}</p>
      <p class="temp">${temp}<span style="font-size:14px"> ${unitStr()}</span></p>
      <p class="small">Humidity: ${hum}% • Wind: ${wind} m/s</p>
      <p class="small">${desc}</p>
      <div style="margin-top:10px"><button class="btn" onclick="addFavorite()">Simpan Favorit</button></div>
    </div>
    <div><img src="https://open-meteo.com/images/weathericons/svg/${wc||0}.svg" alt="${desc}" onerror="this.style.display='none'"></div>
  `;

  // daily
  const daily = om.daily || {}; const dates = daily.time || []; const tmin = daily.temperature_2m_min || []; const tmax = daily.temperature_2m_max || []; const wcodes = daily.weathercode || [];
  forecastGrid.innerHTML = "";
  for(let i=0;i<dates.length && i<5;i++){
    const date = new Date(dates[i]);
    const min = conv(tmin[i]); const max = conv(tmax[i]); const code = wcodes[i] || 0; const ddesc = wcDesc(code);
    const cell = document.createElement("div"); cell.className = "cell";
    cell.innerHTML = `<div class="small">${date.toLocaleDateString()}</div><img src="https://open-meteo.com/images/weathericons/svg/${code}.svg" alt="${ddesc}" onerror="this.style.display='none'"/><div class="small">${ddesc}</div><div style="margin-top:6px">${min}${unitStr()} / ${max}${unitStr()}</div>`;
    forecastGrid.appendChild(cell);
  }
}

/* --- flow: search name -> nominatim -> open-meteo --- */
async function robustSearch(name){
  name = (name||"").trim();
  if(!name){ showError("Masukkan nama kota"); return; }
  showStatus("Mengambil data...");
  debug("Searching", name);
  const geo = await nominatimSearch(name);
  if(!geo.ok){ debug("nominatim failed", geo); showError("Gagal memanggil geocoding. Periksa koneksi."); return; }
  if(!Array.isArray(geo.data) || geo.data.length === 0){ showError('Kota tidak ditemukan. Coba ejaan lain (contoh: "Jakarta").'); return; }
  const place = geo.data[0];
  const display = place.display_name || name; const lat = parseFloat(place.lat); const lon = parseFloat(place.lon);
  debug("Nominatim:", display, lat, lon);
  const om = await openMeteoByCoords(lat, lon);
  if(!om.ok){ debug("om fail", om); showError("Gagal memanggil Open-Meteo. Periksa koneksi."); return; }
  renderFromOpenMeteo(om.data, display);
  localStorage.setItem("lastCity", display);
}

/* --- geolocation --- */
function doGeolocation(){
  if(!navigator.geolocation){ showError("Geolocation tidak tersedia"); return; }
  showStatus("Mendeteksi lokasi...");
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      const om = await openMeteoByCoords(lat, lon);
      if(!om.ok){ showError("Gagal panggil Open-Meteo untuk lokasi Anda."); return; }
      renderFromOpenMeteo(om.data, "Lokasi saat ini");
      localStorage.setItem("lastCity", "Lokasi saat ini");
    }catch(e){ showError("Gagal fetch lokasi"); }
  }, ()=> showError("Izin lokasi ditolak / timeout"), { timeout:8000 });
}

/* --- favorites --- */
function getFavs(){ try{ return JSON.parse(localStorage.getItem("fav")||"[]"); }catch{ return []; } }
function addFavorite(){ if(!currentCity) return; const a=getFavs(); if(!a.includes(currentCity)){ a.push(currentCity); localStorage.setItem("fav", JSON.stringify(a)); renderFavorites(); } }
function removeFavorite(n){ const a=getFavs().filter(x=>x!==n); localStorage.setItem("fav", JSON.stringify(a)); renderFavorites(); }
function renderFavorites(){ const a=getFavs(); favoritesEl.innerHTML=""; if(a.length===0){ favoritesEl.textContent="Belum ada favorit"; return; } a.forEach(n=>{ const d=document.createElement("div"); d.className="fav-pill"; d.textContent=n; d.onclick=()=> robustSearch(n); d.oncontextmenu=(e)=>{ e.preventDefault(); removeFavorite(n); }; favoritesEl.appendChild(d); }); }

/* --- samples, auto-update & events --- */
function showSamples(){ currentEl.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="robustSearch('Jakarta')">Jakarta</button><button class="btn" onclick="robustSearch('London')">London</button><button class="btn" onclick="robustSearch('New York')">New York</button></div><p class="small" style="margin-top:8px">Klik untuk tes cepat.</p>`; }

function startAuto(){
  if(autoInterval) clearInterval(autoInterval);
  autoInterval = setInterval(()=>{ const last = localStorage.getItem("lastCity"); if(last) robustSearch(last); }, 300000);
  document.addEventListener("visibilitychange", ()=>{ if(document.hidden){ if(autoInterval) clearInterval(autoInterval); } else startAuto(); });
}

searchBtn.addEventListener("click", ()=> robustSearch(cityInput.value.trim()));
cityInput.addEventListener("keydown", e => { if(e.key === "Enter") robustSearch(cityInput.value.trim()); });
cityInput.addEventListener("input", e => {
  suggestions.innerHTML = "";
  const q = e.target.value.trim().toLowerCase();
  if(!q) return;
  const sample = ["Jakarta","Bandung","Surabaya","Medan","Yogyakarta","Semarang","Denpasar"];
  sample.filter(s=>s.toLowerCase().includes(q)).slice(0,6).forEach(m=>{
    const el = document.createElement("div"); el.className = "item"; el.textContent = m;
    el.onclick = ()=> { cityInput.value = m; suggestions.innerHTML = ""; robustSearch(m); };
    suggestions.appendChild(el);
  });
});
geoBtn.addEventListener("click", doGeolocation);
refreshBtn.addEventListener("click", ()=> { const last = localStorage.getItem("lastCity"); if(currentCoords){ openMeteoByCoords(currentCoords.lat, currentCoords.lon).then(r=>{ if(r.ok) renderFromOpenMeteo(r.data, currentCity); else showError("Gagal refresh"); }); } else if(last) robustSearch(last); else showStatus("Belum ada yang disegarkan."); });
samplesBtn.addEventListener("click", showSamples);
unitBtn.addEventListener("click", ()=> { isCelsius = !isCelsius; unitBtn.textContent = isCelsius ? "°C":"°F"; if(lastData){ renderFromOpenMeteo(lastData.data, currentCity); }});
themeBtn.addEventListener("click", ()=> document.body.classList.toggle("dark"));

(function init(){ renderFavorites(); const last = localStorage.getItem("lastCity"); if(last){ cityInput.value = last; robustSearch(last); } else showSamples(); startAuto(); })();
window.addFavorite = addFavorite;
