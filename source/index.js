import "@fontsource/monaspace-neon";
import "@fontsource/monaspace-argon";
import "@fontsource/monaspace-radon";
import "./styles/styles.css";

import Starfield from "./vendor/starfield.js/starfield.js";

Starfield.setup({
        auto: false,
        starColor: "rgb(255, 255, 255)",
        canvasColor: "rgb(20, 10, 30)",
        hueJitter: 0,
        trailLength: 0.75,
        baseSpeed: 2.5,
        maxAcceleration: 5,
        accelerationRate: 0.05,
        decelerationRate: 0.05,
        minSpawnRadius: 100,
        maxSpawnRadius: 500
});

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/dist/svg-arrow.css";
import "tippy.js/animations/scale.css";

tippy("[data-tippy-content]", {
        animation: "scale",
        onShow(instance) {
                if (instance.reference.classList.contains("locked")) {
                        return false;
                }
        }
});

import * as Elements from "./elements.js";
import * as Canvas from "./canvas.js";
import * as Flow from "./flow.js";

Elements.setupDropdowns();
Elements.setupColorPickers();

Canvas.setup();

Flow.start();