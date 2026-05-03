# Setup Guide

## Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
exec $SHELL    # or restart your terminal so $PATH picks up bun
bun --version  # should print 1.3+
```

## Install dependencies

```bash
cd /path/to/quiz-buzzers
bun install
```

## Run

```bash
# Dev (Vite HMR for client, Bun --watch for server)
bun run dev
# → open http://localhost:5173

# Production (single port :3000, builds + serves dist)
bun run build
bun run start
# → open http://<your-LAN-IP>:3000
```

The server prints all LAN-reachable URLs on boot. Use the `Network:` URL when
testing from another device on the same wifi.

## Environment variables

- `PORT` — server port (default `3000`).
- `NODE_ENV=production` — switches Bun to serving the built `client/dist/` instead of the dev placeholder.

## PlayStation Buzz controllers

### USB IDs

VID `0x054C` (Sony), PID `0x0002` (Logitech-branded Buzz dongle).
1 dongle exposes 4 controllers. Max 2 dongles supported (8 buzz players).

### Per-OS notes

#### Windows
Plug-and-play. Chrome/Edge will prompt for HID access on first use.

#### macOS
Plug-and-play. Chrome will prompt for permission. No special Gatekeeper steps.

#### Linux
Most distros allow normal users to access HID devices without root, but if
`navigator.hid.requestDevice()` returns "device not found" even though the
dongle is plugged in, add a udev rule:

```
# /etc/udev/rules.d/99-buzz.rules
SUBSYSTEM=="usb", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0002", MODE="0666"
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="054c", ATTRS{idProduct}=="0002", MODE="0666"
```

Then:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

Unplug/replug the dongle.

## Browser support

| | Host (`/host`) | Phone (`/play`) |
|---|---|---|
| Chrome | ✓ | ✓ |
| Edge | ✓ | ✓ |
| Safari | ✗ (no WebHID) | ✓ |
| Firefox | ✗ (no WebHID) | ✓ |

The host machine **must** be Chromium-based to use Buzz controllers. Phones can
use any modern browser.
