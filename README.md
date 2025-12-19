# Jazz Dancer – Alive in Motion

An interactive, music-driven ASCII dance experience. A vinyl-inspired player, synchronized ASCII animation, and bilingual UI bring a small stage to your browser.

## Features
- ASCII dancer rendered from hundreds of frames with a visible loading state and offline-friendly fallbacks
- Vinyl player UI with play/pause, seek bar, mute toggle, and looping audio
- Music-reactive brick visualizer powered by the Web Audio API
- Bilingual interface (English/中文) with rotating dance quotes
- Keyboard shortcuts plus click-to-trigger special moves on the ASCII dancer

## Quickstart
1) From the project root, start a simple server (needed for loading ASCII frames): `python3 -m http.server 8000`
2) Open `http://localhost:8000/dancing-girl.html` in a modern browser
3) Click **Dancing** to start the animation (music auto-starts); use **Reset** to return to the initial state

## Controls
- `Dancing` button: start/stop the ASCII dance and music together
- `Reset` button: stop everything and reset the timeline
- Vinyl controls: play/pause, mute toggle, click the progress bar to seek
- ASCII area: click the dancer for a special move
- Language switch: toggle English/中文 copy
- Keyboard: space = toggle dance, `m` = music on/off, `r` = reset

## Customization
- Swap the track by replacing `assets/music/Nick Cave & The Bad Seeds - O Children (Official Audio).mp3` or by updating the audio source near the top of `assets/js/dancing.js`.
- Add or modify ASCII frames under `assets/img/dancing/dancing_ascii/`; fallback frames are embedded in `dancing.js` for immediate playback.
- Tweak visuals in `assets/css/dancing.css` (e.g., colors, gradients, grid layout, animations).

## Project Structure
- `dancing-girl.html` — main page wiring the layout and assets
- `assets/js/dancing.js` — interaction logic, language copy, audio controls, ASCII loader, visualizer
- `assets/css/dancing.css` — styling for the vinyl player, ASCII display, particles, and layout
- `assets/img/dancing/` — dancer icon, ASCII frame files, helper script
- `assets/music/` — bundled demo track

Enjoy the groove! If you run into audio autoplay restrictions, interact with the page once (e.g., click the stage) to enable sound.***
