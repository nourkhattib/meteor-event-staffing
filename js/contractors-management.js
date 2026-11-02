import { supabase } from "./supabase.js";
import { requireAuth, logout } from "./auth.js";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  refreshContractorsBtnTop: document.getElementById("refreshContractorsBtnTop"),
  refreshContractorsBtnHero: document.getElementById("refreshContractorsBtnHero"),

  openCreateContractorBtnHero: document.getElementById("openCreateContractorBtnHero"),
  openCreateContractorBtnFilters: document.getElementById("openCreateContractorBtnFilters"),

  contractorsPageMessageBox: document.getElementById("contractorsPageMessageBox"),

  kpiContractorsCount: document.getElementById("kpiContractorsCount"),
  kpiContractorsCountSub: document.getElementById("kpiContractorsCountSub"),
  kpiActiveUsersCount: document.getElementById("kpiActiveUsersCount"),
  kpiActiveUsersCountSub: document.getElementById("kpiActiveUsersCountSub"),
  kpiReadyReportsCount: document.getElementById("kpiReadyReportsCount"),
  kpiReadyReportsCountSub: document.getElementById("kpiReadyReportsCountSub"),
  kpiBlockedReportsCount: document.getElementById("kpiBlockedReportsCount"),
  kpiBlockedReportsCountSub: document.getElementById("kpiBlockedReportsCountSub"),

  contractorsSearchInput: document.getElementById("contractorsSearchInput"),
  userStatusFilter: document.getElementById("userStatusFilter"),
  reportStatusFilter: document.getElementById("reportStatusFilter"),
  clearContractorsFiltersBtn: document.getElementById("clearContractorsFiltersBtn"),

  contractorsSummaryText: document.getElementById("contractorsSummaryText"),
  contractorsTableBody: document.getElementById("contractorsTableBody"),

  contractorModal: document.getElementById("contractorModal"),
  contractorModalBackdrop: document.getElementById("contractorModalBackdrop"),
  closeContractorModalBtn: document.getElementById("closeContractorModalBtn"),
  cancelContractorModalBtn: document.getElementById("cancelContractorModalBtn"),
  contractorModalTitle: document.getElementById("contractorModalTitle"),
  contractorModalSubtitle: document.getElementById("contractorModalSubtitle"),
  contractorModalMessageBox: document.getElementById("contractorModalMessageBox"),
  contractorForm: document.getElementById("contractorForm"),
  contractorId: document.getElementById("contractorId"),
  contractorUserId: document.getElementById("contractorUserId"),
  contractorCompanyNameInput: document.getElementById("contractorCompanyNameInput"),
  contractorPhoneInput: document.getElementById("contractorPhoneInput"),
  contractorEmailInput: document.getElementById("contractorEmailInput"),
  contractorFullNameInput: document.getElementById("contractorFullNameInput"),
  contractorUsernameInput: document.getElementById("contractorUsernameInput"),
  contractorPasswordInput: document.getElementById("contractorPasswordInput"),
  contractorUserStatusInput: document.getElementById("contractorUserStatusInput"),
  deleteContractorBtn: document.getElementById("deleteContractorBtn"),

  reportStatusModal: document.getElementById("reportStatusModal"),
  reportStatusModalBackdrop: document.getElementById("reportStatusModalBackdrop"),
  closeReportStatusModalBtn: document.getElementById("closeReportStatusModalBtn"),
  closeReportStatusModalFooterBtn: document.getElementById("closeReportStatusModalFooterBtn"),
  reportStatusModalTitle: document.getElementById("reportStatusModalTitle"),
  reportStatusModalSubtitle: document.getElementById("reportStatusModalSubtitle"),
  reportStatusMessageBox: document.getElementById("reportStatusMessageBox"),
  reportStatusMissingPricesList: document.getElementById("reportStatusMissingPricesList"),
  confirmGeneratePdfBtn: document.getElementById("confirmGeneratePdfBtn")
};

const state = {
  currentUser: null,
  contractors: [],
  users: [],
  filteredRows: [],
  monthlyChecks: new Map(),
  selectedContractorForReport: null,
  selectedReportCheck: null
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.currentUser = user;
  await loadPageData();
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

  [els.refreshContractorsBtnTop, els.refreshContractorsBtnHero].forEach((btn) => {
    btn?.addEventListener("click", loadPageData);
  });

  [els.openCreateContractorBtnHero, els.openCreateContractorBtnFilters].forEach((btn) => {
    btn?.addEventListener("click", () => openContractorModal());
  });

  els.contractorsSearchInput?.addEventListener("input", applyFilters);
  els.userStatusFilter?.addEventListener("change", applyFilters);
  els.reportStatusFilter?.addEventListener("change", applyFilters);

  els.clearContractorsFiltersBtn?.addEventListener("click", () => {
    if (els.contractorsSearchInput) els.contractorsSearchInput.value = "";
    if (els.userStatusFilter) els.userStatusFilter.value = "all";
    if (els.reportStatusFilter) els.reportStatusFilter.value = "all";
    applyFilters();
  });

  els.closeContractorModalBtn?.addEventListener("click", closeContractorModal);
  els.cancelContractorModalBtn?.addEventListener("click", closeContractorModal);
  els.contractorModalBackdrop?.addEventListener("click", closeContractorModal);
  els.contractorForm?.addEventListener("submit", handleSaveContractor);
  els.deleteContractorBtn?.addEventListener("click", handleDeleteContractor);

  els.closeReportStatusModalBtn?.addEventListener("click", closeReportStatusModal);
  els.closeReportStatusModalFooterBtn?.addEventListener("click", closeReportStatusModal);
  els.reportStatusModalBackdrop?.addEventListener("click", closeReportStatusModal);
  els.confirmGeneratePdfBtn?.addEventListener("click", handleGeneratePdfConfirmed);
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

async function loadPageData() {
  clearPageMessage();

  if (els.contractorsTableBody) {
    els.contractorsTableBody.innerHTML = emptyState("טוען קבלנים...", "רק רגע.");
  }

  await Promise.all([loadContractors(), loadUsers()]);
  await evaluateMonthlyChecks();
  applyFilters();
}

async function loadContractors() {
  const { data, error } = await supabase
    .from("contractors")
    .select("id, company_name, phone, email")
    .order("company_name", { ascending: true });

  if (error) {
    console.error("loadContractors error:", error);
    state.contractors = [];
    showPageMessage("שגיאה בטעינת הקבלנים.", "error");
    return;
  }

  state.contractors = data || [];
}

async function loadUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, contractor_id, full_name, username, phone, role, is_active")
    .eq("role", "contractor")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("loadUsers error:", error);
    state.users = [];
    showPageMessage("שגיאה בטעינת משתמשי הקבלנים.", "error");
    return;
  }

  state.users = data || [];
}

async function evaluateMonthlyChecks() {
  state.monthlyChecks = new Map();

  if (!state.contractors.length) return;

  const [monthStart, monthEnd] = getCurrentMonthRange();

  const { data: assignments, error: assignmentsError } = await supabase
    .from("contractor_assignments")
    .select(`
      id,
      contractor_id,
      event_id,
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      signature_status,
      pricing_override_enabled,
      override_pricing_mode,
      override_price_worker,
      override_price_certified,
      override_price_commander,
      override_price_early_worker,
      override_hourly_worker,
      override_hourly_certified,
      override_hourly_commander,
      override_hourly_early_worker,
      contractor_signed_at,
      events:event_id (
        id,
        event_date,
        event_type,
        event_name,
        competition_type,
        manual_location,
        city_id,
        stadium_id,
        cities:city_id (
          city_id,
          name_he
        ),
        stadiums:stadium_id (
          id,
          name
        ),
        home_team:home_team_id (
          id,
          name
        ),
        away_team:away_team_id (
          id,
          name
        )
      )
    `)
    .eq("signature_status", "signed")
    .gte("events.event_date", monthStart)
    .lt("events.event_date", monthEnd);

  if (assignmentsError) {
    console.error("evaluateMonthlyChecks assignments error:", assignmentsError);
    for (const contractor of state.contractors) {
      state.monthlyChecks.set(contractor.id, emptyCheck());
    }
    return;
  }

  const assignmentsByContractor = new Map();
  for (const row of assignments || []) {
    const list = assignmentsByContractor.get(row.contractor_id) || [];
    list.push(row);
    assignmentsByContractor.set(row.contractor_id, list);
  }

  const { data: prices, error: pricesError } = await supabase
    .from("contractor_prices")
    .select(`
      id,
      contractor_id,
      event_type,
      stadium_id,
      city_id,
      pricing_mode,
      price_worker,
      price_certified,
      price_commander,
      price_early_worker,
      hourly_worker,
      hourly_certified,
      hourly_commander,
      hourly_early_worker
    `);

  if (pricesError) {
    console.error("evaluateMonthlyChecks prices error:", pricesError);
  }

  const pricesRows = prices || [];

  for (const contractor of state.contractors) {
    const contractorAssignments = assignmentsByContractor.get(contractor.id) || [];
    const check = buildMonthlyCheck(contractorAssignments, pricesRows);
    state.monthlyChecks.set(contractor.id, check);
  }
}

function buildMonthlyCheck(assignments, pricesRows) {
  const result = {
    hasData: assignments.length > 0,
    isReady: false,
    isBlocked: false,
    totalAmount: 0,
    missingRows: [],
    computedRows: []
  };

  if (!assignments.length) return result;

  for (const assignment of assignments) {
    const event = assignment.events || {};
    const resolved = resolvePricingForAssignment(assignment, pricesRows);
    const actualCounts = {
      workers: toNumber(assignment.actual_workers),
      certified: toNumber(assignment.actual_certified),
      commanders: toNumber(assignment.actual_commanders),
      early: toNumber(assignment.actual_early_workers)
    };

    const computedRow = {
      assignment,
      event,
      title: getEventDisplayTitle(event),
      location: getEventLocation(event),
      counts: actualCounts,
      totalAmount: 0,
      missingReason: "",
      pricingModeLabel: "",
      pricingSource: ""
    };

    if (!resolved.ok) {
      computedRow.missingReason = resolved.reason;
      computedRow.pricingModeLabel = resolved.modeLabel || "לא מוגדר";
      computedRow.pricingSource = resolved.sourceLabel || "לא נמצא";
      result.missingRows.push(computedRow);
      result.computedRows.push(computedRow);
      continue;
    }

    const amount = calculateAssignmentAmount(actualCounts, resolved.priceSet);

    computedRow.totalAmount = amount;
    computedRow.pricingModeLabel = getPricingModeLabel(resolved.priceSet.pricing_mode);
    computedRow.pricingSource = resolved.sourceLabel;

    result.totalAmount += amount;
    result.computedRows.push(computedRow);
  }

  result.isBlocked = result.missingRows.length > 0;
  result.isReady = result.hasData && !result.isBlocked;

  return result;
}

function resolvePricingForAssignment(assignment, pricesRows) {
  if (assignment.pricing_override_enabled) {
    const mode = assignment.override_pricing_mode || "";
    if (!mode) {
      return {
        ok: false,
        reason: "מופעלת עקיפת מחיר אבל מצב התמחור לא הוגדר.",
        modeLabel: "לא מוגדר",
        sourceLabel: "מחיר חריג בשיבוץ"
      };
    }

    const overrideSet = {
      pricing_mode: mode,
      price_worker: toNumber(assignment.override_price_worker),
      price_certified: toNumber(assignment.override_price_certified),
      price_commander: toNumber(assignment.override_price_commander),
      price_early_worker: toNumber(assignment.override_price_early_worker),
      hourly_worker: toNumber(assignment.override_hourly_worker),
      hourly_certified: toNumber(assignment.override_hourly_certified),
      hourly_commander: toNumber(assignment.override_hourly_commander),
      hourly_early_worker: toNumber(assignment.override_hourly_early_worker)
    };

    const validation = validatePriceSet(overrideSet);
    if (!validation.ok) {
      return {
        ok: false,
        reason: validation.reason,
        modeLabel: getPricingModeLabel(mode),
        sourceLabel: "מחיר חריג בשיבוץ"
      };
    }

    return {
      ok: true,
      priceSet: overrideSet,
      sourceLabel: "מחיר חריג בשיבוץ"
    };
  }

  const event = assignment.events || {};
  const eventType = event.event_type || "";

  let matched = null;

  if (eventType === "football" && event.stadium_id) {
    matched = pricesRows.find((row) =>
      Number(row.contractor_id) === Number(assignment.contractor_id) &&
      row.event_type === "football" &&
      Number(row.stadium_id) === Number(event.stadium_id)
    );
  } else if (eventType === "event" && event.city_id) {
    matched = pricesRows.find((row) =>
      Number(row.contractor_id) === Number(assignment.contractor_id) &&
      row.event_type === "event" &&
      Number(row.city_id) === Number(event.city_id)
    );
  }

  if (!matched) {
    return {
      ok: false,
      reason: eventType === "football"
        ? "לא נמצא מחיר ברירת מחדל לאצטדיון זה."
        : "לא נמצא מחיר ברירת מחדל לעיר זו.",
      modeLabel: "לא מוגדר",
      sourceLabel: "מחיר ברירת מחדל"
    };
  }

  const validation = validatePriceSet(matched);
  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
      modeLabel: getPricingModeLabel(matched.pricing_mode),
      sourceLabel: "מחיר ברירת מחדל"
    };
  }

  return {
    ok: true,
    priceSet: matched,
    sourceLabel: "מחיר ברירת מחדל"
  };
}

function validatePriceSet(priceSet) {
  const mode = priceSet.pricing_mode;

  if (!mode) {
    return { ok: false, reason: "לא הוגדר מצב תמחור." };
  }

  if (mode === "daily") {
    if (
      toNumber(priceSet.price_worker) <= 0 &&
      toNumber(priceSet.price_certified) <= 0 &&
      toNumber(priceSet.price_commander) <= 0 &&
      toNumber(priceSet.price_early_worker) <= 0
    ) {
      return { ok: false, reason: "במחיר יומי חייב להיות לפחות מחיר אחד גדול מ-0." };
    }
  }

  if (mode === "hourly") {
    if (
      toNumber(priceSet.hourly_worker) <= 0 &&
      toNumber(priceSet.hourly_certified) <= 0 &&
      toNumber(priceSet.hourly_commander) <= 0 &&
      toNumber(priceSet.hourly_early_worker) <= 0
    ) {
      return { ok: false, reason: "במחיר שעתי חייב להיות לפחות מחיר אחד גדול מ-0." };
    }
  }

  if (mode === "mixed") {
    const hasDaily =
      toNumber(priceSet.price_worker) > 0 ||
      toNumber(priceSet.price_certified) > 0 ||
      toNumber(priceSet.price_commander) > 0 ||
      toNumber(priceSet.price_early_worker) > 0;

    const hasHourly =
      toNumber(priceSet.hourly_worker) > 0 ||
      toNumber(priceSet.hourly_certified) > 0 ||
      toNumber(priceSet.hourly_commander) > 0 ||
      toNumber(priceSet.hourly_early_worker) > 0;

    if (!hasDaily || !hasHourly) {
      return { ok: false, reason: "במחיר משולב חייבים גם מחירים יומיים וגם שעתיים." };
    }
  }

  return { ok: true };
}

function calculateAssignmentAmount(counts, priceSet) {
  const mode = priceSet.pricing_mode;

  if (mode === "daily") {
    return round2(
      counts.workers * toNumber(priceSet.price_worker) +
      counts.certified * toNumber(priceSet.price_certified) +
      counts.commanders * toNumber(priceSet.price_commander) +
      counts.early * toNumber(priceSet.price_early_worker)
    );
  }

  if (mode === "hourly") {
    return round2(
      counts.workers * toNumber(priceSet.hourly_worker) +
      counts.certified * toNumber(priceSet.hourly_certified) +
      counts.commanders * toNumber(priceSet.hourly_commander) +
      counts.early * toNumber(priceSet.hourly_early_worker)
    );
  }

  if (mode === "mixed") {
    return round2(
      counts.workers * toNumber(priceSet.price_worker) +
      counts.certified * toNumber(priceSet.price_certified) +
      counts.commanders * toNumber(priceSet.price_commander) +
      counts.early * toNumber(priceSet.hourly_early_worker)
    );
  }

  return 0;
}

function applyFilters() {
  const search = normalizeText(els.contractorsSearchInput?.value);
  const userStatus = els.userStatusFilter?.value || "all";
  const reportStatus = els.reportStatusFilter?.value || "all";

  state.filteredRows = state.contractors.filter((contractor) => {
    const user = getUserByContractorId(contractor.id);
    const check = state.monthlyChecks.get(contractor.id) || emptyCheck();

    const haystack = [
      contractor.company_name,
      contractor.phone,
      contractor.email,
      user?.full_name,
      user?.username,
      user?.phone
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (search && !haystack.includes(search)) {
      return false;
    }

    if (userStatus === "active" && (!user || !user.is_active)) return false;
    if (userStatus === "inactive" && (!user || user.is_active)) return false;
    if (userStatus === "no_user" && user) return false;

    if (reportStatus === "ready" && !check.isReady) return false;
    if (reportStatus === "blocked" && !check.isBlocked) return false;
    if (reportStatus === "empty" && check.hasData) return false;

    return true;
  });

  renderKpis();
  renderTable();
}

function renderKpis() {
  const totalContractors = state.contractors.length;
  const activeUsers = state.users.filter((user) => !!user.is_active).length;
  const readyReports = Array.from(state.monthlyChecks.values()).filter((check) => check.isReady).length;
  const blockedReports = Array.from(state.monthlyChecks.values()).filter((check) => check.isBlocked).length;

  setKpi(
    els.kpiContractorsCount,
    els.kpiContractorsCountSub,
    totalContractors,
    totalContractors ? "קבלנים שמוגדרים במערכת" : "אין קבלנים במערכת"
  );

  setKpi(
    els.kpiActiveUsersCount,
    els.kpiActiveUsersCountSub,
    activeUsers,
    activeUsers ? "משתמשי קבלן פעילים" : "אין משתמשים פעילים"
  );

  setKpi(
    els.kpiReadyReportsCount,
    els.kpiReadyReportsCountSub,
    readyReports,
    readyReports ? "דוחות מוכנים להפקה" : "אין דוחות מוכנים"
  );

  setKpi(
    els.kpiBlockedReportsCount,
    els.kpiBlockedReportsCountSub,
    blockedReports,
    blockedReports ? "דורשים השלמת מחירים" : "אין דוחות חסומים"
  );
}

function renderTable() {
  const total = state.filteredRows.length;

  if (els.contractorsSummaryText) {
    els.contractorsSummaryText.textContent = total
      ? `${total} קבלנים מוצגים כרגע`
      : "לא נמצאו קבלנים לפי הסינון";
  }

  if (!total) {
    els.contractorsTableBody.innerHTML = emptyState(
      "לא נמצאו קבלנים",
      "נסה לשנות את החיפוש או הסינון."
    );
    return;
  }

  els.contractorsTableBody.innerHTML = state.filteredRows.map((contractor) => {
    const user = getUserByContractorId(contractor.id);
    const check = state.monthlyChecks.get(contractor.id) || emptyCheck();

    const userStatusHtml = !user
      ? `<span class="meteor-status-badge muted">ללא משתמש</span>`
      : user.is_active
        ? `<span class="meteor-status-badge success">פעיל</span>`
        : `<span class="meteor-status-badge danger">לא פעיל</span>`;

    const reportHtml = !check.hasData
      ? `<span class="meteor-mini-badge muted">ללא נתונים</span>`
      : check.isBlocked
        ? `<span class="meteor-mini-badge danger">חסום - חסר מחיר</span>`
        : `<span class="meteor-mini-badge success">מוכן להפקה</span>`;

    const monthlyAmount = check.isReady ? formatCurrency(check.totalAmount) : "--";

    return `
      <div class="contractors-table-row contractors-table-body-row">
        <div class="contractors-table-main-cell">
          <strong>${escapeHtml(contractor.company_name)}</strong>
          <span>${escapeHtml(contractor.email || "")}</span>
        </div>

        <div>${escapeHtml(contractor.phone || "-")}</div>

        <div>${escapeHtml(user?.full_name || "-")}</div>

        <div>${escapeHtml(user?.username || "-")}</div>

        <div>${userStatusHtml}</div>

        <div>${reportHtml}</div>

        <div><strong>${monthlyAmount}</strong></div>

        <div>
          <div class="meteor-row-actions contractors-row-actions">
            <button
              type="button"
              class="meteor-btn meteor-btn-primary meteor-btn-sm js-open-contractor-view"
              data-id="${contractor.id}"
            >
              כניסה
            </button>

            <button
              type="button"
              class="meteor-btn meteor-btn-outline meteor-btn-sm js-edit-contractor"
              data-id="${contractor.id}"
            >
              עריכה
            </button>

            <button
              type="button"
              class="meteor-btn meteor-btn-outline meteor-btn-sm js-check-report"
              data-id="${contractor.id}"
            >
              דוח חודשי
            </button>

            <button
              type="button"
              class="meteor-btn meteor-btn-danger-soft meteor-btn-sm js-delete-contractor"
              data-id="${contractor.id}"
            >
              מחיקה
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  bindTableActions();
}

function bindTableActions() {
  els.contractorsTableBody.querySelectorAll(".js-open-contractor-view").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const contractorId = Number(btn.dataset.id || 0);

      if (!contractorId || Number.isNaN(contractorId)) {
        showPageMessage("מזהה קבלן חסר או לא תקין.", "warning");
        return;
      }

      try {
        sessionStorage.setItem("meteor_admin_selected_contractor_id", String(contractorId));
      } catch (storageError) {
        console.warn("sessionStorage write failed:", storageError);
      }

      const targetUrl = new URL("./contractor-admin-view.html", window.location.href);
      targetUrl.searchParams.set("contractor_id", String(contractorId));
      targetUrl.hash = `contractor_id=${contractorId}`;

      console.log("Opening contractor admin view:", targetUrl.toString());
      window.location.assign(targetUrl.toString());
    });
  });

  els.contractorsTableBody.querySelectorAll(".js-edit-contractor").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const contractor = buildRowForEdit(btn.dataset.id);
      if (!contractor) return;
      openContractorModal(contractor);
    });
  });

  els.contractorsTableBody.querySelectorAll(".js-delete-contractor").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const contractor = buildRowForEdit(btn.dataset.id);
      if (!contractor) return;
      openContractorModal(contractor);
      showBoxMessage(
        els.contractorModalMessageBox,
        "למחיקה יש להשתמש בכפתור האדום שבתחתית החלון.",
        "warning"
      );
    });
  });

  els.contractorsTableBody.querySelectorAll(".js-check-report").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const contractor = state.contractors.find((c) => String(c.id) === String(btn.dataset.id));
      if (!contractor) return;
      openReportStatusModal(contractor);
    });
  });
}

function getUserByContractorId(contractorId) {
  return state.users.find((user) => Number(user.contractor_id) === Number(contractorId)) || null;
}

function buildRowForEdit(contractorId) {
  const contractor = state.contractors.find((row) => String(row.id) === String(contractorId));
  if (!contractor) return null;

  const user = getUserByContractorId(contractor.id);

  return {
    contractor,
    user
  };
}

function openContractorModal(payload = null) {
  clearBox(els.contractorModalMessageBox);
  els.contractorForm?.reset();

  if (!payload) {
    els.contractorModalTitle.textContent = "קבלן חדש";
    els.contractorModalSubtitle.textContent = "יצירת קבלן חדש ומשתמש גישה.";
    els.contractorId.value = "";
    els.contractorUserId.value = "";
    els.contractorUserStatusInput.value = "active";
    els.deleteContractorBtn.style.display = "none";
    openModal(els.contractorModal, els.contractorModalBackdrop);
    return;
  }

  const contractor = payload.contractor;
  const user = payload.user;

  els.contractorModalTitle.textContent = `עריכת קבלן - ${contractor.company_name}`;
  els.contractorModalSubtitle.textContent = "כאן ניתן לעדכן את פרטי הקבלן ואת פרטי הגישה שלו.";

  els.contractorId.value = contractor.id || "";
  els.contractorUserId.value = user?.id || "";
  els.contractorCompanyNameInput.value = contractor.company_name || "";
  els.contractorPhoneInput.value = contractor.phone || "";
  els.contractorEmailInput.value = contractor.email || "";
  els.contractorFullNameInput.value = user?.full_name || "";
  els.contractorUsernameInput.value = user?.username || "";
  els.contractorPasswordInput.value = "";
  els.contractorUserStatusInput.value = user?.is_active === false ? "inactive" : "active";

  els.deleteContractorBtn.style.display = "inline-flex";
  openModal(els.contractorModal, els.contractorModalBackdrop);
}

function closeContractorModal() {
  closeModal(els.contractorModal, els.contractorModalBackdrop);
  clearBox(els.contractorModalMessageBox);
  els.contractorForm?.reset();
}

async function handleSaveContractor(event) {
  event.preventDefault();
  clearBox(els.contractorModalMessageBox);

  const contractorId = Number(els.contractorId.value || 0);
  const userId = cleanNullable(els.contractorUserId.value);

  const companyName = cleanNullable(els.contractorCompanyNameInput.value);
  const phone = cleanNullable(els.contractorPhoneInput.value);
  const email = cleanNullable(els.contractorEmailInput.value);
  const fullName = cleanNullable(els.contractorFullNameInput.value);
  const username = cleanNullable(els.contractorUsernameInput.value);
  const password = cleanNullable(els.contractorPasswordInput.value);
  const isActive = (els.contractorUserStatusInput.value || "active") === "active";

  if (!companyName) {
    showBoxMessage(els.contractorModalMessageBox, "יש להזין שם קבלן.", "warning");
    return;
  }

  if (!phone) {
    showBoxMessage(els.contractorModalMessageBox, "יש להזין מספר טלפון.", "warning");
    return;
  }

  if (!fullName) {
    showBoxMessage(els.contractorModalMessageBox, "יש להזין שם מלא.", "warning");
    return;
  }

  if (!username) {
    showBoxMessage(els.contractorModalMessageBox, "יש להזין שם משתמש.", "warning");
    return;
  }

  if (!contractorId && !password) {
    showBoxMessage(els.contractorModalMessageBox, "בקבלן חדש חובה להזין סיסמה.", "warning");
    return;
  }

  const duplicateUsername = state.users.find((row) =>
    normalizeText(row.username) === normalizeText(username) &&
    String(row.id) !== String(userId || "")
  );

  if (duplicateUsername) {
    showBoxMessage(els.contractorModalMessageBox, "שם המשתמש כבר קיים במערכת.", "error");
    return;
  }

  if (!contractorId) {
    await createContractor({
      companyName,
      phone,
      email,
      fullName,
      username,
      password,
      isActive
    });
    return;
  }

  await updateContractor({
    contractorId,
    userId,
    companyName,
    phone,
    email,
    fullName,
    username,
    password,
    isActive
  });
}

async function createContractor(payload) {
  const contractorInsert = await supabase
    .from("contractors")
    .insert({
      company_name: payload.companyName,
      phone: payload.phone,
      email: payload.email
    })
    .select("id")
    .single();

  if (contractorInsert.error || !contractorInsert.data) {
    console.error("createContractor contractorInsert error:", contractorInsert.error);
    showBoxMessage(els.contractorModalMessageBox, "לא ניתן ליצור קבלן כרגע.", "error");
    return;
  }

  const newContractorId = contractorInsert.data.id;

  const userInsert = await supabase
    .from("users")
    .insert({
      full_name: payload.fullName,
      phone: payload.phone,
      username: payload.username,
      password_hash: payload.password,
      role: "contractor",
      contractor_id: newContractorId,
      is_active: payload.isActive
    })
    .select("id")
    .single();

  if (userInsert.error) {
    console.error("createContractor userInsert error:", userInsert.error);
    showBoxMessage(
      els.contractorModalMessageBox,
      "הקבלן נוצר אבל משתמש הגישה לא נוצר. בדוק הרשאות מסד או שדות חובה.",
      "error"
    );
    return;
  }

  closeContractorModal();
  showPageMessage("הקבלן נוצר בהצלחה.", "success");
  await loadPageData();
}

async function updateContractor(payload) {
  const contractorUpdate = await supabase
    .from("contractors")
    .update({
      company_name: payload.companyName,
      phone: payload.phone,
      email: payload.email
    })
    .eq("id", payload.contractorId);

  if (contractorUpdate.error) {
    console.error("updateContractor contractorUpdate error:", contractorUpdate.error);
    showBoxMessage(els.contractorModalMessageBox, "לא ניתן לעדכן את פרטי הקבלן.", "error");
    return;
  }

  if (payload.userId) {
    const userPayload = {
      full_name: payload.fullName,
      phone: payload.phone,
      username: payload.username,
      is_active: payload.isActive,
      updated_at: new Date().toISOString()
    };

    if (payload.password) {
      userPayload.password_hash = payload.password;
    }

    const userUpdate = await supabase
      .from("users")
      .update(userPayload)
      .eq("id", payload.userId);

    if (userUpdate.error) {
      console.error("updateContractor userUpdate error:", userUpdate.error);
      showBoxMessage(els.contractorModalMessageBox, "לא ניתן לעדכן את משתמש הקבלן.", "error");
      return;
    }
  } else {
    const userInsert = await supabase
      .from("users")
      .insert({
        full_name: payload.fullName,
        phone: payload.phone,
        username: payload.username,
        password_hash: payload.password || "123456",
        role: "contractor",
        contractor_id: payload.contractorId,
        is_active: payload.isActive
      })
      .select("id")
      .single();

    if (userInsert.error) {
      console.error("updateContractor missing userInsert error:", userInsert.error);
      showBoxMessage(
        els.contractorModalMessageBox,
        "פרטי הקבלן עודכנו, אבל לא ניתן היה ליצור משתמש חדש.",
        "warning"
      );
      return;
    }
  }

  closeContractorModal();
  showPageMessage("פרטי הקבלן עודכנו בהצלחה.", "success");
  await loadPageData();
}

async function handleDeleteContractor() {
  const contractorId = Number(els.contractorId.value || 0);
  const userId = cleanNullable(els.contractorUserId.value);
  const contractorName = els.contractorCompanyNameInput.value.trim() || "הקבלן";

  if (!contractorId) return;

  const confirmed = window.confirm(`למחוק את "${contractorName}"?`);
  if (!confirmed) return;

  if (userId) {
    const userDelete = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (userDelete.error) {
      console.error("handleDeleteContractor userDelete error:", userDelete.error);
    }
  }

  const contractorDelete = await supabase
    .from("contractors")
    .delete()
    .eq("id", contractorId);

  if (contractorDelete.error) {
    console.error("handleDeleteContractor contractorDelete error:", contractorDelete.error);
    showBoxMessage(
      els.contractorModalMessageBox,
      "לא ניתן למחוק את הקבלן. כנראה שיש נתונים מקושרים במסד.",
      "error"
    );
    return;
  }

  closeContractorModal();
  showPageMessage("הקבלן נמחק בהצלחה.", "success");
  await loadPageData();
}

function openReportStatusModal(contractor) {
  const check = state.monthlyChecks.get(contractor.id) || emptyCheck();
  state.selectedContractorForReport = contractor;
  state.selectedReportCheck = check;

  els.reportStatusModalTitle.textContent = `מצב דוח חודשי - ${contractor.company_name}`;
  els.reportStatusModalSubtitle.textContent = `בדיקה עבור חודש ${getCurrentMonthLabel()}`;

  renderReportModal(contractor, check);
  openModal(els.reportStatusModal, els.reportStatusModalBackdrop);
}

function renderReportModal(contractor, check) {
  clearBox(els.reportStatusMessageBox);

  if (!check.hasData) {
    showBoxMessage(
      els.reportStatusMessageBox,
      "אין אירועים חתומים החודש עבור קבלן זה.",
      "warning"
    );
    els.confirmGeneratePdfBtn.disabled = true;
    els.reportStatusMissingPricesList.innerHTML = emptyState(
      "אין נתונים",
      "רק אירועים חתומים נכנסים לדוח החודשי."
    );
    return;
  }

  if (check.isBlocked) {
    showBoxMessage(
      els.reportStatusMessageBox,
      "לא ניתן להפיק את הדוח. יש אירועים חתומים שחסרים בהם מחירים.",
      "warning"
    );
    els.confirmGeneratePdfBtn.disabled = true;

    els.reportStatusMissingPricesList.innerHTML = check.missingRows.map((row) => `
      <article class="meteor-event-card contractor-monthly-card is-missing-price">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <div class="meteor-event-card-badges">
              <span class="meteor-mini-badge danger">חסר מחיר</span>
              <span class="meteor-mini-badge muted">${escapeHtml(row.pricingSource)}</span>
            </div>

            <h3>${escapeHtml(row.title)}</h3>

            <div class="meteor-event-meta-grid">
              <div class="meteor-event-meta-item">
                <span>תאריך</span>
                <strong>${formatDate(row.event?.event_date)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מיקום</span>
                <strong>${escapeHtml(row.location)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מצב תמחור</span>
                <strong>${escapeHtml(row.pricingModeLabel)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>סיבה</span>
                <strong>${escapeHtml(row.missingReason)}</strong>
              </div>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    return;
  }

  showBoxMessage(
    els.reportStatusMessageBox,
    `הדוח תקין להפקה. סך כולל לחודש: ${formatCurrency(check.totalAmount)}.`,
    "success"
  );

  els.confirmGeneratePdfBtn.disabled = false;

  els.reportStatusMissingPricesList.innerHTML = `
    <div class="meteor-empty-state">
      <strong>הדוח מוכן להפקה</strong>
      <span>לא נמצאו אירועים שחסר בהם מחיר. ניתן להפיק PDF למחלקת חשבונות.</span>
    </div>
  `;
}

function closeReportStatusModal() {
  closeModal(els.reportStatusModal, els.reportStatusModalBackdrop);
}

function handleGeneratePdfConfirmed() {
  if (!state.selectedContractorForReport || !state.selectedReportCheck || !state.selectedReportCheck.isReady) {
    return;
  }

  generateMonthlyPdf(state.selectedContractorForReport, state.selectedReportCheck);
}

function generateMonthlyPdf(contractor, check) {
  const rows = check.computedRows || [];
  const monthLabel = getCurrentMonthLabel();

  const html = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>דוח חודשי - ${escapeHtml(contractor.company_name)}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          padding: 24px;
          color: #111827;
        }
        h1, h2 {
          margin: 0 0 12px;
        }
        .top {
          border-bottom: 2px solid #d1d5db;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .box {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 12px;
          background: #f9fafb;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 10px;
          text-align: right;
          vertical-align: top;
        }
        th {
          background: #f3f4f6;
        }
        tfoot td {
          font-weight: bold;
          background: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="top">
        <h1>מטאור אבטחה - פירוט חודשי לקבלן</h1>
        <h2>${escapeHtml(contractor.company_name)}</h2>

        <div class="meta">
          <div class="box"><strong>טלפון</strong><div>${escapeHtml(contractor.phone || "-")}</div></div>
          <div class="box"><strong>חודש</strong><div>${escapeHtml(monthLabel)}</div></div>
          <div class="box"><strong>סה"כ לתשלום</strong><div>${escapeHtml(formatCurrency(check.totalAmount))}</div></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>אירוע</th>
            <th>תאריך</th>
            <th>מיקום</th>
            <th>דיילים</th>
            <th>בעלי תעודה</th>
            <th>מפקדים</th>
            <th>כוח מקדים</th>
            <th>תמחור</th>
            <th>סה"כ</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(row.title)}</td>
              <td>${escapeHtml(formatDate(row.event?.event_date))}</td>
              <td>${escapeHtml(row.location)}</td>
              <td>${row.counts.workers}</td>
              <td>${row.counts.certified}</td>
              <td>${row.counts.commanders}</td>
              <td>${row.counts.early}</td>
              <td>${escapeHtml(row.pricingModeLabel)} / ${escapeHtml(row.pricingSource)}</td>
              <td>${escapeHtml(formatCurrency(row.totalAmount))}</td>
            </tr>
          `).join("")}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="9">סה"כ לחודש</td>
            <td>${escapeHtml(formatCurrency(check.totalAmount))}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=1200,height=900");
  if (!printWindow) {
    showPageMessage("הדפדפן חסם חלון הדפסה. יש לאפשר pop-up ולנסות שוב.", "warning");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 400);

  closeReportStatusModal();
}

function getEventDisplayTitle(event) {
  if (!event) return "אירוע";

  if (event.event_type === "football") {
    const home = event.home_team?.name || "מארחת";
    const away = event.away_team?.name || "אורחת";
    return `${home} - ${away}`;
  }

  return event.event_name || "אירוע";
}

function getEventLocation(event) {
  if (!event) return "-";

  if (event.event_type === "football") {
    return event.stadiums?.name || event.cities?.name_he || "-";
  }

  return event.manual_location || event.cities?.name_he || "-";
}

function getPricingModeLabel(mode) {
  switch (mode) {
    case "daily":
      return "יומי";
    case "hourly":
      return "שעתי";
    case "mixed":
      return "משולב";
    default:
      return "לא מוגדר";
  }
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const end = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  return [start, end];
}

function getCurrentMonthLabel() {
  const now = new Date();
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric"
  }).format(new Date(now.getFullYear(), now.getMonth(), 1));
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

function showPageMessage(message, type = "error") {
  if (!els.contractorsPageMessageBox) return;
  els.contractorsPageMessageBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.contractorsPageMessageBox) els.contractorsPageMessageBox.innerHTML = "";
}

function showBoxMessage(container, message, type = "error") {
  if (!container) return;
  container.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearBox(container) {
  if (container) container.innerHTML = "";
}

function emptyState(title, subtitle) {
  return `
    <div class="meteor-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(subtitle)}</span>
    </div>
  `;
}

function openModal(modal, backdrop) {
  modal?.classList.add("is-open");
  backdrop?.classList.add("is-open");
  document.body.classList.add("modal-open");
}

function closeModal(modal, backdrop) {
  modal?.classList.remove("is-open");
  backdrop?.classList.remove("is-open");
  document.body.classList.remove("modal-open");
}

function emptyCheck() {
  return {
    hasData: false,
    isReady: false,
    isBlocked: false,
    totalAmount: 0,
    missingRows: [],
    computedRows: []
  };
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanNullable(value) {
  const clean = String(value || "").trim();
  return clean ? clean : null;
}

function toNumber(value) {
  return Number(value || 0);
}

function round2(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(dateString);

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}