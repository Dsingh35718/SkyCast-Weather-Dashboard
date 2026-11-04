/** SkyCast's pure, browser- and Node-compatible weather helpers. */
export const DEFAULT_LOCATION = Object.freeze({
  name: 'New York', admin1: 'New York', country: 'United States', latitude: 40.7143, longitude: -74.0060,
});

const VISUALS = [
  { codes: [0], text: 'Clear sky', icon: '☀️', night: '🌙', type: 'clear' },
  { codes: [1], text: 'Mainly clear', icon: '🌤️', night: '🌙', type: 'clear' },
  { codes: [2], text: 'Partly cloudy', icon: '⛅', night: '☁️', type: 'clouds' },
  { codes: [3], text: 'Overcast', icon: '☁️', night: '☁️', type: 'clouds' },
  { codes: [45, 48], text: 'Foggy', icon: '🌫️', type: 'fog' },
  { codes: [51, 53, 55, 56, 57], text: 'Drizzle', icon: '🌦️', type: 'rain' },
  { codes: [61, 63, 65, 66, 67], text: 'Rainy', icon: '🌧️', type: 'rain' },
  { codes: [71, 73, 75, 77], text: 'Snowy', icon: '❄️', type: 'snow' },
  { codes: [80, 81, 82], text: 'Rain showers', icon: '🌧️', type: 'rain' },
  { codes: [85, 86], text: 'Snow showers', icon: '🌨️', type: 'snow' },
  { codes: [95, 96, 99], text: 'Thunderstorms', icon: '⛈️', type: 'storm' },
];

export function weatherVisual(code, isDay = true) {
  const found = VISUALS.find(item => item.codes.includes(Number(code)));
  if (!found) return { text: 'Weather unavailable', icon: '🌡️', type: 'unknown' };
  return { text: found.text, icon: !isDay && found.night ? found.night : found.icon, type: found.type };
}

export function displayLocation(location) {
  if (!location || !location.name) return 'Unknown location';
  const parts = [location.name];
  if (location.admin1 && location.admin1 !== location.name) parts.push(location.admin1);
  if (location.country) parts.push(location.country);
  return parts.join(', ');
}

export function convertTemperature(celsius, unit = 'C') {
  if (celsius === null || celsius === undefined || !Number.isFinite(Number(celsius))) return null;
  const value = Number(celsius);
  return unit === 'F' ? value * 9 / 5 + 32 : value;
}

export function displayTemp(celsius, unit = 'C') {
  const value = convertTemperature(celsius, unit);
  return value === null ? '—' : `${Math.round(value)}°`;
}

export function displayWind(kmh, unit = 'C') {
  if (kmh === null || kmh === undefined || !Number.isFinite(Number(kmh))) return '—';
  return `${Math.round(unit === 'F' ? Number(kmh) / 1.609344 : Number(kmh))} ${unit === 'F' ? 'mph' : 'km/h'}`;
}

export function displayPercent(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}%` : '—';
}

export function displayHour(time) {
  if (typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(time)) return '—';
  const hour = Number(time.slice(11, 13));
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12} ${suffix}`;
}

export function displayDay(iso, full = false) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) return '—';
  return new Intl.DateTimeFormat('en-US', { weekday: full ? 'long' : 'short', timeZone: 'UTC' }).format(date);
}

export function displayClock(time) {
  if (typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(time)) return '—';
  const hour = Number(time.slice(11, 13));
  const minute = time.slice(14, 16);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export function makeGeocodingUrl(term) {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', String(term).trim());
  url.searchParams.set('count', '6');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  return url.toString();
}

export function makeForecastUrl(place) {
  if (!place || !Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) {
    throw new TypeError('A location with valid coordinates is required');
  }
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(place.latitude));
  url.searchParams.set('longitude', String(place.longitude));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m,cloud_cover');
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  return url.toString();
}

export function selectNextHours(weather, number = 8) {
  const times = weather?.hourly?.time || [];
  const currentTime = weather?.current?.time || '';
  const currentHour = currentTime.slice(0, 13);
  let start = times.findIndex(time => time.slice(0, 13) >= currentHour);
  if (start === -1) start = 0;
  return times.slice(start, start + number).map((time, offset) => ({
    time,
    temperature: weather.hourly.temperature_2m?.[start + offset] ?? null,
    precipitation: weather.hourly.precipitation_probability?.[start + offset] ?? null,
    code: weather.hourly.weather_code?.[start + offset] ?? null,
  }));
}

export function selectDays(weather) {
  const times = weather?.daily?.time || [];
  return times.map((date, index) => ({
    date,
    code: weather.daily.weather_code?.[index] ?? null,
    high: weather.daily.temperature_2m_max?.[index] ?? null,
    low: weather.daily.temperature_2m_min?.[index] ?? null,
    rain: weather.daily.precipitation_probability_max?.[index] ?? null,
    sunrise: weather.daily.sunrise?.[index] ?? null,
    sunset: weather.daily.sunset?.[index] ?? null,
    uv: weather.daily.uv_index_max?.[index] ?? null,
  }));
}

export function validateForecast(weather) {
  return Boolean(weather && weather.current && typeof weather.current.temperature_2m === 'number' &&
    Array.isArray(weather.hourly?.time) && Array.isArray(weather.daily?.time) && weather.daily.time.length > 0);
}
