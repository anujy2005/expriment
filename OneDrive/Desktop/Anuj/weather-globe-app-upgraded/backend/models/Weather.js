const mongoose = require("mongoose");

const WeatherSchema = new mongoose.Schema({
  city: String,
  temperature: Number,
  lat: Number,
  lon: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Weather", WeatherSchema);