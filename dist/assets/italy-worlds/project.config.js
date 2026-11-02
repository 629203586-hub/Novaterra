export default {
  "name": "italy",
  "title": "Vallenuova",
  "subtitle": "Piazza · Campanile · Cypress",
  "seed": 73,
  "terrain": {
    "width": 64,
    "depth": 50,
    "thickness": 4.4,
    "surface": "plaza",
    "relief": 0.2
  },
  "camera": {
    "position": [
      -65,
      49,
      82
    ],
    "target": [
      0,
      6,
      -3
    ],
    "viewHeight": 82,
    "minZoom": 0.45,
    "maxZoom": 4,
    "minPolarAngle": 0.35,
    "maxPolarAngle": 2.0,
    "autoRotate": true,
    "autoRotateSpeed": 0.05
  },
  "weather": {
    "preset": "clear",
    "wind": 0.25,
    "rainCount": 300
  },
  "lighting": {
    "default": "sunset",
    "night": false,
    "windowLitRate": 0.68,
    "bloom": 0.3,
    "exposure": 1.06,
    "dayBackground": "#b9cdd4",
    "nightBackground": "#132238",
    "dayFloor": "#a9b7b4",
    "nightFloor": "#152333",
    "captions": {
      "day": "Linen on the line. Espresso on the step.",
      "sunset": "The last sun on the bell tower. Aperitivo in the shade.",
      "night": "The piazza empties. The fountain keeps talking."
    },
    "presets": {
      "day": {
        "sky": "#a9c4cf",
        "floor": "#8fa3ad",
        "exposure": 1.0,
        "key": "#fff6e2",
        "keyIntensity": 3.0,
        "fill": "#e9dcc0",
        "fillIntensity": 0.55,
        "hemisphere": 1.42,
        "ground": "#7d7256",
        "bloom": 0.1,
        "sun": [
          -46,
          62,
          30
        ]
      },
      "sunset": {
        "sky": "#e9c7b3",
        "floor": "#4a2e2e",
        "exposure": 1.04,
        "key": "#ffdcad",
        "keyIntensity": 2.7,
        "fill": "#ccdbe5",
        "fillIntensity": 0.65,
        "hemisphere": 1.1,
        "ground": "#b8a98e",
        "bloom": 0.12,
        "sun": [
          -54,
          30,
          34
        ]
      },
      "night": {
        "sky": "#0b1626",
        "floor": "#0d1522",
        "exposure": 1.14,
        "key": "#96b4ec",
        "keyIntensity": 0.8,
        "fill": "#5f74b8",
        "fillIntensity": 0.35,
        "hemisphere": 0.8,
        "ground": "#18202f",
        "bloom": 0.58,
        "sun": [
          26,
          40,
          -22
        ]
      }
    },
    "clock": {
      "day": "DAY · 14:20",
      "sunset": "SUNSET · 18:35",
      "night": "NIGHT · 21:20"
    }
  },
  "visual": {
    "palette": {},
    "fontFamily": "'Trebuchet MS','Gill Sans',Arial,sans-serif",
    "outlineOpacity": 0.38,
    "pixelRatio": 1.6,
    "shadows": true
  },
  "people": {
    "count": 30,
    "economyCount": 18,
    "speedScale": 1
  },
  "traffic": {
    "count": 5,
    "fleet": [
      "mini",
      "scooter",
      "ape",
      "mini",
      "van"
    ],
    "speedScale": 0.9,
    "signals": true,
    "signalPlan": [
      [
        "MAIN",
        9
      ],
      [
        "MAIN_AMBER",
        2
      ],
      [
        "MAIN_CLEAR",
        1.2
      ],
      [
        "LANE",
        6
      ],
      [
        "LANE_AMBER",
        1.6
      ],
      [
        "LANE_CLEAR",
        1.2
      ],
      [
        "PED",
        6
      ],
      [
        "PED_CLEAR",
        1.2
      ]
    ],
    "labels": {
      "bus": "NAVETTA",
      "route": "I",
      "delivery": "FORNO"
    }
  }
};
