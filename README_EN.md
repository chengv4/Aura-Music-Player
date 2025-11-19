# Music Player browser Extension
[中文](README.md) | [English](README_EN.md)

A browser extension developed with React for playing online music.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue)

## Screenshots

![Plugins Management](screenshots/plugin-set-view.gif)  

*Support custom plugins*

![Music Player Interface](screenshots/player-interface.png)  

*Main player interface with music controls*

![Search Results](screenshots/search-results.gif)  

*Searching for music across multiple platforms*


## Features

- Multi-platform music support: Supports Netease, Kugou, Kuwo, and Maoer FM
- Online music search: Search music by keywords
- Playback controls: Play/pause, next/previous track, volume control, progress adjustment
- Playlist management: Add to playlist, favorite songs
- Loop modes: Single loop, list loop, shuffle playback
- Plugin management: Dynamically load and switch between different music platform plugins

## Install Dependencies (recommend pnpm)

```bash
npm install
```

## Development Mode

There are two ways to develop:

### Method: Development Server 

Start a development server and open a browser window:

```bash
npm start 
```

## Build Production Version

To build the production version of the extension, run:

```bash
npm run build
```

The built files will be saved in the build directory.

## Load Extension to Chrome

1. Open `chrome://extensions/` in Chrome browser
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the build directory in the project

## Usage

1. After installing the extension, an icon will appear in the Chrome toolbar
2. Click the icon to open the music player
3. Select the music platform through the tabs at the top
4. You can search for music through the search box, or browse charts and playlists
5. Click on a song to play it, and control playback through the player at the bottom

## Tech Stack

- React 18: For building user interfaces
- Webpack: Module bundler
- Babel: JavaScript compiler
- localForage: Offline storage solution
- HTML5 Audio API: For audio playback

## Project Structure

```
Aura-Music-Player/
├── public/                   # Public resource directory
│   ├── js/                   # JavaScript files
│   └── index.html            # Main page template
├── scripts/                  # Build scripts
├── src/                      # React source code
│   ├── assets/               # Static resources
│   ├── components/           # React components
│   ├── hooks/                # Custom React Hooks
│   ├── utils/                # Utility functions
│   ├── App.css               # Main app styles
│   ├── App.js                # Main app component
│   ├── MusicContext.js       # Music state management
│   ├── index.css             # Global styles
│   └── index.js              # Application entry point
├── README_ZH.md              # Chinese README
├── background.js             # Extension background script
├── manifest.json             # Extension configuration file
├── package.json              # Project configuration and dependencies
└── webpack.config.js         # Webpack configuration file
```

## License

This project is licensed under the AGPL-3.0 License. See the [LICENSE](./LICENSE) file for details.

Under the AGPL-3.0 License, commercial use of this project is prohibited. If you would like to obtain a commercial use license, please contact the project maintainer.