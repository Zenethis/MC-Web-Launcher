# Minecraft Web Launcher

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Zenethis/Minecraft-Web-Launcher)  
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Zenethis/Minecraft-Web-Launcher)

## Overview

The **Minecraft Web Launcher** is a purely browser‑based launcher that lets you spin up isolated Minecraft instances in your browser—no native Minecraft installation required. It runs entirely client‑side (HTML/CSS/JS), with a Service Worker for offline caching and PWA install support.

## Features

- **100% Client‑Side**: No server or native code dependencies.  
- **Isolated Instances**: Generates a standalone `.zip` containing its own `.minecraft` folder you can run separately—doesn’t touch any existing installation.  
- **Offline‑First**: UI assets and downloads are cached via Service Worker for fast reloads and offline resilience.  
- **PWA‑Ready**: Includes `site.webmanifest` and icons for “Add to Home” or desktop install.  
- **Customizable**: Modify `versions.json`, `icons.json`, and `styles.css` for your own themes and builds.

## Quick Start

1. **Clone the repo**  
   ```bash
   git clone https://github.com/Zenethis/Minecraft-Web-Launcher.git
   cd Minecraft-Web-Launcher
