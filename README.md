<p align="center">
  <img src="rematters/logo.svg" alt="Rematters" width="88" height="88" />
</p>

<h1 align="center">Rematters</h1>

<p align="center"><strong>Your smart-home pairing code vault</strong> for Home Assistant</p>

<p align="center">
  <a href="https://github.com/Rematters/Rematters-HA">GitHub</a> ·
  <a href="https://rematters.casa">rematters.casa</a> ·
  <a href="https://viewer.rematters.casa">Viewer</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Home%20Assistant-Add--on-41BDF5?style=flat-square&logo=home-assistant" alt="Home Assistant Add-on" />
  <img src="https://img.shields.io/github/stars/Rematters/Rematters-HA?style=flat-square" alt="GitHub stars" />
</p>

---

**Rematters** (*Remembers* + smart-home protocols) helps you store, organize, and retrieve pairing codes you would otherwise lose in email, boxes, or controller apps. Use it entirely on Home Assistant, sync with **Rematters Cloud**, or combine both.

| Resource | Link |
|----------|------|
| **Product site & cloud vault** | [rematters.casa](https://rematters.casa) |
| **Read-only export viewer** | [viewer.rematters.casa](https://viewer.rematters.casa) · [Rematters-Webviewer](https://github.com/Rematters/Rematters-Webviewer) |
| **Docker (self-host, no HA)** | [Rematters-Docker](https://github.com/Rematters/Rematters-Docker) |
| **Cloud app source** | [Rematters-Web](https://github.com/Rematters/Rematters-Web) |

## What it does

- **Vault:** categories (room, vendor, project) with colored icons; each entry has a name, notes, and protocol-specific fields.
- **QR & labels:** generate QR PNGs and printable sticker cards (Matter layout, HomeKit official card SVG, Z-Wave SmartStart label).
- **Scan:** camera or image upload to add codes; duplicate detection per protocol.
- **Home Assistant link:** optional `entity_id` + attribute; **Pull from HA** copies the value into the vault.
- **Export / import:** JSON backup compatible with the [Rematters Viewer](https://viewer.rematters.casa).
- **Google Drive:** scheduled automatic JSON backups (optional).
- **Rematters Cloud:** bidirectional sync with your account at [rematters.casa](https://rematters.casa) (optional).

The add-on UI runs inside Home Assistant via **Ingress** (no extra login; HA handles access).

## Supported protocols

| Protocol | What you store | QR / card |
|----------|----------------|-----------|
| **Matter** | `MT:…` payload and/or 11-digit manual code | Matter sticker (logo + QR + manual code) |
| **HomeKit** | 8-digit pairing code, setup ID, category & flag; builds `X-HM://…` URI | HomeKit label card (400×540 SVG, quartile QR) |
| **Z-Wave SmartStart** | 90-digit SmartStart string; DSK and S2 PIN derived automatically | Z-Wave label + QR (version 3, EC level L) |

Cloud sync and export use the same vault schema for all three types (`code_type`: `matter`, `homekit`, or `zwave`).

## Ways to use Rematters

| Mode | Best for |
|------|----------|
| **HA add-on only** (this repo) | Data stays on your Home Assistant instance |
| **Rematters Cloud** | Browser vault at [rematters.casa](https://rematters.casa); no HA required |
| **Hybrid** | Add-on + cloud account linked with a sync token; merge on schedule and on demand |
| **Docker** | Same app as the add-on, self-hosted without Supervisor — [Rematters-Docker](https://github.com/Rematters/Rematters-Docker) |

Hybrid sync is **bidirectional**: newest `updated_at` wins per code or category. The website does not push into HA entities; the add-on syncs vault JSON with the cloud API.

## Install (Home Assistant)

### 1. Add the app repository

**Settings → Apps → Install app → Repositories** (or **Add-on store → Repositories** on older setups)

```text
https://github.com/Rematters/Rematters-HA
```

Wait until the repository appears, then refresh if needed.

### 2. Install the add-on

**Settings → Apps** → **Rematters** → **Install** → **Start**.

### 3. Open the UI

**Open Web UI** (Ingress panel). Optional: add **Rematters** to the sidebar (**Show in sidebar**).

### 4. Configure (optional)

**Configuration** tab — see [Add-on options](#add-on-options) below. After changing cloud or Drive settings, **Save** and **restart** the add-on.

**Requirements:** Home Assistant with Apps / add-on support (Supervised, OS, or compatible). Architectures: `aarch64`, `amd64`, `armhf`, `armv7`.

## Add-on options

Set these under **Settings → Apps → Rematters → Configuration**.

### Rematters Cloud

| Option | Default | Description |
|--------|---------|-------------|
| `cloud_enabled` | `true` | Enable sync with Rematters Cloud |
| `cloud_url` | `https://rematters.casa` | Cloud API base URL (use default unless self-hosting the web app) |
| `cloud_token` | *(empty)* | Personal sync token from [rematters.casa](https://rematters.casa) → **Account** → **Generate HA sync token** (`rm_…`) |

With a valid token, the add-on syncs on startup and every **15 minutes**. In the Ingress UI, use **Cloud sync** for an immediate merge.

To run **without** the cloud, set `cloud_enabled` to `false` and leave `cloud_token` empty.

### Google Drive backup

| Option | Default | Description |
|--------|---------|-------------|
| `gdrive_enabled` | `false` | Upload vault JSON backups to Google Drive |
| `gdrive_folder_id` | *(empty)* | Target folder ID (dedicated folder recommended) |
| `gdrive_client_id` | *(empty)* | OAuth 2.0 client ID (Desktop app) |
| `gdrive_client_secret` | *(empty)* | OAuth client secret |
| `gdrive_refresh_token` | *(empty)* | Refresh token with `drive.file` scope |
| `backup_interval_hours` | `24` | Hours between automatic uploads (1–168) |
| `backup_keep_count` | `10` | Maximum backup files kept in the folder (1–100) |

One-time Google Cloud setup (OAuth consent, Drive API, refresh token) is described in [rematters/DOCS.md](rematters/DOCS.md#google-drive-oauth-one-time).

## Quick start in the UI

1. Create a **category** (e.g. *Living room*).
2. **Add code** → choose **Matter**, **HomeKit**, or **Z-Wave**.
3. Enter the pairing data (paste QR text, scan, or **Pull from HA**).
4. Open the card actions to download **QR**, **label/card**, or **export** the vault.

**Languages:** English by default; Dutch, German, French, Spanish, Italian, and Portuguese via the language menu in Ingress. Add-on configuration panel strings: `rematters/translations/`.

## Rematters Cloud (web)

Register at **[rematters.casa](https://rematters.casa)** for a browser-based vault with the same features (scan, share links, sticker export). Use it standalone or link the HA add-on:

1. Create an account and generate an **HA sync token**.
2. Paste the token into add-on **Configuration** → `cloud_token`.
3. Restart the add-on.

Details: [DOCS.md — Rematters Cloud (hybrid)](rematters/DOCS.md#rematters-cloud-hybrid).

## Export & Rematters Viewer

Download **Export JSON** from the add-on or cloud app. Anyone can open that file at **[viewer.rematters.casa](https://viewer.rematters.casa)** without installing HA — QR codes are rendered locally in the browser.

## Repository layout

```text
Rematters-HA/                 ← HA Apps repository root
├── repository.yaml
└── rematters/                ← add-on (slug: rematters)
    ├── config.yaml           ← version, options, schema
    ├── icon.png / logo.png
    ├── DOCS.md               ← OAuth, JSON schema, API
    ├── CHANGELOG.md
    └── app/                  ← FastAPI app (copied to /app in container)
```

## Documentation

- [DOCS.md](rematters/DOCS.md) — usage, Google Drive OAuth, vault JSON schema, Ingress API
- [CHANGELOG.md](rematters/CHANGELOG.md) — release history

## Development

```bash
cd rematters/app
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
REMATTERS_DATA=/tmp/rematters-data python main.py
```

Open `http://127.0.0.1:8099` (no Ingress; API is open locally).

## Credits

- HomeKit QR/card layout inspired by [SimonGolms/homekit-code](https://github.com/SimonGolms/homekit-code) (MIT).
- Z-Wave SmartStart QR format aligned with SDS13937 / [zwave-js](https://github.com/zwave-js/node-zwave-js) conventions.

## License

MIT © [Rematters](https://rematters.casa)
