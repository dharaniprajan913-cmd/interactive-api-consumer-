
const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const statusBox = document.getElementById("status");
const weatherCard = document.getElementById("weatherCard");

function showStatus(message, type = "") {
  statusBox.replaceChildren();

  const dot = document.createElement("span");
  dot.className = "status-dot";

  const text = document.createElement("span");
  text.textContent = message;

  statusBox.append(dot, text);
  statusBox.className = "status";

  if (type) statusBox.classList.add(type);
}

function getWeatherInfo(code) {
  const weather = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    56: ["Freezing drizzle", "🌧️"],
    57: ["Heavy freezing drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Moderate rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Heavy freezing rain", "🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Moderate snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Moderate rain showers", "🌧️"],
    82: ["Heavy rain showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm with hail", "⛈️"],
    99: ["Severe thunderstorm", "⛈️"]
  };

  return weather[code] || ["Unknown condition", "🌡️"];
}

async function getCityCoordinates(city) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to search for this city.");
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("City not found. Please try another city.");
  }

  // Prefer a matching Indian city when available.
  const location =
    data.results.find(place => place.country_code === "IN") ||
    data.results[0];

  return location;
}

async function getWeather(latitude, longitude) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather service is unavailable. Try again later.");
  }

  const data = await response.json();

  if (!data.current) {
    throw new Error("Weather data is currently unavailable.");
  }

  return data;
}

function displayWeather(location, data) {
  const current = data.current;
  const [description, icon] = getWeatherInfo(current.weather_code);

  document.getElementById("cityName").textContent =
    `${location.name}, ${location.country || ""}`;

  document.getElementById("localTime").textContent =
    `Timezone: ${data.timezone}`;

  document.getElementById("weatherIcon").textContent = icon;
  document.getElementById("condition").textContent = description;

  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);

  document.getElementById("feelsLike").textContent =
    Math.round(current.apparent_temperature);

  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.getElementById("windSpeed").textContent =
    Number(current.wind_speed_10m).toFixed(1);

  document.getElementById("updatedAt").textContent =
    `${current.time.replace("T", " ")} (${data.timezone})`;

  document.getElementById("humidityBar").style.width =
    `${Math.max(0, Math.min(100, current.relative_humidity_2m))}%`;

  // Visual indicator scaled to a maximum of 60 km/h
  document.getElementById("windBar").style.width =
    `${Math.max(0, Math.min(100, current.wind_speed_10m / 60 * 100))}%`;

  weatherCard.hidden = false;
}

async function searchWeather(city) {
  searchBtn.disabled = true;
  searchBtn.innerHTML = "<span>⟳</span> Loading...";
  weatherCard.hidden = true;

  showStatus("Fetching live weather data...");

  try {
    const location = await getCityCoordinates(city);

    const weatherData = await getWeather(
      location.latitude,
      location.longitude
    );

    displayWeather(location, weatherData);
    showStatus("Weather loaded successfully!", "success");

  } catch (error) {
    showStatus(
      error.message || "Something went wrong. Check your internet connection.",
      "error"
    );

  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = "<span>⌕</span> Search";
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showStatus("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }

  searchWeather(city);
});

// Default city when the page opens
form.addEventListener("submit", event => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showStatus("Please enter a city name.", "error");
    cityInput.focus();
    return;
  }

  searchWeather(city);
});

// Show the welcome screen when the app opens
weatherCard.hidden = true;
showStatus("Enter a city to check its weather.");
