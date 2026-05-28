"""HomeKit setup URI (X-HM://) — aligned with SimonGolms/homekit-code."""

from __future__ import annotations

import re

# https://github.com/SimonGolms/homekit-code/blob/master/src/config/categories.ts
HOMEKIT_CATEGORIES: dict[str, int] = {
    "airConditioner": 21,
    "airport": 27,
    "airPurifier": 19,
    "appleTv": 24,
    "bridge": 2,
    "dehumidifier": 23,
    "door": 12,
    "doorLock": 6,
    "fan": 3,
    "faucet": 29,
    "garage": 4,
    "heater": 20,
    "humidifier": 22,
    "ipCamera": 17,
    "lightbulb": 5,
    "other": 1,
    "outlet": 7,
    "programmableSwitch": 15,
    "rangeExtender": 16,
    "securitySystem": 11,
    "sensor": 10,
    "showerHead": 30,
    "speaker": 26,
    "sprinkler": 28,
    "switch": 8,
    "targetController": 32,
    "television": 31,
    "thermostat": 9,
    "videoDoorBell": 18,
    "window": 13,
    "windowCovering": 14,
}

DEFAULT_HOMEKIT_FLAG = 2  # IP


def pairing_digits(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    return digits if len(digits) == 8 else ""


def normalize_setup_id(value: str) -> str:
    s = re.sub(r"[^0-9A-Za-z]", "", (value or "").strip()).upper()
    return s[:4] if len(s) == 4 else ""


def to_base36_upper(n: int, width: int = 9) -> str:
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if n <= 0:
        return "0".zfill(width)
    out: list[str] = []
    while n:
        n, rem = divmod(n, 36)
        out.append(alphabet[rem])
    return "".join(reversed(out)).zfill(width)


def compose_setup_uri(
    *,
    category_id: int,
    flag: int = DEFAULT_HOMEKIT_FLAG,
    password: str,
    setup_id: str = "",
    version: int = 0,
    reserved: int = 0,
) -> str:
    """Build ``X-HM://{base36}{setupId}`` (homekit-code composeSetupUri)."""
    payload = version & 0x7
    payload = ((payload << 4) | (reserved & 0xF)) & 0xFFFFFFFF
    payload = ((payload << 8) | (category_id & 0xFF)) & 0xFFFFFFFF
    payload = ((payload << 4) | (flag & 0xF)) & 0xFFFFFFFF
    payload = (int(payload) << 27) | (int(password) & 0x7FFFFFFF)
    base36 = to_base36_upper(int(payload), 9)
    return f"X-HM://{base36}{normalize_setup_id(setup_id)}"


def category_id_for(name: str) -> int:
    key = (name or "other").strip()
    return HOMEKIT_CATEGORIES.get(key, HOMEKIT_CATEGORIES["other"])


def parse_setup_uri(uri: str) -> dict[str, str] | None:
    s = (uri or "").strip()
    if not s.upper().startswith("X-HM://"):
        return None
    body = s[7:]
    if len(body) < 9:
        return None
    base36 = body[:9].upper()
    setup_id = normalize_setup_id(body[9:13] if len(body) > 9 else "")
    return {"base36": base36, "setup_id": setup_id, "uri": f"X-HM://{base36}{setup_id}"}


def decode_pairing_from_uri(uri: str) -> str:
    parsed = parse_setup_uri(uri)
    if not parsed:
        return ""
    try:
        n = int(parsed["base36"], 36)
    except ValueError:
        return ""
    password = n & 0x7FFFFFFF
    digits = str(password)
    return digits.zfill(8) if len(digits) <= 8 else ""


def qr_encode_payload(qr_payload: str, manual_code: str = "") -> str | None:
    qr = (qr_payload or "").strip()
    if qr.upper().startswith("X-HM://"):
        return qr
    digits = pairing_digits(manual_code)
    if digits:
        return None
    return None


def normalize_fields(
    manual_code: str,
    qr_payload: str,
    *,
    homekit_category: str = "other",
    homekit_flag: int = DEFAULT_HOMEKIT_FLAG,
    setup_id: str = "",
) -> dict[str, str | int]:
    """Normalize HomeKit vault fields; (re)build setup URI when possible."""
    qr = (qr_payload or "").strip()
    parsed = parse_setup_uri(qr) if qr else None
    digits = pairing_digits(manual_code)
    sid = normalize_setup_id(setup_id)
    if parsed and not digits:
        digits = decode_pairing_from_uri(parsed["uri"])
    if parsed:
        return {
            "manual_code": digits,
            "qr_payload": parsed["uri"],
            "setup_id": parsed["setup_id"] or sid,
            "homekit_category": homekit_category,
            "homekit_flag": int(homekit_flag),
        }
    if len(digits) == 8:
        cat_id = category_id_for(homekit_category)
        uri = compose_setup_uri(
            category_id=cat_id,
            flag=int(homekit_flag),
            password=digits,
            setup_id=sid,
        )
        return {
            "manual_code": digits,
            "qr_payload": uri,
            "setup_id": sid,
            "homekit_category": homekit_category,
            "homekit_flag": int(homekit_flag),
        }
    return {
        "manual_code": digits,
        "qr_payload": qr,
        "setup_id": sid,
        "homekit_category": homekit_category,
        "homekit_flag": int(homekit_flag),
    }


def has_scannable_qr(qr_payload: str) -> bool:
    return (qr_payload or "").strip().upper().startswith("X-HM://")
