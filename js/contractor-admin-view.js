import { supabase } from "./supabase.js";
import { requireAuth, logout } from "./auth.js";

const ADMIN_SELECTED_CONTRACTOR_STORAGE_KEY = "meteor_admin_selected_contractor_id";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  contractorPageTitle: document.getElementById("contractorPageTitle"),
  contractorHeroTitle: document.getElementById("contractorHeroTitle"),
  contractorHeroSubtitle: document.getElementById("contractorHeroSubtitle"),
  refreshContractorViewBtn: document.getElementById("refreshContractorViewBtn"),

  openAddPriceBtnHero: document.getElementById("openAddPriceBtnHero"),
  openAddPriceBtnFilters: document.getElementById("openAddPriceBtnFilters"),
  openAddPriceBtnSide: document.getElementById("openAddPriceBtnSide"),
  openAllPricesModalBtn: document.getElementById("openAllPricesModalBtn"),

  generateContractorMonthlyPdfBtnHero: document.getElementById("generateContractorMonthlyPdfBtnHero"),
  generateContractorMonthlyPdfBtnSide: document.getElementById("generateContractorMonthlyPdfBtnSide"),

  contractorViewMessageBox: document.getElementById("contractorViewMessageBox"),

  kpiSignedEventsCount: document.getElementById("kpiSignedEventsCount"),
  kpiSignedEventsCountSub: document.getElementById("kpiSignedEventsCountSub"),
  kpiActualPeopleCount: document.getElementById("kpiActualPeopleCount"),
  kpiActualPeopleCountSub: document.getElementById("kpiActualPeopleCountSub"),
  kpiTotalAmount: document.getElementById("kpiTotalAmount"),
  kpiTotalAmountSub: document.getElementById("kpiTotalAmountSub"),
  kpiBlockedEvents: document.getElementById("kpiBlockedEvents"),
  kpiBlockedEventsSub: document.getElementById("kpiBlockedEventsSub"),

  monthlyFilter: document.getElementById("monthlyFilter"),
  specificDateFilter: document.getElementById("specificDateFilter"),
  searchInput: document.getElementById("searchInput"),
  pricingStateFilter: document.getElementById("pricingStateFilter"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),

  eventsSummaryText: document.getElementById("eventsSummaryText"),
  contractorSignedEventsList: document.getElementById("contractorSignedEventsList"),

  contractorPricingQuickList: document.getElementById("contractorPricingQuickList"),
  contractorMonthlyStatusBox: document.getElementById("contractorMonthlyStatusBox"),
  monthSummaryEvents: document.getElementById("monthSummaryEvents"),
  monthSummaryPeople: document.getElementById("monthSummaryPeople"),
  monthSummaryAmount: document.getElementById("monthSummaryAmount"),

  hoursModal: document.getElementById("hoursModal"),
  hoursModalBackdrop: document.getElementById("hoursModalBackdrop"),
  closeHoursModalBtn: document.getElementById("closeHoursModalBtn"),
  cancelHoursModalBtn: document.getElementById("cancelHoursModalBtn"),
  hoursModalTitle: document.getElementById("hoursModalTitle"),
  hoursModalSubtitle: document.getElementById("hoursModalSubtitle"),
  hoursModalMessageBox: document.getElementById("hoursModalMessageBox"),
  hoursForm: document.getElementById("hoursForm"),
  hoursAssignmentId: document.getElementById("hoursAssignmentId"),
  overrideArrivalTimeInput: document.getElementById("overrideArrivalTimeInput"),
  overrideEndTimeInput: document.getElementById("overrideEndTimeInput"),
  overrideEarlyTimeInput: document.getElementById("overrideEarlyTimeInput"),
  clearHoursOverridesBtn: document.getElementById("clearHoursOverridesBtn"),

  priceModal: document.getElementById("priceModal"),
  priceModalBackdrop: document.getElementById("priceModalBackdrop"),
  closePriceModalBtn: document.getElementById("closePriceModalBtn"),
  cancelPriceModalBtn: document.getElementById("cancelPriceModalBtn"),
  priceModalTitle: document.getElementById("priceModalTitle"),
  priceModalSubtitle: document.getElementById("priceModalSubtitle"),
  priceModalMessageBox: document.getElementById("priceModalMessageBox"),
  priceForm: document.getElementById("priceForm"),
  priceRecordId: document.getElementById("priceRecordId"),
  priceTargetType: document.getElementById("priceTargetType"),
  priceEventType: document.getElementById("priceEventType"),
  priceStadiumWrap: document.getElementById("priceStadiumWrap"),
  priceCityWrap: document.getElementById("priceCityWrap"),
  priceEventWrap: document.getElementById("priceEventWrap"),

  priceStadiumInput: document.getElementById("priceStadiumInput"),
  stadiumsList: document.getElementById("stadiumsList"),

  priceCityInput: document.getElementById("priceCityInput"),
  citiesList: document.getElementById("citiesList"),

  priceEventSelect: document.getElementById("priceEventSelect"),
  priceModeSelect: document.getElementById("priceModeSelect"),

  dailyPricesBox: document.getElementById("dailyPricesBox"),
  hourlyPricesBox: document.getElementById("hourlyPricesBox"),
  dailyEarlyWrap: document.getElementById("dailyEarlyWrap"),
  hourlyWorkerWrap: document.getElementById("hourlyWorkerWrap"),
  hourlyCertifiedWrap: document.getElementById("hourlyCertifiedWrap"),
  hourlyCommanderWrap: document.getElementById("hourlyCommanderWrap"),
  hourlyEarlyWrap: document.getElementById("hourlyEarlyWrap"),

  priceWorkerInput: document.getElementById("priceWorkerInput"),
  priceCertifiedInput: document.getElementById("priceCertifiedInput"),
  priceCommanderInput: document.getElementById("priceCommanderInput"),
  priceEarlyInput: document.getElementById("priceEarlyInput"),
  hourlyWorkerInput: document.getElementById("hourlyWorkerInput"),
  hourlyCertifiedInput: document.getElementById("hourlyCertifiedInput"),
  hourlyCommanderInput: document.getElementById("hourlyCommanderInput"),
  hourlyEarlyInput: document.getElementById("hourlyEarlyInput"),
  deletePriceBtn: document.getElementById("deletePriceBtn"),

  allPricesModal: document.getElementById("allPricesModal"),
  allPricesModalBackdrop: document.getElementById("allPricesModalBackdrop"),
  closeAllPricesModalBtn: document.getElementById("closeAllPricesModalBtn"),
  allPricesSearchInput: document.getElementById("allPricesSearchInput"),
  allPricesTypeFilter: document.getElementById("allPricesTypeFilter"),
  allPricesList: document.getElementById("allPricesList"),

  monthlyReportModal: document.getElementById("monthlyReportModal"),
  monthlyReportModalBackdrop: document.getElementById("monthlyReportModalBackdrop"),
  closeMonthlyReportModalBtn: document.getElementById("closeMonthlyReportModalBtn"),
  closeMonthlyReportModalFooterBtn: document.getElementById("closeMonthlyReportModalFooterBtn"),
  monthlyReportModalTitle: document.getElementById("monthlyReportModalTitle"),
  monthlyReportModalSubtitle: document.getElementById("monthlyReportModalSubtitle"),
  monthlyReportStatusBox: document.getElementById("monthlyReportStatusBox"),
  monthlyReportIssuesList: document.getElementById("monthlyReportIssuesList"),
  confirmGenerateMonthlyPdfBtn: document.getElementById("confirmGenerateMonthlyPdfBtn"),

  signatureViewModal: document.getElementById("signatureViewModal"),
  signatureViewModalBackdrop: document.getElementById("signatureViewModalBackdrop"),
  closeSignatureViewModalBtn: document.getElementById("closeSignatureViewModalBtn"),
  closeSignatureViewModalFooterBtn: document.getElementById("closeSignatureViewModalFooterBtn"),
  signatureViewModalTitle: document.getElementById("signatureViewModalTitle"),
  signatureViewModalSubtitle: document.getElementById("signatureViewModalSubtitle"),
  signatureViewMessageBox: document.getElementById("signatureViewMessageBox"),
  signatureViewImageWrap: document.getElementById("signatureViewImageWrap"),
  signatureViewMeta: document.getElementById("signatureViewMeta")
};

const state = {
  currentUser: null,
  contractorId: null,
  contractor: null,
  contractorUser: null,

  cities: [],
  stadiums: [],
  allEvents: [],

  signedAssignments: [],
  defaultPrices: [],

  computedRows: [],
  filteredRows: [],
  currentMonthTotals: emptyTotals(),
  currentMonthIssues: [],

  editingHoursRow: null,
  editingPriceContext: null,
  selectedSignatureRow: null
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.currentUser = user;

  const contractorIdRaw = getContractorIdFromUrlOrStorage();

  console.log("Current URL:", window.location.href);
  console.log("Search params:", window.location.search);
  console.log("Hash:", window.location.hash);
  console.log("Resolved contractor_id raw:", contractorIdRaw);

  if (!contractorIdRaw) {
    showPageMessage(
      "לא התקבל contractor_id בכתובת המסך וגם לא נמצא גיבוי מהמסך הקודם.",
      "warning"
    );
    return;
  }

  const contractorId = Number(contractorIdRaw);
  if (Number.isNaN(contractorId) || contractorId <= 0) {
    showPageMessage(`מזהה קבלן לא תקין: ${escapeHtml(contractorIdRaw)}`, "warning");
    return;
  }

  state.contractorId = contractorId;
  persistSelectedContractorId(contractorId);

  setDefaultMonth();

  const baseLoaded = await loadBaseData();
  if (!baseLoaded) return;

  await loadScreenData();
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

  els.refreshContractorViewBtn?.addEventListener("click", loadScreenData);

  [els.openAddPriceBtnHero, els.openAddPriceBtnFilters, els.openAddPriceBtnSide].forEach((btn) => {
    btn?.addEventListener("click", () => openPriceModal());
  });

  els.openAllPricesModalBtn?.addEventListener("click", openAllPricesModal);

  [els.generateContractorMonthlyPdfBtnHero, els.generateContractorMonthlyPdfBtnSide].forEach((btn) => {
    btn?.addEventListener("click", openMonthlyReportModal);
  });

  els.monthlyFilter?.addEventListener("change", loadScreenData);
  els.specificDateFilter?.addEventListener("change", applyFiltersAndRender);
  els.searchInput?.addEventListener("input", applyFiltersAndRender);
  els.pricingStateFilter?.addEventListener("change", applyFiltersAndRender);

  els.clearFiltersBtn?.addEventListener("click", () => {
    setDefaultMonth();
    if (els.specificDateFilter) els.specificDateFilter.value = "";
    if (els.searchInput) els.searchInput.value = "";
    if (els.pricingStateFilter) els.pricingStateFilter.value = "all";
    loadScreenData();
  });

  els.closeHoursModalBtn?.addEventListener("click", closeHoursModal);
  els.cancelHoursModalBtn?.addEventListener("click", closeHoursModal);
  els.hoursModalBackdrop?.addEventListener("click", closeHoursModal);
  els.hoursForm?.addEventListener("submit", handleSaveHours);
  els.clearHoursOverridesBtn?.addEventListener("click", handleClearHoursOverrides);

  els.closePriceModalBtn?.addEventListener("click", closePriceModal);
  els.cancelPriceModalBtn?.addEventListener("click", closePriceModal);
  els.priceModalBackdrop?.addEventListener("click", closePriceModal);
  els.priceTargetType?.addEventListener("change", updatePriceTargetVisibility);
  els.priceEventType?.addEventListener("change", updatePriceTargetVisibility);
  els.priceModeSelect?.addEventListener("change", updatePriceModeVisibility);
  els.priceForm?.addEventListener("submit", handleSavePrice);
  els.deletePriceBtn?.addEventListener("click", handleDeletePrice);

  els.closeAllPricesModalBtn?.addEventListener("click", closeAllPricesModal);
  els.allPricesModalBackdrop?.addEventListener("click", closeAllPricesModal);
  els.allPricesSearchInput?.addEventListener("input", renderAllPricesList);
  els.allPricesTypeFilter?.addEventListener("change", renderAllPricesList);

  els.closeMonthlyReportModalBtn?.addEventListener("click", closeMonthlyReportModal);
  els.closeMonthlyReportModalFooterBtn?.addEventListener("click", closeMonthlyReportModal);
  els.monthlyReportModalBackdrop?.addEventListener("click", closeMonthlyReportModal);
  els.confirmGenerateMonthlyPdfBtn?.addEventListener("click", generateMonthlyPdf);

  els.closeSignatureViewModalBtn?.addEventListener("click", closeSignatureViewModal);
  els.closeSignatureViewModalFooterBtn?.addEventListener("click", closeSignatureViewModal);
  els.signatureViewModalBackdrop?.addEventListener("click", closeSignatureViewModal);
}

function getContractorIdFromUrlOrStorage() {
  const params = new URLSearchParams(window.location.search);

  const fromSearch =
    params.get("contractor_id") ||
    params.get("contractorId") ||
    params.get("id") ||
    "";

  if (fromSearch) {
    persistSelectedContractorId(fromSearch);
    return fromSearch;
  }

  const rawHash = String(window.location.hash || "").replace(/^#/, "").trim();
  if (rawHash) {
    const hashParams = new URLSearchParams(rawHash);

    const fromHash =
      hashParams.get("contractor_id") ||
      hashParams.get("contractorId") ||
      hashParams.get("id") ||
      "";

    if (fromHash) {
      persistSelectedContractorId(fromHash);
      return fromHash;
    }

    if (/^\d+$/.test(rawHash)) {
      persistSelectedContractorId(rawHash);
      return rawHash;
    }
  }

  try {
    const fromStorage = sessionStorage.getItem(ADMIN_SELECTED_CONTRACTOR_STORAGE_KEY) || "";
    if (fromStorage) return fromStorage;
  } catch (error) {
    console.warn("sessionStorage read failed:", error);
  }

  return "";
}

function persistSelectedContractorId(value) {
  const clean = String(value || "").trim();
  if (!clean) return;

  try {
    sessionStorage.setItem(ADMIN_SELECTED_CONTRACTOR_STORAGE_KEY, clean);
  } catch (error) {
    console.warn("sessionStorage write failed:", error);
  }
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function setDefaultMonth() {
  const now = new Date();
  if (els.monthlyFilter) {
    els.monthlyFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
}

async function loadBaseData() {
  clearPageMessage();

  const [
    contractorRes,
    userRes,
    citiesRes,
    stadiumsRes,
    eventsRes
  ] = await Promise.all([
    supabase
      .from("contractors")
      .select("id, company_name, phone, email")
      .eq("id", state.contractorId),
    supabase
      .from("users")
      .select("id, contractor_id, full_name, username, phone, is_active")
      .eq("role", "contractor")
      .eq("contractor_id", state.contractorId)
      .limit(1),
    supabase
      .from("cities")
      .select("city_id, name_he")
      .order("name_he", { ascending: true }),
    supabase
      .from("stadiums")
      .select("id, name, city_id")
      .order("name", { ascending: true }),
    supabase
      .from("events")
      .select(`
        id,
        event_date,
        event_type,
        competition_type,
        event_name,
        manual_location,
        city_id,
        stadium_id,
        cities:city_id ( city_id, name_he ),
        stadiums:stadium_id ( id, name ),
        home_team:home_team_id ( id, name ),
        away_team:away_team_id ( id, name )
      `)
      .order("event_date", { ascending: false })
  ]);

  if (contractorRes.error) {
    console.error("loadBaseData contractor error:", contractorRes.error);
    showPageMessage(`שגיאה בטעינת קבלן #${state.contractorId}: ${contractorRes.error.message}`, "error");
    return false;
  }

  const contractorRow = contractorRes.data?.[0] || null;

  if (!contractorRow) {
    showPageMessage(
      `לא נמצאה שורת קבלן עבור contractor_id=${state.contractorId}.`,
      "error"
    );
    return false;
  }

  state.contractor = contractorRow;
  state.contractorUser = userRes.data?.[0] || null;
  state.cities = citiesRes.data || [];
  state.stadiums = stadiumsRes.data || [];
  state.allEvents = eventsRes.data || [];

  hydrateContractorHeader();
  populatePriceLookups();
  return true;
}

async function loadScreenData() {
  if (!state.contractorId) return;

  clearPageMessage();

  const [monthStart, monthEnd] = getMonthRange(els.monthlyFilter?.value);

  const [assignmentsRes, pricesRes] = await Promise.all([
    supabase
      .from("contractor_assignments")
      .select(`
        id,
        event_id,
        contractor_id,
        actual_workers,
        actual_certified,
        actual_commanders,
        actual_early_workers,
        counted_at,
        contractor_signed_at,
        signature_status,
        assignment_status,
        response_status,
        override_arrival_time,
        override_end_time,
        override_early_workers_time,
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
        contractor_signature_note,
        events:event_id (
          id,
          event_date,
          arrival_time,
          end_time,
          early_workers_time,
          event_type,
          competition_type,
          event_name,
          manual_location,
          notes,
          city_id,
          stadium_id,
          cities:city_id ( city_id, name_he ),
          stadiums:stadium_id ( id, name ),
          home_team:home_team_id ( id, name ),
          away_team:away_team_id ( id, name )
        )
      `)
      .eq("contractor_id", state.contractorId)
      .eq("signature_status", "signed")
      .gte("events.event_date", monthStart)
      .lt("events.event_date", monthEnd)
      .order("contractor_signed_at", { ascending: false }),
    supabase
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
      `)
      .eq("contractor_id", state.contractorId)
  ]);

  if (assignmentsRes.error) {
    console.error("loadScreenData assignments error:", assignmentsRes.error);
    state.signedAssignments = [];
    showPageMessage("שגיאה בטעינת האירועים החתומים.", "error");
  } else {
    state.signedAssignments = assignmentsRes.data || [];
  }

  if (pricesRes.error) {
    console.error("loadScreenData prices error:", pricesRes.error);
    state.defaultPrices = [];
    showPageMessage("שגיאה בטעינת מחירי ברירת המחדל.", "error");
  } else {
    state.defaultPrices = pricesRes.data || [];
  }

  populatePriceLookups();
  recomputeRows();
  applyFiltersAndRender();
}

function hydrateContractorHeader() {
  const company = state.contractor?.company_name || "קבלן";
  const phone = state.contractor?.phone || "-";
  const username = state.contractorUser?.username ? ` · משתמש: ${state.contractorUser.username}` : "";

  if (els.contractorPageTitle) els.contractorPageTitle.textContent = company;
  if (els.contractorHeroTitle) els.contractorHeroTitle.textContent = company;
  if (els.contractorHeroSubtitle) {
    els.contractorHeroSubtitle.textContent =
      `טלפון: ${phone}${username}. כאן מנוהלים כל האירועים החתומים, המחירים, השעות והדוח החודשי של הקבלן.`;
  }
}

function populatePriceLookups() {
  fillDatalist(
    els.citiesList,
    state.cities.map((row) => ({
      value: row.city_id,
      label: row.name_he
    }))
  );

  fillDatalist(
    els.stadiumsList,
    state.stadiums.map((row) => ({
      value: row.id,
      label: row.name
    }))
  );

  fillSelect(
    els.priceEventSelect,
    [{ value: "", label: "בחר אירוע" }, ...state.signedAssignments.map((row) => ({
      value: row.id,
      label: `${formatDateShort(row.events?.event_date)} · ${getEventTitle(row.events || {})}`
    }))]
  );
}

function fillDatalist(listEl, items) {
  if (!listEl) return;
  listEl.innerHTML = items.map((item) => `
    <option value="${escapeHtml(item.label)}"></option>
  `).join("");
}

function fillSelect(selectEl, items) {
  if (!selectEl) return;
  selectEl.innerHTML = items.map((item) => `
    <option value="${escapeHtml(String(item.value ?? ""))}">${escapeHtml(item.label)}</option>
  `).join("");
}

function findCityByName(name) {
  const clean = normalizeText(name);
  if (!clean) return null;
  return state.cities.find((row) => normalizeText(row.name_he) === clean) || null;
}

function findStadiumByName(name) {
  const clean = normalizeText(name);
  if (!clean) return null;
  return state.stadiums.find((row) => normalizeText(row.name) === clean) || null;
}

function getSelectedCityIdFromInput() {
  return findCityByName(els.priceCityInput?.value)?.city_id || null;
}

function getSelectedStadiumIdFromInput() {
  return findStadiumByName(els.priceStadiumInput?.value)?.id || null;
}

function recomputeRows() {
  state.computedRows = state.signedAssignments.map((row) => computeAssignmentRow(row));
  state.currentMonthIssues = state.computedRows.filter((row) => row.isBlocked);
  state.currentMonthTotals = state.computedRows.reduce((acc, row) => {
    acc.events += 1;
    acc.people += row.totalPeople;
    acc.amount += row.totalAmount;
    if (row.isBlocked) acc.blocked += 1;
    return acc;
  }, emptyTotals());
}

function computeAssignmentRow(row) {
  const event = row.events || {};
  const mainHours = computeMainHours(row);
  const earlyHours = computeEarlyHours(row);

  const counts = {
    workers: toNumber(row.actual_workers),
    certified: toNumber(row.actual_certified),
    commanders: toNumber(row.actual_commanders),
    early: toNumber(row.actual_early_workers)
  };

  const totalPeople = counts.workers + counts.certified + counts.commanders + counts.early;

  const resolved = resolvePricing(row, mainHours, earlyHours, counts);
  const title = getEventTitle(event);
  const location = getEventLocation(event);

  if (!resolved.ok) {
    return {
      assignment: row,
      event,
      title,
      location,
      mainHours,
      earlyHours,
      totalPeople,
      totalAmount: 0,
      isBlocked: true,
      blockReason: resolved.reason,
      pricingSource: resolved.source,
      pricingMode: resolved.mode || "לא מוגדר",
      pricingExplain: resolved.explain || "",
      amounts: { workers: 0, certified: 0, commanders: 0, early: 0 }
    };
  }

  const amounts = calculateAmounts(row, resolved.priceSet, resolved.effectiveMode, mainHours, earlyHours);
  const totalAmount = round2(amounts.workers + amounts.certified + amounts.commanders + amounts.early);

  return {
    assignment: row,
    event,
    title,
    location,
    mainHours,
    earlyHours,
    totalPeople,
    totalAmount,
    isBlocked: false,
    blockReason: "",
    pricingSource: resolved.source,
    pricingMode: getPricingModeLabel(resolved.effectiveMode),
    pricingExplain: resolved.explain || "",
    amounts
  };
}

function resolvePricing(row, mainHours, earlyHours, counts) {
  const event = row.events || {};
  let priceSet = null;
  let source = "ברירת מחדל";

  if (row.pricing_override_enabled) {
    priceSet = {
      pricing_mode: cleanNullable(row.override_pricing_mode),
      price_worker: toNumber(row.override_price_worker),
      price_certified: toNumber(row.override_price_certified),
      price_commander: toNumber(row.override_price_commander),
      price_early_worker: toNumber(row.override_price_early_worker),
      hourly_worker: toNumber(row.override_hourly_worker),
      hourly_certified: toNumber(row.override_hourly_certified),
      hourly_commander: toNumber(row.override_hourly_commander),
      hourly_early_worker: toNumber(row.override_hourly_early_worker)
    };
    source = "Override אירוע";
  } else {
    if (event.event_type === "football") {
      priceSet = state.defaultPrices.find((price) =>
        price.event_type === "football" &&
        Number(price.stadium_id || 0) === Number(event.stadium_id || event.stadiums?.id || 0)
      ) || null;
    } else {
      priceSet = state.defaultPrices.find((price) =>
        price.event_type === "event" &&
        Number(price.city_id || 0) === Number(event.city_id || event.cities?.city_id || 0)
      ) || null;
    }
  }

  if (!priceSet) {
    return {
      ok: false,
      reason: "לא נמצא מחיר מתאים.",
      source: "חסר מחיר",
      mode: "לא מוגדר",
      explain: ""
    };
  }

  const applied = deriveEffectivePricingMode(event, priceSet.pricing_mode, mainHours, counts);

  const validation = validatePriceSetForEffectiveMode(counts, priceSet, applied.mode);
  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
      source,
      mode: getPricingModeLabel(applied.mode),
      explain: applied.explain
    };
  }

  return {
    ok: true,
    priceSet,
    source,
    effectiveMode: applied.mode,
    explain: applied.explain
  };
}

function deriveEffectivePricingMode(event, baseMode, mainHours, counts) {
  const cleanBase = cleanNullable(baseMode) || guessDefaultPricingModeForEvent(event);

  if (event?.event_type === "football" && mainHours > 6) {
    return {
      mode: "hourly",
      explain: "המשחק עבר 6 שעות ולכן חושב כשעתי מלא."
    };
  }

  if (event?.event_type === "football" && counts.early > 0 && cleanBase === "daily") {
    return {
      mode: "mixed",
      explain: "יש כוח מקדים ולכן הופעל תמחור משולב."
    };
  }

  if (event?.event_type === "event" && cleanBase === "daily") {
    return {
      mode: "hourly",
      explain: "אירוע רגיל מחושב כשעתי."
    };
  }

  return {
    mode: cleanBase,
    explain: cleanBase === "mixed" ? "תמחור משולב." : ""
  };
}

function validatePriceSetForEffectiveMode(counts, priceSet, mode) {
  const missing = [];

  if (mode === "daily") {
    if (counts.workers > 0 && toNumber(priceSet.price_worker) <= 0) missing.push("יומי דייל");
    if (counts.certified > 0 && toNumber(priceSet.price_certified) <= 0) missing.push("יומי תעודה");
    if (counts.commanders > 0 && toNumber(priceSet.price_commander) <= 0) missing.push("יומי מפקד");
    if (counts.early > 0 && toNumber(priceSet.price_early_worker) <= 0) missing.push("יומי מקדים");
  }

  if (mode === "hourly") {
    if (counts.workers > 0 && toNumber(priceSet.hourly_worker) <= 0) missing.push("שעתי דייל");
    if (counts.certified > 0 && toNumber(priceSet.hourly_certified) <= 0) missing.push("שעתי תעודה");
    if (counts.commanders > 0 && toNumber(priceSet.hourly_commander) <= 0) missing.push("שעתי מפקד");
    if (counts.early > 0 && toNumber(priceSet.hourly_early_worker) <= 0) missing.push("שעתי מקדים");
  }

  if (mode === "mixed") {
    if (counts.workers > 0 && toNumber(priceSet.price_worker) <= 0) missing.push("יומי דייל");
    if (counts.certified > 0 && toNumber(priceSet.price_certified) <= 0) missing.push("יומי תעודה");
    if (counts.commanders > 0 && toNumber(priceSet.price_commander) <= 0) missing.push("יומי מפקד");
    if (counts.early > 0 && toNumber(priceSet.hourly_early_worker) <= 0) missing.push("שעתי מקדים");
  }

  if (missing.length) {
    return { ok: false, reason: `חסר מחיר עבור: ${missing.join(", ")}` };
  }

  return { ok: true };
}

function calculateAmounts(row, priceSet, mode, mainHours, earlyHours) {
  if (mode === "daily") {
    return {
      workers: round2(toNumber(row.actual_workers) * toNumber(priceSet.price_worker)),
      certified: round2(toNumber(row.actual_certified) * toNumber(priceSet.price_certified)),
      commanders: round2(toNumber(row.actual_commanders) * toNumber(priceSet.price_commander)),
      early: round2(toNumber(row.actual_early_workers) * toNumber(priceSet.price_early_worker))
    };
  }

  if (mode === "hourly") {
    return {
      workers: round2(toNumber(row.actual_workers) * toNumber(priceSet.hourly_worker) * mainHours),
      certified: round2(toNumber(row.actual_certified) * toNumber(priceSet.hourly_certified) * mainHours),
      commanders: round2(toNumber(row.actual_commanders) * toNumber(priceSet.hourly_commander) * mainHours),
      early: round2(toNumber(row.actual_early_workers) * toNumber(priceSet.hourly_early_worker) * earlyHours)
    };
  }

  return {
    workers: round2(toNumber(row.actual_workers) * toNumber(priceSet.price_worker)),
    certified: round2(toNumber(row.actual_certified) * toNumber(priceSet.price_certified)),
    commanders: round2(toNumber(row.actual_commanders) * toNumber(priceSet.price_commander)),
    early: round2(toNumber(row.actual_early_workers) * toNumber(priceSet.hourly_early_worker) * earlyHours)
  };
}

function computeMainHours(row) {
  const event = row.events || {};
  const start = row.override_arrival_time || event.arrival_time;
  const end = row.override_end_time || event.end_time;
  return computeHoursBetween(start, end);
}

function computeEarlyHours(row) {
  const event = row.events || {};
  const start = row.override_early_workers_time || event.early_workers_time || row.override_arrival_time || event.arrival_time;
  const end = row.override_end_time || event.end_time;
  return computeHoursBetween(start, end);
}

function computeHoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 1;

  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 1;

  let diff = end - start;
  if (diff <= 0) diff += 24 * 60;

  return Math.max(1, round2(diff / 60));
}

function applyFiltersAndRender() {
  const term = normalizeText(els.searchInput?.value);
  const dateFilter = els.specificDateFilter?.value || "";
  const pricingFilter = els.pricingStateFilter?.value || "all";

  state.filteredRows = state.computedRows.filter((row) => {
    if (dateFilter && row.event?.event_date !== dateFilter) return false;

    const haystack = [
      row.title,
      row.location,
      row.event?.stadiums?.name,
      row.event?.cities?.name_he,
      row.event?.home_team?.name,
      row.event?.away_team?.name,
      row.event?.competition_type,
      row.event?.event_name
    ].filter(Boolean).join(" ").toLowerCase();

    if (term && !haystack.includes(term)) return false;

    if (pricingFilter === "ready" && row.isBlocked) return false;
    if (pricingFilter === "blocked" && !row.isBlocked) return false;
    if (pricingFilter === "override" && row.pricingSource !== "Override אירוע") return false;
    if (pricingFilter === "default" && row.pricingSource !== "ברירת מחדל") return false;

    return true;
  });

  renderAll();
}

function renderAll() {
  renderKpis();
  renderSignedEvents();
  renderQuickPrices();
  renderMonthSummary();
}

function renderKpis() {
  const totals = state.currentMonthTotals;

  setKpi(
    els.kpiSignedEventsCount,
    els.kpiSignedEventsCountSub,
    totals.events,
    totals.events ? "אירועים חתומים בחודש הנוכחי" : "אין אירועים חתומים בחודש זה"
  );

  setKpi(
    els.kpiActualPeopleCount,
    els.kpiActualPeopleCountSub,
    totals.people,
    totals.people ? "סה״כ אנשים בפועל בכלל האירועים" : "אין ספירות בחודש זה"
  );

  setKpi(
    els.kpiTotalAmount,
    els.kpiTotalAmountSub,
    formatCurrency(totals.amount),
    totals.amount ? "סה״כ מחושב לחודש" : "אין סכום מחושב"
  );

  setKpi(
    els.kpiBlockedEvents,
    els.kpiBlockedEventsSub,
    totals.blocked,
    totals.blocked ? "אירועים חסומים לתמחור" : "כל האירועים תקינים"
  );
}

function renderSignedEvents() {
  if (!state.filteredRows.length) {
    if (els.eventsSummaryText) els.eventsSummaryText.textContent = "לא נמצאו אירועים לפי הסינון";
    if (els.contractorSignedEventsList) {
      els.contractorSignedEventsList.innerHTML = emptyState(
        "אין אירועים להצגה",
        "נסה לשנות חודש, חיפוש או מצב תמחור."
      );
    }
    return;
  }

  if (els.eventsSummaryText) {
    els.eventsSummaryText.textContent = `${state.filteredRows.length} אירועים מוצגים כרגע`;
  }

  els.contractorSignedEventsList.innerHTML = state.filteredRows.map((row) => {
    const event = row.event || {};
    return `
      <article class="meteor-event-card contractor-admin-event-card ${row.isBlocked ? "is-missing-price" : ""}">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <div class="meteor-event-card-badges">
              <span class="meteor-mini-badge ${event.event_type === "football" ? "primary" : "muted"}">
                ${event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל"}
              </span>
              <span class="meteor-mini-badge ${row.isBlocked ? "danger" : row.pricingSource === "Override אירוע" ? "warning" : "success"}">
                ${escapeHtml(row.isBlocked ? "חסום" : row.pricingSource)}
              </span>
              <span class="meteor-status-badge ${row.isBlocked ? "danger" : "success"}">
                ${escapeHtml(row.pricingMode)}
              </span>
            </div>

            <h3>${escapeHtml(row.title)}</h3>

            <div class="meteor-event-meta-grid">
              <div class="meteor-event-meta-item">
                <span>תאריך</span>
                <strong>${formatDate(event.event_date)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מיקום</span>
                <strong>${escapeHtml(row.location)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>שעות רגילות</span>
                <strong>${row.mainHours}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>שעות מקדים</span>
                <strong>${row.earlyHours}</strong>
              </div>
            </div>

            <div class="event-card-summary-strip">
              <span>דיילים: <strong>${toNumber(row.assignment.actual_workers)} / ${formatCurrency(row.amounts.workers)}</strong></span>
              <span>תעודה: <strong>${toNumber(row.assignment.actual_certified)} / ${formatCurrency(row.amounts.certified)}</strong></span>
              <span>מפקדים: <strong>${toNumber(row.assignment.actual_commanders)} / ${formatCurrency(row.amounts.commanders)}</strong></span>
              <span>מקדים: <strong>${toNumber(row.assignment.actual_early_workers)} / ${formatCurrency(row.amounts.early)}</strong></span>
              <span>סה״כ: <strong>${formatCurrency(row.totalAmount)}</strong></span>
            </div>

            ${row.pricingExplain ? `
              <div class="meteor-inline-info-strip mt-2">
                <div class="meteor-inline-info-text">${escapeHtml(row.pricingExplain)}</div>
              </div>
            ` : ""}

            ${row.isBlocked ? `
              <div class="meteor-inline-warning-strip">
                <strong>הדוח חסום:</strong>
                <span>${escapeHtml(row.blockReason)}</span>
              </div>
            ` : ""}
          </div>

          <div class="meteor-event-card-actions contractor-admin-event-actions">
            <button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-edit-hours" data-id="${row.assignment.id}">
              עדכון שעות
            </button>

            <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-event-override" data-id="${row.assignment.id}">
              מחיר לאירוע זה
            </button>

            <button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-view-signature" data-id="${row.assignment.id}">
              הצג חתימת קבלן
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.contractorSignedEventsList.querySelectorAll(".js-edit-hours").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.computedRows.find((x) => String(x.assignment.id) === String(btn.dataset.id));
      if (row) openHoursModal(row);
    });
  });

  els.contractorSignedEventsList.querySelectorAll(".js-event-override").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.computedRows.find((x) => String(x.assignment.id) === String(btn.dataset.id));
      if (row) openPriceModal({ kind: "event_override", assignmentRow: row });
    });
  });

  els.contractorSignedEventsList.querySelectorAll(".js-view-signature").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.computedRows.find((x) => String(x.assignment.id) === String(btn.dataset.id));
      if (row) await openSignatureViewModal(row);
    });
  });
}

function renderQuickPrices() {
  if (!els.contractorPricingQuickList) return;

  if (!state.defaultPrices.length) {
    els.contractorPricingQuickList.innerHTML = emptyState(
      "אין מחירים מוגדרים",
      "הוסף מחירי ברירת מחדל לפי עיר או אצטדיון."
    );
    return;
  }

  const preview = state.defaultPrices.slice(0, 8);

  els.contractorPricingQuickList.innerHTML = preview.map((row) => {
    const label = row.event_type === "football"
      ? (state.stadiums.find((s) => Number(s.id) === Number(row.stadium_id))?.name || "אצטדיון")
      : (state.cities.find((c) => Number(c.city_id) === Number(row.city_id))?.name_he || "עיר");

    return `
      <article class="meteor-mini-card js-open-price-row" data-id="${row.id}">
        <div class="meteor-mini-card-top">
          <strong>${escapeHtml(label)}</strong>
          <span class="meteor-mini-badge ${row.pricing_mode === "mixed" ? "warning" : row.pricing_mode === "hourly" ? "muted" : "primary"}">
            ${escapeHtml(getPricingModeLabel(row.pricing_mode))}
          </span>
        </div>
        <div class="meteor-mini-card-body">
          <div class="meteor-mini-line">${row.event_type === "football" ? "כדורגל / אצטדיון" : "אירוע / עיר"}</div>
          <div class="meteor-mini-line">${describePricePreview(row)}</div>
        </div>
      </article>
    `;
  }).join("");

  els.contractorPricingQuickList.querySelectorAll(".js-open-price-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.defaultPrices.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) openPriceModal({ kind: "default", row });
    });
  });
}

function renderMonthSummary() {
  const rows = state.filteredRows;
  const totals = rows.reduce((acc, row) => {
    acc.events += 1;
    acc.people += row.totalPeople;
    acc.amount += row.totalAmount;
    if (row.isBlocked) acc.blocked += 1;
    return acc;
  }, emptyTotals());

  if (els.monthSummaryEvents) els.monthSummaryEvents.textContent = String(totals.events);
  if (els.monthSummaryPeople) els.monthSummaryPeople.textContent = String(totals.people);
  if (els.monthSummaryAmount) els.monthSummaryAmount.textContent = formatCurrency(totals.amount);

  clearBox(els.contractorMonthlyStatusBox);

  if (!rows.length) {
    showBoxMessage(els.contractorMonthlyStatusBox, "אין כרגע נתונים בתצוגה.", "warning");
    return;
  }

  if (totals.blocked > 0) {
    showBoxMessage(
      els.contractorMonthlyStatusBox,
      `הדוח חסום כרגע. יש ${totals.blocked} אירועים עם חסר תמחורי.`,
      "warning"
    );
  } else {
    showBoxMessage(
      els.contractorMonthlyStatusBox,
      "כל האירועים בתצוגה תקינים והתמחור מוכן להפקת PDF.",
      "success"
    );
  }
}

function openHoursModal(row) {
  state.editingHoursRow = row;
  clearBox(els.hoursModalMessageBox);

  els.hoursAssignmentId.value = String(row.assignment.id);
  els.overrideArrivalTimeInput.value = normalizeTimeValue(row.assignment.override_arrival_time || "");
  els.overrideEndTimeInput.value = normalizeTimeValue(row.assignment.override_end_time || "");
  els.overrideEarlyTimeInput.value = normalizeTimeValue(row.assignment.override_early_workers_time || "");

  els.hoursModalTitle.textContent = `עדכון שעות - ${row.title}`;
  els.hoursModalSubtitle.textContent = `שעות Override לקבלן זה בלבד · ${formatDate(row.event.event_date)}`;

  openModal(els.hoursModal, els.hoursModalBackdrop);
}

function closeHoursModal() {
  state.editingHoursRow = null;
  els.hoursForm?.reset();
  clearBox(els.hoursModalMessageBox);
  closeModal(els.hoursModal, els.hoursModalBackdrop);
}

async function handleSaveHours(event) {
  event.preventDefault();
  clearBox(els.hoursModalMessageBox);

  const assignmentId = Number(els.hoursAssignmentId.value || 0);
  if (!assignmentId) return;

  const payload = {
    override_arrival_time: cleanNullable(els.overrideArrivalTimeInput.value),
    override_end_time: cleanNullable(els.overrideEndTimeInput.value),
    override_early_workers_time: cleanNullable(els.overrideEarlyTimeInput.value),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("contractor_assignments")
    .update(payload)
    .eq("id", assignmentId);

  if (error) {
    console.error("handleSaveHours error:", error);
    showBoxMessage(els.hoursModalMessageBox, "לא ניתן לשמור את השעות כרגע.", "error");
    return;
  }

  closeHoursModal();
  showPageMessage("שעות הקבלן עודכנו בהצלחה.", "success");
  await loadScreenData();
}

async function handleClearHoursOverrides() {
  const assignmentId = Number(els.hoursAssignmentId.value || 0);
  if (!assignmentId) return;

  const { error } = await supabase
    .from("contractor_assignments")
    .update({
      override_arrival_time: null,
      override_end_time: null,
      override_early_workers_time: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId);

  if (error) {
    console.error("handleClearHoursOverrides error:", error);
    showBoxMessage(els.hoursModalMessageBox, "לא ניתן לאפס את Override השעות כרגע.", "error");
    return;
  }

  closeHoursModal();
  showPageMessage("Override השעות אופס בהצלחה.", "success");
  await loadScreenData();
}

function openPriceModal(context = null) {
  state.editingPriceContext = context;
  els.priceForm?.reset();
  clearBox(els.priceModalMessageBox);

  els.priceRecordId.value = "";
  fillPriceInputs({});
  if (els.deletePriceBtn) els.deletePriceBtn.style.display = "none";

  if (!context) {
    els.priceModalTitle.textContent = "הוספת מחיר";
    els.priceModalSubtitle.textContent = "ברירת מחדל לאצטדיון, ברירת מחדל לעיר או מחיר חריג לאירוע.";
    els.priceTargetType.value = "default_stadium";
    els.priceEventType.value = "football";
    if (els.priceStadiumInput) els.priceStadiumInput.value = "";
    if (els.priceCityInput) els.priceCityInput.value = "";
    updatePriceTargetVisibility();
    updatePriceModeVisibility();
    openModal(els.priceModal, els.priceModalBackdrop);
    return;
  }

  if (context.kind === "default" && context.row) {
    const row = context.row;

    els.priceModalTitle.textContent = "עריכת מחיר ברירת מחדל";
    els.priceModalSubtitle.textContent = "עדכון מחיר קבוע לקבלן.";

    els.priceRecordId.value = String(row.id || "");
    els.priceTargetType.value = row.event_type === "football" ? "default_stadium" : "default_city";
    els.priceEventType.value = row.event_type || "football";

    if (els.priceStadiumInput) els.priceStadiumInput.value = "";
    if (els.priceCityInput) els.priceCityInput.value = "";

    if (row.event_type === "football") {
      const stadiumName =
        state.stadiums.find((s) => Number(s.id) === Number(row.stadium_id))?.name || "";
      if (els.priceStadiumInput) els.priceStadiumInput.value = stadiumName;
    } else {
      const cityName =
        state.cities.find((c) => Number(c.city_id) === Number(row.city_id))?.name_he || "";
      if (els.priceCityInput) els.priceCityInput.value = cityName;
    }

    fillPriceInputs(row);
    if (els.deletePriceBtn) els.deletePriceBtn.style.display = "inline-flex";

    updatePriceTargetVisibility();
    updatePriceModeVisibility();
    openModal(els.priceModal, els.priceModalBackdrop);
    return;
  }

  if (context.kind === "event_override" && context.assignmentRow) {
    const row = context.assignmentRow;
    const event = row.event || {};

    if (els.priceStadiumInput) els.priceStadiumInput.value = "";
    if (els.priceCityInput) els.priceCityInput.value = "";

    els.priceModalTitle.textContent = "מחיר חריג לאירוע";
    els.priceModalSubtitle.textContent = `${row.title} · ${formatDate(event.event_date)}`;

    els.priceTargetType.value = "event_override";
    els.priceEventType.value = event.event_type || "football";
    els.priceEventSelect.value = String(row.assignment.id);

    fillPriceInputs({
      pricing_mode: row.assignment.override_pricing_mode || guessDefaultPricingModeForEvent(event),
      price_worker: row.assignment.override_price_worker,
      price_certified: row.assignment.override_price_certified,
      price_commander: row.assignment.override_price_commander,
      price_early_worker: row.assignment.override_price_early_worker,
      hourly_worker: row.assignment.override_hourly_worker,
      hourly_certified: row.assignment.override_hourly_certified,
      hourly_commander: row.assignment.override_hourly_commander,
      hourly_early_worker: row.assignment.override_hourly_early_worker
    });

    if (els.deletePriceBtn) {
      els.deletePriceBtn.style.display = row.assignment.pricing_override_enabled ? "inline-flex" : "none";
    }

    updatePriceTargetVisibility();
    updatePriceModeVisibility();
    openModal(els.priceModal, els.priceModalBackdrop);
    return;
  }

  closePriceModal();
}

function closePriceModal() {
  state.editingPriceContext = null;
  els.priceForm?.reset();
  if (els.priceStadiumInput) els.priceStadiumInput.value = "";
  if (els.priceCityInput) els.priceCityInput.value = "";
  clearBox(els.priceModalMessageBox);
  closeModal(els.priceModal, els.priceModalBackdrop);
}

async function openSignatureViewModal(row) {
  state.selectedSignatureRow = row;
  clearBox(els.signatureViewMessageBox);

  if (els.signatureViewModalTitle) {
    els.signatureViewModalTitle.textContent = `חתימת קבלן - ${row.title}`;
  }

  if (els.signatureViewModalSubtitle) {
    els.signatureViewModalSubtitle.textContent =
      `${formatDate(row.event?.event_date)} · ${row.location}`;
  }

  if (els.signatureViewImageWrap) {
    els.signatureViewImageWrap.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>טוען חתימה...</strong>
        <span>רק רגע.</span>
      </div>
    `;
  }

  if (els.signatureViewMeta) {
    els.signatureViewMeta.innerHTML = "";
  }

  openModal(els.signatureViewModal, els.signatureViewModalBackdrop);

  const { data, error } = await supabase
    .from("contractor_signatures")
    .select(`
      id,
      assignment_id,
      contractor_id,
      signed_by_user_id,
      signature_status,
      signature_image_url,
      sign_note,
      signed_at
    `)
    .eq("assignment_id", row.assignment.id)
    .eq("contractor_id", state.contractorId)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("openSignatureViewModal error:", error);
    showBoxMessage(els.signatureViewMessageBox, "לא ניתן לטעון את חתימת הקבלן כרגע.", "error");

    if (els.signatureViewImageWrap) {
      els.signatureViewImageWrap.innerHTML = emptyState(
        "שגיאה בטעינת חתימה",
        "בדוק את הטבלה contractor_signatures ונסה שוב."
      );
    }
    return;
  }

  if (!data) {
    if (els.signatureViewImageWrap) {
      els.signatureViewImageWrap.innerHTML = emptyState(
        "לא נמצאה חתימה",
        "לא נשמרה חתימה עבור אירוע זה."
      );
    }
    return;
  }

  const hasImage = !!cleanNullable(data.signature_image_url);

  if (els.signatureViewImageWrap) {
    els.signatureViewImageWrap.innerHTML = hasImage
      ? `
        <div class="contractor-signature-preview-card">
          <img
            src="${escapeHtml(data.signature_image_url)}"
            alt="חתימת קבלן"
            class="contractor-signature-preview-image"
          />
        </div>
      `
      : emptyState(
          "אין תמונת חתימה",
          "נשמרה חתימה טקסטואלית/סטטוס, אבל לא נשמרה תמונת חתימה."
        );
  }

  if (els.signatureViewMeta) {
    els.signatureViewMeta.innerHTML = `
      <div class="contractor-signature-meta-grid">
        <div class="meteor-event-meta-item">
          <span>סטטוס חתימה</span>
          <strong>${escapeHtml(data.signature_status || "-")}</strong>
        </div>

        <div class="meteor-event-meta-item">
          <span>נחתם בתאריך</span>
          <strong>${data.signed_at ? formatDateTime(data.signed_at) : "-"}</strong>
        </div>

        <div class="meteor-event-meta-item">
          <span>הערת קבלן</span>
          <strong>${escapeHtml(data.sign_note || row.assignment.contractor_signature_note || "-")}</strong>
        </div>
      </div>
    `;
  }
}

function closeSignatureViewModal() {
  state.selectedSignatureRow = null;
  clearBox(els.signatureViewMessageBox);

  if (els.signatureViewImageWrap) els.signatureViewImageWrap.innerHTML = "";
  if (els.signatureViewMeta) els.signatureViewMeta.innerHTML = "";

  closeModal(els.signatureViewModal, els.signatureViewModalBackdrop);
}

function updatePriceTargetVisibility() {
  const target = els.priceTargetType?.value || "default_stadium";

  if (target === "default_stadium") {
    els.priceEventType.value = "football";
    els.priceEventType.disabled = true;
  } else if (target === "default_city") {
    els.priceEventType.value = "event";
    els.priceEventType.disabled = true;
  } else {
    els.priceEventType.disabled = true;
  }

  if (els.priceStadiumWrap) {
    els.priceStadiumWrap.style.display = target === "default_stadium" ? "" : "none";
  }

  if (els.priceCityWrap) {
    els.priceCityWrap.style.display = target === "default_city" ? "" : "none";
  }

  if (els.priceEventWrap) {
    els.priceEventWrap.style.display = target === "event_override" ? "" : "none";
  }
}

function updatePriceModeVisibility() {
  const mode = els.priceModeSelect?.value || "daily";

  if (els.dailyPricesBox) {
    els.dailyPricesBox.style.display = mode === "daily" || mode === "mixed" ? "" : "none";
  }

  if (els.hourlyPricesBox) {
    els.hourlyPricesBox.style.display = mode === "hourly" || mode === "mixed" ? "" : "none";
  }

  if (els.dailyEarlyWrap) {
    els.dailyEarlyWrap.style.display = mode === "daily" ? "" : "none";
  }

  if (els.hourlyWorkerWrap) {
    els.hourlyWorkerWrap.style.display = mode === "hourly" ? "" : "none";
  }

  if (els.hourlyCertifiedWrap) {
    els.hourlyCertifiedWrap.style.display = mode === "hourly" ? "" : "none";
  }

  if (els.hourlyCommanderWrap) {
    els.hourlyCommanderWrap.style.display = mode === "hourly" ? "" : "none";
  }

  if (els.hourlyEarlyWrap) {
    els.hourlyEarlyWrap.style.display = mode === "hourly" || mode === "mixed" ? "" : "none";
  }
}

async function handleSavePrice(event) {
  event.preventDefault();
  clearBox(els.priceModalMessageBox);

  const target = els.priceTargetType?.value || "default_stadium";
  const payload = collectPricePayload();
  const validation = validatePricePayload(payload);

  if (!validation.ok) {
    showBoxMessage(els.priceModalMessageBox, validation.reason, "warning");
    return;
  }

  if (target === "default_stadium" || target === "default_city") {
    await handleSaveDefaultPrice(target, payload);
    return;
  }

  if (target === "event_override") {
    await handleSaveEventOverride(payload);
    return;
  }

  showBoxMessage(els.priceModalMessageBox, "סוג יעד תמחור לא נתמך.", "warning");
}

function validatePricePayload(payload) {
  if (!payload.pricing_mode) {
    return { ok: false, reason: "יש לבחור שיטת תמחור." };
  }

  if (payload.pricing_mode === "daily") {
    if (payload.price_worker <= 0 && payload.price_certified <= 0 && payload.price_commander <= 0 && payload.price_early_worker <= 0) {
      return { ok: false, reason: "יש למלא לפחות מחיר יומי אחד." };
    }
  }

  if (payload.pricing_mode === "hourly") {
    if (payload.hourly_worker <= 0 && payload.hourly_certified <= 0 && payload.hourly_commander <= 0 && payload.hourly_early_worker <= 0) {
      return { ok: false, reason: "יש למלא לפחות מחיר שעתי אחד." };
    }
  }

  if (payload.pricing_mode === "mixed") {
    if (payload.price_worker <= 0 && payload.price_certified <= 0 && payload.price_commander <= 0) {
      return { ok: false, reason: "בתמחור משולב חייבים מחירים יומיים לתפקידים הרגילים." };
    }
    if (payload.hourly_early_worker <= 0) {
      return { ok: false, reason: "בתמחור משולב חייב להיות מחיר שעתי לכוח מקדים." };
    }
  }

  return { ok: true };
}

async function handleSaveDefaultPrice(target, payload) {
  const recordId = Number(els.priceRecordId?.value || 0);

  const isFootball = target === "default_stadium";
  const selectedStadiumId = getSelectedStadiumIdFromInput();
  const selectedCityId = getSelectedCityIdFromInput();

  const rowPayload = {
    contractor_id: state.contractorId,
    event_type: isFootball ? "football" : "event",
    stadium_id: isFootball ? selectedStadiumId : null,
    city_id: isFootball ? null : selectedCityId,
    pricing_mode: payload.pricing_mode,
    price_worker: payload.price_worker,
    price_certified: payload.price_certified,
    price_commander: payload.price_commander,
    price_early_worker: payload.price_early_worker,
    hourly_worker: payload.hourly_worker,
    hourly_certified: payload.hourly_certified,
    hourly_commander: payload.hourly_commander,
    hourly_early_worker: payload.hourly_early_worker
  };

  if (isFootball && !rowPayload.stadium_id) {
    showBoxMessage(els.priceModalMessageBox, "יש לבחור אצטדיון מתוך הרשימה.", "warning");
    return;
  }

  if (!isFootball && !rowPayload.city_id) {
    showBoxMessage(els.priceModalMessageBox, "יש לבחור עיר מתוך הרשימה.", "warning");
    return;
  }

  let error = null;

  if (recordId) {
    ({ error } = await supabase
      .from("contractor_prices")
      .update(rowPayload)
      .eq("id", recordId));
  } else {
    ({ error } = await supabase
      .from("contractor_prices")
      .insert(rowPayload));
  }

  if (error) {
    console.error("handleSaveDefaultPrice error:", error);
    showBoxMessage(els.priceModalMessageBox, "לא ניתן לשמור את המחיר כרגע.", "error");
    return;
  }

  closePriceModal();
  showPageMessage(recordId ? "מחיר ברירת המחדל עודכן." : "מחיר ברירת המחדל נוסף.", "success");
  await loadScreenData();
}

async function handleSaveEventOverride(payload) {
  const assignmentId = Number(els.priceEventSelect?.value || 0) ||
    Number(state.editingPriceContext?.assignmentRow?.assignment?.id || 0);

  if (!assignmentId) {
    showBoxMessage(els.priceModalMessageBox, "יש לבחור אירוע.", "warning");
    return;
  }

  const { error } = await supabase
    .from("contractor_assignments")
    .update({
      pricing_override_enabled: true,
      override_pricing_mode: payload.pricing_mode,
      override_price_worker: payload.price_worker,
      override_price_certified: payload.price_certified,
      override_price_commander: payload.price_commander,
      override_price_early_worker: payload.price_early_worker,
      override_hourly_worker: payload.hourly_worker,
      override_hourly_certified: payload.hourly_certified,
      override_hourly_commander: payload.hourly_commander,
      override_hourly_early_worker: payload.hourly_early_worker,
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId);

  if (error) {
    console.error("handleSaveEventOverride error:", error);
    showBoxMessage(els.priceModalMessageBox, "לא ניתן לשמור מחיר חריג לאירוע כרגע.", "error");
    return;
  }

  closePriceModal();
  showPageMessage("המחיר החריג לאירוע נשמר בהצלחה.", "success");
  await loadScreenData();
}

async function handleDeletePrice() {
  if (!state.editingPriceContext) return;

  if (state.editingPriceContext.kind === "default" && state.editingPriceContext.row) {
    const { error } = await supabase
      .from("contractor_prices")
      .delete()
      .eq("id", state.editingPriceContext.row.id);

    if (error) {
      console.error("handleDeletePrice default error:", error);
      showBoxMessage(els.priceModalMessageBox, "לא ניתן למחוק את המחיר כרגע.", "error");
      return;
    }

    closePriceModal();
    showPageMessage("מחיר ברירת המחדל נמחק.", "success");
    await loadScreenData();
    return;
  }

  if (state.editingPriceContext.kind === "event_override" && state.editingPriceContext.assignmentRow) {
    const { error } = await supabase
      .from("contractor_assignments")
      .update({
        pricing_override_enabled: false,
        override_pricing_mode: null,
        override_price_worker: 0,
        override_price_certified: 0,
        override_price_commander: 0,
        override_price_early_worker: 0,
        override_hourly_worker: 0,
        override_hourly_certified: 0,
        override_hourly_commander: 0,
        override_hourly_early_worker: 0,
        updated_at: new Date().toISOString()
      })
      .eq("id", state.editingPriceContext.assignmentRow.assignment.id);

    if (error) {
      console.error("handleDeletePrice override error:", error);
      showBoxMessage(els.priceModalMessageBox, "לא ניתן למחוק את המחיר החריג כרגע.", "error");
      return;
    }

    closePriceModal();
    showPageMessage("המחיר החריג לאירוע הוסר.", "success");
    await loadScreenData();
    return;
  }

  showBoxMessage(els.priceModalMessageBox, "לא נמצא פריט למחיקה.", "warning");
}

function openAllPricesModal() {
  renderAllPricesList();
  openModal(els.allPricesModal, els.allPricesModalBackdrop);
}

function closeAllPricesModal() {
  closeModal(els.allPricesModal, els.allPricesModalBackdrop);
}

function renderAllPricesList() {
  if (!els.allPricesList) return;

  const term = normalizeText(els.allPricesSearchInput?.value);
  const typeFilter = els.allPricesTypeFilter?.value || "all";

  let rows = [...state.defaultPrices];

  if (typeFilter !== "all") {
    rows = rows.filter((row) => row.event_type === typeFilter);
  }

  if (term) {
    rows = rows.filter((row) => {
      const label = getPriceRowLabel(row);
      return normalizeText(label).includes(term);
    });
  }

  if (!rows.length) {
    els.allPricesList.innerHTML = emptyState("אין מחירים להצגה", "נסה לשנות את הסינון.");
    return;
  }

  els.allPricesList.innerHTML = rows.map((row) => `
    <article class="meteor-event-card meteor-price-card">
      <div class="meteor-event-card-top">
        <div class="meteor-event-card-main">
          <div class="meteor-event-card-badges">
            <span class="meteor-mini-badge ${row.event_type === "football" ? "primary" : "muted"}">
              ${row.event_type === "football" ? "כדורגל" : "אירוע"}
            </span>
            <span class="meteor-mini-badge ${row.pricing_mode === "mixed" ? "warning" : row.pricing_mode === "hourly" ? "muted" : "success"}">
              ${escapeHtml(getPricingModeLabel(row.pricing_mode))}
            </span>
          </div>

          <h3>${escapeHtml(getPriceRowLabel(row))}</h3>

          <div class="event-card-summary-strip">
            <span>${describePricePreview(row)}</span>
          </div>
        </div>

        <div class="meteor-event-card-actions">
          <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-edit-default-price" data-id="${row.id}">
            עריכה
          </button>
        </div>
      </div>
    </article>
  `).join("");

  els.allPricesList.querySelectorAll(".js-edit-default-price").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.defaultPrices.find((x) => String(x.id) === String(btn.dataset.id));
      if (!row) return;
      closeAllPricesModal();
      openPriceModal({ kind: "default", row });
    });
  });
}

function openMonthlyReportModal() {
  const rows = state.filteredRows;
  const blocked = rows.filter((row) => row.isBlocked);

  els.monthlyReportModalTitle.textContent = `דוח חודשי - ${state.contractor?.company_name || "קבלן"}`;
  els.monthlyReportModalSubtitle.textContent = els.monthlyFilter?.value
    ? `חודש ${els.monthlyFilter.value}`
    : "חודש נוכחי";

  clearBox(els.monthlyReportStatusBox);

  if (!rows.length) {
    showBoxMessage(els.monthlyReportStatusBox, "אין אירועים להצגה בדוח.", "warning");
  } else if (blocked.length) {
    showBoxMessage(
      els.monthlyReportStatusBox,
      `הדוח חסום כרגע כי יש ${blocked.length} אירועים עם חסר תמחורי.`,
      "warning"
    );
  } else {
    showBoxMessage(els.monthlyReportStatusBox, "הדוח מוכן להפקה.", "success");
  }

  els.monthlyReportIssuesList.innerHTML = blocked.length
    ? `<ul class="mb-0">${blocked.map((row) => `
        <li>
          <strong>${escapeHtml(row.title)}</strong>
          <span> · ${escapeHtml(row.blockReason)}</span>
        </li>
      `).join("")}</ul>`
    : `<div class="meteor-empty-state small"><strong>אין חסרים</strong><span>אפשר להפיק דוח.</span></div>`;

  openModal(els.monthlyReportModal, els.monthlyReportModalBackdrop);
}

function closeMonthlyReportModal() {
  closeModal(els.monthlyReportModal, els.monthlyReportModalBackdrop);
}

function generateMonthlyPdf() {
  const rows = state.filteredRows;
  const blocked = rows.filter((row) => row.isBlocked);

  if (!rows.length) {
    showBoxMessage(els.monthlyReportStatusBox, "אין נתונים להפקה.", "warning");
    return;
  }

  if (blocked.length) {
    showBoxMessage(els.monthlyReportStatusBox, "לא ניתן להפיק דוח כאשר קיימים אירועים חסומים.", "warning");
    return;
  }

  const html = buildMonthlyReportHtml(rows);
  const win = window.open("", "_blank", "width=1200,height=900");

  if (!win) {
    showBoxMessage(els.monthlyReportStatusBox, "הדפדפן חסם פתיחת חלון הדפסה.", "error");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (error) {
      console.error("print error:", error);
    }
  }, 300);
}

function buildMonthlyReportHtml(rows) {
  const totals = rows.reduce((acc, row) => {
    acc.events += 1;
    acc.people += row.totalPeople;
    acc.amount += row.totalAmount;
    return acc;
  }, emptyTotals());

  const rowsHtml = rows.map((row) => `
    <tr>
      <td>${escapeHtml(formatDate(row.event?.event_date))}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.location)}</td>
      <td>${escapeHtml(row.pricingSource)}</td>
      <td>${escapeHtml(row.pricingMode)}</td>
      <td>${escapeHtml(row.pricingExplain || "-")}</td>
      <td>${row.totalPeople}</td>
      <td>${formatCurrency(row.totalAmount)}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>דוח חודשי - ${escapeHtml(state.contractor?.company_name || "קבלן")}</title>
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; padding: 24px; color: #111; }
        h1,h2,h3 { margin: 0 0 12px; }
        .meta { margin-bottom: 20px; }
        .summary { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .box { border: 1px solid #ccc; border-radius: 10px; padding: 12px 16px; min-width: 180px; }
        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: right; }
        th { background: #f3f3f3; }
      </style>
    </head>
    <body>
      <h1>דוח חודשי לקבלן</h1>
      <div class="meta">
        <div><strong>קבלן:</strong> ${escapeHtml(state.contractor?.company_name || "-")}</div>
        <div><strong>טלפון:</strong> ${escapeHtml(state.contractor?.phone || "-")}</div>
        <div><strong>חודש:</strong> ${escapeHtml(els.monthlyFilter?.value || "-")}</div>
      </div>

      <div class="summary">
        <div class="box"><strong>אירועים</strong><div>${totals.events}</div></div>
        <div class="box"><strong>אנשים</strong><div>${totals.people}</div></div>
        <div class="box"><strong>סה״כ לתשלום</strong><div>${formatCurrency(totals.amount)}</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>תאריך</th>
            <th>אירוע</th>
            <th>מיקום</th>
            <th>מקור מחיר</th>
            <th>שיטת תמחור</th>
            <th>הסבר</th>
            <th>סה״כ אנשים</th>
            <th>סה״כ לתשלום</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function collectPricePayload() {
  return {
    pricing_mode: cleanNullable(els.priceModeSelect?.value),
    price_worker: toNumber(els.priceWorkerInput?.value),
    price_certified: toNumber(els.priceCertifiedInput?.value),
    price_commander: toNumber(els.priceCommanderInput?.value),
    price_early_worker: toNumber(els.priceEarlyInput?.value),
    hourly_worker: toNumber(els.hourlyWorkerInput?.value),
    hourly_certified: toNumber(els.hourlyCertifiedInput?.value),
    hourly_commander: toNumber(els.hourlyCommanderInput?.value),
    hourly_early_worker: toNumber(els.hourlyEarlyInput?.value)
  };
}

function fillPriceInputs(row) {
  els.priceModeSelect.value = row.pricing_mode || "daily";
  els.priceWorkerInput.value = toNumber(row.price_worker);
  els.priceCertifiedInput.value = toNumber(row.price_certified);
  els.priceCommanderInput.value = toNumber(row.price_commander);
  els.priceEarlyInput.value = toNumber(row.price_early_worker);
  els.hourlyWorkerInput.value = toNumber(row.hourly_worker);
  els.hourlyCertifiedInput.value = toNumber(row.hourly_certified);
  els.hourlyCommanderInput.value = toNumber(row.hourly_commander);
  els.hourlyEarlyInput.value = toNumber(row.hourly_early_worker);
  updatePriceModeVisibility();
}

function getPriceRowLabel(row) {
  if (row.event_type === "football") {
    return state.stadiums.find((s) => Number(s.id) === Number(row.stadium_id))?.name || "אצטדיון";
  }
  return state.cities.find((c) => Number(c.city_id) === Number(row.city_id))?.name_he || "עיר";
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

function describePricePreview(row) {
  if (row.pricing_mode === "daily") {
    return `יומי דייל ${formatCurrency(row.price_worker)} · יומי תעודה ${formatCurrency(row.price_certified)} · יומי מפקד ${formatCurrency(row.price_commander)}`;
  }
  if (row.pricing_mode === "hourly") {
    return `שעתי דייל ${formatCurrency(row.hourly_worker)} · שעתי תעודה ${formatCurrency(row.hourly_certified)} · שעתי מפקד ${formatCurrency(row.hourly_commander)}`;
  }
  return `משולב: יומי רגיל + שעתי מקדים ${formatCurrency(row.hourly_early_worker)}`;
}

function guessDefaultPricingModeForEvent(event) {
  if (event?.event_type === "football") return "daily";
  return "hourly";
}

function getEventTitle(event) {
  if (!event) return "אירוע";

  if (event.event_type === "football") {
    const home = event.home_team?.name || "";
    const away = event.away_team?.name || "";
    if (home || away) return `${home || "קבוצה"} - ${away || "קבוצה"}`;
    if (event.competition_type) return event.competition_type;
    return "משחק כדורגל";
  }

  return event.event_name || "אירוע";
}

function getEventLocation(event) {
  if (!event) return "-";

  if (event.event_type === "football") {
    return event.stadiums?.name || event.manual_location || "-";
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

function getMonthRange(monthValue) {
  const now = new Date();
  const safeValue = monthValue || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = safeValue.split("-").map(Number);

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 1);
  const end = formatDateISO(endDate);

  return [start, end];
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
  if (!els.contractorViewMessageBox) return;
  els.contractorViewMessageBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.contractorViewMessageBox) els.contractorViewMessageBox.innerHTML = "";
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

function emptyTotals() {
  return {
    events: 0,
    people: 0,
    amount: 0,
    blocked: 0
  };
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function cleanNullable(value) {
  const clean = String(value ?? "").trim();
  return clean ? clean : null;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTimeValue(value) {
  const str = String(value || "").trim();
  if (!str) return "";
  return str.slice(0, 5);
}

function parseTimeToMinutes(value) {
  const str = normalizeTimeValue(value);
  if (!str || !str.includes(":")) return null;

  const [h, m] = str.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;

  return h * 60 + m;
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatCurrency(value) {
  const num = toNumber(value);
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2
  }).format(num);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("he-IL").format(date);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatDateShort(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}