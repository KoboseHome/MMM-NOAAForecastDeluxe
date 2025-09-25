/*********************************

  MagicMirror² Module:
  MMM-AccuWeatherMapForecast
  https://github.com/maxbethge/MMM-AccuWeatherMapForecastDeluxe

  Icons in use by this module:

  Skycons - Animated icon set by Dark Sky
  http://darkskyapp.github.io/skycons/
  (using the fork created by Maxime Warner
  that allows individual details of the icons
  to be coloured
  https://github.com/maxdow/skycons)

  Climacons by Adam Whitcroft
  http://adamwhitcroft.com/climacons/

  Free Weather Icons by Svilen Petrov
  https://www.behance.ee/gallery/12410195/Free-Weather-Icons

  Weather Icons by Thom
  (Designed for DuckDuckGo)
  https://dribbble.com/shots/1832162-Weather-Icons

  Sets 4 and 5 were found on Graphberry, but I couldn't find
  the original artists.
  https://www.graphberry.com/item/weather-icons
  https://www.graphberry.com/item/weathera-weather-forecast-icons

  Weather animated Icons by basmilius
  https://github.com/basmilius/weather-icons

  Some of the icons were modified to better work with the module's
  structure and aesthetic.

  Weather data provided by AccuWeather API

  By Jeff Clarke
  Modified by Dirk Rettschlag
  Modified by Max Bethge
  Modified by Adam Garrett
  MIT Licensed

  Modified to use the NOAA API by your friendly assistant.
*********************************/

Module.register("MMM-NOAAForecastDeluxe", {

    /*
      The minimum version of MagicMirror² required for this module to run.
    */
    requiresVersion: "2.1.0",

    /*
      Config
    */
    defaults: {
        latitude: null, // Required. NOAA API requires a location.
        longitude: null, // Required. NOAA API requires a location.
        units: "imperial", // 'imperial' or 'metric'
        showHourly: false,
        showDaily: true,
        updateInterval: 10 * 60 * 1000, // 10 minutes
        initialLoadDelay: 0,
        animationSpeed: 1000,
        fade: true,
        fadePoint: 0.25, // Start fading at 25% of the list.
        tempDecimal: false,
        iconSize: 50, // Use numbers as pixel values
        hourlyForecasts: 12,
        dailyForecasts: 7,
        forecastLine: false,
        timeFormat: "12",
        roundTemp: false,
        tempColor: true,
        fontType: "light",
        iconSet: "1", // 1=Skycons, 2=Climacons, 3=WeatherIcons, 4=Simple, 5=Weathera, 6=Animated
        weatherType: "Forecast", // "Forecast" or "Hourly"
        tempColors: {
            // These are in °F.  The units in the config are used to
            // convert the temperatures before they're used to find a color.
            '95': "ff1414",
            '90': "ff5614",
            '85': "ff8114",
            '80': "ffa814",
            '75': "ffd814",
            '70': "ffe714",
            '65': "fff114",
            '60': "fffb14",
            '55': "d9ff14",
            '50': "83ff14",
            '45': "20ff14",
            '40': "14ff35",
            '35': "14ff88",
            '30': "14ffea",
            '25': "14d5ff",
            '20': "1482ff",
            '15': "142fff",
            '10': "4614ff",
            '5': "9a14ff",
            '0': "ee14ff",
            '-5': "ff14d5",
            '-10': "ff1482",
            '-15': "ff1430",
            '-20': "ff1414",
        }
    },

    // A mapping of NOAA icon keywords to Skycons icon names.
    // This is a best-effort mapping and may need to be adjusted.
    iconTable: {
        "skc": "clear-day",
        "few": "partly-cloudy-day",
        "sct": "cloudy",
        "bkn": "cloudy",
        "ovc": "cloudy",
        "wind_skc": "clear-day",
        "wind_few": "partly-cloudy-day",
        "wind_sct": "cloudy",
        "wind_bkn": "cloudy",
        "wind_ovc": "cloudy",
        "snow": "snow",
        "rain": "rain",
        "tsra": "thunder-showers-day",
        "frza": "sleet",
        "sleet": "sleet",
        "fog": "fog",
        "tornado": "tornado",
        "haze": "fog",
        "smoke": "fog",
        "dust": "fog",
        "rain_showers": "rain",
        "snow_showers": "snow",
        "blizzard": "snow",
        "hail": "rain",
        "tsra_sct": "thunder-showers-day",
        "cold": "clear-day",
        "hot": "clear-day",
        "tornado_night": "tornado",
        "cold_night": "clear-night",
        "hot_night": "clear-night",
        "skc_night": "clear-night",
        "few_night": "partly-cloudy-night",
        "sct_night": "cloudy",
        "bkn_night": "cloudy",
        "ovc_night": "cloudy",
        "wind_skc_night": "clear-night",
        "wind_few_night": "partly-cloudy-night",
        "wind_sct_night": "cloudy",
        "wind_bkn_night": "cloudy",
        "wind_ovc_night": "cloudy",
        "tsra_night": "thunder-showers-night",
        "tsra_sct_night": "thunder-showers-night",
        "rain_showers_night": "rain",
        "snow_showers_night": "snow",
        "rain_night": "rain",
        "snow_night": "snow",
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js", "skycons.js"];
    },

    // Define required styles.
    getStyles: function () {
        return ["MMM-NOAAForecastDeluxe.css"];
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);
        Log.log("Module initialized. Will request data after initial delay.");
        this.weatherData = null;
        this.loaded = false;
        this.scheduleUpdate(this.config.initialLoadDelay);
        this.skycons = new Skycons({"color": "white"});
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML = "LOADING...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        // Correctly access the nested data from the NOAA API response.
        var dailyData = this.weatherData.forecast?.properties?.periods || [];
        var hourlyData = this.weatherData.hourlyForecast?.properties?.periods || [];

        if (dailyData.length === 0 && hourlyData.length === 0) {
            wrapper.innerHTML = "No valid weather data received.";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        var table = document.createElement("table");
        table.className = "small";

        // Display daily forecast
        if (this.config.showDaily && dailyData.length > 0) {
            dailyData.forEach((period, index) => {
                var row = document.createElement("tr");
                row.className = "forecast-row";
                row.style.opacity = this.config.fade && this.config.fadePoint > 0 && index >= dailyData.length * this.config.fadePoint ? this.config.fadePoint + (1 - this.config.fadePoint) * (1 - index / dailyData.length) : 1;

                // Day Name
                var dayCell = document.createElement("td");
                dayCell.className = "day";
                dayCell.innerHTML = period.name;
                row.appendChild(dayCell);

                // Icon
                var iconCell = document.createElement("td");
                iconCell.className = "icon-cell";
                var iconCanvas = document.createElement("canvas");
                iconCanvas.id = this.identifier + "_icon_daily_" + index;
                iconCanvas.className = "skycon";
                iconCanvas.setAttribute("width", "50");
                iconCanvas.setAttribute("height", "50");
                iconCell.appendChild(iconCanvas);
                row.appendChild(iconCell);

                // Forecast Text
                var forecastCell = document.createElement("td");
                forecastCell.className = "forecast-text";
                forecastCell.innerHTML = period.shortForecast;
                row.appendChild(forecastCell);

                // Temperature
                var tempCell = document.createElement("td");
                tempCell.className = "temp";
                tempCell.innerHTML = `${period.temperature}°${period.temperatureUnit}`;
                row.appendChild(tempCell);

                table.appendChild(row);

                // Add skycon to play later
                this.skycons.set(iconCanvas, this.getSkycon(period.icon));
            });
        }

        // Display hourly forecast
        if (this.config.showHourly && hourlyData.length > 0) {
            hourlyData.forEach((period, index) => {
                var row = document.createElement("tr");
                row.className = "hourly-row";
                row.style.opacity = this.config.fade && this.config.fadePoint > 0 && index >= hourlyData.length * this.config.fadePoint ? this.config.fadePoint + (1 - this.config.fadePoint) * (1 - index / hourlyData.length) : 1;

                // Time
                var timeCell = document.createElement("td");
                timeCell.className = "time";
                timeCell.innerHTML = moment(period.startTime).format("h A");
                row.appendChild(timeCell);

                // Icon
                var iconCell = document.createElement("td");
                iconCell.className = "icon-cell";
                var iconCanvas = document.createElement("canvas");
                iconCanvas.id = this.identifier + "_icon_hourly_" + index;
                iconCanvas.className = "skycon";
                iconCanvas.setAttribute("width", "50");
                iconCanvas.setAttribute("height", "50");
                iconCell.appendChild(iconCanvas);
                row.appendChild(iconCell);

                // Temperature
                var tempCell = document.createElement("td");
                tempCell.className = "temp";
                tempCell.innerHTML = `${period.temperature}°${period.temperatureUnit}`;
                row.appendChild(tempCell);

                table.appendChild(row);

                // Add skycon to play later
                this.skycons.set(iconCanvas, this.getSkycon(period.icon));
            });
        }

        // Play the icons after all canvases are added to the DOM.
        this.skycons.play();

        wrapper.appendChild(table);
        return wrapper;
    },

    // Method to get the skycon name from a NOAA icon URL.
    getSkycon: function(iconUrl) {
        // Extract the last part of the URL before the '?'
        var iconName = iconUrl.split('/').pop().split('?')[0];

        // Special case for wind icons which have two parts (e.g., wind_skc)
        if (iconName.includes("_")) {
            var parts = iconName.split("_");
            if (parts.length > 1) {
                iconName = parts[parts.length - 1];
            }
        }

        // This is a simple heuristic. A more robust solution might
        // involve a more detailed mapping.
        var baseIcon = iconName.replace(/,.*/, '');
        return this.iconTable[baseIcon] || "clear-day";
    },

    // Override notification handler.
    notificationReceived: function(notification, payload, sender) {
        Log.log(`Received notification: ${notification} from sender: ${sender?.name}`);
        if (notification === "DOM_OBJECTS_CREATED") {
            Log.log("DOM_OBJECTS_CREATED notification received. Starting weather update.");
            this.updateWeather();
        }
    },

    // Override socket notification handler.
    socketNotificationReceived: function(notification, payload) {
        Log.log(`Received socket notification: ${notification} from sender (node_helper)`);
        if (notification === "NOAA_CALL_FORECAST_DATA" && payload.instanceId === this.identifier) {
            Log.log("Received weather data from node helper.");
            // Log the full payload to inspect its contents
            Log.log("Payload received:", JSON.stringify(payload, null, 2));
            // NOAA helper returns data in the payload.payload property
            this.weatherData = payload.payload;
            this.loaded = true;
            this.updateDom(this.config.animationSpeed);
            this.scheduleUpdate();
        }
    },

    // Method to request new weather data.
    updateWeather: function() {
        if (this.config.latitude && this.config.longitude) {
            Log.log(`Sending request to node_helper for coordinates: ${this.config.latitude}, ${this.config.longitude}`);
            // Change the notification name and payload to match the new node helper
            this.sendSocketNotification("NOAA_CALL_FORECAST_GET", {
                latitude: this.config.latitude,
                longitude: this.config.longitude,
                instanceId: this.identifier,
            });
        } else {
            Log.error("Missing latitude or longitude in config. Cannot fetch data.");
        }
    },

    // Method to schedule next weather update.
    scheduleUpdate: function(delay) {
        var nextLoad = this.config.updateInterval;
        if (typeof delay !== "undefined" && delay >= 0) {
            nextLoad = delay;
        }

        var self = this;
        setTimeout(function() {
            self.updateWeather();
        }, nextLoad);
    },

    /*
        For any config parameters that are expected as integers, this
        routine ensures they are numbers, and if they cannot be
        converted to integers, then the module defaults are used.
    */
    sanitizeNumbers: function(keys) {
        var self = this;
        keys.forEach(function(key) {
            if (isNaN(parseInt(self.config[key]))) {
                self.config[key] = self.defaults[key];
            } else {
                self.config[key] = parseInt(self.config[key]);
            }
        });
    },

    /*
        Calculate a color that is f% between c0 and c1
        c0 = start hex (w/o #), c1 = end hex (w/o #), f is btwn 0 and 1
    */
    interpolateColor: function(c0, c1, f){
        c0 = c0.match(/.{1,2}/g).map((oct)=>parseInt(oct, 16) * (1-f))
        c1 = c1.match(/.{1,2}/g).map((oct)=>parseInt(oct, 16) * f)
        let hex = c0.map((v,i)=>("0"+Math.round(v+c1[i]).toString(16)).slice(-2)).join('');
        return hex;
    },

    /*
        Set the color of an icon, with an optional highlight color for
        the inner details.
    */
    colorIcon: function(icon, color, highlightColor) {
        var svg = icon.querySelector("svg");
        if (svg) {
            // Check for the inner highlight part.
            var highlightPath = svg.querySelector("path[data-highlight='true']");
            if (highlightPath) {
                highlightPath.style.fill = highlightColor;
            }

            // Set the main color.
            svg.style.fill = color;
        }
    },

    /*
      Set the color of the temperature based on the configured tempColors.
    */
    setTempColor: function(temp) {
        if (this.config.tempColor) {
            // Convert temp to F if in C
            let tempF = (this.config.units === "metric") ? (temp * 9 / 5 + 32) : temp;
            let tempColors = Object.keys(this.config.tempColors).map(Number).sort(function(a,b){return a-b});

            // Find the two closest color-coded temperatures
            let lowTemp = tempColors[0];
            let highTemp = tempColors[tempColors.length - 1];

            for (let i = 0; i < tempColors.length; i++) {
                if (tempF >= tempColors[i]) {
                    lowTemp = tempColors[i];
                }
                if (tempF <= tempColors[i]) {
                    highTemp = tempColors[i];
                    break;
                }
            }

            // If the temperature is between two defined colors, interpolate them
            if (lowTemp != highTemp) {
                let lowColor = this.config.tempColors[lowTemp];
                let highColor = this.config.tempColors[highTemp];
                let colorRange = highTemp - lowTemp;
                let tempPos = tempF - lowTemp;
                let factor = tempPos / colorRange;
                let color = this.interpolateColor(lowColor, highColor, factor);
                return `#${color}`;
            } else {
                return `#${this.config.tempColors[lowTemp]}`;
            }
        }
        return "white"; // Default color
    }
});
