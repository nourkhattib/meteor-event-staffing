import { supabase } from "./supabase.js";
import { requireAuth, logout } from "./auth.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import {
  getRequestedTotal,
  getApprovedTotal,
  isPendingResponse,
  isWaitingManagerChangeApproval,
  isApprovedWaitingCount,
  isWaitingSignature,
  isSignedAndMonthlyClosed,
  isRejectedAssignment,
  getAssignmentLifecycleState,
  getAssignmentLifecycleLabel,
  getAssignmentLifecycleBadgeClass,
  buildApproveChangeRequestApply,
  buildCancelAssignmentUpdate,
  filterPendingAssignments,
  filterChangeRequestedAssignments
} from "./assignment-state.js";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  refreshEventsBtnHero: document.getElementById("refreshEventsBtnHero"),
  refreshEventsBtn: document.getElementById("refreshEventsBtn"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),

  monthFilter: document.getElementById("monthFilter"),
  specificDateFilter: document.getElementById("specificDateFilter"),
  eventSearchInput: document.getElementById("eventSearchInput"),

  assignmentsMsgBox: document.getElementById("assignmentsMsgBox"),
  eventsSummaryText: document.getElementById("eventsSummaryText"),
  eventsListWrap: document.getElementById("eventsListWrap"),

  kpiEventsCount: document.getElementById("kpiEventsCount"),
  kpiEventsCountSub: document.getElementById("kpiEventsCountSub"),
  kpiOpenEvents: document.getElementById("kpiOpenEvents"),
  kpiOpenEventsSub: document.getElementById("kpiOpenEventsSub"),
  kpiWorkersList: document.getElementById("kpiWorkersList"),
  kpiWorkersListSub: document.getElementById("kpiWorkersListSub"),
  kpiFootballEvents: document.getElementById("kpiFootballEvents"),
  kpiFootballEventsSub: document.getElementById("kpiFootballEventsSub"),

  assignmentModal: document.getElementById("assignmentModal"),
  assignmentModalBackdrop: document.getElementById("assignmentModalBackdrop"),
  closeAssignmentModal: document.getElementById("closeAssignmentModal"),
  modalEventTitle: document.getElementById("modalEventTitle"),
  modalEventSubtitle: document.getElementById("modalEventSubtitle"),
  eventInfoTitle: document.getElementById("eventInfoTitle"),
  eventInfoType: document.getElementById("eventInfoType"),
  eventInfoMeta: document.getElementById("eventInfoMeta"),

  totalWorkers: document.getElementById("totalWorkers"),
  totalCertified: document.getElementById("totalCertified"),
  totalCommanders: document.getElementById("totalCommanders"),
  totalEarly: document.getElementById("totalEarly"),
  totalGrand: document.getElementById("totalGrand"),
  approvedContractorsCount: document.getElementById("approvedContractorsCount"),
  approvedPeopleTotal: document.getElementById("approvedPeopleTotal"),
  pendingContractorsCount: document.getElementById("pendingContractorsCount"),

  openPendingModalBtn: document.getElementById("openPendingModalBtn"),
  openWorkersListsBtn: document.getElementById("openWorkersListsBtn"),
  assignedContractorSearch: document.getElementById("assignedContractorSearch"),
  assignmentsList: document.getElementById("assignmentsList"),

  assignmentForm: document.getElementById("assignmentForm"),
  assignmentId: document.getElementById("assignmentId"),
  contractorSearch: document.getElementById("contractorSearch"),
  contractorId: document.getElementById("contractorId"),
  contractorResults: document.getElementById("contractorResults"),
  requestedWorkers: document.getElementById("requestedWorkers"),
  requestedCertified: document.getElementById("requestedCertified"),
  requestedCommanders: document.getElementById("requestedCommanders"),
  requestedEarlyWorkers: document.getElementById("requestedEarlyWorkers"),
  saveAssignmentBtn: document.getElementById("saveAssignmentBtn"),
  cancelAssignmentEditBtn: document.getElementById("cancelAssignmentEditBtn"),
  assignmentFormTitle: document.getElementById("assignmentFormTitle"),
  assignmentEditBadge: document.getElementById("assignmentEditBadge"),

  pendingModal: document.getElementById("pendingModal"),
  pendingModalBackdrop: document.getElementById("pendingModalBackdrop"),
  closePendingModal: document.getElementById("closePendingModal"),
  pendingSearchInput: document.getElementById("pendingSearchInput"),
  pendingContractorsList: document.getElementById("pendingContractorsList"),
  remindAllPendingBtn: document.getElementById("remindAllPendingBtn"),

  workersListsModal: document.getElementById("workersListsModal"),
  workersListsModalBackdrop: document.getElementById("workersListsModalBackdrop"),
  closeWorkersListsModal: document.getElementById("closeWorkersListsModal"),
  exportAllWorkersCsvBtn: document.getElementById("exportAllWorkersCsvBtn"),
  workerListsContractorSearch: document.getElementById("workerListsContractorSearch"),
  workerListsAssignmentsWrap: document.getElementById("workerListsAssignmentsWrap"),
  workersTableTitle: document.getElementById("workersTableTitle"),
  workersTableSearch: document.getElementById("workersTableSearch"),
  exportSelectedListCsvBtn: document.getElementById("exportSelectedListCsvBtn"),
  selectAllWorkersCheckbox: document.getElementById("selectAllWorkersCheckbox"),
  bulkApproveWorkersBtn: document.getElementById("bulkApproveWorkersBtn"),
  bulkRejectWorkersBtn: document.getElementById("bulkRejectWorkersBtn"),
  workersTableWrap: document.getElementById("workersTableWrap")
};

const state = {
  currentUser: null,
  allEvents: [],
  filteredEvents: [],
  contractors: [],
  selectedEvent: null,
  selectedEventAssignments: [],
  pendingRows: [],
  workersListsByAssignment: [],
  selectedWorkerAssignmentId: null,
  initialEventIdFromUrl: null,
  initialContractorIdFromUrl: null,
  initialContractorNameFromUrl: ""
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.currentUser = user;
  readUrlParams();
  setDefaultMonth();

  await Promise.all([
    loadContractors(),
    loadEvents()
  ]);

  if (state.initialEventIdFromUrl) {
    await openEventFromUrl();
  }
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

  [els.refreshEventsBtn, els.refreshEventsBtnHero].forEach((btn) => {
    btn?.addEventListener("click", loadEvents);
  });

  els.prevMonthBtn?.addEventListener("click", () => shiftMonth(-1));
  els.nextMonthBtn?.addEventListener("click", () => shiftMonth(1));

  els.monthFilter?.addEventListener("change", loadEvents);
  els.specificDateFilter?.addEventListener("change", applyEventFilters);
  els.eventSearchInput?.addEventListener("input", applyEventFilters);

  els.clearFiltersBtn?.addEventListener("click", () => {
    setDefaultMonth();
    els.specificDateFilter.value = "";
    els.eventSearchInput.value = "";
    loadEvents();
  });

  els.closeAssignmentModal?.addEventListener("click", closeAssignmentModal);
  els.assignmentModalBackdrop?.addEventListener("click", closeAssignmentModal);

  els.openPendingModalBtn?.addEventListener("click", async () => {
    if (!state.selectedEvent) return;
    await openPendingModal();
  });

  els.openWorkersListsBtn?.addEventListener("click", async () => {
    if (!state.selectedEvent) return;
    await openWorkersListsModal();
  });

  els.assignedContractorSearch?.addEventListener("input", renderAssignmentsList);

  els.closePendingModal?.addEventListener("click", closePendingModal);
  els.pendingModalBackdrop?.addEventListener("click", closePendingModal);
  els.pendingSearchInput?.addEventListener("input", renderPendingRows);
  els.remindAllPendingBtn?.addEventListener("click", handleRemindAllPending);

  els.closeWorkersListsModal?.addEventListener("click", closeWorkersListsModal);
  els.workersListsModalBackdrop?.addEventListener("click", closeWorkersListsModal);

  els.workerListsContractorSearch?.addEventListener("input", renderWorkersAssignmentsList);
  els.workersTableSearch?.addEventListener("input", renderSelectedWorkersTable);
  els.exportAllWorkersCsvBtn?.addEventListener("click", exportAllWorkersCsv);
  els.exportSelectedListCsvBtn?.addEventListener("click", exportSelectedListCsv);
  els.selectAllWorkersCheckbox?.addEventListener("change", toggleSelectAllWorkers);
  els.bulkApproveWorkersBtn?.addEventListener("click", () => bulkUpdateWorkersStatus("approved"));
  els.bulkRejectWorkersBtn?.addEventListener("click", () => bulkUpdateWorkersStatus("rejected"));

  els.assignmentForm?.addEventListener("submit", handleSaveAssignment);
  els.cancelAssignmentEditBtn?.addEventListener("click", resetAssignmentForm);

  setupContractorAutocomplete();
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  state.initialEventIdFromUrl = params.get("event_id");
  state.initialContractorIdFromUrl = params.get("contractor_id");
  state.initialContractorNameFromUrl = params.get("contractor_name") || "";
}

function setDefaultMonth() {
  const now = new Date();
  els.monthFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(delta) {
  const raw = els.monthFilter.value;
  if (!raw) {
    setDefaultMonth();
    return;
  }

  const [year, month] = raw.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  els.monthFilter.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  loadEvents();
}

function showPageMessage(message, type = "error") {
  if (!els.assignmentsMsgBox) return;
  els.assignmentsMsgBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.assignmentsMsgBox) els.assignmentsMsgBox.innerHTML = "";
}

async function loadContractors() {
  const { data, error } = await supabase
    .from("contractors")
    .select("id, company_name, phone, email")
    .order("company_name", { ascending: true });

  if (error) {
    console.error("loadContractors error:", error);
    state.contractors = [];
    return;
  }

  state.contractors = data || [];
}

async function loadEvents() {
  clearPageMessage();

  const monthValue = els.monthFilter.value;
  if (!monthValue) return;

  const [year, month] = monthValue.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = formatDateISO(new Date(year, month, 1));

  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      event_date,
      arrival_time,
      end_time,
      early_workers_time,
      event_type,
      competition_type,
      city_id,
      stadium_id,
      home_team_id,
      away_team_id,
      event_name,
      manual_location,
      notes,
      requires_workers_list,
      status,
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
    `)
    .gte("event_date", start)
    .lt("event_date", end)
    .order("event_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  if (error) {
    console.error("loadEvents error:", error);
    els.eventsListWrap.innerHTML = `
      <div class="meteor-empty-state">
        <strong>שגיאה בטעינת האירועים</strong>
        <span>בדוק את המסד ונסה שוב.</span>
      </div>
    `;
    return;
  }

  state.allEvents = data || [];
  applyEventFilters();
}

function applyEventFilters() {
  const term = normalizeText(els.eventSearchInput.value);
  const specificDate = els.specificDateFilter.value || "";

  state.filteredEvents = state.allEvents.filter((event) => {
    if (specificDate && event.event_date !== specificDate) return false;

    if (!term) return true;

    const haystack = [
      event.event_date,
      getEventDisplayTitle(event),
      event.event_name,
      event.home_team?.name,
      event.away_team?.name,
      event.stadiums?.name,
      event.cities?.name_he,
      event.manual_location,
      event.competition_type
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  });

  renderEventsKpis();
  renderEvents();
}

function renderEventsKpis() {
  const total = state.filteredEvents.length;
  const openEvents = state.filteredEvents.filter((e) => getComputedEventStatus(e) === "open").length;
  const workersList = state.filteredEvents.filter((e) => !!e.requires_workers_list).length;
  const football = state.filteredEvents.filter((e) => e.event_type === "football").length;

  setKpi(els.kpiEventsCount, els.kpiEventsCountSub, total, total ? "אירועים בתצוגה הנוכחית" : "אין אירועים לחודש/סינון");
  setKpi(els.kpiOpenEvents, els.kpiOpenEventsSub, openEvents, openEvents ? "עדיין פתוחים לשיבוץ" : "אין אירועים פתוחים");
  setKpi(els.kpiWorkersList, els.kpiWorkersListSub, workersList, workersList ? "דורשים רשימת עובדים" : "אין דרישת רשימות");
  setKpi(els.kpiFootballEvents, els.kpiFootballEventsSub, football, football ? "משחקי כדורגל בחודש" : "אין משחקי כדורגל");
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

async function renderEvents() {
  const total = state.filteredEvents.length;

  if (els.eventsSummaryText) {
    els.eventsSummaryText.textContent = total
      ? `${total} אירועים מוצגים כרגע`
      : "לא נמצאו אירועים לפי הסינון";
  }

  if (!total) {
    els.eventsListWrap.innerHTML = `
      <div class="meteor-empty-state">
        <strong>לא נמצאו אירועים</strong>
        <span>נסה לשנות חודש, תאריך או חיפוש.</span>
      </div>
    `;
    return;
  }

  const ids = state.filteredEvents.map((e) => e.id);
  const statsMap = await loadAssignmentStatsForEvents(ids);

  els.eventsListWrap.innerHTML = state.filteredEvents.map((event) => {
    const stats = statsMap.get(event.id) || emptyEventStats();
    const title = getEventDisplayTitle(event);
    const location = getEventLocation(event);
    const status = getComputedEventStatus(event);
    const statusLabel = getStatusLabel(status);
    const statusClass = getStatusClass(status);

    return `
      <article class="meteor-event-card">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <div class="meteor-event-card-badges">
              <span class="meteor-mini-badge ${event.event_type === "football" ? "primary" : "muted"}">
                ${event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל"}
              </span>
              <span class="meteor-status-badge ${statusClass}">${statusLabel}</span>
              ${event.requires_workers_list ? `<span class="meteor-mini-badge warning">דורש רשימת עובדים</span>` : ""}
            </div>

            <h3>${escapeHtml(title)}</h3>

            <div class="meteor-event-meta-grid">
              <div class="meteor-event-meta-item">
                <span>תאריך</span>
                <strong>${formatDate(event.event_date)}</strong>
              </div>

              <div class="meteor-event-meta-item">
                <span>שעת התייצבות</span>
                <strong>${formatTime(event.arrival_time)}</strong>
              </div>

              <div class="meteor-event-meta-item">
                <span>מיקום</span>
                <strong>${escapeHtml(location)}</strong>
              </div>

              <div class="meteor-event-meta-item">
                <span>${event.event_type === "football" ? "מסגרת" : "שם אירוע"}</span>
                <strong>${escapeHtml(event.competition_type || event.event_name || "-")}</strong>
              </div>
            </div>

            <div class="event-card-summary-strip">
              <span>שיבוצים: <strong>${stats.assignmentsCount}</strong></span>
              <span>אישרו: <strong>${stats.approvedContractors}</strong></span>
              <span>ממתינים: <strong>${stats.pendingContractors}</strong></span>
              <span>סה״כ מוזמן: <strong>${stats.totalRequested}</strong></span>
              <span>סה״כ מאושר: <strong>${stats.totalApproved}</strong></span>
            </div>
          </div>

          <div class="meteor-event-card-actions">
            <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-open-assignment" data-id="${event.id}">
              פתח שיבוץ
            </button>
            <button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-open-pending" data-id="${event.id}">
              מי עדיין לא אישר
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.eventsListWrap.querySelectorAll(".js-open-assignment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const event = state.filteredEvents.find((item) => String(item.id) === String(btn.dataset.id));
      if (event) await openAssignmentModal(event);
    });
  });

  els.eventsListWrap.querySelectorAll(".js-open-pending").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const event = state.filteredEvents.find((item) => String(item.id) === String(btn.dataset.id));
      if (!event) return;
      state.selectedEvent = event;
      await loadAssignmentsForEvent(event.id);
      await openPendingModal();
    });
  });
}

function emptyEventStats() {
  return {
    assignmentsCount: 0,
    approvedContractors: 0,
    pendingContractors: 0,
    totalRequested: 0,
    totalApproved: 0
  };
}

async function loadAssignmentStatsForEvents(eventIds) {
  const map = new Map();

  if (!eventIds.length) return map;

  const { data, error } = await supabase
    .from("contractor_assignments")
    .select(`
      id,
      event_id,
      requested_workers,
      requested_certified,
      requested_commanders,
      requested_early_workers,
      response_status,
      assignment_status,
      counted_at,
      signature_status,
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      requested_change_workers,
      requested_change_certified,
      requested_change_commanders,
      requested_change_early_workers
    `)
    .in("event_id", eventIds);

  if (error) {
    console.error("loadAssignmentStatsForEvents error:", error);
    return map;
  }

  for (const eventId of eventIds) {
    map.set(eventId, emptyEventStats());
  }

  for (const row of data || []) {
    const stats = map.get(row.event_id) || emptyEventStats();
    const lifecycle = getAssignmentLifecycleState(row);

    if (lifecycle === "cancelled") {
      map.set(row.event_id, stats);
      continue;
    }

    stats.assignmentsCount += 1;
    stats.totalRequested += getRequestedTotal(row);

    if (countsAsApprovedForSummary(row)) {
      stats.approvedContractors += 1;
      stats.totalApproved += getApprovedTotal(row);
    }

    if (countsAsPendingForSummary(row)) {
      stats.pendingContractors += 1;
    }

    map.set(row.event_id, stats);
  }

  return map;
}

async function openEventFromUrl() {
  let event = state.allEvents.find((item) => String(item.id) === String(state.initialEventIdFromUrl));

  if (!event) {
    event = await fetchEventById(state.initialEventIdFromUrl);
  }

  if (!event) return;

  if (event.event_date) {
    const eventMonth = String(event.event_date).slice(0, 7);
    if (eventMonth && els.monthFilter.value !== eventMonth) {
      els.monthFilter.value = eventMonth;
      await loadEvents();
      event = state.allEvents.find((item) => String(item.id) === String(state.initialEventIdFromUrl)) || event;
    }
  }

  await openAssignmentModal(event, {
    prefillContractorId: state.initialContractorIdFromUrl,
    prefillContractorName: state.initialContractorNameFromUrl
  });
}

async function fetchEventById(eventId) {
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      event_date,
      arrival_time,
      end_time,
      early_workers_time,
      event_type,
      competition_type,
      city_id,
      stadium_id,
      home_team_id,
      away_team_id,
      event_name,
      manual_location,
      notes,
      requires_workers_list,
      status,
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
    `)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    console.error("fetchEventById error:", error);
    return null;
  }

  return data || null;
}

async function openAssignmentModal(event, options = {}) {
  state.selectedEvent = event;
  resetAssignmentForm();

  els.modalEventTitle.textContent = `שיבוץ קבלנים - ${getEventDisplayTitle(event)}`;
  els.modalEventSubtitle.textContent = `תאריך ${formatDate(event.event_date)} · ${escapeHtml(getEventLocation(event))}`;

  els.eventInfoTitle.textContent = getEventDisplayTitle(event);
  els.eventInfoType.textContent = event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל";

  els.eventInfoMeta.innerHTML = `
    <div class="meteor-event-meta-item">
      <span>תאריך</span>
      <strong>${formatDate(event.event_date)}</strong>
    </div>
    <div class="meteor-event-meta-item">
      <span>שעת התייצבות</span>
      <strong>${formatTime(event.arrival_time)}</strong>
    </div>
    <div class="meteor-event-meta-item">
      <span>שעת סיום</span>
      <strong>${formatTime(event.end_time)}</strong>
    </div>
    <div class="meteor-event-meta-item">
      <span>צוות מקדים</span>
      <strong>${event.early_workers_time ? formatTime(event.early_workers_time) : "אין"}</strong>
    </div>
    <div class="meteor-event-meta-item">
      <span>מיקום</span>
      <strong>${escapeHtml(getEventLocation(event))}</strong>
    </div>
    <div class="meteor-event-meta-item">
      <span>${event.event_type === "football" ? "מסגרת" : "שם"}</span>
      <strong>${escapeHtml(event.competition_type || event.event_name || "-")}</strong>
    </div>
  `;

  await loadAssignmentsForEvent(event.id);

  if (options.prefillContractorName) {
    els.assignedContractorSearch.value = options.prefillContractorName;
  }

  openModal(els.assignmentModal, els.assignmentModalBackdrop);
}

function closeAssignmentModal() {
  closeModal(els.assignmentModal, els.assignmentModalBackdrop);
  state.selectedEvent = null;
  state.selectedEventAssignments = [];
}

async function loadAssignmentsForEvent(eventId) {
  const { data, error } = await supabase
    .from("contractor_assignments")
    .select(`
      id,
      event_id,
      contractor_id,
      requested_workers,
      requested_certified,
      requested_commanders,
      requested_early_workers,
      response_status,
      assignment_status,
      requested_change_workers,
      requested_change_certified,
      requested_change_commanders,
      requested_change_early_workers,
      contractor_response_note,
      admin_note,
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      counted_at,
      signature_status,
      contractor:contractor_id (
        id,
        company_name,
        phone,
        email
      )
    `)
    .eq("event_id", eventId)
    .order("id", { ascending: true });

  if (error) {
    console.error("loadAssignmentsForEvent error:", error);
    state.selectedEventAssignments = [];
  } else {
    state.selectedEventAssignments = data || [];
  }

  renderTotals();
  renderAssignmentsList();
}

function renderTotals() {
  let totalWorkers = 0;
  let totalCertified = 0;
  let totalCommanders = 0;
  let totalEarly = 0;
  let approvedContractors = 0;
  let approvedPeople = 0;
  let pendingCount = 0;

  for (const item of state.selectedEventAssignments) {
    const lifecycle = getAssignmentLifecycleState(item);

    if (lifecycle === "cancelled") continue;

    totalWorkers += Number(item.requested_workers || 0);
    totalCertified += Number(item.requested_certified || 0);
    totalCommanders += Number(item.requested_commanders || 0);
    totalEarly += Number(item.requested_early_workers || 0);

    if (countsAsApprovedForSummary(item)) {
      approvedContractors += 1;
      approvedPeople += getApprovedTotal(item);
    }

    if (countsAsPendingForSummary(item)) {
      pendingCount += 1;
    }
  }

  els.totalWorkers.textContent = String(totalWorkers);
  els.totalCertified.textContent = String(totalCertified);
  els.totalCommanders.textContent = String(totalCommanders);
  els.totalEarly.textContent = String(totalEarly);
  els.totalGrand.textContent = String(totalWorkers + totalCertified + totalCommanders + totalEarly);
  els.approvedContractorsCount.textContent = String(approvedContractors);
  els.approvedPeopleTotal.textContent = String(approvedPeople);
  els.pendingContractorsCount.textContent = String(pendingCount);
}

function renderAssignmentsList() {
  const list = state.selectedEventAssignments;
  const term = normalizeText(els.assignedContractorSearch.value);

  if (!list.length) {
    els.assignmentsList.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>אין שיבוצים</strong>
        <span>עדיין לא שובצו קבלנים לאירוע זה.</span>
      </div>
    `;
    return;
  }

  const filtered = list.filter((item) => {
    const haystack = [
      item.contractor?.company_name,
      item.contractor?.phone,
      String(item.contractor_id || "")
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(term);
  });

  if (!filtered.length) {
    els.assignmentsList.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>לא נמצאו קבלנים</strong>
        <span>נסה חיפוש אחר.</span>
      </div>
    `;
    return;
  }

  els.assignmentsList.innerHTML = filtered.map((item) => {
    const lifecycle = getAssignmentLifecycleState(item);
    const statusLabel = getAssignmentLifecycleLabel(item);
    const badgeClass = getAssignmentLifecycleBadgeClass(item);
    const hasChangeRequest = lifecycle === "waiting_manager_change";
    const isCancelled = lifecycle === "cancelled";
    const isRejected = lifecycle === "rejected";
    const isMonthlyClosed = lifecycle === "monthly_closed";
    const actions = [];

    if (!isCancelled && !isMonthlyClosed) {
      actions.push(`<button class="meteor-btn meteor-btn-outline meteor-btn-sm js-edit-assignment" data-id="${item.id}" type="button">עדכן</button>`);
    }

    if (lifecycle === "pending_response" || lifecycle === "waiting_manager_change") {
      actions.push(`<button class="meteor-btn meteor-btn-primary meteor-btn-sm js-remind-assignment" data-id="${item.id}" type="button">שלח תזכורת</button>`);
    }

    if (hasChangeRequest) {
      actions.push(`<button class="meteor-btn meteor-btn-outline meteor-btn-sm js-approve-change" data-id="${item.id}" type="button">אשר שינוי כמות</button>`);
    }

    if (state.selectedEvent?.requires_workers_list && !isCancelled && !isRejected) {
      actions.push(`<button class="meteor-btn meteor-btn-outline meteor-btn-sm js-open-workers" data-id="${item.id}" type="button">רשימת עובדים</button>`);
    }

    if (!isCancelled && !isMonthlyClosed) {
      actions.push(`<button class="meteor-btn meteor-btn-danger-soft meteor-btn-sm js-delete-assignment" data-id="${item.id}" type="button">בטל שיבוץ</button>`);
    }

    return `
      <article class="meteor-event-card assignment-row-card ${lifecycle}">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <div class="meteor-event-card-badges">
              <span class="meteor-status-badge ${badgeClass}">${statusLabel}</span>
              <span class="meteor-mini-badge muted">סה״כ מוזמן: ${getRequestedTotal(item)}</span>
              ${countsAsApprovedForSummary(item) ? `<span class="meteor-mini-badge primary">מאושר: ${getApprovedTotal(item)}</span>` : ""}
              ${hasChangeRequest ? `<span class="meteor-mini-badge warning">יש בקשת שינוי</span>` : ""}
              ${item.signature_status === "signed" ? `<span class="meteor-mini-badge primary">חתום</span>` : ""}
            </div>

            <h3>${escapeHtml(item.contractor?.company_name || "קבלן")}</h3>

            <div class="meteor-event-meta-grid">
              <div class="meteor-event-meta-item">
                <span>דיילים</span>
                <strong>${Number(item.requested_workers || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>תעודות</span>
                <strong>${Number(item.requested_certified || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מפקדים</span>
                <strong>${Number(item.requested_commanders || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מקדים</span>
                <strong>${Number(item.requested_early_workers || 0)}</strong>
              </div>
            </div>

            ${hasChangeRequest ? `
              <p class="meteor-event-notes">
                בקשת שינוי: דיילים ${Number(item.requested_change_workers || 0)} |
                תעודות ${Number(item.requested_change_certified || 0)} |
                מפקדים ${Number(item.requested_change_commanders || 0)} |
                מקדים ${Number(item.requested_change_early_workers || 0)}
              </p>
            ` : ""}
          </div>

          <div class="meteor-event-card-actions">
            ${actions.join("")}
          </div>
        </div>
      </article>
    `;
  }).join("");

  attachAssignmentActions();
}

function attachAssignmentActions() {
  els.assignmentsList.querySelectorAll(".js-edit-assignment").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.selectedEventAssignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) populateAssignmentForm(row);
    });
  });

  els.assignmentsList.querySelectorAll(".js-remind-assignment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.selectedEventAssignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await sendReminderToAssignment(row, true);
    });
  });

  els.assignmentsList.querySelectorAll(".js-approve-change").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.selectedEventAssignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await approveChangeRequest(row);
    });
  });

  els.assignmentsList.querySelectorAll(".js-open-workers").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await openWorkersListsModal(btn.dataset.id);
    });
  });

  els.assignmentsList.querySelectorAll(".js-delete-assignment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.selectedEventAssignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await deleteAssignment(row);
    });
  });
}

function setupContractorAutocomplete() {
  els.contractorSearch?.addEventListener("input", () => {
    els.contractorId.value = "";
    renderContractorAutocomplete();
  });

  els.contractorSearch?.addEventListener("focus", renderContractorAutocomplete);

  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".meteor-autocomplete");
    if (!inside) {
      els.contractorResults.classList.remove("is-open");
      els.contractorResults.innerHTML = "";
    }
  });
}

function renderContractorAutocomplete() {
  const term = normalizeText(els.contractorSearch.value);

  const filtered = state.contractors
    .filter((item) => normalizeText(item.company_name).includes(term))
    .slice(0, 8);

  if (!filtered.length) {
    els.contractorResults.innerHTML = "";
    els.contractorResults.classList.remove("is-open");
    return;
  }

  els.contractorResults.innerHTML = filtered.map((item) => `
    <button type="button" class="meteor-autocomplete-item js-contractor-option" data-id="${item.id}">
      <span class="meteor-autocomplete-main">${escapeHtml(item.company_name)}</span>
      <span class="meteor-autocomplete-meta">${escapeHtml(item.phone || "")}</span>
    </button>
  `).join("");

  els.contractorResults.classList.add("is-open");

  els.contractorResults.querySelectorAll(".js-contractor-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const contractor = filtered.find((x) => String(x.id) === String(btn.dataset.id));
      if (!contractor) return;

      els.contractorId.value = String(contractor.id);
      els.contractorSearch.value = contractor.company_name;
      els.contractorResults.innerHTML = "";
      els.contractorResults.classList.remove("is-open");
    });
  });
}

async function handleSaveAssignment(event) {
  event.preventDefault();

  if (!state.selectedEvent) return;

  const contractorId = Number(els.contractorId.value || 0);
  if (!contractorId) {
    showPageMessage("יש לבחור קבלן מתוך הרשימה.", "warning");
    return;
  }

  const requestedWorkers = Number(els.requestedWorkers.value || 0);
  const requestedCertified = Number(els.requestedCertified.value || 0);
  const requestedCommanders = Number(els.requestedCommanders.value || 0);
  const requestedEarlyWorkers = Number(els.requestedEarlyWorkers.value || 0);

  if ((requestedWorkers + requestedCertified + requestedCommanders + requestedEarlyWorkers) <= 0) {
    showPageMessage("יש למלא לפחות כמות אחת גדולה מ-0.", "warning");
    return;
  }

  const payload = {
    event_id: state.selectedEvent.id,
    contractor_id: contractorId,
    requested_workers: requestedWorkers,
    requested_certified: requestedCertified,
    requested_commanders: requestedCommanders,
    requested_early_workers: requestedEarlyWorkers
  };

  const contractor = state.contractors.find((x) => Number(x.id) === contractorId);
  const editingId = Number(els.assignmentId.value || 0);

  try {
    setAssignmentLoading(true);

    if (editingId) {
      const existing = state.selectedEventAssignments.find((x) => Number(x.id) === editingId);

      const { error } = await supabase
        .from("contractor_assignments")
        .update({
          ...payload,
          response_status: existing?.response_status || "pending",
          assignment_status: existing?.assignment_status || "active"
        })
        .eq("id", editingId);

      if (error) throw error;

      await sendAssignmentNotification({
        contractor,
        event: state.selectedEvent,
        mode: "update"
      });

      showPageMessage("השיבוץ עודכן בהצלחה.", "success");
    } else {
      const existing = state.selectedEventAssignments.find((x) => Number(x.contractor_id) === contractorId && getAssignmentLifecycleState(x) !== "cancelled");
      if (existing) {
        showPageMessage("הקבלן כבר משובץ לאירוע. אפשר לערוך את השיבוץ הקיים.", "warning");
        return;
      }

      const { error } = await supabase
        .from("contractor_assignments")
        .insert({
          ...payload,
          response_status: "pending",
          assignment_status: "active",
          signature_status: "not_sent"
        });

      if (error) throw error;

      await sendAssignmentNotification({
        contractor,
        event: state.selectedEvent,
        mode: "new"
      });

      showPageMessage("השיבוץ נשמר בהצלחה.", "success");
    }

    await loadAssignmentsForEvent(state.selectedEvent.id);
    await renderEvents();
    resetAssignmentForm();
  } catch (error) {
    console.error("handleSaveAssignment error:", error);
    showPageMessage("אירעה שגיאה בשמירת השיבוץ.", "error");
  } finally {
    setAssignmentLoading(false);
  }
}

function populateAssignmentForm(row) {
  els.assignmentId.value = String(row.id);
  els.contractorId.value = String(row.contractor_id);
  els.contractorSearch.value = row.contractor?.company_name || "";
  els.requestedWorkers.value = String(Number(row.requested_workers || 0));
  els.requestedCertified.value = String(Number(row.requested_certified || 0));
  els.requestedCommanders.value = String(Number(row.requested_commanders || 0));
  els.requestedEarlyWorkers.value = String(Number(row.requested_early_workers || 0));

  els.assignmentFormTitle.textContent = "עדכון שיבוץ קבלן";
  els.assignmentEditBadge.classList.remove("d-none");
  els.cancelAssignmentEditBtn.classList.remove("d-none");

  const textEl = els.saveAssignmentBtn.querySelector(".btn-text");
  if (textEl) textEl.textContent = "עדכן שיבוץ";
}

function resetAssignmentForm() {
  els.assignmentForm?.reset();
  els.assignmentId.value = "";
  els.contractorId.value = "";
  els.contractorSearch.value = "";
  els.requestedWorkers.value = "0";
  els.requestedCertified.value = "0";
  els.requestedCommanders.value = "0";
  els.requestedEarlyWorkers.value = "0";

  els.assignmentFormTitle.textContent = "שיבוץ קבלן לאירוע";
  els.assignmentEditBadge.classList.add("d-none");
  els.cancelAssignmentEditBtn.classList.add("d-none");

  const textEl = els.saveAssignmentBtn.querySelector(".btn-text");
  if (textEl) textEl.textContent = "שמור שיבוץ";
}

function setAssignmentLoading(isLoading) {
  els.saveAssignmentBtn.disabled = isLoading;
  els.saveAssignmentBtn.classList.toggle("is-loading", isLoading);

  const textEl = els.saveAssignmentBtn.querySelector(".btn-text");
  const loaderEl = els.saveAssignmentBtn.querySelector(".btn-loader");

  if (textEl) {
    textEl.textContent = isLoading
      ? "שומר..."
      : (els.assignmentId.value ? "עדכן שיבוץ" : "שמור שיבוץ");
  }

  if (loaderEl) {
    loaderEl.classList.toggle("d-none", !isLoading);
  }
}

async function deleteAssignment(row) {
  const ok = window.confirm("לבטל את השיבוץ לקבלן זה?");
  if (!ok) return;

  try {
    const { error } = await supabase
      .from("contractor_assignments")
      .update(buildCancelAssignmentUpdate())
      .eq("id", row.id);

    if (error) throw error;

    await sendAssignmentNotification({
      contractor: row.contractor,
      event: state.selectedEvent,
      mode: "delete"
    });

    showPageMessage("השיבוץ בוטל בהצלחה.", "success");

    await loadAssignmentsForEvent(state.selectedEvent.id);
    await renderEvents();
    resetAssignmentForm();
  } catch (error) {
    console.error("deleteAssignment error:", error);
    showPageMessage("לא ניתן לבטל את השיבוץ כרגע.", "error");
  }
}

async function openPendingModal() {
  const pending = filterPendingAssignments(state.selectedEventAssignments);
  const changeRequested = filterChangeRequestedAssignments(state.selectedEventAssignments);

  state.pendingRows = [...pending, ...changeRequested];
  els.pendingSearchInput.value = "";
  renderPendingRows();
  openModal(els.pendingModal, els.pendingModalBackdrop);
}

function closePendingModal() {
  closeModal(els.pendingModal, els.pendingModalBackdrop);
  state.pendingRows = [];
}

function renderPendingRows() {
  const term = normalizeText(els.pendingSearchInput.value);
  const rows = state.pendingRows.filter((row) => {
    const haystack = [
      row.contractor?.company_name,
      row.contractor?.phone
    ].filter(Boolean).join(" ").toLowerCase();

    return haystack.includes(term);
  });

  if (!rows.length) {
    els.pendingContractorsList.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>אין קבלנים ממתינים</strong>
        <span>לא נמצאו תוצאות לפי החיפוש.</span>
      </div>
    `;
    return;
  }

  els.pendingContractorsList.innerHTML = rows.map((row) => {
    const lifecycleLabel = getAssignmentLifecycleLabel(row);
    const lifecycleClass = getAssignmentLifecycleBadgeClass(row);
    const hasChangeRequest = isWaitingManagerChangeApproval(row);

    return `
      <article class="meteor-event-card">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <div class="meteor-event-card-badges">
              <span class="meteor-status-badge ${lifecycleClass}">${lifecycleLabel}</span>
              <span class="meteor-mini-badge muted">סה״כ מוזמן: ${getRequestedTotal(row)}</span>
              ${hasChangeRequest ? `<span class="meteor-mini-badge warning">בקשת שינוי פתוחה</span>` : ""}
            </div>

            <h3>${escapeHtml(row.contractor?.company_name || "קבלן")}</h3>

            <div class="meteor-event-meta-grid">
              <div class="meteor-event-meta-item">
                <span>דיילים</span>
                <strong>${Number(row.requested_workers || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>תעודות</span>
                <strong>${Number(row.requested_certified || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מפקדים</span>
                <strong>${Number(row.requested_commanders || 0)}</strong>
              </div>
              <div class="meteor-event-meta-item">
                <span>מקדים</span>
                <strong>${Number(row.requested_early_workers || 0)}</strong>
              </div>
            </div>
          </div>

          <div class="meteor-event-card-actions">
            ${hasChangeRequest ? `<button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-approve-change-pending" data-id="${row.id}">אשר שינוי כמות</button>` : ""}
            <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-remind-pending" data-id="${row.id}">
              שלח תזכורת
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.pendingContractorsList.querySelectorAll(".js-remind-pending").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.pendingRows.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await sendReminderToAssignment(row, true);
    });
  });

  els.pendingContractorsList.querySelectorAll(".js-approve-change-pending").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.pendingRows.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) {
        await approveChangeRequest(row);
        await openPendingModal();
      }
    });
  });
}

async function handleRemindAllPending() {
  if (!state.pendingRows.length) {
    showPageMessage("אין קבלנים ממתינים לשלוח להם תזכורת.", "warning");
    return;
  }

  els.remindAllPendingBtn.disabled = true;

  try {
    let success = 0;
    let failed = 0;

    for (const row of state.pendingRows) {
      const result = await sendReminderToAssignment(row, false);
      if (result.ok) success += 1;
      else failed += 1;
    }

    if (failed === 0) {
      showPageMessage(`נשלחו ${success} תזכורות בהצלחה.`, "success");
    } else {
      showPageMessage(`נשלחו ${success} תזכורות, ו-${failed} נכשלו.`, "warning");
    }
  } finally {
    els.remindAllPendingBtn.disabled = false;
  }
}

async function openWorkersListsModal(preselectAssignmentId = null) {
  await loadWorkersListsForEvent();

  els.workerListsContractorSearch.value = "";
  els.workersTableSearch.value = "";
  els.selectAllWorkersCheckbox.checked = false;

  if (preselectAssignmentId && state.workersListsByAssignment.some((x) => String(x.assignment_id) === String(preselectAssignmentId))) {
    state.selectedWorkerAssignmentId = preselectAssignmentId;
  } else {
    state.selectedWorkerAssignmentId = state.workersListsByAssignment[0]?.assignment_id || null;
  }

  renderWorkersAssignmentsList();
  renderSelectedWorkersTable();

  openModal(els.workersListsModal, els.workersListsModalBackdrop);
}

function closeWorkersListsModal() {
  closeModal(els.workersListsModal, els.workersListsModalBackdrop);
  state.workersListsByAssignment = [];
  state.selectedWorkerAssignmentId = null;
}

async function loadWorkersListsForEvent() {
  const assignmentIds = state.selectedEventAssignments
    .filter((item) => getAssignmentLifecycleState(item) !== "cancelled")
    .map((item) => item.id);

  if (!assignmentIds.length) {
    state.workersListsByAssignment = [];
    return;
  }

  const { data, error } = await supabase
    .from("contractor_assignment_workers")
    .select(`
      id,
      assignment_id,
      contractor_id,
      full_name,
      id_number,
      is_certified,
      is_spare,
      worker_status,
      review_note,
      contractor:contractor_id (
        id,
        company_name
      )
    `)
    .in("assignment_id", assignmentIds)
    .order("assignment_id", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("loadWorkersListsForEvent error:", error);
    state.workersListsByAssignment = [];
    return;
  }

  const grouped = new Map();

  for (const row of data || []) {
    if (!grouped.has(row.assignment_id)) {
      grouped.set(row.assignment_id, {
        assignment_id: row.assignment_id,
        contractor_id: row.contractor_id,
        contractor_name: row.contractor?.company_name || "קבלן",
        workers: []
      });
    }
    grouped.get(row.assignment_id).workers.push(row);
  }

  state.workersListsByAssignment = Array.from(grouped.values());
}

function renderWorkersAssignmentsList() {
  const term = normalizeText(els.workerListsContractorSearch.value);

  const rows = state.workersListsByAssignment.filter((group) =>
    normalizeText(group.contractor_name).includes(term)
  );

  if (!rows.length) {
    els.workerListsAssignmentsWrap.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>אין רשימות עובדים</strong>
        <span>לא נמצאו תוצאות.</span>
      </div>
    `;
    return;
  }

  els.workerListsAssignmentsWrap.innerHTML = rows.map((group) => {
    const approvedCount = group.workers.filter((w) => w.worker_status === "approved").length;
    const rejectedCount = group.workers.filter((w) => w.worker_status === "rejected").length;
    const pendingCount = group.workers.filter((w) => w.worker_status === "pending").length;
    const isActive = String(group.assignment_id) === String(state.selectedWorkerAssignmentId);

    return `
      <article class="meteor-event-card ${isActive ? "workers-assignment-active" : ""}">
        <div class="meteor-event-card-top">
          <div class="meteor-event-card-main">
            <h3>${escapeHtml(group.contractor_name)}</h3>
            <div class="meteor-event-card-badges">
              <span class="meteor-mini-badge primary">מאושרים: ${approvedCount}</span>
              <span class="meteor-mini-badge warning">ממתינים: ${pendingCount}</span>
              <span class="meteor-mini-badge muted">נדחו: ${rejectedCount}</span>
            </div>
          </div>

          <div class="meteor-event-card-actions">
            <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-select-workers-list" data-id="${group.assignment_id}">
              פתח רשימה
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  els.workerListsAssignmentsWrap.querySelectorAll(".js-select-workers-list").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedWorkerAssignmentId = btn.dataset.id;
      els.selectAllWorkersCheckbox.checked = false;
      renderWorkersAssignmentsList();
      renderSelectedWorkersTable();
    });
  });
}

function renderSelectedWorkersTable() {
  const group = state.workersListsByAssignment.find(
    (x) => String(x.assignment_id) === String(state.selectedWorkerAssignmentId)
  );

  if (!group) {
    els.workersTableTitle.textContent = "בחר קבלן להצגת הרשימה";
    els.workersTableWrap.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>לא נבחר קבלן</strong>
        <span>בחר קבלן כדי לראות את רשימת העובדים.</span>
      </div>
    `;
    return;
  }

  els.workersTableTitle.textContent = `רשימת עובדים - ${group.contractor_name}`;

  const term = normalizeText(els.workersTableSearch.value);
  const workers = group.workers.filter((worker) => {
    const haystack = `${worker.full_name || ""} ${worker.id_number || ""}`.toLowerCase();
    return haystack.includes(term);
  });

  if (!workers.length) {
    els.workersTableWrap.innerHTML = `
      <div class="meteor-empty-state small">
        <strong>לא נמצאו עובדים</strong>
        <span>נסה חיפוש אחר.</span>
      </div>
    `;
    return;
  }

  els.workersTableWrap.innerHTML = `
    <div class="workers-table-grid">
      <div class="workers-table-head">סמן</div>
      <div class="workers-table-head">שם מלא</div>
      <div class="workers-table-head">ת״ז</div>
      <div class="workers-table-head">תעודה</div>
      <div class="workers-table-head">ספייר</div>
      <div class="workers-table-head">סטטוס</div>
      <div class="workers-table-head">פעולות</div>

      ${workers.map((worker) => `
        <div class="workers-table-cell">
          <input class="worker-row-checkbox" type="checkbox" value="${worker.id}" />
        </div>
        <div class="workers-table-cell"><strong>${escapeHtml(worker.full_name || "-")}</strong></div>
        <div class="workers-table-cell">${escapeHtml(worker.id_number || "-")}</div>
        <div class="workers-table-cell">${worker.is_certified ? "כן" : "לא"}</div>
        <div class="workers-table-cell">${worker.is_spare ? "כן" : "לא"}</div>
        <div class="workers-table-cell">
          <span class="meteor-status-badge ${getWorkerStatusClass(worker.worker_status)}">
            ${getWorkerStatusLabel(worker.worker_status)}
          </span>
        </div>
        <div class="workers-table-cell">
          <div class="d-flex gap-2 flex-wrap">
            <button class="meteor-btn meteor-btn-primary meteor-btn-sm js-approve-worker" data-id="${worker.id}" type="button">אשר</button>
            <button class="meteor-btn meteor-btn-danger-soft meteor-btn-sm js-reject-worker" data-id="${worker.id}" type="button">דחה</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  els.workersTableWrap.querySelectorAll(".js-approve-worker").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateWorkerStatus(btn.dataset.id, "approved");
    });
  });

  els.workersTableWrap.querySelectorAll(".js-reject-worker").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await updateWorkerStatus(btn.dataset.id, "rejected");
    });
  });
}

function toggleSelectAllWorkers() {
  els.workersTableWrap.querySelectorAll(".worker-row-checkbox").forEach((checkbox) => {
    checkbox.checked = els.selectAllWorkersCheckbox.checked;
  });
}

function getSelectedWorkerIds() {
  return Array.from(els.workersTableWrap.querySelectorAll(".worker-row-checkbox:checked"))
    .map((el) => Number(el.value));
}

async function bulkUpdateWorkersStatus(status) {
  const ids = getSelectedWorkerIds();
  if (!ids.length) {
    showPageMessage("יש לבחור לפחות עובד אחד.", "warning");
    return;
  }

  const { error } = await supabase
    .from("contractor_assignment_workers")
    .update({
      worker_status: status,
      reviewed_at: new Date().toISOString()
    })
    .in("id", ids);

  if (error) {
    console.error("bulkUpdateWorkersStatus error:", error);
    showPageMessage("שגיאה בעדכון מרובה.", "error");
    return;
  }

  showPageMessage(status === "approved" ? "העובדים אושרו." : "העובדים נדחו.", "success");
  await refreshWorkersListsAfterUpdate();
}

async function updateWorkerStatus(workerId, status) {
  const { error } = await supabase
    .from("contractor_assignment_workers")
    .update({
      worker_status: status,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", workerId);

  if (error) {
    console.error("updateWorkerStatus error:", error);
    showPageMessage("שגיאה בעדכון סטטוס עובד.", "error");
    return;
  }

  showPageMessage(status === "approved" ? "העובד אושר." : "העובד נדחה.", "success");
  await refreshWorkersListsAfterUpdate();
}

async function refreshWorkersListsAfterUpdate() {
  await loadWorkersListsForEvent();
  renderWorkersAssignmentsList();
  renderSelectedWorkersTable();
  els.selectAllWorkersCheckbox.checked = false;
}

async function approveChangeRequest(row) {
  if (!isWaitingManagerChangeApproval(row)) {
    showPageMessage("אין בקשת שינוי פתוחה עבור שיבוץ זה.", "warning");
    return;
  }

  const { error } = await supabase
    .from("contractor_assignments")
    .update(buildApproveChangeRequestApply(row))
    .eq("id", row.id);

  if (error) {
    console.error("approveChangeRequest error:", error);
    showPageMessage("שגיאה באישור שינוי הכמות.", "error");
    return;
  }

  await sendAssignmentNotification({
    contractor: row.contractor,
    event: state.selectedEvent,
    mode: "update"
  });

  showPageMessage("שינוי הכמות אושר ועודכן בשיבוץ.", "success");
  await loadAssignmentsForEvent(state.selectedEvent.id);
  await renderEvents();
}

function normalizeWhatsappPhone(rawPhone) {
  let phone = String(rawPhone || "").trim();
  if (!phone) return "";

  phone = phone.replace(/[^\d+]/g, "");

  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.startsWith("972")) return phone;
  if (phone.startsWith("0")) return `972${phone.slice(1)}`;

  return phone;
}

async function sendWhatsappMessage(phone, message) {
  const cleanPhone = normalizeWhatsappPhone(phone);
  if (!cleanPhone) return { ok: false, reason: "missing_phone" };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        reason: data?.error || "send_failed"
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error?.message || "network_error"
    };
  }
}

function buildAssignmentMessage({ contractor, event, mode = "new" }) {
  const contractorName = contractor?.company_name || "קבלן";
  const eventTitle = getEventDisplayTitle(event);
  const eventDate = formatDate(event?.event_date || "");
  const location = getEventLocation(event);

  let headline = "יש לך שיבוץ חדש במערכת מטאור אבטחה.";
  if (mode === "update") headline = "השיבוץ שלך עודכן במערכת מטאור אבטחה.";
  if (mode === "delete") headline = "השיבוץ שלך בוטל במערכת מטאור אבטחה.";
  if (mode === "reminder") headline = "תזכורת: יש לך שיבוץ שממתין לאישור במערכת מטאור אבטחה.";

  return [
    `שלום ${contractorName},`,
    "",
    headline,
    "",
    `אירוע: ${eventTitle}`,
    `תאריך: ${eventDate}`,
    `מיקום: ${location}`,
    "",
    "נא להיכנס למערכת כדי לצפות בפרטים ולעדכן סטטוס."
  ].join("\n");
}

async function sendAssignmentNotification({ contractor, event, mode }) {
  if (!contractor?.phone) return { ok: false, reason: "missing_phone" };

  const message = buildAssignmentMessage({
    contractor,
    event,
    mode
  });

  return sendWhatsappMessage(contractor.phone, message);
}

async function sendReminderToAssignment(row, showMessageAfter = true) {
  const result = await sendAssignmentNotification({
    contractor: row.contractor,
    event: state.selectedEvent,
    mode: "reminder"
  });

  if (showMessageAfter) {
    if (result.ok) {
      showPageMessage("התזכורת נשלחה בהצלחה.", "success");
    } else if (result.reason === "missing_phone") {
      showPageMessage("לא נשלחה תזכורת כי אין מספר טלפון תקין לקבלן.", "warning");
    } else {
      showPageMessage("שליחת התזכורת נכשלה.", "error");
    }
  }

  return result;
}

function openModal(modalEl, backdropEl) {
  modalEl.classList.add("is-open");
  backdropEl.classList.add("is-open");
  modalEl.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal(modalEl, backdropEl) {
  modalEl.classList.remove("is-open");
  backdropEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function countsAsApprovedForSummary(row) {
  return isApprovedWaitingCount(row) || isWaitingSignature(row) || isSignedAndMonthlyClosed(row);
}

function countsAsPendingForSummary(row) {
  return isPendingResponse(row) || isWaitingManagerChangeApproval(row);
}

function getEventDisplayTitle(event) {
  if (!event) return "---";

  if (event.event_type === "football") {
    return `${event.home_team?.name || "בית"} - ${event.away_team?.name || "חוץ"}`;
  }

  return event.event_name || "אירוע";
}

function getEventLocation(event) {
  if (!event) return "---";
  return event.stadiums?.name || event.manual_location || event.cities?.name_he || "ללא מיקום";
}

function getComputedEventStatus(event) {
  const today = formatDateISO(new Date());
  if (event.status === "cancelled") return "cancelled";
  if (event.event_date < today) return "closed";
  return "open";
}

function getWorkerStatusLabel(status) {
  switch (status) {
    case "approved":
      return "מאושר";
    case "rejected":
      return "נדחה";
    default:
      return "ממתין";
  }
}

function getWorkerStatusClass(status) {
  switch (status) {
    case "approved":
      return "is-open";
    case "rejected":
      return "is-cancelled";
    default:
      return "is-closed";
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "open":
      return "פתוח";
    case "closed":
      return "סגור";
    case "cancelled":
      return "בוטל";
    default:
      return "לא ידוע";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "open":
      return "is-open";
    case "closed":
      return "is-closed";
    case "cancelled":
      return "is-cancelled";
    default:
      return "";
  }
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatTime(timeString) {
  if (!timeString) return "--:--";
  return String(timeString).slice(0, 5);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function downloadCsv(rows, filename) {
  if (!rows?.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function sanitizeFilename(value) {
  return String(value || "list")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

function exportAllWorkersCsv() {
  const rows = [];

  for (const group of state.workersListsByAssignment) {
    for (const worker of group.workers) {
      rows.push({
        contractor: group.contractor_name,
        full_name: worker.full_name,
        id_number: worker.id_number,
        is_certified: worker.is_certified ? "כן" : "לא",
        is_spare: worker.is_spare ? "כן" : "לא",
        worker_status: getWorkerStatusLabel(worker.worker_status)
      });
    }
  }

  if (!rows.length) {
    showPageMessage("אין רשימות עובדים לייצוא.", "warning");
    return;
  }

  downloadCsv(rows, `all_workers_lists_event_${state.selectedEvent?.id || "event"}.csv`);
}

function exportSelectedListCsv() {
  const group = state.workersListsByAssignment.find(
    (x) => String(x.assignment_id) === String(state.selectedWorkerAssignmentId)
  );

  if (!group || !group.workers.length) {
    showPageMessage("אין רשימה נבחרת לייצוא.", "warning");
    return;
  }

  const rows = group.workers.map((worker) => ({
    contractor: group.contractor_name,
    full_name: worker.full_name,
    id_number: worker.id_number,
    is_certified: worker.is_certified ? "כן" : "לא",
    is_spare: worker.is_spare ? "כן" : "לא",
    worker_status: getWorkerStatusLabel(worker.worker_status)
  }));

  downloadCsv(rows, `workers_${sanitizeFilename(group.contractor_name)}_${group.assignment_id}.csv`);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}