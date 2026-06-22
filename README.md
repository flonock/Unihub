# Unihub Dashboard

A custom-built, local-first university workspace dashboard designed for maximum productivity and retro aesthetics. Built with Next.js, React, and native Linux integration.

## Features

- **TUI-Esque Aesthetics:** Fully customized UI using the RosePine-Moon color palette, complete with CRT flickers, glitch hover effects, and block cursors.
- **Dynamic File Explorer:** Automatically indexes your local University directory. Features custom filetype parsing, color-coded icons, and instant opening of any file using your default Linux applications (`xdg-open`).
- **Xournal++ Integration:** Deep integration with Xournal++. Automatically generates new `.xopp` files from a `template.xopp` when entering new directories.
- **Native PDF Previews:** Instantly stream and preview lecture slides and assignments inside the dashboard using a zero-dependency native iframe, with a 1-click "Annotate in Xournal" bridge.
- **Widget Deck:** A modular widget panel currently featuring:
  - Pomodoro Timer
  - Advanced Unit Converter
  - Astronomical Julian Date Clock
  - Hex/Binary Data Encoder
  - Telemetry Monitor
- **Offline Flashcard Engine:** A scaffolded spaced-repetition module featuring a custom JSON extractor to pull closed-ecosystem flashcards (e.g., from Buffl) directly into an offline format.

## Setup & Configuration

This app is designed to run locally on your Linux machine to have full access to your filesystem.

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Start the App:**
   ```bash
   npm run dev
   ```
3. **Configure:**
   Once the dashboard loads, click the Settings Gear icon in the sidebar to configure your **Home Folder** (the root directory it will index) and toggle UI animations.

## Xournal++ Templates
To use the template feature, simply place a configured `template.xopp` file inside your designated Home Folder. The app will automatically copy and rename it whenever you try to open a missing `.xopp` note in a subfolder.
