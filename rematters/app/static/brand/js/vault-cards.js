/**
 * Shared Matter sticker cards (Rematters Cloud + HA Ingress).
 * Sticker is HTML/CSS (logo + qr.png + pin) — matches the physical Matter label.
 */
(function (global) {
  const LABELS = { share: "Share", edit: "Edit", delete: "Delete" };

  /** Matter connectivity mark (CSA-style symbol, inline for offline use). */
  const MATTER_MARK_PATH =
    "M128 18.3c-5.1 0-9.7 2.9-11.9 7.4L81 120.4c-2.2 4.5-6.8 7.4-11.9 7.4-10.2 0-18.5 8.3-18.5 18.5 0 3.9 1.2 7.6 3.2 10.7l-8.6 43.2c-1.8 9.1 4.2 17.8 13.3 19.6 1.4.3 2.9.4 4.3.4 10.8 0 19.7-8.4 20.9-19.1l2.5-24.7c.2-2.5 2.3-4.5 4.8-4.5s4.6 2 4.8 4.5l2.5 24.7c1.2 10.8 10.1 19.1 20.9 19.1 1.4 0 2.9-.1 4.3-.4 9.1-1.8 15.1-10.5 13.3-19.6l-8.6-43.2c2-3.1 3.2-6.8 3.2-10.7 0-10.2-8.3-18.5-18.5-18.5-5.1 0-9.7-2.9-11.9-7.4L139.9 25.7c-2.2-4.5-6.8-7.4-11.9-7.4h-.2z";

  function hasMtPayload(code) {
    const q = String(code.qr_payload || "").trim();
    return q.toUpperCase().startsWith("MT:");
  }

  function displayManual(code) {
    const manual = String(code.manual_code || "").trim();
    if (!manual) return "";
    const digits = manual.replace(/\D/g, "");
    if (digits.length === 11) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
    }
    return manual;
  }

  function matterBrandHtml() {
    return `<div class="matter-sticker-brand" aria-label="matter">
      <svg class="matter-sticker-mark" viewBox="0 0 256 256" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path fill="currentColor" d="${MATTER_MARK_PATH}"/>
      </svg>
      <span class="matter-sticker-word">matter</span>
    </div>`;
  }

  function qrSlotHtml(code, opts) {
    const apiPrefix = opts.qrApiPrefix || "/api";
    const hasMt = hasMtPayload(code);
    if (hasMt) {
      return `<div class="matter-sticker-qr-slot">
        <img class="matter-sticker-qr" src="${apiPrefix}/codes/${code.id}/qr.png" alt="" width="220" height="220" loading="lazy" decoding="async" />
      </div>`;
    }
    return `<div class="matter-sticker-qr-slot" aria-hidden="true">
      <div class="matter-sticker-qr-placeholder">
        <svg class="matter-sticker-qr-ph-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          <path fill="currentColor" stroke="none" d="M7 12h.01M12 12h.01M17 12h.01M12 17h.01"/>
        </svg>
      </div>
    </div>`;
  }

  function buildStickerHtml(code, opts) {
    const escapeHtml = opts.escapeHtml;
    const hasMt = hasMtPayload(code);
    const pin = displayManual(code);
    const brand = matterBrandHtml();

    if (!hasMt && !pin) {
      return `
        <div class="matter-sticker matter-sticker--empty">
          <div class="matter-sticker-box">
            ${brand}
            <p class="matter-sticker-empty-msg">No setup code yet</p>
          </div>
        </div>`;
    }

    const pinBlock = pin
      ? `<p class="matter-sticker-pin">${escapeHtml(pin)}</p>`
      : "";

    return `
      <div class="matter-sticker">
        <div class="matter-sticker-box matter-sticker-box--full">
          ${brand}
          ${qrSlotHtml(code, opts)}
          ${pinBlock}
        </div>
      </div>`;
  }

  function buildCodeCardHtml(code, opts) {
    const escapeHtml = opts.escapeHtml;
    const iconsHref = opts.iconsHref || "/brand/icons.svg";
    const icons =
      global.RemattersVaultShareUi?.cardIconButtonsHtml({
        iconsHref,
        showShare: true,
        shareLabel: LABELS.share,
        editLabel: LABELS.edit,
        deleteLabel: LABELS.delete,
      }) || "";

    return `
      <div class="matter-label-wrap">
        <div class="card-actions-overlay">${icons}</div>
        ${buildStickerHtml(code, opts)}
      </div>
      <p class="code-card-caption" title="${escapeHtml(code.name)}">${escapeHtml(code.name)}</p>
    `;
  }

  function wireCodeCard(card, code, handlers) {
    const shareBtn = card.querySelector("[data-share]");
    if (shareBtn && handlers.onShare) {
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        handlers.onShare(code);
      };
    }
    const editBtn = card.querySelector("[data-edit]");
    if (editBtn && handlers.onEdit) {
      editBtn.onclick = (e) => {
        e.stopPropagation();
        handlers.onEdit(code);
      };
    }
    const delBtn = card.querySelector("[data-delete]");
    if (delBtn && handlers.onDelete) {
      delBtn.onclick = (e) => {
        e.stopPropagation();
        handlers.onDelete(code.id);
      };
    }
  }

  function categoryNameDefault(vault, categoryId) {
    const c = vault.categories.find((x) => x.id === categoryId);
    return c ? c.name : "Uncategorized";
  }

  function fillCategorySelect(selectEl, vault) {
    selectEl.innerHTML = `<option value="">No category</option>`;
    for (const cat of vault.categories) {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      selectEl.appendChild(opt);
    }
  }

  global.RemattersVaultCards = {
    LABELS,
    hasMtPayload,
    displayManual,
    buildCodeCardHtml,
    wireCodeCard,
    categoryNameDefault,
    fillCategorySelect,
  };
})(typeof window !== "undefined" ? window : globalThis);
