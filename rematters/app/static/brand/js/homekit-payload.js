/**
 * HomeKit setup URI (X-HM://) — parity with SimonGolms/homekit-code.
 */
(function (global) {
  const CATEGORIES = {
    airConditioner: 21,
    airport: 27,
    airPurifier: 19,
    appleTv: 24,
    bridge: 2,
    dehumidifier: 23,
    door: 12,
    doorLock: 6,
    fan: 3,
    faucet: 29,
    garage: 4,
    heater: 20,
    humidifier: 22,
    ipCamera: 17,
    lightbulb: 5,
    other: 1,
    outlet: 7,
    programmableSwitch: 15,
    rangeExtender: 16,
    securitySystem: 11,
    sensor: 10,
    showerHead: 30,
    speaker: 26,
    sprinkler: 28,
    switch: 8,
    targetController: 32,
    television: 31,
    thermostat: 9,
    videoDoorBell: 18,
    window: 13,
    windowCovering: 14,
  };

  const CATEGORY_KEYS = Object.keys(CATEGORIES).sort((a, b) =>
    a.localeCompare(b)
  );

  const DEFAULT_FLAG = 2;

  function pairingDigits(value) {
    const d = String(value || "").replace(/\D/g, "");
    return d.length === 8 ? d : "";
  }

  function normalizeSetupId(value) {
    const s = String(value || "")
      .replace(/[^0-9A-Za-z]/g, "")
      .toUpperCase();
    return s.length === 4 ? s : "";
  }

  function toBase36Upper(n, width) {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let num = BigInt(n);
    if (num <= 0n) return "0".padStart(width, "0");
    let out = "";
    while (num > 0n) {
      const rem = Number(num % 36n);
      out = alphabet[rem] + out;
      num = num / 36n;
    }
    return out.padStart(width, "0");
  }

  function composeSetupUri({
    categoryId,
    flag = DEFAULT_FLAG,
    password,
    setupId = "",
    version = 0,
    reserved = 0,
  }) {
    let payload = BigInt(version & 0x7);
    payload = (payload << 4n) | BigInt(reserved & 0xf);
    payload = (payload << 8n) | BigInt(categoryId & 0xff);
    payload = (payload << 4n) | BigInt(flag & 0xf);
    payload = (payload << 27n) | BigInt(Number(password) & 0x7fffffff);
    const base36 = toBase36Upper(payload, 9);
    return `X-HM://${base36}${normalizeSetupId(setupId)}`;
  }

  function categoryIdFor(name) {
    return CATEGORIES[name] ?? CATEGORIES.other;
  }

  function parseSetupUri(uri) {
    const s = String(uri || "").trim();
    if (!s.toUpperCase().startsWith("X-HM://")) return null;
    const body = s.slice(7);
    if (body.length < 9) return null;
    const base36 = body.slice(0, 9).toUpperCase();
    const setupId = normalizeSetupId(body.slice(9, 13));
    return { base36, setupId, uri: `X-HM://${base36}${setupId}` };
  }

  function decodePairingFromUri(uri) {
    const parsed = parseSetupUri(uri);
    if (!parsed) return "";
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let n = 0n;
    for (const ch of parsed.base36) {
      const idx = alphabet.indexOf(ch);
      if (idx < 0) return "";
      n = n * 36n + BigInt(idx);
    }
    const password = Number(n & 0x7fffffffn);
    return String(password).padStart(8, "0").slice(-8);
  }

  function normalizeFields(manualCode, qrPayload, opts = {}) {
    const category = opts.homekit_category || "other";
    const flag = Number(opts.homekit_flag ?? DEFAULT_FLAG);
    let setupId = normalizeSetupId(opts.setup_id || "");
    let qr = String(qrPayload || "").trim();
    let digits = pairingDigits(manualCode);
    const parsed = qr ? parseSetupUri(qr) : null;
    if (parsed && !digits) digits = decodePairingFromUri(parsed.uri);
    if (parsed) {
      return {
        manual_code: digits,
        qr_payload: parsed.uri,
        setup_id: parsed.setup_id || setupId,
        homekit_category: category,
        homekit_flag: flag,
      };
    }
    if (digits.length === 8) {
      const uri = composeSetupUri({
        categoryId: categoryIdFor(category),
        flag,
        password: digits,
        setupId,
      });
      return {
        manual_code: digits,
        qr_payload: uri,
        setup_id: setupId,
        homekit_category: category,
        homekit_flag: flag,
      };
    }
    return {
      manual_code: digits,
      qr_payload: qr,
      setup_id: setupId,
      homekit_category: category,
      homekit_flag: flag,
    };
  }

  function hasScannableQr(qrPayload) {
    return String(qrPayload || "")
      .trim()
      .toUpperCase()
      .startsWith("X-HM://");
  }

  function codeProtocol(code) {
    const ct = String(code?.code_type || "").toLowerCase();
    if (ct === "homekit") return "homekit";
    if (hasScannableQr(code?.qr_payload)) return "homekit";
    if (String(code?.qr_payload || "").toUpperCase().startsWith("MT:")) return "matter";
    return "matter";
  }

  function formatPairingDisplay(manualCode) {
    const d = pairingDigits(manualCode);
    if (d.length !== 8) return String(manualCode || "").trim();
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5, 8)}`;
  }

  global.RemattersHomeKitPayload = {
    CATEGORIES,
    CATEGORY_KEYS,
    DEFAULT_FLAG,
    pairingDigits,
    normalizeSetupId,
    composeSetupUri,
    categoryIdFor,
    parseSetupUri,
    normalizeFields,
    hasScannableQr,
    codeProtocol,
    formatPairingDisplay,
  };
})(typeof window !== "undefined" ? window : globalThis);
