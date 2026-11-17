
"use strict";

/* ==========================================
   GEOMITY v1.0 — MUSIC CONTROLLER
   CROW DEVELOPERS
========================================== */

window.GeomityMusic = (() => {

    const SOUND_PATH = "../../assets/sounds/";

    const tracks = {
        menu: "The_Shape_Is_Watching.mp3",
        normal: "Something_In_Dark.mp3",
        nearby: "The_Monster_Is_Near.mp3",
        approaching: "It's_Getting_Closer.mp3",
        away: "Silence_After_Fear.mp3",
        victory: "The_Shape_Has_Fallen.mp3"
    };

    let currentAudio = null;
    let currentTrack = null;
    let volume = 0.45;

    function play(trackName, loop = true) {
        const filename = tracks[trackName];

        if (!filename) {
            console.error("GEOMITY: Unknown music track:", trackName);
            return;
        }

        if (currentTrack === trackName && currentAudio) {
            return;
        }

        stop();

        currentAudio = new Audio(SOUND_PATH + filename);
        currentAudio.volume = volume;
        currentAudio.loop = loop;
        currentTrack = trackName;

        currentAudio.play().catch(error => {
            console.warn("GEOMITY music playback:", error);
        });
    }

    function stop() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = null;
        currentTrack = null;
    }

    function pause() {
        if (currentAudio) {
            currentAudio.pause();
        }
    }

    function resume() {
        if (currentAudio) {
            currentAudio.play().catch(error => {
                console.warn("GEOMITY music resume:", error);
            });
        }
    }

    function setVolume(value) {
        volume = Math.max(0, Math.min(1, value));

        if (currentAudio) {
            currentAudio.volume = volume;
        }
    }

    function getCurrentTrack() {
        return currentTrack;
    }

    return {
        play,
        stop,
        pause,
        resume,
        setVolume,
        getCurrentTrack
    };

})();

console.log("GEOMITY Music Controller Loaded.");
