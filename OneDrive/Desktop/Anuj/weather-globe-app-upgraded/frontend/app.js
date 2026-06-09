// ── Globe Setup ──
const world = Globe()
  (document.getElementById('globe'))
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .showAtmosphere(true)
  .atmosphereColor('#00c8ff')
  .atmosphereAltitude(0.18)
  .pointsData([])
  .pointColor(d => d.color)
  .pointAltitude(0.012)
  .pointRadius(d => d.radius || 0.4)
  .pointLabel(d => `
    <div class="custom-tooltip">
      <strong>${d.city}</strong>
      🌡️ ${d.temperature}°C &nbsp; 🌬️ ${d.windspeed} km/h
    </div>
  `)
  .onPointClick(d => showCityCard(d));

// Auto-rotate slowly
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.4;

// ── State ──
let mode = 'city';
let allPoints = [];

// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('hud-time').textContent =
    now.toUTCString().slice(17, 25) + ' UTC';
}
updateClock();
setInterval(updateClock, 1000);

// ── Mode Switcher ──
function setMode(m) {
  mode = m;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('mode-badge').textContent = m.toUpperCase();

  const stateBox = document.getElementById('state-country-box');
  const mainInput = document.getElementById('input-main');

  if (m === 'city') {
    mainInput.placeholder = 'Enter city name...';
    stateBox.style.display = 'none';
  } else if (m === 'state') {
    mainInput.placeholder = 'Enter state name (e.g. Maharashtra)...';
    stateBox.style.display = 'flex';
    document.getElementById('input-country').placeholder = 'Country (e.g. India)...';
  } else {
    mainInput.placeholder = 'Enter country name (e.g. India)...';
    stateBox.style.display = 'none';
  }
}

// ── Search ──
function doSearch() {
  if (mode === 'city') searchCity();
  else if (mode === 'state') searchState();
  else searchCountry();
}

// Enter key support
document.getElementById('input-main').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});
document.getElementById('input-country').addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

// ── Temperature helpers ──
function tempColor(t) {
  if (t < 10) return '#4fc3f7';
  if (t < 25) return '#81c784';
  return '#ff7043';
}

function tempClass(t) {
  if (t < 10) return 'cold';
  if (t < 25) return 'mild';
  return 'hot';
}

function weatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

// ── City Search ──
function searchCity() {
  const city = document.getElementById('input-main').value.trim();
  if (!city) return;

  setLoading(true);

  fetch(`http://localhost:5000/weather/${encodeURIComponent(city)}`)
    .then(r => r.json())
    .then(data => {
      setLoading(false);
      if (data.error) { showError(data.error); return; }

      const point = {
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        state: data.state,
        country: data.country,
        temperature: data.temperature,
        windspeed: data.windspeed,
        weathercode: data.weathercode,
        color: tempColor(data.temperature),
        radius: 0.5,
        type: 'city'
      };

      addPoint(point);
      flyTo(data.latitude, data.longitude, 1.5);
      showPanel(data.city, [point]);
    })
    .catch(() => { setLoading(false); showError('Server not responding'); });
}

// ── State Search ──
function searchState() {
  const state = document.getElementById('input-main').value.trim();
  const country = document.getElementById('input-country').value.trim();
  if (!state || !country) return;

  setLoading(true);

  fetch(`http://localhost:5000/state/${encodeURIComponent(state)}/${encodeURIComponent(country)}`)
    .then(r => r.json())
    .then(data => {
      setLoading(false);
      if (data.error) { showError(data.error); return; }

      const points = data.cities.map(c => ({
        lat: c.latitude,
        lng: c.longitude,
        city: c.city,
        state: c.state,
        country: c.country,
        temperature: c.temperature,
        windspeed: c.windspeed,
        weathercode: c.weathercode,
        color: tempColor(c.temperature),
        radius: 0.45,
        type: 'state'
      }));

      points.forEach(addPoint);

      if (points.length) {
        const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
        const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
        flyTo(avgLat, avgLng, 2.5);
      }

      showPanel(`${data.state}, ${data.country}`, points);
    })
    .catch(() => { setLoading(false); showError('Server not responding'); });
}

// ── Country Search ──
function searchCountry() {
  const country = document.getElementById('input-main').value.trim();
  if (!country) return;

  setLoading(true);

  fetch(`http://localhost:5000/country/${encodeURIComponent(country)}`)
    .then(r => r.json())
    .then(data => {
      setLoading(false);
      if (data.error) { showError(data.error); return; }

      const points = data.cities.map(c => ({
        lat: c.latitude,
        lng: c.longitude,
        city: c.city,
        state: c.state,
        country: c.country,
        temperature: c.temperature,
        windspeed: c.windspeed,
        weathercode: c.weathercode,
        color: tempColor(c.temperature),
        radius: 0.4,
        type: 'country'
      }));

      points.forEach(addPoint);

      if (points.length) {
        const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
        const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
        flyTo(avgLat, avgLng, 3.0);
      }

      showPanel(data.country.toUpperCase(), points);
    })
    .catch(() => { setLoading(false); showError('Server not responding'); });
}

// ── Globe helpers ──
function addPoint(p) {
  // Avoid duplicate coords
  allPoints = allPoints.filter(x => !(Math.abs(x.lat - p.lat) < 0.01 && Math.abs(x.lng - p.lng) < 0.01));
  allPoints.push(p);
  world.pointsData([...allPoints]);
}

function flyTo(lat, lng, altitude = 1.5) {
  world.controls().autoRotate = false;
  world.pointOfView({ lat, lng, altitude }, 1800);
  setTimeout(() => { world.controls().autoRotate = true; }, 5000);
}

// ── UI ──
function setLoading(on) {
  const btn = document.querySelector('.search-btn');
  btn.classList.toggle('loading', on);
  btn.innerHTML = on
    ? '<span class="spinner"></span><span>SCANNING</span>'
    : '<span>SCAN</span><span class="btn-arrow">▶</span>';
}

function showError(msg) {
  const panel = document.getElementById('info-panel');
  panel.style.display = 'block';
  document.getElementById('panel-location-name').textContent = 'ERROR';
  document.getElementById('panel-content').innerHTML =
    `<p class="error-msg">⚠ ${msg}</p>`;
}

function closePanel() {
  document.getElementById('info-panel').style.display = 'none';
}

function showCityCard(point) {
  showPanel(point.city, [point]);
}

function showPanel(title, points) {
  const panel = document.getElementById('info-panel');
  const content = document.getElementById('panel-content');
  panel.style.display = 'block';
  document.getElementById('panel-location-name').textContent = title;

  const cards = points.map(p => `
    <div class="city-card">
      <div class="weather-icon-row">${weatherIcon(p.weathercode || 0)}</div>
      <div class="city-card-name">${p.city}</div>
      ${p.state ? `<div class="city-card-sub">${p.state}${p.country ? ', ' + p.country : ''}</div>` : ''}
      <div class="temp-display">
        <span class="temp-value ${tempClass(p.temperature)}">${p.temperature}</span>
        <span class="temp-unit">°C</span>
      </div>
      <div class="weather-meta">
        <div class="meta-item">
          <span class="meta-label">WIND SPEED</span>
          <span class="meta-value">${p.windspeed} km/h</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">CONDITION</span>
          <span class="meta-value">${getCondition(p.weathercode)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">LAT</span>
          <span class="meta-value">${p.lat.toFixed(2)}°</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">LNG</span>
          <span class="meta-value">${p.lng.toFixed(2)}°</span>
        </div>
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="section-label">WEATHER DATA · ${points.length} LOCATION${points.length > 1 ? 'S' : ''}</div>
    ${cards}
  `;
}

function getCondition(code) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Thunder';
  return 'Unknown';
}
