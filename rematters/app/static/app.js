/**
 * Rematters admin UI — relative API paths for HA ingress.
 */
const API = "./api";
const { t, initI18n, setLocale } = window.RemattersI18n;

let vault = { categories: [], codes: [] };
let activeCategoryId = null;

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

async function loadVault() {
  vault = await api("/vault");
  render();
}

function categoryName(id) {
  const c = vault.categories.find((x) => x.id === id);
  return c ? c.name : t("categories.none");
}

function filteredCodes() {
  let codes = vault.codes;
  if (activeCategoryId) {
    codes = codes.filter((c) => c.category_id === activeCategoryId);
  }
  const q = document.getElementById("search").value.trim().toLowerCase();
  if (!q) return codes;
  return codes.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.device_type.toLowerCase().includes(q) ||
      c.manual_code.toLowerCase().includes(q) ||
      c.qr_payload.toLowerCase().includes(q) ||
      c.notes.toLowerCase().includes(q)
  );
}

function renderCategories() {
  const ul = document.getElementById("category-list");
  ul.innerHTML = "";
  const sorted = [...vault.categories].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );
  for (const cat of sorted) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "category-btn" + (activeCategoryId === cat.id ? " active" : "");
    btn.innerHTML = `<span class="category-dot" style="background:${cat.color}"></span>${escapeHtml(cat.name)}`;
    btn.onclick = () => {
      activeCategoryId = cat.id;
      document.getElementById("filter-all").classList.remove("active");
      render();
    };
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      openCategoryDialog(cat);
    };
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function renderCodes() {
  const grid = document.getElementById("codes-grid");
  const empty = document.getElementById("empty-state");
  const codes = filteredCodes();
  grid.innerHTML = "";
  empty.classList.toggle("hidden", codes.length > 0);

  for (const code of codes) {
    const card = document.createElement("article");
    card.className = "code-card";
    const hasQr = code.qr_payload || code.manual_code;
    card.innerHTML = `
      <h3>${escapeHtml(code.name)}</h3>
      <div class="code-meta">
        ${code.device_type ? escapeHtml(code.device_type) + " · " : ""}
        <span class="badge">${escapeHtml(categoryName(code.category_id))}</span>
      </div>
      ${code.manual_code ? `<div class="code-value">${escapeHtml(code.manual_code)}</div>` : ""}
      ${code.qr_payload ? `<div class="code-value">${escapeHtml(code.qr_payload)}</div>` : ""}
      ${code.notes ? `<p class="code-meta">${escapeHtml(code.notes)}</p>` : ""}
      ${code.ha_link?.entity_id ? `<p class="code-meta">HA: ${escapeHtml(code.ha_link.entity_id)}.${escapeHtml(code.ha_link.attribute || "")}</p>` : ""}
      ${hasQr ? `<img class="qr" src="./api/codes/${code.id}/qr.png" alt="QR" />` : ""}
      <div class="card-actions">
        <button type="button" class="btn secondary" data-edit>${escapeHtml(t("action.edit"))}</button>
        <button type="button" class="btn danger" data-delete>${escapeHtml(t("action.delete"))}</button>
      </div>
    `;
    card.querySelector("[data-edit]").onclick = () => openCodeDialog(code);
    card.querySelector("[data-delete]").onclick = () => deleteCode(code.id);
    grid.appendChild(card);
  }
}

function render() {
  renderCategories();
  renderCodes();
  fillCategorySelect();
}

function fillCategorySelect() {
  const sel = document.getElementById("code-category");
  sel.innerHTML = `<option value="">${escapeHtml(t("code.category_none"))}</option>`;
  for (const cat of vault.categories) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  }
}

function escapeHtml(s) {
  if (!s) return "";
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

function openCodeDialog(code = null) {
  const dlg = document.getElementById("code-dialog");
  document.getElementById("code-dialog-title").textContent = code
    ? t("code.dialog_edit")
    : t("code.dialog_new");
  document.getElementById("code-id").value = code?.id || "";
  document.getElementById("code-name").value = code?.name || "";
  document.getElementById("code-device-type").value = code?.device_type || "";
  document.getElementById("code-category").value = code?.category_id || "";
  document.getElementById("code-manual").value = code?.manual_code || "";
  document.getElementById("code-qr").value = code?.qr_payload || "";
  document.getElementById("code-notes").value = code?.notes || "";
  document.getElementById("code-ha-entity").value = code?.ha_link?.entity_id || "";
  document.getElementById("code-ha-attr").value = code?.ha_link?.attribute || "";
  dlg.showModal();
}

function openCategoryDialog(cat = null) {
  const dlg = document.getElementById("category-dialog");
  document.getElementById("category-dialog-title").textContent = cat
    ? t("categories.dialog_edit")
    : t("categories.dialog_new");
  document.getElementById("category-id").value = cat?.id || "";
  document.getElementById("category-name").value = cat?.name || "";
  document.getElementById("category-color").value = cat?.color || "#6366f1";
  dlg.showModal();
}

async function saveCode(e) {
  e.preventDefault();
  const id = document.getElementById("code-id").value;
  const body = {
    name: document.getElementById("code-name").value.trim(),
    device_type: document.getElementById("code-device-type").value.trim(),
    category_id: document.getElementById("code-category").value || null,
    manual_code: document.getElementById("code-manual").value.trim(),
    qr_payload: document.getElementById("code-qr").value.trim(),
    notes: document.getElementById("code-notes").value.trim(),
    ha_link: {
      entity_id: document.getElementById("code-ha-entity").value.trim() || null,
      attribute: document.getElementById("code-ha-attr").value.trim() || null,
    },
  };
  if (id) {
    await api(`/codes/${id}`, { method: "PUT", body: JSON.stringify(body) });
  } else {
    await api("/codes", { method: "POST", body: JSON.stringify(body) });
  }
  document.getElementById("code-dialog").close();
  await loadVault();
}

async function deleteCode(id) {
  if (!confirm(t("confirm.delete_code"))) return;
  await api(`/codes/${id}`, { method: "DELETE" });
  await loadVault();
}

async function saveCategory(e) {
  e.preventDefault();
  const id = document.getElementById("category-id").value;
  const body = {
    name: document.getElementById("category-name").value.trim(),
    color: document.getElementById("category-color").value,
  };
  if (id) {
    await api(`/categories/${id}`, { method: "PUT", body: JSON.stringify(body) });
  } else {
    await api("/categories", { method: "POST", body: JSON.stringify(body) });
  }
  document.getElementById("category-dialog").close();
  await loadVault();
}

async function loadBackupStatus() {
  try {
    const s = await api("/backup/status");
    const el = document.getElementById("backup-status");
    el.textContent = s.gdrive_configured
      ? t("backup.gdrive_active", { hours: s.interval_hours })
      : t("backup.gdrive_inactive");
  } catch {
    /* ignore */
  }
}

function bindUi() {
  document.getElementById("btn-add-code").onclick = () => openCodeDialog();
  document.getElementById("btn-add-category").onclick = () => openCategoryDialog();
  document.getElementById("code-form").onsubmit = saveCode;
  document.getElementById("category-form").onsubmit = saveCategory;
  document.getElementById("search").oninput = renderCodes;

  document.getElementById("filter-all").onclick = () => {
    activeCategoryId = null;
    document.getElementById("filter-all").classList.add("active");
    renderCodes();
  };

  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.onclick = () => btn.closest("dialog").close();
  });

  document.getElementById("btn-export").onclick = () => {
    window.location.href = "./api/export";
  };

  document.getElementById("import-file").onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const merge = confirm(t("confirm.import_merge"));
    await api("/import", {
      method: "POST",
      body: JSON.stringify({ data: text, merge }),
    });
    e.target.value = "";
    await loadVault();
  };

  document.getElementById("btn-backup").onclick = async () => {
    const r = await api("/backup", { method: "POST" });
    alert(
      r.gdrive_file_id ? t("alert.backup_gdrive_ok") : t("alert.backup_local_ok")
    );
  };

  document.getElementById("btn-sync-ha").onclick = async () => {
    const id = document.getElementById("code-id").value;
    if (!id) {
      alert(t("alert.save_before_sync"));
      return;
    }
    try {
      await api(`/codes/${id}/sync-from-ha`, { method: "POST" });
      await loadVault();
      openCodeDialog(vault.codes.find((c) => c.id === id));
    } catch (err) {
      alert(err.message);
    }
  };

  const localeSwitch = document.getElementById("locale-switch");
  if (localeSwitch) {
    localeSwitch.addEventListener("click", (e) => {
      const btn = e.target.closest(".locale-btn[data-locale]");
      if (!btn) return;
      const code = btn.dataset.locale;
      if (code === window.RemattersI18n.getLocale()) return;
      setLocale(code).then(() => {
        render();
        loadBackupStatus();
      });
    });
  }

  window.addEventListener("rematters:locale", () => {
    render();
    loadBackupStatus();
  });
}

window.RemattersUI = { refreshBackupStatus: loadBackupStatus };

async function boot() {
  await initI18n();
  bindUi();
  await loadVault();
  await loadBackupStatus();
}

boot();
