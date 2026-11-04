# 🌤️ SkyCast — Know the sky. Own your day.

**Project 2 of the 12 Must-Do Developer Projects series**  
A responsive, modern weather dashboard built with **HTML5, CSS3, and vanilla JavaScript**. Search cities worldwide, check current conditions, compare temperatures and rain chances, and plan the next seven days.

> **Live demo:** Add your GitHub Pages link here after deployment, for example: `https://dsingh35718.github.io/SkyCast-Weather-Dashboard/`

![SkyCast responsive desktop weather dashboard preview with illustrative sample weather values](assets/skycast-preview-demo.png)

*Preview uses **mock weather data** for the UI demonstration; the published application requests forecast data from Open-Meteo.*

## Features

- **Global city search** with selectable matches for places sharing a name
- **Current weather:** temperature, condition, feels-like, humidity, wind, cloud cover, high/low, and rain chance
- **Hourly outlook:** next eight hourly intervals, temperatures, conditions and precipitation probabilities
- **Seven-day forecast:** high/low temperatures, weather icons and daily precipitation chance
- **Celsius / Fahrenheit** and corresponding km/h / mph conversion
- **Light and dark themes** with persistent preferences
- Quick city shortcuts: New York, London, Tokyo, and New Delhi
- **Responsive UI** for desktop, tablet and phone; horizontally scrollable hourly cards on narrow screens
- Clear loading/error states, semantic markup, labeled inputs and keyboard-operable controls
- No account, build process, dependency installation, server-side code or API key for noncommercial use

### Mobile preview

![SkyCast mobile layout with illustrative sample weather values](assets/skycast-mobile-demo.png)

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, modern JavaScript ES modules |
| Weather data | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) |
| City lookup | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) |
| Local preferences | Browser `localStorage` |
| Tests | Node.js built-in `node:test` and `assert` |
| CI | GitHub Actions |
| Hosting | GitHub Pages |

The app requests live forecast and geocoding data from Open-Meteo. Forecasts are **model-based predictions**, not guaranteed observations. Location search and weather data require an internet connection. Refer to Open-Meteo's current licensing and fair-use terms before commercial deployment.

## Run locally

You need an up-to-date browser and a simple local web server; **do not** double-click `index.html` because ES modules can be blocked for `file://` pages.

```bash
# In the SkyCast-Weather-Dashboard folder
python3 -m http.server 5500
```

Open **http://localhost:5500**. No Node packages or API keys are required to run the web application.

## Automated tests

The project includes pure utility functions with unit tests for WMO weather descriptions, location formatting, temperature conversions, wind units, time/date formatting, Open-Meteo URL parameters, response validation, and hourly/daily forecast selection.

Requires Node.js 20+ (tested with Node.js 22):

```bash
node --test tests/weather.test.mjs
```

**Result during preparation:** 13 tests passing. A GitHub Actions workflow in `.github/workflows/tests.yml` runs these tests on pushes and pull requests.

The dashboard was also checked in a headless browser with **mock API responses** for layout, search-result selection, temperature-unit and theme controls, refresh behavior, and mobile overflow. Live API connectivity should be tested on the GitHub Pages deployment from your browser.

## Deploy using GitHub Pages

1. Create a **public** GitHub repository named `SkyCast-Weather-Dashboard`.
2. Upload **all contents** of this project folder, preserving `tests/`, `.github/workflows/`, and `assets/`. Make sure `index.html` is at the **repository root**.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose **`main`** and **`/ (root)`**, then click **Save**.
6. When GitHub Pages confirms deployment, visit `https://YOUR-USERNAME.github.io/SkyCast-Weather-Dashboard/`.

### Upload tips for the GitHub website

The browser uploader may not reliably preserve hidden `.github` files when choosing individual files. Drag the whole folder contents if supported, or use GitHub Desktop/Terminal to preserve the full structure. To create the workflow directly using GitHub's web editor, select **Add file → Create new file** and use the filename `.github/workflows/tests.yml`.

## Repository structure

```text
SkyCast-Weather-Dashboard/
├── index.html                  # Accessible weather dashboard UI
├── styles.css                  # Responsive dark/light design
├── app.js                      # UI events, fetch requests, local preferences
├── weather.mjs                 # Pure weather formatting and API helpers
├── favicon.svg                 # Brand icon
├── assets/
│   ├── skycast-preview-demo.png
│   └── skycast-mobile-demo.png
├── tests/
│   └── weather.test.mjs        # 13 automated unit tests
├── .github/
│   └── workflows/
│       └── tests.yml          # Continuous integration
├── .gitignore
├── LICENSE
└── README.md
```

## Limitations & privacy

- City name and unit/theme preferences are stored **only in the browser's localStorage**, without account synchronization.
- Requests to Open-Meteo transmit the city search term or geographic coordinates needed for the forecast; see their privacy terms.
- Open-Meteo offers noncommercial access without an API key within its usage conditions. Usage, availability, rate limits, and licensing may change.
- Weather condition icons are expressive emoji whose appearance varies slightly by operating system.
- Values in repository preview screenshots are **illustrative test data**, not real-time reports for a particular date.

## Data and attribution

- Weather forecast: [Open-Meteo](https://open-meteo.com/) — [Forecast API documentation](https://open-meteo.com/en/docs)
- Location lookup: [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api), using location data derived from [GeoNames](https://www.geonames.org/)

Attribution is included in the application footer.

## Author

**Darshdeep Singh** — Computer & Information Science, SUNY Old Westbury  
[GitHub](https://github.com/Dsingh35718) · [LinkedIn](https://www.linkedin.com/in/darshdeep-singh-087701219/)

*Built as a portfolio project to practice JavaScript modules, REST API integration, responsive UI, state persistence, automated tests, and deployment.*
