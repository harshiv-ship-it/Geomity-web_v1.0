
"use strict";

/* ==========================================
   GEOMITY V1.0 — A HORROR SHAPE
   CROW DEVELOPERS
   WEB EDITION — WINDOWS + ANDROID
========================================== */

/* ==========================================
   HTML ELEMENTS
========================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const startButton = document.getElementById("start-button");
const exitLevelButton = document.getElementById("exit-level-button");

const resultTitle = document.getElementById("result-title");
const resultText = document.getElementById("result-text");

const fragmentDisplay = document.getElementById("fragments");
const messageDisplay = document.getElementById("message");
const mapNameDisplay = document.getElementById("map-name");

const mapScreen = document.getElementById("map-screen");
const hud = document.getElementById("hud");

// Device selection elements
const deviceScreen = document.getElementById("device-screen");
const orientationScreen = document.getElementById("orientation-screen");

const androidButton = document.getElementById("android-button");
const windowsButton = document.getElementById("windows-button");

// Android controls
const touchControls = document.getElementById("touch-controls");
const touchFlashlight = document.getElementById("touch-flashlight");
const touchPause = document.getElementById("touch-pause");

/* ==========================================
   CONSTANTS
========================================== */

const FOV = Math.PI / 3;
const MAX_DISTANCE = 14;
const SAVE_KEY = "geomity_unlocked_map";

const PLAYER_START = {
    x: 1.5,
    y: 1.5,
    angle: 0
};

/* ==========================================
   MAP DATA
========================================== */

const MAPS = [
    {
        id: 1,
        name: "THE FORGOTTEN MAZE",
        difficulty: "EASY",
        fragments: 3,
        monsterSpeed: 0.65,
        playerSpeed: 2.2,
        darkness: 0.94,
        lightRadius: 0.55,
        maze: [
            "111111111111",
            "100000000001",
            "101110110101",
            "100010000001",
            "110010111101",
            "100000100001",
            "101110101101",
            "100000000001",
            "111111111111"
        ]
    },
    {
        id: 2,
        name: "THE SILENT ROOMS",
        difficulty: "MEDIUM",
        fragments: 4,
        monsterSpeed: 0.85,
        playerSpeed: 2.2,
        darkness: 0.96,
        lightRadius: 0.48,
        maze: [
            "111111111111",
            "100000000001",
            "101010101101",
            "100000000001",
            "101101011101",
            "100000000001",
            "101011010101",
            "100000000001",
            "111111111111"
        ]
    },
    {
        id: 3,
        name: "THE HOLLOW DEPTHS",
        difficulty: "HARD",
        fragments: 5,
        monsterSpeed: 1.05,
        playerSpeed: 2.15,
        darkness: 0.975,
        lightRadius: 0.40,
        maze: [
            "111111111111",
            "100000000001",
            "111010111101",
            "100000000001",
            "101110110101",
            "100000000001",
            "101011011101",
            "100000000001",
            "111111111111"
        ]
    },
    {
        id: 4,
        name: "THE DARKEST HOUR",
        difficulty: "EXTREME",
        fragments: 6,
        monsterSpeed: 1.25,
        playerSpeed: 2.1,
        darkness: 0.985,
        lightRadius: 0.32,
        maze: [
            "111111111111",
            "100000000001",
            "101110101101",
            "100000000001",
            "111011101101",
            "100000000001",
            "101101011101",
            "100000000001",
            "111111111111"
        ]
    },
    {
        id: 5,
        name: "THE IMPOSSIBLE",
        difficulty: "IMPOSSIBLE",
        fragments: 7,
        monsterSpeed: 1.45,
        playerSpeed: 2.0,
        darkness: 0.995,
        lightRadius: 0.25,
        maze: [
            "111111111111",
            "100000000001",
            "101011101101",
            "100000000001",
            "110110111101",
            "100000000001",
            "101101011101",
            "100000000001",
            "111111111111"
        ]
    }
];

/* ==========================================
   GAME STATE
========================================== */

let selectedMap = 1;
let currentMap = MAPS[0];
let maze = currentMap.maze;

let selectedDevice = null;

let player = null;
let monster = null;
let exitPosition = null;
let fragments = [];

let fragmentCount = 0;
let requiredFragments = 3;

let currentMonsterSpeed = 0.65;
let currentPlayerSpeed = 2.2;
let currentDarkness = 0.94;
let currentLightRadius = 0.55;

let flashlight = true;
let state = "device-selection";

let keys = {};

let lastTime = 0;
let depthBuffer = [];
let rayCount = 0;

let pathTimer = 0;
let monsterTarget = null;
let audioContext = null;

// Android touch-look tracking
let touchLookPointer = null;
let lastTouchLookX = 0;

/* ==========================================
   PROGRESS STORAGE
========================================== */

let unlockedMap = 1;

try {
    const saved = Number(localStorage.getItem(SAVE_KEY));

    if (Number.isFinite(saved) && saved >= 1) {
        unlockedMap = Math.min(5, Math.floor(saved));
    }
} catch (error) {
    console.warn("Progress storage unavailable:", error);
}

function saveProgress() {
    try {
        localStorage.setItem(SAVE_KEY, String(unlockedMap));
    } catch (error) {
        console.warn("Could not save progress:", error);
    }
}

/* ==========================================
   DEVICE SELECTION
========================================== */

function setTouchControlsVisible(visible) {
    if (!touchControls) return;

    touchControls.classList.toggle("hidden", !visible);
    touchControls.style.display = visible ? "flex" : "none";
}

function showDeviceSelection() {
    state = "device-selection";
    selectedDevice = null;
    keys = {};

    setTouchControlsVisible(false);

    deviceScreen.classList.remove("hidden");
    deviceScreen.style.display = "flex";

    orientationScreen.classList.add("hidden");
    orientationScreen.style.display = "none";

    mapScreen.classList.add("hidden");
    mapScreen.style.display = "none";

    overlay.classList.add("hidden");
    overlay.style.display = "none";

    hud.style.display = "none";

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function isLandscape() {
    return window.innerWidth > window.innerHeight;
}

function chooseDevice(device) {
    if (device !== "android" && device !== "windows") return;

    selectedDevice = device;

    deviceScreen.classList.add("hidden");
    deviceScreen.style.display = "none";

    if (device === "android") {
        setTouchControlsVisible(false);

        const hint = document.getElementById("hint");

        if (hint) {
            hint.textContent =
                "TOUCH CONTROLS: MOVE | DRAG SCREEN: LOOK | LIGHT: FLASHLIGHT | PAUSE";
        }

        if (isLandscape()) {
            showMapSelection();
        } else {
            checkAndroidOrientation();
        }

    } else {
        setTouchControlsVisible(false);

        const hint = document.getElementById("hint");

        if (hint) {
            hint.textContent =
                "WASD: MOVE | MOUSE: LOOK | F: FLASHLIGHT | ESC: PAUSE";
        }

        orientationScreen.classList.add("hidden");
        orientationScreen.style.display = "none";

        showMapSelection();
    }
}

function checkAndroidOrientation() {
    if (selectedDevice !== "android") return;

    if (!isLandscape()) {
        if (state === "playing") {
            pauseGame();
        }

        orientationScreen.classList.remove("hidden");
        orientationScreen.style.display = "flex";

    } else {
        orientationScreen.classList.add("hidden");
        orientationScreen.style.display = "none";

        if (state === "device-selection") {
            showMapSelection();
        }
    }
}

if (androidButton) {
    androidButton.addEventListener("click", () => {
        chooseDevice("android");
    });
}

if (windowsButton) {
    windowsButton.addEventListener("click", () => {
        chooseDevice("windows");
    });
}

window.addEventListener("resize", checkAndroidOrientation);
window.addEventListener("orientationchange", checkAndroidOrientation);

/* ==========================================
   CANVAS RESIZE
========================================== */

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

/* ==========================================
   AUDIO
========================================== */

function playTone(frequency = 440, duration = 0.12, type = "sine") {
    try {
        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.07, audioContext.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);

    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}

/* ==========================================
   SCREEN MANAGEMENT
========================================== */

function showMapSelection() {
    if (!selectedDevice) return;

    state = "menu";
    keys = {};

    setTouchControlsVisible(false);

    if (window.GeomityMusic) {
        window.GeomityMusic.play("menu");
    }

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    deviceScreen.classList.add("hidden");
    orientationScreen.classList.add("hidden");

    mapScreen.classList.remove("hidden");
    mapScreen.style.display = "flex";

    overlay.classList.add("hidden");
    overlay.style.display = "none";

    hud.style.display = "none";

    startButton.classList.remove("hidden");
    startButton.style.display = "block";

    exitLevelButton.classList.add("hidden");
    exitLevelButton.style.display = "none";

    updateMapSelection();
}

function updateMapSelection() {
    MAPS.forEach(map => {
        const button = document.getElementById(
            `map-${map.id}-button`
        );

        if (!button) return;

        const unlocked = map.id <= unlockedMap;

        button.disabled = !unlocked;
        button.classList.toggle("unlocked", unlocked);
        button.classList.toggle("locked", !unlocked);

        const status = button.querySelector(".map-status");

        if (status) {
            status.textContent = unlocked ? "UNLOCKED" : "LOCKED";
        }
    });
}

function selectMap(mapId) {
    if (mapId < 1 || mapId > MAPS.length) return;
    if (mapId > unlockedMap) return;

    selectedMap = mapId;
    currentMap = MAPS[mapId - 1];
    maze = currentMap.maze;

    mapNameDisplay.textContent =
        `MAP ${currentMap.id}: ${currentMap.name}`;

    mapScreen.style.display = "none";

    hud.style.display = "block";

    resultTitle.textContent = `MAP ${currentMap.id}`;

    resultText.textContent =
        `${currentMap.name} — ${currentMap.difficulty}`;

    startButton.textContent = "ENTER MAP";
    startButton.classList.remove("hidden");
    startButton.style.display = "block";

    exitLevelButton.classList.add("hidden");
    exitLevelButton.style.display = "none";

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    state = "menu";
}

MAPS.forEach(map => {
    const button = document.getElementById(
        `map-${map.id}-button`
    );

    if (button) {
        button.addEventListener("click", () => {
            selectMap(map.id);
        });
    }
});

/* ==========================================
   MAZE COLLISION
========================================== */

function wallAt(x, y) {
    const mx = Math.floor(x);
    const my = Math.floor(y);

    return !maze[my] || maze[my][mx] !== "0";
}

function canOccupy(x, y, radius = 0.19) {
    return (
        !wallAt(x - radius, y - radius) &&
        !wallAt(x + radius, y - radius) &&
        !wallAt(x - radius, y + radius) &&
        !wallAt(x + radius, y + radius)
    );
}

/* ==========================================
   AUTOMATIC VALID MAP POSITIONS
========================================== */

function getReachableCells() {
    const start = {
        x: Math.floor(PLAYER_START.x),
        y: Math.floor(PLAYER_START.y)
    };

    if (wallAt(start.x + 0.5, start.y + 0.5)) {
        throw new Error(
            "Player starting position is inside a wall."
        );
    }

    const queue = [start];
    const visited = new Set([`${start.x},${start.y}`]);
    const cells = [];

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    let index = 0;

    while (index < queue.length) {
        const cell = queue[index++];

        const distance =
            Math.abs(cell.x - start.x) +
            Math.abs(cell.y - start.y);

        cells.push({
            x: cell.x + 0.5,
            y: cell.y + 0.5,
            gridX: cell.x,
            gridY: cell.y,
            distance
        });

        for (const direction of directions) {
            const nextX = cell.x + direction.x;
            const nextY = cell.y + direction.y;
            const key = `${nextX},${nextY}`;

            if (visited.has(key)) continue;
            if (wallAt(nextX + 0.5, nextY + 0.5)) continue;

            visited.add(key);

            queue.push({
                x: nextX,
                y: nextY
            });
        }
    }

    return cells;
}

function chooseMapPositions(map) {
    const cells = getReachableCells();

    if (cells.length < map.fragments + 4) {
        throw new Error(
            `Map ${map.id} does not have enough reachable spaces.`
        );
    }

    const startX = PLAYER_START.x;
    const startY = PLAYER_START.y;

    const available = cells.filter(cell =>
        Math.hypot(
            cell.x - startX,
            cell.y - startY
        ) > 1.5
    );

    available.sort((a, b) => b.distance - a.distance);

    exitPosition = {
        x: available[0].x,
        y: available[0].y
    };

    const monsterCell = available.find(cell =>
        Math.hypot(
            cell.x - exitPosition.x,
            cell.y - exitPosition.y
        ) > 2
    ) || available[1];

    monster = {
        x: monsterCell.x,
        y: monsterCell.y
    };

    const candidates = available.filter(cell =>
        Math.hypot(
            cell.x - exitPosition.x,
            cell.y - exitPosition.y
        ) > 1.2 &&
        Math.hypot(
            cell.x - monster.x,
            cell.y - monster.y
        ) > 1.2
    );

    candidates.sort((a, b) => a.distance - b.distance);

    fragments = [];

    const used = [];

    for (const candidate of candidates) {
        if (fragments.length >= map.fragments) break;

        const spaced = used.every(position =>
            Math.hypot(
                candidate.x - position.x,
                candidate.y - position.y
            ) >= 2
        );

        if (
            spaced ||
            candidates.length - used.length <=
            map.fragments - fragments.length
        ) {
            fragments.push({
                x: candidate.x,
                y: candidate.y,
                found: false
            });

            used.push(candidate);
        }
    }

    for (const candidate of candidates) {
        if (fragments.length >= map.fragments) break;

        const alreadyUsed = fragments.some(fragment =>
            fragment.x === candidate.x &&
            fragment.y === candidate.y
        );

        if (!alreadyUsed) {
            fragments.push({
                x: candidate.x,
                y: candidate.y,
                found: false
            });
        }
    }

    if (fragments.length !== map.fragments) {
        throw new Error(
            `Could not place all fragments in map ${map.id}.`
        );
    }
}

/* ==========================================
   RAYCASTING
========================================== */

function castRay(angle) {
    const step = 0.025;

    for (
        let distance = 0;
        distance < MAX_DISTANCE;
        distance += step
    ) {
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        if (wallAt(x, y)) {
            return {
                distance,
                x,
                y
            };
        }
    }

    return {
        distance: MAX_DISTANCE,
        x: 0,
        y: 0
    };
}

function drawWorld() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.fillStyle = "#09080c";
    ctx.fillRect(0, 0, width, height / 2);

    ctx.fillStyle = "#171015";
    ctx.fillRect(
        0,
        height / 2,
        width,
        height / 2
    );

    rayCount = Math.ceil(width / 2);
    depthBuffer = new Array(rayCount);

    const columnWidth = width / rayCount;

    for (let i = 0; i < rayCount; i++) {
        const angle =
            player.angle -
            FOV / 2 +
            (i / rayCount) * FOV;

        const ray = castRay(angle);

        const corrected = Math.max(
            0.1,
            ray.distance * Math.cos(angle - player.angle)
        );

        depthBuffer[i] = corrected;

        const wallHeight = Math.min(
            height * 2,
            height / corrected
        );

        const shade = Math.max(
            8,
            Math.floor(125 - corrected * 9)
        );

        ctx.fillStyle =
            `rgb(${shade}, ${Math.floor(shade * 0.15)}, ${Math.floor(shade * 0.22)})`;

        ctx.fillRect(
            i * columnWidth,
            (height - wallHeight) / 2,
            columnWidth + 1,
            wallHeight
        );
    }

    drawObjects();
    drawLighting();
}

/* ==========================================
   OBJECT PROJECTION
========================================== */

function projectObject(x, y, drawFunction, size = 1) {
    const dx = x - player.x;
    const dy = y - player.y;

    const distance = Math.hypot(dx, dy);

    if (distance < 0.08) return;

    const angle = Math.atan2(dy, dx);

    const relative = Math.atan2(
        Math.sin(angle - player.angle),
        Math.cos(angle - player.angle)
    );

    if (Math.abs(relative) > FOV / 2 + 0.15) return;

    const depth = distance * Math.cos(relative);

    if (depth <= 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const screenX =
        width / 2 +
        Math.tan(relative) *
        width / (2 * Math.tan(FOV / 2));

    const column = Math.max(
        0,
        Math.min(
            rayCount - 1,
            Math.floor(screenX / width * rayCount)
        )
    );

    if (depthBuffer[column] < depth - 0.15) return;

    const objectSize = height / depth * size;

    drawFunction(
        screenX,
        height / 2,
        objectSize,
        depth
    );
}

/* ==========================================
   OBJECT GRAPHICS
========================================== */

function drawFragment(x, y, size) {
    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);

    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff1e48";

    const s = Math.max(5, size * 0.45);

    ctx.fillStyle = "#ff294e";
    ctx.fillRect(-s / 2, -s / 2, s, s);

    ctx.fillStyle = "#ffd1d9";
    ctx.fillRect(-s / 6, -s / 6, s / 3, s / 3);

    ctx.restore();
}

function drawExit(x, y, size) {
    ctx.save();

    const unlocked = fragmentCount >= requiredFragments;

    const w = Math.max(8, size * 0.45);
    const h = Math.max(12, size * 0.9);

    ctx.shadowBlur = 25;
    ctx.shadowColor = unlocked ? "#27e8a0" : "#a51b30";

    ctx.fillStyle = unlocked ? "#12694e" : "#35101b";

    ctx.fillRect(
        x - w / 2,
        y - h / 2,
        w,
        h
    );

    ctx.strokeStyle = unlocked ? "#63ffd0" : "#d34b63";
    ctx.lineWidth = Math.max(1, size * 0.035);

    ctx.strokeRect(
        x - w / 2,
        y - h / 2,
        w,
        h
    );

    ctx.fillStyle = "#fff";

    ctx.beginPath();

    ctx.arc(
        x + w * 0.28,
        y,
        Math.max(1, size * 0.025),
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

function drawShadow(x, y, size) {
    ctx.save();

    const width = Math.max(8, size * 0.36);
    const height = Math.max(14, size * 0.8);

    ctx.shadowBlur = 22;
    ctx.shadowColor = "#b0002b";

    ctx.fillStyle = "#080207";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + height * 0.2,
        width * 0.5,
        height * 0.38,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x,
        y - height * 0.25,
        width * 0.27,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowColor = "#ff183c";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#ff294c";

    ctx.beginPath();

    ctx.arc(
        x - width * 0.12,
        y - height * 0.26,
        Math.max(1, width * 0.035),
        0,
        Math.PI * 2
    );

    ctx.arc(
        x + width * 0.12,
        y - height * 0.26,
        Math.max(1, width * 0.035),
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

function drawObjects() {
    const objects = [];

    for (const fragment of fragments) {
        if (fragment.found) continue;

        objects.push({
            x: fragment.x,
            y: fragment.y,
            distance: Math.hypot(
                fragment.x - player.x,
                fragment.y - player.y
            ),
            draw: (sx, sy, size) =>
                drawFragment(sx, sy, size),
            size: 0.12
        });
    }

    objects.push({
        x: exitPosition.x,
        y: exitPosition.y,
        distance: Math.hypot(
            exitPosition.x - player.x,
            exitPosition.y - player.y
        ),
        draw: (sx, sy, size) =>
            drawExit(sx, sy, size),
        size: 0.8
    });

    objects.push({
        x: monster.x,
        y: monster.y,
        distance: Math.hypot(
            monster.x - player.x,
            monster.y - player.y
        ),
        draw: (sx, sy, size) =>
            drawShadow(sx, sy, size),
        size: 0.8
    });

    objects.sort((a, b) => b.distance - a.distance);

    for (const object of objects) {
        projectObject(
            object.x,
            object.y,
            object.draw,
            object.size
        );
    }
}

/* ==========================================
   LIGHTING
========================================== */

function drawLighting() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const radius = width * (
        flashlight
            ? currentLightRadius
            : currentLightRadius * 0.45
    );

    const darkness = ctx.createRadialGradient(
        width / 2,
        height / 2,
        15,
        width / 2,
        height / 2,
        radius
    );

    darkness.addColorStop(
        0,
        flashlight
            ? "rgba(0,0,0,0.04)"
            : `rgba(0,0,0,${currentDarkness})`
    );

    darkness.addColorStop(
        0.5,
        `rgba(0,0,0,${currentDarkness * 0.45})`
    );

    darkness.addColorStop(
        1,
        `rgba(0,0,0,${currentDarkness})`
    );

    ctx.fillStyle = darkness;
    ctx.fillRect(0, 0, width, height);

    const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.15,
        width / 2,
        height / 2,
        width * 0.7
    );

    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "rgba(0,0,0,0.35)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}

/* ==========================================
   PLAYER MOVEMENT
========================================== */

function movePlayer(dt) {
    if (keys["arrowleft"]) {
        player.angle -= 1.8 * dt;
    }

    if (keys["arrowright"]) {
        player.angle += 1.8 * dt;
    }

    let forward = 0;
    let sideways = 0;

    if (keys["w"] || keys["arrowup"]) forward++;
    if (keys["s"] || keys["arrowdown"]) forward--;

    if (keys["a"]) sideways--;
    if (keys["d"]) sideways++;

    if (!forward && !sideways) return;

    const dx =
        Math.cos(player.angle) * forward +
        Math.cos(player.angle + Math.PI / 2) * sideways;

    const dy =
        Math.sin(player.angle) * forward +
        Math.sin(player.angle + Math.PI / 2) * sideways;

    const length = Math.hypot(dx, dy);
    const speed = currentPlayerSpeed * dt;

    const nx = player.x + (dx / length) * speed;
    const ny = player.y + (dy / length) * speed;

    if (canOccupy(nx, player.y)) {
        player.x = nx;
    }

    if (canOccupy(player.x, ny)) {
        player.y = ny;
    }
}

/* ==========================================
   FRAGMENTS AND EXIT
========================================== */

function updateFragments() {
    for (const fragment of fragments) {
        if (fragment.found) continue;

        const distance = Math.hypot(
            player.x - fragment.x,
            player.y - fragment.y
        );

        if (distance < 0.48) {
            fragment.found = true;
            fragmentCount++;

            fragmentDisplay.textContent =
                `FRAGMENTS: ${fragmentCount} / ${requiredFragments}`;

            messageDisplay.textContent =
                fragmentCount >= requiredFragments
                    ? "THE EXIT HAS BEEN UNLOCKED"
                    : "ENERGY FRAGMENT COLLECTED";

            playTone(660, 0.12);

            if (fragmentCount >= requiredFragments) {
                playTone(880, 0.2, "triangle");
            }
        }
    }
}

function updateExit() {
    const distance = Math.hypot(
        player.x - exitPosition.x,
        player.y - exitPosition.y
    );

    if (distance < 0.65) {
        if (fragmentCount >= requiredFragments) {
            endGame(true);
        } else {
            messageDisplay.textContent =
                `EXIT LOCKED — ${requiredFragments - fragmentCount} FRAGMENTS REMAIN`;
        }
    }
}

/* ==========================================
   MONSTER PATHFINDING
========================================== */

function findMonsterTarget() {
    const start = {
        x: Math.floor(monster.x),
        y: Math.floor(monster.y)
    };

    const goal = {
        x: Math.floor(player.x),
        y: Math.floor(player.y)
    };

    const startKey = `${start.x},${start.y}`;
    const goalKey = `${goal.x},${goal.y}`;

    if (startKey === goalKey) return null;

    const queue = [start];
    let queueIndex = 0;

    const parents = new Map();
    parents.set(startKey, null);

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    let found = false;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++];
        const currentKey = `${current.x},${current.y}`;

        if (currentKey === goalKey) {
            found = true;
            break;
        }

        for (const direction of directions) {
            const next = {
                x: current.x + direction.x,
                y: current.y + direction.y
            };

            const nextKey = `${next.x},${next.y}`;

            if (parents.has(nextKey)) continue;

            if (wallAt(next.x + 0.5, next.y + 0.5)) {
                continue;
            }

            parents.set(nextKey, current);
            queue.push(next);
        }
    }

    if (!found) return null;

    let current = goal;

    while (true) {
        const parent = parents.get(
            `${current.x},${current.y}`
        );

        if (!parent) return null;

        if (
            parent.x === start.x &&
            parent.y === start.y
        ) {
            return {
                x: current.x + 0.5,
                y: current.y + 0.5
            };
        }

        current = parent;
    }
}

/* ==========================================
   MONSTER MOVEMENT
========================================== */

function moveMonster(dt) {
    pathTimer -= dt;

    if (pathTimer <= 0 || !monsterTarget) {
        monsterTarget = findMonsterTarget();
        pathTimer = 0.35;
    }

    if (monsterTarget) {
        const dx = monsterTarget.x - monster.x;
        const dy = monsterTarget.y - monster.y;

        const distance = Math.hypot(dx, dy);

        if (distance > 0.04) {
            const movement = Math.min(
                currentMonsterSpeed * dt,
                distance
            );

            const nx =
                monster.x + (dx / distance) * movement;

            const ny =
                monster.y + (dy / distance) * movement;

            if (canOccupy(nx, monster.y, 0.12)) {
                monster.x = nx;
            }

            if (canOccupy(monster.x, ny, 0.12)) {
                monster.y = ny;
            }

        } else {
            monsterTarget = null;
        }
    }

    const distanceToPlayer = Math.hypot(
        player.x - monster.x,
        player.y - monster.y
    );

    if (distanceToPlayer < 0.55) {
        endGame(false);
    }
}

/* ==========================================
   START / RESUME / PAUSE
========================================== */

function startNewGame() {
    if (selectedDevice === "android" && !isLandscape()) {
        checkAndroidOrientation();
        return;
    }

    currentMap = MAPS[selectedMap - 1];
    maze = currentMap.maze;

    requiredFragments = currentMap.fragments;

    currentMonsterSpeed = currentMap.monsterSpeed;
    currentPlayerSpeed = currentMap.playerSpeed;
    currentDarkness = currentMap.darkness;
    currentLightRadius = currentMap.lightRadius;

    try {
        chooseMapPositions(currentMap);

    } catch (error) {
        console.error("Map setup failed:", error);

        resultTitle.textContent = "MAP ERROR";
        resultText.textContent = error.message;

        overlay.classList.remove("hidden");
        overlay.style.display = "flex";

        return;
    }

    player = {
        x: PLAYER_START.x,
        y: PLAYER_START.y,
        angle: PLAYER_START.angle
    };

    fragmentCount = 0;
    flashlight = true;

    monsterTarget = null;
    pathTimer = 0;

    keys = {};

    fragmentDisplay.textContent =
        `FRAGMENTS: 0 / ${requiredFragments}`;

    messageDisplay.textContent =
        `FIND ${requiredFragments} ENERGY FRAGMENTS`;

    mapNameDisplay.textContent =
        `MAP ${selectedMap}: ${currentMap.name}`;

    state = "playing";

    overlay.classList.add("hidden");
    overlay.style.display = "none";

    mapScreen.style.display = "none";
    hud.style.display = "block";

    setTouchControlsVisible(
        selectedDevice === "android"
    );

    startButton.classList.remove("hidden");
    startButton.style.display = "block";

    exitLevelButton.classList.add("hidden");
    exitLevelButton.style.display = "none";

    const mapMusic = {
        1: "normal",
        2: "nearby",
        3: "approaching",
        4: "away",
        5: "victory"
    };

    if (window.GeomityMusic) {
        window.GeomityMusic.play(mapMusic[selectedMap]);
    }

    playTone(440, 0.15);

    // Pointer lock is only for Windows.
    if (selectedDevice === "windows") {
        canvas.requestPointerLock?.();
    }
}

function resumeGame() {
    if (state !== "paused") return;

    if (selectedDevice === "android" && !isLandscape()) {
        checkAndroidOrientation();
        return;
    }

    state = "playing";

    if (window.GeomityMusic) {
        window.GeomityMusic.resume();
    }

    overlay.classList.add("hidden");
    overlay.style.display = "none";

    setTouchControlsVisible(
        selectedDevice === "android"
    );

    if (selectedDevice === "windows") {
        canvas.requestPointerLock?.();
    }
}

function pauseGame() {
    if (state !== "playing") return;

    state = "paused";
    keys = {};

    setTouchControlsVisible(false);

    if (window.GeomityMusic) {
        window.GeomityMusic.pause();
    }

    resultTitle.textContent = "PAUSED";
    resultText.textContent =
        "THE MAZE IS WAITING FOR YOU.";

    startButton.textContent = "RESUME";
    startButton.classList.remove("hidden");
    startButton.style.display = "block";

    exitLevelButton.classList.remove("hidden");
    exitLevelButton.style.display = "block";

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

function exitCurrentLevel() {
    keys = {};
    monsterTarget = null;

    setTouchControlsVisible(false);

    if (window.GeomityMusic) {
        window.GeomityMusic.play("menu");
    }

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }

    showMapSelection();
}

/* ==========================================
   MAP COMPLETION
========================================== */

function endGame(won) {
    if (state !== "playing") return;

    state = won ? "won" : "lost";
    keys = {};

    setTouchControlsVisible(false);

    if (won) {
        playTone(660, 0.25, "triangle");

        setTimeout(() => {
            playTone(880, 0.35, "triangle");
        }, 220);

        if (
            selectedMap === unlockedMap &&
            unlockedMap < MAPS.length
        ) {
            unlockedMap++;
            saveProgress();
        }

        resultTitle.textContent = "MAP COMPLETED";

        resultText.textContent = selectedMap === 5
            ? "YOU CONQUERED THE IMPOSSIBLE."
            : "THE NEXT MAP HAS BEEN UNLOCKED.";

    } else {
        playTone(110, 0.5, "sawtooth");

        resultTitle.textContent = "CAUGHT";

        resultText.textContent =
            "THE SHADOW REACHED YOU. RETURN TO MAP SELECTION.";
    }

    startButton.textContent = "RETURN TO MAPS";
    startButton.classList.remove("hidden");
    startButton.style.display = "block";

    exitLevelButton.classList.add("hidden");
    exitLevelButton.style.display = "none";

    overlay.classList.remove("hidden");
    overlay.style.display = "flex";

    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

/* ==========================================
   BUTTON EVENTS
========================================== */

startButton.addEventListener("click", () => {
    if (state === "paused") {
        resumeGame();

    } else if (state === "menu") {
        startNewGame();

    } else if (state === "won" || state === "lost") {
        showMapSelection();
    }
});

exitLevelButton.addEventListener(
    "click",
    exitCurrentLevel
);


/* MAP SELECTION EXIT BUTTON */

const mapExitButton = document.getElementById("map-exit-button");

if (mapExitButton) {
    mapExitButton.addEventListener("click", () => {
        window.location.href = "../index.html";
    });
}


/* ==========================================
   KEYBOARD CONTROLS
========================================== */

document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if ([
        "w", "a", "s", "d",
        "arrowup", "arrowdown",
        "arrowleft", "arrowright",
        " "
    ].includes(key)) {
        event.preventDefault();
    }

    keys[key] = true;

    if (key === "f" && state === "playing") {
        flashlight = !flashlight;

        playTone(
            flashlight ? 600 : 300,
            0.1
        );
    }

    if (key === "escape" && state === "playing") {
        pauseGame();
    }
});

document.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
    keys = {};

    if (state === "playing" && selectedDevice === "windows") {
        pauseGame();
    }
});

/* ==========================================
   WINDOWS MOUSE LOOK
========================================== */

document.addEventListener("mousemove", event => {
    if (
        selectedDevice === "windows" &&
        state === "playing" &&
        document.pointerLockElement === canvas
    ) {
        player.angle += event.movementX * 0.0025;
    }
});

document.addEventListener("pointerlockchange", () => {
    if (selectedDevice !== "windows") return;

    if (
        state === "playing" &&
        document.pointerLockElement !== canvas
    ) {
        pauseGame();
    }
});

canvas.addEventListener("click", () => {
    if (
        selectedDevice === "windows" &&
        state === "playing" &&
        document.pointerLockElement !== canvas
    ) {
        canvas.requestPointerLock?.();
    }
});

/* ==========================================
   ANDROID TOUCH MOVEMENT
========================================== */

// Movement buttons in game.html must use:
// class="touch-button" data-key="w"
// class="touch-button" data-key="a"
// class="touch-button" data-key="s"
// class="touch-button" data-key="d"

const movementButtons = document.querySelectorAll(
    ".touch-button[data-key]"
);

movementButtons.forEach(button => {
    const key = button.dataset.key;

    button.addEventListener("pointerdown", event => {
        if (
            selectedDevice !== "android" ||
            state !== "playing"
        ) {
            return;
        }

        event.preventDefault();

        keys[key] = true;

        try {
            button.setPointerCapture(event.pointerId);
        } catch (error) {
            // Pointer capture may not be supported.
        }
    });

    function releaseMovement(event) {
        keys[key] = false;

        if (
            button.hasPointerCapture &&
            button.hasPointerCapture(event.pointerId)
        ) {
            button.releasePointerCapture(event.pointerId);
        }
    }

    button.addEventListener("pointerup", releaseMovement);
    button.addEventListener("pointercancel", releaseMovement);
    button.addEventListener("lostpointercapture", () => {
        keys[key] = false;
    });
});

/* ==========================================
   ANDROID FLASHLIGHT BUTTON
========================================== */

if (touchFlashlight) {
    touchFlashlight.addEventListener("click", () => {
        if (
            selectedDevice !== "android" ||
            state !== "playing"
        ) {
            return;
        }

        flashlight = !flashlight;

        playTone(
            flashlight ? 600 : 300,
            0.1
        );

        touchFlashlight.classList.toggle(
            "active",
            flashlight
        );
    });
}

/* ==========================================
   ANDROID PAUSE BUTTON
========================================== */

if (touchPause) {
    touchPause.addEventListener("click", () => {
        if (
            selectedDevice === "android" &&
            state === "playing"
        ) {
            pauseGame();
        }
    });
}

/* ==========================================
   ANDROID DRAG-TO-LOOK
========================================== */

canvas.addEventListener("pointerdown", event => {
    if (
        selectedDevice !== "android" ||
        state !== "playing" ||
        event.pointerType !== "touch"
    ) {
        return;
    }

    touchLookPointer = event.pointerId;
    lastTouchLookX = event.clientX;

    try {
        canvas.setPointerCapture(event.pointerId);
    } catch (error) {
        // Continue without pointer capture.
    }
});

canvas.addEventListener("pointermove", event => {
    if (
        selectedDevice !== "android" ||
        state !== "playing" ||
        touchLookPointer !== event.pointerId
    ) {
        return;
    }

    const movementX = event.clientX - lastTouchLookX;

    player.angle += movementX * 0.006;

    lastTouchLookX = event.clientX;
});

function stopTouchLook(event) {
    if (touchLookPointer !== event.pointerId) return;

    touchLookPointer = null;

    try {
        if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
    } catch (error) {
        // Ignore unsupported pointer capture.
    }
}

canvas.addEventListener("pointerup", stopTouchLook);
canvas.addEventListener("pointercancel", stopTouchLook);

/* ==========================================
   DRAW AND MAIN LOOP
========================================== */

function draw() {
    if (!player || !monster || !exitPosition) {
        ctx.fillStyle = "#030305";

        ctx.fillRect(
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        return;
    }

    drawWorld();
}

function loop(timestamp) {
    const dt = Math.min(
        (timestamp - lastTime) / 1000 || 0,
        0.05
    );

    lastTime = timestamp;

    if (state === "playing") {
        movePlayer(dt);
        updateFragments();
        updateExit();

        if (state === "playing") {
            moveMonster(dt);
        }
    }

    draw();

    requestAnimationFrame(loop);
}

/* ==========================================
   INITIALIZE
========================================== */

showDeviceSelection();

console.log("GEOMITY v1.0 Web Edition initialized.");
console.log("Five maps loaded.");
console.log("Device selection enabled.");
console.log("Windows controls enabled.");
console.log("Android touch controls enabled.");
console.log("Unlocked map:", unlockedMap);

requestAnimationFrame(loop);
