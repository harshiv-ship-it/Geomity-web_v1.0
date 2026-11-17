
"use strict";

/* ==========================================
   GEOMITY v1.0 — MAIN MENU
   CROW DEVELOPERS
========================================== */

const screens = document.querySelectorAll(".screen");

/* MENU MUSIC */


/* MENU MUSIC */

const menuMusic = new Audio("../assets/sounds/The_Shape_Is_Watching.mp3");

menuMusic.loop = true;
menuMusic.volume = 0.45;

function startMenuMusic() {
    if (menuMusic.paused) {
        menuMusic.play().catch(error => {
            console.warn("GEOMITY menu music error:", error);
        });
    }
}

document.addEventListener("pointerdown", startMenuMusic);
document.addEventListener("keydown", startMenuMusic);

menuMusic.loop = true;
menuMusic.volume = 0.45;

let menuMusicStarted = false;

function startMenuMusic() {
    if (menuMusicStarted) return;

    menuMusicStarted = true;

    menuMusic.play().catch(error => {
        console.warn("GEOMITY menu music:", error);
        menuMusicStarted = false;
    });
}

document.addEventListener("pointerdown", startMenuMusic, { once: true });
document.addEventListener("keydown", startMenuMusic, { once: true });

/* SCREEN NAVIGATION */

function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }
}

/* MENU NAVIGATION */

/* PLAY — OPEN THE ACTUAL GAME */

document.getElementById("play-button")?.addEventListener("click", () => {
    window.location.href = "game/game.html";
});

/* CREDITS */

document.getElementById("credits-button")?.addEventListener("click", () => {
    showScreen("credits-screen");
});

/* SETTINGS */

document.getElementById("settings-button")?.addEventListener("click", () => {
    showScreen("settings-screen");
});

/* BACK BUTTONS */

document.querySelectorAll(".back-button").forEach(button => {
    button.addEventListener("click", () => {
        showScreen(button.dataset.screen || "main-menu");
    });
});

/* ATMOSPHERIC PARTICLES */

const particles = document.getElementById("particles");

function createEmbers() {
    if (!particles) return;

    for (let i = 0; i < 25; i++) {
        const ember = document.createElement("div");

        ember.className = "ember";
        ember.style.left = Math.random() * 100 + "%";
        ember.style.top = (Math.random() * 100 + 100) + "%";

        ember.style.animationDuration =
            (12 + Math.random() * 20) + "s";

        ember.style.animationDelay =
            (-Math.random() * 25) + "s";

        particles.appendChild(ember);
    }
}

createEmbers();

/* GRAPHICS SETTINGS */

const brightness = document.getElementById("brightness");

brightness?.addEventListener("input", () => {
    const value = Number(brightness.value) / 100;

    const gameContainer = document.getElementById("game-container");

    if (gameContainer) {
        gameContainer.style.filter = `brightness(${value})`;
    }
});

/* ATMOSPHERIC EFFECT SETTINGS */

const effects = document.getElementById("effects");

effects?.addEventListener("change", () => {
    document.querySelectorAll(".fog").forEach(fog => {
        fog.style.display = effects.checked ? "block" : "none";
    });

    if (particles) {
        particles.style.display = effects.checked ? "block" : "none";
    }
});

/* EXIT */

document.getElementById("exit-button")?.addEventListener("click", async () => {
    if (window.pywebview?.api?.exit_app) {
        await window.pywebview.api.exit_app();
    } else {
        alert("To exit GEOMITY, close this window.");
    }
});

console.log("GEOMITY v1.0 initialized.");
console.log("GEOMITY menu music controller initialized.");
