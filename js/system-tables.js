import { supabase } from "./supabase.js";
import { requireAuth, logout } from "./auth.js";

const TABLES = [
  {
    key: "cities",
    label: "ערים",
    table: "cities",
    primaryKey: "city_id",
    defaultSort: { column: "name_he", ascending: true },
    searchFields: ["name_he"],
    columns: [
      { key: "city_id", label: "מזהה", type: "readonly" },
      { key: "name_he", label: "שם עיר", type: "text", required: true }
    ],
    description: "רשימת הערים במערכת. משמשת אירועים, אצטדיונים ותמחור."
  },
  {
    key: "stadiums",
    label: "אצטדיונים",
    table: "stadiums",
    primaryKey: "id",
    defaultSort: { column: "name", ascending: true },
    searchFields: ["name", "city_name"],
    columns: [
      { key: "id", label: "מזהה", type: "readonly" },
      { key: "name", label: "שם אצטדיון", type: "text", required: true },
      { key: "city_id", label: "עיר", type: "select_city", required: false }
    ],
    description: "אצטדיונים למשחקי כדורגל."
  },
  {
    key: "leagues",
    label: "ליגות",
    table: "leagues",
    primaryKey: "id",
    defaultSort: { column: "name", ascending: true },
    searchFields: ["name"],
    columns: [
      { key: "id", label: "מזהה", type: "readonly" },
      { key: "name", label: "שם ליגה", type: "text", required: true }
    ],
    description: "טבלת מסגרות / ליגות של משחקים."
  },
  {
    key: "teams",
    label: "קבוצות",
    table: "teams",
    primaryKey: "id",
    defaultSort: { column: "name", ascending: true },
    searchFields: ["name", "league_name"],
    columns: [
      { key: "id", label: "מזהה", type: "readonly" },
      { key: "name", label: "שם קבוצה", type: "text", required: true },
      { key: "league_id", label: "ליגה", type: "select_league", required: false }
    ],
    description: "קבוצות כדורגל המחוברות לליגות."
  },
  {
    key: "contractors",
    label: "קבלנים",
    table: "contractors",
    primaryKey: "id",
    defaultSort: { column: "company_name", ascending: true },
    searchFields: ["company_name", "phone", "email"],
    columns: [
      { key: "id", label: "מזהה", type: "readonly" },
      { key: "company_name", label: "שם חברה", type: "text", required: true },
      { key: "phone", label: "טלפון", type: "text", required: true },
      { key: "email", label: "אימייל", type: "email", required: false }
    ],
    description: "קבלני האבטחה של המערכת."
  },
  {
    key: "users",
    label: "משתמשים",
    table: "users",
    primaryKey: "id",
    defaultSort: { column: "created_at", ascending: false },
    searchFields: ["full_name", "username", "phone", "role"],
    columns: [
      { key: "id", label: "מזהה", type: "readonly" },
      { key: "full_name", label: "שם מלא", type: "text", required: true },
      { key: "username", label: "שם משתמש", type: "text", required: true },
      { key: "phone", label: "טלפון", type: "text", required: false },
      { key: "role", label: "תפקיד", type: "select_role", required: true },
      { key: "contractor_id", label: "קבלן", type: "select_contractor", required: false },
      { key: "is_active", label: "פעיל", type: "boolean", required: false }
    ],
    description: "משתמשי המערכת - מנהלים וקבלנים."
  }
];

const els = {
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  refreshSystemTablesBtn: document.getElementById("refreshSystemTablesBtn"),
  openAddRecordBtnHero: document.getElementById("openAddRecordBtnHero"),
  openAddRecordBtnFilters: document.getElementById("openAddRecordBtnFilters"),
  openAddRecordBtnSide: document.getElementById("openAddRecordBtnSide"),
  refreshRowsBtnSide: document.getElementById("refreshRowsBtnSide"),

  systemTablesMessageBox: document.getElementById("systemTablesMessageBox"),

  kpiActiveTable: document.getElementById("kpiActiveTable"),
  kpiActiveTableSub: document.getElementById("kpiActiveTableSub"),
  kpiVisibleRows: document.getElementById("kpiVisibleRows"),
  kpiVisibleRowsSub: document.getElementById("kpiVisibleRowsSub"),
  kpiTotalRows: document.getElementById("kpiTotalRows"),
  kpiTotalRowsSub: document.getElementById("kpiTotalRowsSub"),
  kpiMode: document.getElementById("kpiMode"),
  kpiModeSub: document.getElementById("kpiModeSub"),

  tableSearchInput: document.getElementById("tableSearchInput"),
  tableSearchDropdown: document.getElementById("tableSearchDropdown"),
  activeTableSelect: document.getElementById("activeTableSelect"),
  rowSearchInput: document.getElementById("rowSearchInput"),
  clearSystemTableFiltersBtn: document.getElementById("clearSystemTableFiltersBtn"),

  activeTableTitle: document.getElementById("activeTableTitle"),
  activeTableDescription: document.getElementById("activeTableDescription"),
  systemTableHead: document.getElementById("systemTableHead"),
  systemTableBody: document.getElementById("systemTableBody"),
  systemTablesQuickList: document.getElementById("systemTablesQuickList"),

  recordModal: document.getElementById("recordModal"),
  recordModalBackdrop: document.getElementById("recordModalBackdrop"),
  closeRecordModalBtn: document.getElementById("closeRecordModalBtn"),
  cancelRecordModalBtn: document.getElementById("cancelRecordModalBtn"),
  recordModalTitle: document.getElementById("recordModalTitle"),
  recordModalSubtitle: document.getElementById("recordModalSubtitle"),
  recordModalMessageBox: document.getElementById("recordModalMessageBox"),
  recordForm: document.getElementById("recordForm"),
  recordPrimaryValue: document.getElementById("recordPrimaryValue"),
  recordFormGrid: document.getElementById("recordFormGrid"),
  saveRecordBtn: document.getElementById("saveRecordBtn"),
  deleteRecordBtn: document.getElementById("deleteRecordBtn")
};

const state = {
  currentUser: null,
  activeTableKey: TABLES[0].key,
  rows: [],
  filteredRows: [],
  editingRow: null,
  lookupData: {
    cities: [],
    leagues: [],
    contractors: []
  }
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.currentUser = user;

  populateTableSelect();
  renderTablesQuickList();
  setActiveTable(TABLES[0].key, false);

  await loadLookups();
  await loadActiveTableRows();
}

function bindUi() {
  els.logoutBtn?.addEventListener("click", logout);

  els.openSidebarBtn?.addEventListener("click", () => {
    els.adminSidebar?.classList.add("is-open");
    els.sidebarBackdrop?.classList.add("is-open");
    document.body.classList.add("sidebar-open");
  });

  els.closeSidebarBtn?.addEventListener("click", closeSidebar);
  els.sidebarBackdrop?.addEventListener("click", closeSidebar);

  els.refreshSystemTablesBtn?.addEventListener("click", async () => {
    await loadLookups();
    await loadActiveTableRows();
  });

  els.refreshRowsBtnSide?.addEventListener("click", async () => {
    await loadLookups();
    await loadActiveTableRows();
  });

  [els.openAddRecordBtnHero, els.openAddRecordBtnFilters, els.openAddRecordBtnSide].forEach((btn) => {
    btn?.addEventListener("click", () => openRecordModal());
  });

  els.activeTableSelect?.addEventListener("change", async () => {
    setActiveTable(els.activeTableSelect.value, true);
    await loadActiveTableRows();
  });

  els.rowSearchInput?.addEventListener("input", applyRowFilter);
  els.tableSearchInput?.addEventListener("input", handleTableSearchInput);
  els.tableSearchInput?.addEventListener("focus", handleTableSearchInput);

  document.addEventListener("click", (event) => {
    const insideInput = els.tableSearchInput?.contains(event.target);
    const insideDropdown = els.tableSearchDropdown?.contains(event.target);
    if (!insideInput && !insideDropdown) closeTableDropdown();
  });

  els.clearSystemTableFiltersBtn?.addEventListener("click", async () => {
    if (els.tableSearchInput) els.tableSearchInput.value = "";
    if (els.rowSearchInput) els.rowSearchInput.value = "";
    setActiveTable(TABLES[0].key, true);
    await loadActiveTableRows();
  });

  els.closeRecordModalBtn?.addEventListener("click", closeRecordModal);
  els.cancelRecordModalBtn?.addEventListener("click", closeRecordModal);
  els.recordModalBackdrop?.addEventListener("click", closeRecordModal);
  els.recordForm?.addEventListener("submit", handleSaveRecord);
  els.deleteRecordBtn?.addEventListener("click", handleDeleteRecord);
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function getActiveTableConfig() {
  return TABLES.find((table) => table.key === state.activeTableKey) || TABLES[0];
}

function setActiveTable(tableKey, syncSelect = true) {
  const config = TABLES.find((table) => table.key === tableKey);
  if (!config) return;

  state.activeTableKey = tableKey;

  if (syncSelect && els.activeTableSelect) {
    els.activeTableSelect.value = tableKey;
  }

  if (els.activeTableTitle) els.activeTableTitle.textContent = config.label;
  if (els.activeTableDescription) els.activeTableDescription.textContent = config.description || "";

  renderTablesQuickList();
  updateKpisBase();
}

function populateTableSelect() {
  if (!els.activeTableSelect) return;

  els.activeTableSelect.innerHTML = TABLES.map((table) => `
    <option value="${escapeHtml(table.key)}">${escapeHtml(table.label)}</option>
  `).join("");
}

function renderTablesQuickList() {
  if (!els.systemTablesQuickList) return;

  els.systemTablesQuickList.innerHTML = TABLES.map((table) => `
    <button
      type="button"
      class="system-table-quick-btn ${table.key === state.activeTableKey ? "active" : ""}"
      data-key="${escapeHtml(table.key)}"
    >
      <strong>${escapeHtml(table.label)}</strong>
      <span>${escapeHtml(table.description)}</span>
    </button>
  `).join("");

  els.systemTablesQuickList.querySelectorAll(".system-table-quick-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key || TABLES[0].key;
      setActiveTable(key, true);
      await loadActiveTableRows();
    });
  });
}

function handleTableSearchInput() {
  const term = normalizeText(els.tableSearchInput?.value);
  const filtered = TABLES.filter((table) => {
    if (!term) return true;
    return normalizeText(`${table.label} ${table.table} ${table.description}`).includes(term);
  });

  if (!filtered.length) {
    els.tableSearchDropdown.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>לא נמצאה טבלה</strong>
        <span>נסה לכתוב חלק מהשם.</span>
      </div>
    `;
    els.tableSearchDropdown.classList.add("is-open");
    return;
  }

  els.tableSearchDropdown.innerHTML = filtered.map((table) => `
    <button type="button" class="meteor-autocomplete-item js-table-pick" data-key="${escapeHtml(table.key)}">
      <span class="meteor-autocomplete-main">${escapeHtml(table.label)}</span>
      <span class="meteor-autocomplete-meta">${escapeHtml(table.table)}</span>
    </button>
  `).join("");

  els.tableSearchDropdown.classList.add("is-open");

  els.tableSearchDropdown.querySelectorAll(".js-table-pick").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.key || TABLES[0].key;
      const table = TABLES.find((item) => item.key === key);
      if (els.tableSearchInput) els.tableSearchInput.value = table?.label || "";
      closeTableDropdown();
      setActiveTable(key, true);
      await loadActiveTableRows();
    });
  });
}

function closeTableDropdown() {
  els.tableSearchDropdown?.classList.remove("is-open");
}

async function loadLookups() {
  const [citiesRes, leaguesRes, contractorsRes] = await Promise.all([
    supabase.from("cities").select("city_id, name_he").order("name_he", { ascending: true }),
    supabase.from("leagues").select("id, name").order("name", { ascending: true }),
    supabase.from("contractors").select("id, company_name").order("company_name", { ascending: true })
  ]);

  state.lookupData.cities = citiesRes.data || [];
  state.lookupData.leagues = leaguesRes.data || [];
  state.lookupData.contractors = contractorsRes.data || [];
}

async function loadActiveTableRows() {
  clearPageMessage();

  const config = getActiveTableConfig();

  let query = supabase.from(config.table).select("*");

  if (config.defaultSort?.column) {
    query = query.order(config.defaultSort.column, { ascending: config.defaultSort.ascending !== false });
  }

  const { data, error } = await query;

  if (error) {
    console.error("loadActiveTableRows error:", error);
    state.rows = [];
    state.filteredRows = [];
    showPageMessage(`שגיאה בטעינת הטבלה ${config.label}.`, "error");
    renderRows();
    updateKpisBase();
    return;
  }

  state.rows = enrichRows(config, data || []);
  state.filteredRows = [...state.rows];

  applyRowFilter();
}

function enrichRows(config, rows) {
  if (config.key === "stadiums") {
    return rows.map((row) => ({
      ...row,
      city_name: getCityName(row.city_id)
    }));
  }

  if (config.key === "teams") {
    return rows.map((row) => ({
      ...row,
      league_name: getLeagueName(row.league_id)
    }));
  }

  if (config.key === "users") {
    return rows.map((row) => ({
      ...row,
      contractor_name: getContractorName(row.contractor_id)
    }));
  }

  return rows;
}

function applyRowFilter() {
  const config = getActiveTableConfig();
  const term = normalizeText(els.rowSearchInput?.value);

  state.filteredRows = state.rows.filter((row) => {
    if (!term) return true;
    const searchable = config.searchFields
      .map((field) => row[field])
      .filter(Boolean)
      .join(" ");
    return normalizeText(searchable).includes(term);
  });

  renderRows();
  updateKpisBase();
}

function renderRows() {
  const config = getActiveTableConfig();

  renderTableHead(config);

  if (!state.filteredRows.length) {
    els.systemTableBody.innerHTML = emptyState(
      "לא נמצאו רשומות",
      "נסה לשנות את החיפוש או להוסיף רשומה חדשה."
    );
    return;
  }

  els.systemTableBody.innerHTML = state.filteredRows.map((row) => {
    const visibleCols = config.columns.slice(0, 4);
    const metaHtml = visibleCols.map((col) => `
      <div class="system-table-row-cell">
        <span>${escapeHtml(col.label)}</span>
        <strong>${escapeHtml(formatCellValue(config, row, col))}</strong>
      </div>
    `).join("");

    return `
      <article class="system-table-row-card">
        <div class="system-table-row-main">
          <div class="system-table-row-grid">
            ${metaHtml}
          </div>
        </div>

        <div class="system-table-row-actions">
          <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-edit-row" data-id="${escapeHtml(String(row[config.primaryKey]))}">
            עריכה
          </button>
          <button type="button" class="meteor-btn meteor-btn-danger-soft meteor-btn-sm js-delete-row" data-id="${escapeHtml(String(row[config.primaryKey]))}">
            מחיקה
          </button>
        </div>
      </article>
    `;
  }).join("");

  els.systemTableBody.querySelectorAll(".js-edit-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.rows.find((item) => String(item[config.primaryKey]) === String(btn.dataset.id));
      if (row) openRecordModal(row);
    });
  });

  els.systemTableBody.querySelectorAll(".js-delete-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.rows.find((item) => String(item[config.primaryKey]) === String(btn.dataset.id));
      if (row) openRecordModal(row, { deleteOnlyHint: true });
    });
  });
}

function renderTableHead(config) {
  els.systemTableHead.innerHTML = config.columns.map((col) => `
    <div class="system-table-head-cell">${escapeHtml(col.label)}</div>
  `).join("") + `<div class="system-table-head-cell system-table-head-actions">פעולות</div>`;
}

function updateKpisBase() {
  const config = getActiveTableConfig();

  setKpi(els.kpiActiveTable, els.kpiActiveTableSub, config.label, config.table);
  setKpi(
    els.kpiVisibleRows,
    els.kpiVisibleRowsSub,
    state.filteredRows.length,
    state.filteredRows.length ? "רשומות לפי הסינון הנוכחי" : "אין רשומות להצגה"
  );
  setKpi(
    els.kpiTotalRows,
    els.kpiTotalRowsSub,
    state.rows.length,
    state.rows.length ? "סה״כ רשומות בטבלה" : "הטבלה ריקה"
  );
  setKpi(els.kpiMode, els.kpiModeSub, "LIVE", "הוספה / עריכה / מחיקה");
}

function openRecordModal(row = null, options = {}) {
  const config = getActiveTableConfig();
  state.editingRow = row || null;

  clearBox(els.recordModalMessageBox);
  els.recordForm.reset();
  els.recordFormGrid.innerHTML = "";

  const isEdit = Boolean(row);
  const deleteOnlyHint = options.deleteOnlyHint === true;

  els.recordModalTitle.textContent = isEdit ? `עריכת רשומה - ${config.label}` : `הוספת רשומה - ${config.label}`;
  els.recordModalSubtitle.textContent = isEdit
    ? "עדכן את השדות הדרושים ולחץ שמירה."
    : "מלא את השדות הדרושים ולחץ שמירה.";

  els.recordPrimaryValue.value = isEdit ? String(row[config.primaryKey] ?? "") : "";
  els.deleteRecordBtn.style.display = isEdit ? "inline-flex" : "none";

  config.columns.forEach((col) => {
    const fieldHtml = buildFieldHtml(config, col, row);
    if (fieldHtml) {
      els.recordFormGrid.insertAdjacentHTML("beforeend", fieldHtml);
    }
  });

  if (deleteOnlyHint) {
    showBoxMessage(
      els.recordModalMessageBox,
      "למחיקה אפשר להשתמש בכפתור האדום שבתחתית החלון.",
      "warning"
    );
  }

  openModal(els.recordModal, els.recordModalBackdrop);
}

function closeRecordModal() {
  state.editingRow = null;
  els.recordForm.reset();
  els.recordFormGrid.innerHTML = "";
  clearBox(els.recordModalMessageBox);
  closeModal(els.recordModal, els.recordModalBackdrop);
}

function buildFieldHtml(config, col, row) {
  const value = row?.[col.key];

  if (col.type === "readonly") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <input
          class="meteor-input"
          type="text"
          value="${escapeHtml(value ?? "")}"
          readonly
        />
      </div>
    `;
  }

  if (col.type === "select_city") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <select class="meteor-input meteor-select" data-field="${escapeHtml(col.key)}">
          <option value="">ללא בחירה</option>
          ${state.lookupData.cities.map((item) => `
            <option value="${escapeHtml(String(item.city_id))}" ${String(value ?? "") === String(item.city_id) ? "selected" : ""}>
              ${escapeHtml(item.name_he)}
            </option>
          `).join("")}
        </select>
      </div>
    `;
  }

  if (col.type === "select_league") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <select class="meteor-input meteor-select" data-field="${escapeHtml(col.key)}">
          <option value="">ללא בחירה</option>
          ${state.lookupData.leagues.map((item) => `
            <option value="${escapeHtml(String(item.id))}" ${String(value ?? "") === String(item.id) ? "selected" : ""}>
              ${escapeHtml(item.name)}
            </option>
          `).join("")}
        </select>
      </div>
    `;
  }

  if (col.type === "select_contractor") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <select class="meteor-input meteor-select" data-field="${escapeHtml(col.key)}">
          <option value="">ללא בחירה</option>
          ${state.lookupData.contractors.map((item) => `
            <option value="${escapeHtml(String(item.id))}" ${String(value ?? "") === String(item.id) ? "selected" : ""}>
              ${escapeHtml(item.company_name)}
            </option>
          `).join("")}
        </select>
      </div>
    `;
  }

  if (col.type === "select_role") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <select class="meteor-input meteor-select" data-field="${escapeHtml(col.key)}">
          <option value="admin" ${String(value ?? "") === "admin" ? "selected" : ""}>admin</option>
          <option value="contractor" ${String(value ?? "") === "contractor" ? "selected" : ""}>contractor</option>
        </select>
      </div>
    `;
  }

  if (col.type === "boolean") {
    return `
      <div class="meteor-form-group system-table-form-group">
        <label class="meteor-label">${escapeHtml(col.label)}</label>
        <select class="meteor-input meteor-select" data-field="${escapeHtml(col.key)}">
          <option value="true" ${value === true ? "selected" : ""}>כן</option>
          <option value="false" ${value === false ? "selected" : ""}>לא</option>
        </select>
      </div>
    `;
  }

  return `
    <div class="meteor-form-group system-table-form-group">
      <label class="meteor-label">${escapeHtml(col.label)}</label>
      <input
        class="meteor-input"
        data-field="${escapeHtml(col.key)}"
        type="${col.type === "email" ? "email" : "text"}"
        value="${escapeHtml(value ?? "")}"
        ${col.required ? "required" : ""}
      />
    </div>
  `;
}

async function handleSaveRecord(event) {
  event.preventDefault();
  clearBox(els.recordModalMessageBox);

  const config = getActiveTableConfig();
  const isEdit = Boolean(state.editingRow);

  const payload = collectFormPayload(config);
  const validation = validatePayload(config, payload);

  if (!validation.ok) {
    showBoxMessage(els.recordModalMessageBox, validation.reason, "warning");
    return;
  }

  let error = null;

  if (isEdit) {
    ({ error } = await supabase
      .from(config.table)
      .update(payload)
      .eq(config.primaryKey, state.editingRow[config.primaryKey]));
  } else {
    ({ error } = await supabase
      .from(config.table)
      .insert(payload));
  }

  if (error) {
    console.error("handleSaveRecord error:", error);
    showBoxMessage(els.recordModalMessageBox, `לא ניתן לשמור כרגע: ${error.message}`, "error");
    return;
  }

  closeRecordModal();
  showPageMessage(isEdit ? "הרשומה עודכנה בהצלחה." : "הרשומה נוספה בהצלחה.", "success");
  await loadLookups();
  await loadActiveTableRows();
}

async function handleDeleteRecord() {
  clearBox(els.recordModalMessageBox);

  const config = getActiveTableConfig();
  if (!state.editingRow) return;

  const { error } = await supabase
    .from(config.table)
    .delete()
    .eq(config.primaryKey, state.editingRow[config.primaryKey]);

  if (error) {
    console.error("handleDeleteRecord error:", error);
    showBoxMessage(els.recordModalMessageBox, `לא ניתן למחוק כרגע: ${error.message}`, "error");
    return;
  }

  closeRecordModal();
  showPageMessage("הרשומה נמחקה בהצלחה.", "success");
  await loadLookups();
  await loadActiveTableRows();
}

function collectFormPayload(config) {
  const payload = {};

  config.columns.forEach((col) => {
    if (col.type === "readonly") return;

    const el = els.recordFormGrid.querySelector(`[data-field="${col.key}"]`);
    if (!el) return;

    let value = el.value;

    if (col.type === "boolean") {
      payload[col.key] = String(value) === "true";
      return;
    }

    if (col.type.startsWith("select_")) {
      payload[col.key] = value === "" ? null : Number(value);
      return;
    }

    payload[col.key] = String(value || "").trim();
  });

  if (config.key === "users" && payload.role === "admin") {
    payload.contractor_id = null;
  }

  return payload;
}

function validatePayload(config, payload) {
  for (const col of config.columns) {
    if (col.type === "readonly") continue;
    if (!col.required) continue;

    const value = payload[col.key];
    const isEmpty = value === null || value === undefined || value === "";
    if (isEmpty) {
      return { ok: false, reason: `השדה "${col.label}" הוא שדה חובה.` };
    }
  }

  if (config.key === "users") {
    if (payload.role === "contractor" && !payload.contractor_id) {
      return { ok: false, reason: `למשתמש מסוג contractor חייב להיות קבלן משויך.` };
    }
  }

  return { ok: true };
}

function formatCellValue(config, row, col) {
  if (config.key === "stadiums" && col.key === "city_id") {
    return row.city_name || "-";
  }

  if (config.key === "teams" && col.key === "league_id") {
    return row.league_name || "-";
  }

  if (config.key === "users" && col.key === "contractor_id") {
    return row.contractor_name || "-";
  }

  if (config.key === "users" && col.key === "is_active") {
    return row.is_active ? "כן" : "לא";
  }

  return row[col.key] ?? "-";
}

function getCityName(cityId) {
  return state.lookupData.cities.find((item) => Number(item.city_id) === Number(cityId))?.name_he || "";
}

function getLeagueName(leagueId) {
  return state.lookupData.leagues.find((item) => Number(item.id) === Number(leagueId))?.name || "";
}

function getContractorName(contractorId) {
  return state.lookupData.contractors.find((item) => Number(item.id) === Number(contractorId))?.company_name || "";
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

function openModal(modal, backdrop) {
  modal?.classList.add("is-open");
  backdrop?.classList.add("is-open");
  modal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modal, backdrop) {
  modal?.classList.remove("is-open");
  backdrop?.classList.remove("is-open");
  modal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function showPageMessage(message, type = "error") {
  if (!els.systemTablesMessageBox) return;
  els.systemTablesMessageBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.systemTablesMessageBox) els.systemTablesMessageBox.innerHTML = "";
}

function showBoxMessage(boxEl, message, type = "error") {
  if (!boxEl) return;
  boxEl.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearBox(boxEl) {
  if (boxEl) boxEl.innerHTML = "";
}

function emptyState(title, subtitle) {
  return `
    <div class="meteor-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(subtitle)}</span>
    </div>
  `;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}