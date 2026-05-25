"""Google Drive backup for vault JSON."""

from __future__ import annotations

import io
import json
import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload

_LOGGER = logging.getLogger("rematters.gdrive")


class GDriveBackup:
    def __init__(self, options: dict[str, Any]) -> None:
        self.enabled = bool(options.get("gdrive_enabled"))
        self.folder_id = (options.get("gdrive_folder_id") or "").strip()
        self.client_id = options.get("gdrive_client_id") or ""
        self.client_secret = options.get("gdrive_client_secret") or ""
        self.refresh_token = options.get("gdrive_refresh_token") or ""
        self.keep_count = int(options.get("backup_keep_count") or 10)

    @property
    def configured(self) -> bool:
        return bool(
            self.enabled
            and self.folder_id
            and self.client_id
            and self.client_secret
            and self.refresh_token
        )

    def _service(self):
        creds = Credentials(
            token=None,
            refresh_token=self.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=["https://www.googleapis.com/auth/drive.file"],
        )
        return build("drive", "v3", credentials=creds, cache_discovery=False)

    def upload_vault(self, vault_path: Path) -> Optional[str]:
        if not self.configured:
            _LOGGER.debug("Google Drive backup not configured, skipping")
            return None

        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"rematters_{stamp}.json"
        content = vault_path.read_bytes()

        media = MediaIoBaseUpload(
            io.BytesIO(content),
            mimetype="application/json",
            resumable=True,
        )
        metadata = {
            "name": filename,
            "parents": [self.folder_id],
            "description": "Rematters automatic backup",
        }

        service = self._service()
        created = (
            service.files()
            .create(body=metadata, media_body=media, fields="id,name")
            .execute()
        )
        file_id = created.get("id")
        _LOGGER.info("Uploaded backup %s (%s)", filename, file_id)
        self._prune_old_backups(service)
        return file_id

    def _prune_old_backups(self, service) -> None:
        query = (
            f"'{self.folder_id}' in parents and "
            "name contains 'rematters_' and trashed = false"
        )
        results = (
            service.files()
            .list(
                q=query,
                fields="files(id,name,createdTime)",
                orderBy="createdTime desc",
                pageSize=100,
            )
            .execute()
        )
        files = results.get("files", [])
        for old in files[self.keep_count :]:
            service.files().delete(fileId=old["id"]).execute()
            _LOGGER.info("Removed old backup %s", old.get("name"))


def load_options() -> dict[str, Any]:
    path = Path(os.environ.get("REMATTERS_OPTIONS", "/data/options.json"))
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))
