# KB1 Config

[![Traffic](https://img.shields.io/badge/analytics-umami-blue)](https://cloud.umami.is/analytics/us/share/X00Oso9T1qydknsS)

Browser-based configuration and performance app for the handcrafted PocketMidi KB1 MIDI controller. Configure keyboard, lever, press, touch, and system settings over Bluetooth, manage presets, and perform with 12 real-time sliders in FX, MIX, or COMBO mode.

**Live app:** [KB1 Configurator](https://pocketmidi.github.io/KB1-config/)

## Quick Start

1. Squeeze both KB1 levers inward for 3 seconds; release when the LEDs turn off to enable Bluetooth.
2. Tap the Bluetooth icon in the app's upper left and select KB1. Settings load automatically.
3. Edit settings under **SETTINGS**, then tap the bouncing amber arrow in the upper right to send them. Sent settings are applied immediately and saved to device flash.

Use Chrome, Edge, or Opera on desktop or Android. On iOS, [V Browser](https://vbrowser.co) is recommended; Safari does not support Web Bluetooth.

## Guides

- [User Guide](docs/USER_GUIDE.md): Current labels, settings, presets, and sliders. Also available via **USER GUIDE** and the **i** buttons in the app.
- [KB1 Studio User Guide](https://pocketmidi.github.io/KB1-studio/): Hardware setup, charging, Tracker configuration, and firmware updates.
- [Typography Reference](TYPOGRAPHY_REFERENCE.md): Theme tokens for UI development.
- [Preset Upload Server](server/README.md): Community upload endpoint setup.

The detailed settings reference lives in the User Guide, not in a second copy here.

## Development

Use a Node.js version supported by Vite 7 (20.19+ or 22.12+).

```bash
git clone https://github.com/PocketMidi/KB1-config.git
cd KB1-config
npm install
npm run dev
npm run build
npm run preview
```

Web Bluetooth works on localhost without HTTPS. The build runs Vue/TypeScript checks and writes to `dist/`.

The GitHub Actions workflow deploys to GitHub Pages on pushes to `main`. Set **Settings > Pages > Source** to **GitHub Actions**.

## Technology

Vue 3, TypeScript, Vite, and Web Bluetooth.

## License

See [LICENSE](LICENSE).
