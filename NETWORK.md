# Accessing the dev server from other devices (phone, tablet)

The dev server binds to `0.0.0.0`, so it should be reachable from other devices on your Wi‑Fi.

## If it doesn't work: macOS Firewall

macOS Firewall often blocks incoming connections. To allow access:

1. Open **System Settings** → **Network** → **Firewall**
2. Click the lock to make changes
3. Either:
   - **Turn off Firewall** temporarily for testing, or
   - Click **Options** → **Add (+)** → add **Node** or your Terminal app, and set it to **Allow incoming connections**

## Find your IP

```bash
ipconfig getifaddr en0
```

Then open `http://YOUR_IP:3000` on the other device (e.g. `http://192.168.1.158:3000`).
