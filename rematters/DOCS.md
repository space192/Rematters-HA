# Rematters — documentatie

**Rematters** = *Remembers* + *Matter* — bewaar binding codes zodat je ze later terugvindt.

## Gebruik

1. **Categorieën** — groepeer codes per ruimte, merk of eigen logica (rechtermuisklik op categorie = bewerken).
2. **Codes toevoegen** — vul minimaal naam + manual code en/of `MT:` QR string in.
3. **HA-koppeling** — optioneel `entity_id` + attribuut; gebruik **Ophalen uit HA** om de waarde te synchroniseren.
4. **Exporteren** — download `rematters-export.json` voor backup of de Rematters viewer.
5. **Backup nu** — lokale kopie + upload naar Google Drive (indien geconfigureerd).

## Google Drive OAuth (eenmalig)

1. [Google Cloud Console](https://console.cloud.google.com/) → nieuw project → **APIs & Services** → enable **Google Drive API**.
2. **OAuth consent screen** (External of Internal voor Workspace).
3. **Credentials** → **Create OAuth client ID** → type **Desktop app**.
4. Verkrijg een refresh token met scope `drive.file`, bijvoorbeeld via [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) (eigen client ID/secret invullen).
5. Maak in Drive een map `Rematters Backups` en kopieer de folder ID uit de URL: `https://drive.google.com/drive/folders/FOLDER_ID_HIER`.

Configureer in de add-on:

| Optie | Beschrijving |
|-------|----------------|
| Google Drive backup | Aan/uit |
| Folder ID | Doelmap |
| Client ID / Secret / Refresh token | OAuth credentials |

Automatische backups draaien volgens **Backup interval (hours)**; oude bestanden worden bijgehouden tot **Backups to retain**.

## JSON-schema (v1)

```json
{
  "meta": { "version": 1, "exported_at": "ISO8601", "addon_version": "0.1.0" },
  "categories": [
    { "id": "uuid", "name": "Woonkamer", "color": "#6366f1", "sort_order": 0 }
  ],
  "codes": [
    {
      "id": "uuid",
      "name": "Apparaatnaam",
      "device_type": "lamp",
      "category_id": "uuid-of-null",
      "manual_code": "1234-567-8901",
      "qr_payload": "MT:…",
      "notes": "",
      "ha_link": { "entity_id": "light.x", "attribute": "matter_setup_code" },
      "created_at": "ISO8601",
      "updated_at": "ISO8601"
    }
  ]
}
```

## API (ingress)

Alle routes onder `./api/` (relatief voor Ingress):

| Methode | Pad | Actie |
|---------|-----|--------|
| GET | `/vault` | Volledige vault |
| GET | `/export` | JSON download |
| POST | `/import` | `{ "data": "…", "merge": false }` |
| POST | `/backup` | Handmatige backup |
| CRUD | `/categories`, `/codes` | Beheer |
| POST | `/codes/{id}/sync-from-ha` | HA attribuut → code |

## Beveiliging

- Ingress verkeer komt alleen van Supervisor (`172.30.32.2`).
- Geen aparte login in de add-on; HA authenticatie via Ingress.
- Bewaar OAuth secrets alleen in add-on configuratie (niet in export-JSON).

## Rematters viewer

Gebruikers zonder HA openen de export op **[viewer.rematters.nl](https://viewer.rematters.nl)** (bron: [Rematters-Webviewer](https://github.com/Rematters/Rematters-Webviewer)). De viewer valideert `codes[]` en rendert QR lokaal in de browser.

Productsite en installatie: [rematters.nl](https://rematters.nl) · [Rematters-Web](https://github.com/Rematters/Rematters-Web)
