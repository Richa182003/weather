import { useState } from "react";
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiStrongWind, WiHumidity } from "react-icons/wi";

const weatherCodeToIcon = (code) => {
  if ([0, 1].includes(code)) return <WiDaySunny size={64} color="#facc15" />;
  if ([2, 3].includes(code)) return <WiCloudy size={64} color="#60a5fa" />;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return <WiRain size={64} color="#3b82f6" />;
  if ([71, 73, 75].includes(code)) return <WiSnow size={64} color="#38bdf8" />;
  return <WiCloudy size={64} color="#6b7280" />; // fallback
};

const weatherCodeToDesc = (code) => {
  const map = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    61: "Rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate showers",
    82: "Violent showers",
  };
  return map[code] ?? "Unknown";
};

export default function App() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");

  const getWeather = async () => {
    setError("");
    setWeather(null);

    const q = city.trim();
    if (!q) {
      setError("Please enter a city name.");
      return;
    }

    try {
      setLoading(true);

      // Geocoding
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found.");
        setLoading(false);
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // Weather with humidity
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m`
      );
      const w = await weatherRes.json();

      if (!w.current_weather) {
        setError("Weather data unavailable.");
        setLoading(false);
        return;
      }

      // find humidity for current hour
      const now = new Date(w.current_weather.time);
      const idx = w.hourly.time.findIndex((t) => t === w.current_weather.time);
      const humidity = idx !== -1 ? w.hourly.relativehumidity_2m[idx] : null;

      setWeather({
        city: name,
        country,
        temperature: w.current_weather.temperature,
        windspeed: w.current_weather.windspeed,
        weathercode: w.current_weather.weathercode,
        humidity,
      });
    } catch (e) {
      console.error(e);
      setError("Failed to fetch weather. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(to bottom right, #60a5fa, #3b82f6, #1e3a8a)",
      color: "#fff",
      fontFamily: "Inter, Arial, sans-serif",
      padding: 20,
    }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>🌤 Weather Now</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>Check the latest weather instantly</p>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city..."
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            border: "none",
            minWidth: 240,
            fontSize: 16,
          }}
          onKeyDown={(e) => { if (e.key === "Enter") getWeather(); }}
        />
        <button
          onClick={getWeather}
          disabled={loading}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "#facc15",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {loading ? "Loading…" : "Get Weather"}
        </button>
      </div>

      {error && <div style={{ marginTop: 16, color: "#fee2e2" }}>{error}</div>}

      {weather && (
        <div style={{
          marginTop: 30,
          padding: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.1)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          textAlign: "center",
          maxWidth: 360,
        }}>
          <h2 style={{ margin: "0 0 10px 0" }}>
            {weather.city}, {weather.country}
          </h2>
          <div style={{ marginBottom: 10 }}>
            {weatherCodeToIcon(weather.weathercode)}
          </div>
          <p style={{ fontSize: 18, margin: 0 }}>
            {weatherCodeToDesc(weather.weathercode)}
          </p>
          <h3 style={{ fontSize: "2rem", margin: "10px 0" }}>
            🌡 {weather.temperature}°C
          </h3>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <WiStrongWind size={28} /> {weather.windspeed} km/h
            </div>
            {weather.humidity !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <WiHumidity size={28} /> {weather.humidity}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
