require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const Weather = require("./models/Weather");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
  app.listen(5000, () => {
    console.log("Server running on port 5000");
  });
})
.catch(err => console.log("MongoDB Error:", err));

// Helper: fetch weather for a lat/lng
async function fetchWeather(lat, lng) {
  const weather = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
    params: {
      latitude: lat,
      longitude: lng,
      current_weather: true,
      hourly: "relative_humidity_2m,apparent_temperature",
      forecast_days: 1
    }
  });
  return weather.data.current_weather;
}

// Helper: geocode a place name
async function geocode(name, count = 1) {
  const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
    params: { name, count, language: "en" }
  });
  return geo.data.results || [];
}

// 🌍 CITY WEATHER
app.get("/weather/:city", async (req, res) => {
  try {
    const city = req.params.city.trim();
    const results = await geocode(city, 1);

    if (!results.length) {
      return res.status(404).json({ error: "City not found" });
    }

    const location = results[0];
    const w = await fetchWeather(location.latitude, location.longitude);

    const result = {
      city: location.name,
      state: location.admin1 || null,
      country: location.country || null,
      country_code: location.country_code || null,
      temperature: w.temperature,
      windspeed: w.windspeed,
      weathercode: w.weathercode,
      latitude: location.latitude,
      longitude: location.longitude
    };

    res.json(result);
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 🗺️ STATE TEMPERATURE - returns temps for major cities in a state
app.get("/state/:state/:country", async (req, res) => {
  try {
    const { state, country } = req.params;

    // Search for the state capital / main city
    const results = await geocode(`${state} ${country}`, 5);

    if (!results.length) {
      return res.status(404).json({ error: "State not found" });
    }

    // Filter to match state name
    const stateResults = results.filter(r =>
      r.admin1 && r.admin1.toLowerCase().includes(state.toLowerCase())
    ).slice(0, 3);

    const targets = stateResults.length ? stateResults : results.slice(0, 3);

    const weatherData = await Promise.all(
      targets.map(async (loc) => {
        const w = await fetchWeather(loc.latitude, loc.longitude);
        return {
          city: loc.name,
          state: loc.admin1 || state,
          country: loc.country,
          temperature: w.temperature,
          windspeed: w.windspeed,
          weathercode: w.weathercode,
          latitude: loc.latitude,
          longitude: loc.longitude
        };
      })
    );

    res.json({ state, country, cities: weatherData });
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 🌐 COUNTRY TEMPERATURE - returns temps for major cities in a country
app.get("/country/:country", async (req, res) => {
  try {
    const { country } = req.params;

    // Common major cities per country — fallback to geocoding
    const majorCities = {
      "india": ["Mumbai","Delhi","Bangalore","Chennai","Kolkata","Hyderabad","Pune","Ahmedabad"],
      "usa": ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","Dallas"],
      "uk": ["London","Manchester","Birmingham","Glasgow","Liverpool","Bristol","Edinburgh","Leeds"],
      "germany": ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Düsseldorf","Leipzig"],
      "france": ["Paris","Lyon","Marseille","Toulouse","Nice","Nantes","Strasbourg","Bordeaux"],
      "china": ["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Hangzhou","Wuhan","Xi'an"],
      "japan": ["Tokyo","Osaka","Nagoya","Sapporo","Fukuoka","Kobe","Kyoto","Hiroshima"],
      "brazil": ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Manaus","Curitiba"],
      "australia": ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Hobart"],
      "canada": ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City"],
      "russia": ["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan","Nizhny Novgorod","Chelyabinsk","Samara"],
      "pakistan": ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Peshawar","Quetta","Multan"],
    };

    const countryKey = country.toLowerCase();
    const cities = majorCities[countryKey] || [];

    let weatherData = [];

    if (cities.length) {
      weatherData = await Promise.all(
        cities.slice(0, 6).map(async (cityName) => {
          const results = await geocode(cityName, 1);
          if (!results.length) return null;
          const loc = results[0];
          const w = await fetchWeather(loc.latitude, loc.longitude);
          return {
            city: loc.name,
            state: loc.admin1 || null,
            country: loc.country,
            temperature: w.temperature,
            windspeed: w.windspeed,
            weathercode: w.weathercode,
            latitude: loc.latitude,
            longitude: loc.longitude
          };
        })
      );
      weatherData = weatherData.filter(Boolean);
    } else {
      // Generic geocode search
      const results = await geocode(country, 6);
      weatherData = await Promise.all(
        results.slice(0, 6).map(async (loc) => {
          const w = await fetchWeather(loc.latitude, loc.longitude);
          return {
            city: loc.name,
            state: loc.admin1 || null,
            country: loc.country,
            temperature: w.temperature,
            windspeed: w.windspeed,
            weathercode: w.weathercode,
            latitude: loc.latitude,
            longitude: loc.longitude
          };
        })
      );
    }

    res.json({ country, cities: weatherData });
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});
