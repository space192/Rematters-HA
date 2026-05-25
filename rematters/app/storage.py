"""JSON file persistence for the Matter vault."""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from threading import Lock

from models import Vault

DEFAULT_DATA_DIR = "/data"
VAULT_FILENAME = "rematters.json"


class VaultStorage:
    def __init__(self, data_dir: str | None = None) -> None:
        self.data_dir = Path(data_dir or os.environ.get("REMATTERS_DATA", DEFAULT_DATA_DIR))
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.path = self.data_dir / VAULT_FILENAME
        self._lock = Lock()

    def load(self) -> Vault:
        with self._lock:
            if not self.path.exists():
                vault = Vault()
                self._write_unlocked(vault)
                return vault
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            return Vault.model_validate(raw)

    def save(self, vault: Vault) -> None:
        with self._lock:
            self._write_unlocked(vault)

    def export_json(self) -> str:
        from models import utc_now

        vault = self.load()
        vault.meta.exported_at = utc_now()
        return vault.model_dump_json(indent=2)

    def import_json(self, payload: str, *, merge: bool = False) -> Vault:
        incoming = Vault.model_validate(json.loads(payload))
        with self._lock:
            if merge and self.path.exists():
                current = Vault.model_validate(
                    json.loads(self.path.read_text(encoding="utf-8"))
                )
                current.categories.extend(incoming.categories)
                current.codes.extend(incoming.codes)
                self._write_unlocked(current)
                return current
            self._write_unlocked(incoming)
            return incoming

    def backup_local_copy(self) -> Path:
        """Create timestamped local backup in /data/backups."""
        from datetime import datetime, timezone

        backup_dir = self.data_dir / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        dest = backup_dir / f"rematters_{stamp}.json"
        shutil.copy2(self.path, dest)
        return dest

    def _write_unlocked(self, vault: Vault) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(
            vault.model_dump_json(indent=2),
            encoding="utf-8",
        )
        tmp.replace(self.path)
