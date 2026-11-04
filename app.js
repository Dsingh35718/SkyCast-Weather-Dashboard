import {
  DEFAULT_LOCATION, weatherVisual, displayLocation, displayTemp, displayWind,
  displayPercent, displayHour, displayDay, displayClock, makeGeocodingUrl,
  makeForecastUrl, selectNextHours, selectDays, validateForecast,
} from './weather.mjs';

const $ = (id) => document.getElementById(id);
const storeKey = 'skycast-preferences-v1';
const state = { location: DEFAULT_LOCATION, unit: 'C', theme: 'dark', forecast: null, request: 0, controller: null };

function persist() {
  try {
    localStorage.setItem(storeKey, JSON.stringify({ location: state.location, unit: state.unit, theme: state.theme }));
  } catch { /* Browser settings might block persistent storage. */ }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey) || '{}');
    if (saved.unit === 'C' || saved.unit === 'F') state.unit = saved.unit;
    if (saved.theme === 'light' || saved.theme === 'dark') state.theme = saved.theme;
    if (saved.location && typeof saved.location.name === 'string' &&
        Number.isFinite(saved.location.latitude) && Number.isFinite(saved.location.longitude) &&
        Math.abs(saved.location.latitude) <= 90 && Math.abs(saved.location.longitude) <= 180) {
      state.location = {
        name: saved.location.name.slice(0, 100),
        admin1: String(saved.location.admin1 || '').slice(0, 100),
        country: String(saved.location.country || '').slice(0, 100),
        latitude: saved.location.latitude, longitude: saved.location.longitude,
      };
    }
  } catch { /* First visit or invalid stored JSON. */ }
}

function setStatus(message, kind = '') {
  const element = $('status');
  element.textContent = message;
  element.className = `status ${kind ? `is-${kind}` : ''}`;
}

function setBusy(busy) {
  $('search-button').disabled = busy;
  $('refresh').disabled = busy;
}

function applyTheme() {
  document.body.dataset.theme = state.theme;
  $('theme-toggle').textContent = state.theme === 'dark' ? '☀' : '☾';
  $('theme-toggle').setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelector('meta[name="theme-color"]').content = state.theme === 'dark' ? '#0a1932' : '#ecf6fc';
}

function updateUnits() {
  document.querySelectorAll('[data-unit]').forEach(button => {
    const active = button.dataset.unit === state.unit;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function render() {
  const data = state.forecast;
  if (!validateForecast(data)) return;
  const place = state.location;
  const current = data.current;
  const day = selectDays(data);
  const visual = weatherVisual(current.weather_code, current.is_day !== 0);

  $('dashboard').hidden = false;
  $('hero-card').dataset.sky = visual.type;
  $('location-name').textContent = place.name;
  $('location-subtitle').textContent = displayLocation(place);
  $('local-time').textContent = `${displayClock(current.time)} ${data.timezone_abbreviation || ''}`.trim();
  $('current-temp').textContent = displayTemp(current.temperature_2m, state.unit);
  $('current-condition').textContent = visual.text;
  $('feels-like').textContent = `Feels like ${displayTemp(current.apparent_temperature, state.unit)}`;
  $('weather-art').textContent = visual.icon;
  $('high-temp').textContent = displayTemp(day[0]?.high, state.unit);
  $('low-temp').textContent = displayTemp(day[0]?.low, state.unit);
  $('updated-at').textContent = `Forecast updated ${displayClock(current.time)}`;

  $('humidity').textContent = displayPercent(current.relative_humidity_2m);
  $('wind').textContent = displayWind(current.wind_speed_10m, state.unit);
  $('cloud-cover').textContent = displayPercent(current.cloud_cover);
  $('rain-chance').textContent = displayPercent(day[0]?.rain);
  renderHours(data);
  renderDays(day);
  updateUnits();
}

function createEl(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function renderHours(data) {
  const fragment = document.createDocumentFragment();
  for (const hour of selectNextHours(data, 8)) {
    const card = createEl('div', 'hour-item');
    card.append(
      createEl('div', 'hour-time', displayHour(hour.time)),
      createEl('span', 'hour-icon', weatherVisual(hour.code).icon),
      createEl('div', 'hour-temp', displayTemp(hour.temperature, state.unit)),
      createEl('div', 'hour-rain', `☂ ${displayPercent(hour.precipitation)}`),
    );
    fragment.append(card);
  }
  $('hourly-list').replaceChildren(fragment);
}

function renderDays(days) {
  const fragment = document.createDocumentFragment();
  days.forEach((day, index) => {
    const visual = weatherVisual(day.code);
    const row = createEl('div', 'day-item');
    const description = createEl('div', 'day-description');
    description.append(createEl('span', '', visual.text), createEl('span', 'day-rain', ` · ☂ ${displayPercent(day.rain)}`));
    const temps = createEl('div', 'day-temps');
    temps.append(createEl('strong', '', displayTemp(day.high, state.unit)), createEl('span', '', displayTemp(day.low, state.unit)));
    row.append(createEl('div', 'day-label', index === 0 ? 'Today' : displayDay(day.date)), createEl('div', 'day-icon', visual.icon), description, temps);
    fragment.append(row);
  });
  $('daily-list').replaceChildren(fragment);
}

function hideSuggestions() {
  $('search-results').hidden = true;
  $('search-results').replaceChildren();
}

function renderSuggestions(results) {
  const box = $('search-results');
  const fragment = document.createDocumentFragment();
  for (const candidate of results) {
    if (!Number.isFinite(candidate.latitude) || !Number.isFinite(candidate.longitude) || !candidate.name) continue;
    const button = createEl('button', '', `📍  ${displayLocation(candidate)}`);
    button.type = 'button';
    button.addEventListener('click', () => {
      hideSuggestions();
      $('city-input').value = candidate.name;
      loadWeather(candidate);
    });
    fragment.append(button);
  }
  if (!fragment.childNodes.length) {
    fragment.append(createEl('p', '', 'No matching cities found. Try a different spelling.'));
  }
  box.replaceChildren(fragment);
  box.hidden = false;
}

async function searchCity(query) {
  const term = query.trim();
  if (term.length < 2) {
    setStatus('Please enter at least two characters.', 'error');
    return;
  }
  const currentRequest = ++state.request;
  if (state.controller) state.controller.abort();
  state.controller = new AbortController();
  hideSuggestions();
  setBusy(true);
  setStatus(`Searching for “${term}”…`);
  try {
    const response = await fetch(makeGeocodingUrl(term), { signal: state.controller.signal });
    if (!response.ok) throw new Error(`Location search failed (${response.status})`);
    const data = await response.json();
    if (currentRequest !== state.request) return;
    const candidates = data.results || [];
    if (!candidates.length) {
      setStatus('City not found. Try a nearby city or add a country, such as “Paris, France”.', 'error');
      return;
    }
    if (candidates.length === 1) {
      await loadWeather(candidates[0]);
    } else {
      renderSuggestions(candidates);
      setStatus('Select a matching location from the list.');
    }
  } catch (error) {
    if (error.name !== 'AbortError' && currentRequest === state.request) {
      setStatus('Unable to search cities right now. Check your connection and retry.', 'error');
    }
  } finally {
    if (currentRequest === state.request) setBusy(false);
  }
}

async function loadWeather(place) {
  const currentRequest = ++state.request;
  if (state.controller) state.controller.abort();
  state.controller = new AbortController();
  setBusy(true);
  setStatus(`Loading the forecast for ${place.name}…`);
  try {
    const response = await fetch(makeForecastUrl(place), { signal: state.controller.signal });
    if (!response.ok) throw new Error(`Forecast request failed (${response.status})`);
    const data = await response.json();
    if (!validateForecast(data)) throw new Error('Unexpected weather data');
    if (currentRequest !== state.request) return;
    state.location = { name: place.name, admin1: place.admin1 || '', country: place.country || '', latitude: Number(place.latitude), longitude: Number(place.longitude) };
    state.forecast = data;
    persist();
    render();
    setStatus(`Showing the latest forecast for ${displayLocation(place)}.`, 'success');
  } catch (error) {
    if (error.name !== 'AbortError' && currentRequest === state.request) {
      setStatus('Could not load the weather right now. Check your connection and try again.', 'error');
    }
  } finally {
    if (currentRequest === state.request) setBusy(false);
  }
}

restore();
applyTheme();
updateUnits();
$('copyright-year').textContent = String(new Date().getFullYear());
$('city-form').addEventListener('submit', event => {
  event.preventDefault();
  searchCity($('city-input').value);
});
$('refresh').addEventListener('click', () => loadWeather(state.location));
$('theme-toggle').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  persist();
});
document.querySelectorAll('[data-unit]').forEach(button => button.addEventListener('click', () => {
  state.unit = button.dataset.unit;
  persist();
  render();
}));
const featuredCities = {
  'New York': DEFAULT_LOCATION,
  London: { name: 'London', admin1: 'England', country: 'United Kingdom', latitude: 51.5085, longitude: -0.1257 },
  Tokyo: { name: 'Tokyo', admin1: 'Tokyo', country: 'Japan', latitude: 35.6895, longitude: 139.6917 },
  'New Delhi': { name: 'New Delhi', admin1: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090 },
};
document.querySelectorAll('[data-city]').forEach(button => button.addEventListener('click', () => {
  hideSuggestions();
  $('city-input').value = button.dataset.city;
  loadWeather(featuredCities[button.dataset.city]);
}));
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideSuggestions(); });
document.addEventListener('click', event => { if (!event.target.closest('.search-area')) hideSuggestions(); });
loadWeather(state.location);
