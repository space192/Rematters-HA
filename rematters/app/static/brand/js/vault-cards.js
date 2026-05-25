/**
 * Shared Matter code card markup (Rematters Cloud + HA Ingress).
 * Labels match the English cloud vault UI.
 */
(function (global) {
  const LABELS = { share: "Share", edit: "Edit", delete: "Delete" };

  function buildCodeCardHtml(code, opts) {
    const escapeHtml = opts.escapeHtml;
    const categoryName = opts.categoryName(code.category_id);
    const iconsHref = opts.iconsHref || "/brand/icons.svg";
    const qrPrefix = opts.qrApiPrefix || "/api";
    const hasQr = code.qr_payload || code.manual_code;
    const icons =
      global.RemattersVaultShareUi?.cardIconButtonsHtml({
        iconsHref,
        showShare: true,
        shareLabel: LABELS.share,
        editLabel: LABELS.edit,
        deleteLabel: LABELS.delete,
      }) || "";

    return `
      <div class="code-card-top">
        <h3>${escapeHtml(code.name)}</h3>
        ${icons}
      </div>
      <div class="code-meta">
        ${code.device_type ? escapeHtml(code.device_type) + " · " : ""}
        <span class="badge">${escapeHtml(categoryName)}</span>
      </div>
      ${code.manual_code ? `<div class="code-value">${escapeHtml(code.manual_code)}</div>` : ""}
      ${code.qr_payload ? `<div class="code-value">${escapeHtml(code.qr_payload)}</div>` : ""}
      ${code.notes ? `<p class="code-meta">${escapeHtml(code.notes)}</p>` : ""}
      ${
        code.ha_link?.entity_id
          ? `<p class="code-meta">HA: ${escapeHtml(code.ha_link.entity_id)}${
              code.ha_link.attribute ? "." + escapeHtml(code.ha_link.attribute) : ""
            }</p>`
          : ""
      }
      ${hasQr ? `<img class="qr" src="${qrPrefix}/codes/${code.id}/qr.png" alt="QR" />` : ""}
    `;
  }

  function wireCodeCard(card, code, handlers) {
    const shareBtn = card.querySelector("[data-share]");
    if (shareBtn && handlers.onShare) {
      shareBtn.onclick = () => handlers.onShare(code);
    }
    const editBtn = card.querySelector("[data-edit]");
    if (editBtn && handlers.onEdit) {
      editBtn.onclick = () => handlers.onEdit(code);
    }
    const delBtn = card.querySelector("[data-delete]");
    if (delBtn && handlers.onDelete) {
      delBtn.onclick = () => handlers.onDelete(code.id);
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
    buildCodeCardHtml,
    wireCodeCard,
    categoryNameDefault,
    fillCategorySelect,
  };
})(typeof window !== "undefined" ? window : globalThis);
