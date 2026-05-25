/**
 * Shared Matter sticker cards (Rematters Cloud + HA Ingress).
 * Sticker is HTML/CSS (logo + qr.png + pin) — matches the physical Matter label.
 */
(function (global) {
  const LABELS = { share: "Share", edit: "Edit", delete: "Delete" };

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

  function buildStickerHtml(code, opts) {
    const escapeHtml = opts.escapeHtml;
    const apiPrefix = opts.qrApiPrefix || "/api";
    const brandPrefix = opts.brandPrefix || "/brand";
    const hasMt = hasMtPayload(code);
    const pin = displayManual(code);

    const logo = `<img class="matter-sticker-logo" src="${brandPrefix}/matter-wordmark.png" alt="matter" width="200" height="48" decoding="async" />`;

    if (!hasMt && !pin) {
      return `
        <div class="matter-sticker matter-sticker--empty">
          <div class="matter-sticker-box">
            ${logo}
            <p class="matter-sticker-empty-msg">No setup code yet</p>
          </div>
        </div>`;
    }

    const qrBlock = hasMt
      ? `<img class="matter-sticker-qr" src="${apiPrefix}/codes/${code.id}/qr.png" alt="" width="220" height="220" loading="lazy" decoding="async" />`
      : "";

    const pinBlock = pin
      ? `<p class="matter-sticker-pin">${escapeHtml(pin)}</p>`
      : "";

    return `
      <div class="matter-sticker">
        <div class="matter-sticker-box">
          ${logo}
          ${qrBlock}
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
