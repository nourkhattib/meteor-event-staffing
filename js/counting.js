import { supabase } from "./supabase.js";
import { requireAuth, logout } from "./auth.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import {
  getRequestedTotal,
  getActualTotal,
  isApprovedWaitingCount,
  isWaitingSignature,
  isSignedAndMonthlyClosed,
  getAssignmentLifecycleState
} from "./assignment-state.js";

const ARRIVAL_STORAGE_KEY = "meteor_worker_arrival_marks_v1";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  refreshCountingBtnHero: document.getElementById("refreshCountingBtnHero"),
  refreshCountingBtn: document.getElementById("refreshCountingBtn"),
  clearCountingFiltersBtn: document.getElementById("clearCountingFiltersBtn"),
  prevDayBtn: document.getElementById("prevDayBtn"),
  nextDayBtn: document.getElementById("nextDayBtn"),

  countingMsgBox: document.getElementById("countingMsgBox"),

  countingDateFilter: document.getElementById("countingDateFilter"),
  countingSearchInput: document.getElementById("countingSearchInput"),
  countingTypeFilter: document.getElementById("countingTypeFilter"),

  kpiTodayEvents: document.getElementById("kpiTodayEvents"),
  kpiTodayEventsSub: document.getElementById("kpiTodayEventsSub"),
  kpiApprovedContractors: document.getElementById("kpiApprovedContractors"),
  kpiApprovedContractorsSub: document.getElementById("kpiApprovedContractorsSub"),
  kpiWaitingCount: document.getElementById("kpiWaitingCount"),
  kpiWaitingCountSub: document.getElementById("kpiWaitingCountSub"),
  kpiWaitingSignature: document.getElementById("kpiWaitingSignature"),
  kpiWaitingSignatureSub: document.getElementById("kpiWaitingSignatureSub"),

  countingSummaryText: document.getElementById("countingSummaryText"),
  countingEventsList: document.getElementById("countingEventsList"),

  countingModal: document.getElementById("countingModal"),
  countingModalBackdrop: document.getElementById("countingModalBackdrop"),
  closeCountingModal: document.getElementById("closeCountingModal"),
  countingModalTitle: document.getElementById("countingModalTitle"),
  countingModalSubtitle: document.getElementById("countingModalSubtitle"),
  countingEventInfoTitle: document.getElementById("countingEventInfoTitle"),
  countingEventInfoType: document.getElementById("countingEventInfoType"),
  countingEventInfoMeta: document.getElementById("countingEventInfoMeta"),

  summaryApprovedContractors: document.getElementById("summaryApprovedContractors"),
  summaryCountedContractors: document.getElementById("summaryCountedContractors"),
  summaryRemainingContractors: document.getElementById("summaryRemainingContractors"),
  summaryWaitingSignature: document.getElementById("summaryWaitingSignature"),

  summaryRequestedWorkers: document.getElementById("summaryRequestedWorkers"),
  summaryRequestedCertified: document.getElementById("summaryRequestedCertified"),
  summaryRequestedCommanders: document.getElementById("summaryRequestedCommanders"),
  summaryRequestedEarly: document.getElementById("summaryRequestedEarly"),
  summaryApprovedPeople: document.getElementById("summaryApprovedPeople"),
  summaryActualPeople: document.getElementById("summaryActualPeople"),

  countingContractorSearch: document.getElementById("countingContractorSearch"),
  countingStatusFilter: document.getElementById("countingStatusFilter"),
  countingAssignmentsList: document.getElementById("countingAssignmentsList"),

  workersCompareModal: document.getElementById("workersCompareModal"),
  workersCompareModalBackdrop: document.getElementById("workersCompareModalBackdrop"),
  closeWorkersCompareModal: document.getElementById("closeWorkersCompareModal"),
  workersCompareTitle: document.getElementById("workersCompareTitle"),
  workersCompareSubtitle: document.getElementById("workersCompareSubtitle"),
  workersCompareSearch: document.getElementById("workersCompareSearch"),
  workersCompareStatusFilter: document.getElementById("workersCompareStatusFilter"),
  workersTotalCount: document.getElementById("workersTotalCount"),
  workersArrivedCount: document.getElementById("workersArrivedCount"),
  workersCertifiedCount: document.getElementById("workersCertifiedCount"),
  workersCompareTableBody: document.getElementById("workersCompareTableBody"),
  markAllWorkersArrivedBtn: document.getElementById("markAllWorkersArrivedBtn"),
  clearAllWorkersArrivedBtn: document.getElementById("clearAllWorkersArrivedBtn"),
  saveWorkersArrivalBtn: document.getElementById("saveWorkersArrivalBtn"),

  countContractorModal: document.getElementById("countContractorModal"),
  countContractorModalBackdrop: document.getElementById("countContractorModalBackdrop"),
  closeCountContractorModal: document.getElementById("closeCountContractorModal"),
  cancelCountContractorBtn: document.getElementById("cancelCountContractorBtn"),
  countContractorTitle: document.getElementById("countContractorTitle"),
  countContractorSubtitle: document.getElementById("countContractorSubtitle"),
  countContractorApprovedStrip: document.getElementById("countContractorApprovedStrip"),
  countContractorMessageBox: document.getElementById("countContractorMessageBox"),

  approvedWorkersValue: document.getElementById("approvedWorkersValue"),
  approvedCertifiedValue: document.getElementById("approvedCertifiedValue"),
  approvedCommandersValue: document.getElementById("approvedCommandersValue"),
  approvedEarlyValue: document.getElementById("approvedEarlyValue"),
  approvedGrandValue: document.getElementById("approvedGrandValue"),

  countContractorForm: document.getElementById("countContractorForm"),
  countAssignmentId: document.getElementById("countAssignmentId"),
  actualWorkersInput: document.getElementById("actualWorkersInput"),
  actualCertifiedInput: document.getElementById("actualCertifiedInput"),
  actualCommandersInput: document.getElementById("actualCommandersInput"),
  actualEarlyInput: document.getElementById("actualEarlyInput"),
  actualGrandLiveValue: document.getElementById("actualGrandLiveValue"),
  actualDeltaLiveValue: document.getElementById("actualDeltaLiveValue"),
  countingNoteInput: document.getElementById("countingNoteInput"),
  saveCountContractorBtn: document.getElementById("saveCountContractorBtn")
};

const state = {
  currentUser: null,
  selectedDate: "",
  allEvents: [],
  filteredEvents: [],
  eventStatsMap: new Map(),
  selectedEvent: null,
  selectedAssignments: [],
  selectedWorkersByAssignment: new Map(),
  selectedWorkersAssignmentId: null,
  selectedCountAssignment: null,
  workerArrivalMarks: loadWorkerArrivalMarks()
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.currentUser = user;
  setTodayFilter();
  await loadEventsForSelectedDate();
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

  [els.refreshCountingBtn, els.refreshCountingBtnHero].forEach((btn) => {
    btn?.addEventListener("click", loadEventsForSelectedDate);
  });

  els.clearCountingFiltersBtn?.addEventListener("click", async () => {
    setTodayFilter();
    if (els.countingSearchInput) els.countingSearchInput.value = "";
    if (els.countingTypeFilter) els.countingTypeFilter.value = "all";
    await loadEventsForSelectedDate();
  });

  els.prevDayBtn?.addEventListener("click", async () => {
    shiftDay(-1);
    await loadEventsForSelectedDate();
  });

  els.nextDayBtn?.addEventListener("click", async () => {
    shiftDay(1);
    await loadEventsForSelectedDate();
  });

  els.countingDateFilter?.addEventListener("change", async () => {
    state.selectedDate = els.countingDateFilter.value || getTodayLocalDate();
    await loadEventsForSelectedDate();
  });

  els.countingSearchInput?.addEventListener("input", applyEventFilters);
  els.countingTypeFilter?.addEventListener("change", applyEventFilters);

  els.closeCountingModal?.addEventListener("click", closeCountingModal);
  els.countingModalBackdrop?.addEventListener("click", closeCountingModal);

  els.countingContractorSearch?.addEventListener("input", renderSelectedAssignments);
  els.countingStatusFilter?.addEventListener("change", renderSelectedAssignments);

  els.closeWorkersCompareModal?.addEventListener("click", closeWorkersCompareModal);
  els.workersCompareModalBackdrop?.addEventListener("click", closeWorkersCompareModal);
  els.workersCompareSearch?.addEventListener("input", renderWorkersCompareTable);
  els.workersCompareStatusFilter?.addEventListener("change", renderWorkersCompareTable);
  els.markAllWorkersArrivedBtn?.addEventListener("click", markAllVisibleWorkersArrived);
  els.clearAllWorkersArrivedBtn?.addEventListener("click", clearAllVisibleWorkersArrived);
  els.saveWorkersArrivalBtn?.addEventListener("click", saveWorkersArrivalMarks);

  els.closeCountContractorModal?.addEventListener("click", closeCountContractorModal);
  els.countContractorModalBackdrop?.addEventListener("click", closeCountContractorModal);
  els.cancelCountContractorBtn?.addEventListener("click", closeCountContractorModal);
  els.countContractorForm?.addEventListener("submit", handleSaveContractorCount);

  [
    els.actualWorkersInput,
    els.actualCertifiedInput,
    els.actualCommandersInput,
    els.actualEarlyInput
  ].forEach((input) => {
    input?.addEventListener("input", updateCountLiveSummary);
  });
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function setTodayFilter() {
  const today = getTodayLocalDate();
  state.selectedDate = today;
  if (els.countingDateFilter) els.countingDateFilter.value = today;
}

function shiftDay(delta) {
  const current = els.countingDateFilter?.value || getTodayLocalDate();
  const date = new Date(`${current}T00:00:00`);
  date.setDate(date.getDate() + delta);
  const next = formatDateISO(date);
  state.selectedDate = next;
  if (els.countingDateFilter) els.countingDateFilter.value = next;
}

async function loadEventsForSelectedDate() {
  clearPageMessage();

  const selectedDate = els.countingDateFilter?.value || getTodayLocalDate();
  state.selectedDate = selectedDate;

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
    .eq("event_date", selectedDate)
    .order("arrival_time", { ascending: true });

  if (error) {
    console.error("loadEventsForSelectedDate error:", error);
    if (els.countingEventsList) {
      els.countingEventsList.innerHTML = emptyState(
        "שגיאה בטעינת האירועים",
        "בדוק את המסד ונסה שוב."
      );
    }
    return;
  }

  state.allEvents = data || [];
  await loadEventStats();
  applyEventFilters();
}

async function loadEventStats() {
  const eventIds = state.allEvents.map((event) => event.id);
  state.eventStatsMap = new Map();

  if (!eventIds.length) return;

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
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      response_status,
      assignment_status,
      counted_at,
      signature_status
    `)
    .in("event_id", eventIds);

  if (error) {
    console.error("loadEventStats error:", error);
    return;
  }

  for (const eventId of eventIds) {
    state.eventStatsMap.set(eventId, emptyEventStats());
  }

  for (const row of data || []) {
    const stats = state.eventStatsMap.get(row.event_id) || emptyEventStats();

    if (row.assignment_status !== "active") {
      state.eventStatsMap.set(row.event_id, stats);
      continue;
    }

    if (row.response_status === "approved") {
      stats.approvedContractors += 1;
      stats.approvedPeople += getRequestedTotal(row);
    }

    if (isApprovedWaitingCount(row)) {
      stats.waitingCount += 1;
    }

    if (isWaitingSignature(row)) {
      stats.waitingSignature += 1;
      stats.actualPeople += getActualTotal(row);
      stats.countedContractors += 1;
    }

    if (isSignedAndMonthlyClosed(row)) {
      stats.signed += 1;
      stats.actualPeople += getActualTotal(row);
      stats.countedContractors += 1;
    }

    state.eventStatsMap.set(row.event_id, stats);
  }
}

function emptyEventStats() {
  return {
    approvedContractors: 0,
    approvedPeople: 0,
    countedContractors: 0,
    waitingCount: 0,
    waitingSignature: 0,
    signed: 0,
    actualPeople: 0
  };
}

function applyEventFilters() {
  const term = normalizeText(els.countingSearchInput?.value);
  const typeFilter = els.countingTypeFilter?.value || "all";

  state.filteredEvents = state.allEvents.filter((event) => {
    if (typeFilter !== "all" && event.event_type !== typeFilter) return false;

    const stats = state.eventStatsMap.get(event.id) || emptyEventStats();
    if (stats.approvedContractors <= 0) return false;

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

  renderKpis();
  renderEvents();
}

function renderKpis() {
  const totalEvents = state.filteredEvents.length;

  let approvedContractors = 0;
  let waitingCount = 0;
  let waitingSignature = 0;

  for (const event of state.filteredEvents) {
    const stats = state.eventStatsMap.get(event.id) || emptyEventStats();
    approvedContractors += stats.approvedContractors;
    waitingCount += stats.waitingCount;
    waitingSignature += stats.waitingSignature;
  }

  setKpi(
    els.kpiTodayEvents,
    els.kpiTodayEventsSub,
    totalEvents,
    totalEvents ? "אירועים עם קבלנים מאושרים ביום זה" : "אין אירועים מתאימים ביום זה"
  );

  setKpi(
    els.kpiApprovedContractors,
    els.kpiApprovedContractorsSub,
    approvedContractors,
    approvedContractors ? "קבלנים שאישרו הגעה" : "אין קבלנים מאושרים כרגע"
  );

  setKpi(
    els.kpiWaitingCount,
    els.kpiWaitingCountSub,
    waitingCount,
    waitingCount ? "עדיין לא נספרו" : "אין קבלנים פתוחים לספירה"
  );

  setKpi(
    els.kpiWaitingSignature,
    els.kpiWaitingSignatureSub,
    waitingSignature,
    waitingSignature ? "נספרו ומחכים לחתימה" : "אין חתימות פתוחות כרגע"
  );
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

function renderEvents() {
  const total = state.filteredEvents.length;

  if (els.countingSummaryText) {
    els.countingSummaryText.textContent = total
      ? `${total} אירועים זמינים לספירה בתאריך ${formatDate(state.selectedDate)}`
      : "לא נמצאו אירועים עם קבלנים מאושרים לפי הסינון";
  }

  if (!total) {
    if (els.countingEventsList) {
      els.countingEventsList.innerHTML = emptyState(
        "אין אירועים לספירה",
        "נסה לשנות תאריך או חיפוש."
      );
    }
    return;
  }

  els.countingEventsList.innerHTML = state.filteredEvents
    .map((event) => {
      const stats = state.eventStatsMap.get(event.id) || emptyEventStats();
      const title = getEventDisplayTitle(event);
      const location = getEventLocation(event);
      const timeLabel = `${formatTime(event.arrival_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ""}`;

      return `
        <article class="meteor-event-card counting-event-card counting-event-card-mobile">
          <div class="counting-event-card-mobile-top">
            <div class="counting-event-card-mobile-main">
              <div class="counting-event-card-mobile-badges">
                <span class="meteor-mini-badge ${event.event_type === "football" ? "primary" : "muted"}">
                  ${event.event_type === "football" ? "כדורגל" : "אירוע"}
                </span>
                ${event.requires_workers_list ? `<span class="meteor-mini-badge warning">רשימת עובדים</span>` : ""}
              </div>

              <h3>${escapeHtml(title)}</h3>

              <div class="counting-event-card-mobile-meta">
                <span>${formatDate(event.event_date)}</span>
                <span>•</span>
                <span>${escapeHtml(timeLabel || "--:--")}</span>
              </div>

              <div class="counting-event-card-mobile-location">
                ${escapeHtml(location)}
              </div>

              <div class="counting-event-compact-strip">
                <div>מאושרים <strong>${stats.approvedContractors}</strong></div>
                <div>נספרו <strong>${stats.countedContractors}</strong></div>
                <div>נשארו <strong>${stats.waitingCount}</strong></div>
              </div>
            </div>

            <div class="counting-event-card-mobile-actions">
              <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-open-counting" data-id="${event.id}">
                פתח ספירה
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els.countingEventsList.querySelectorAll(".js-open-counting").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const event = state.filteredEvents.find((row) => String(row.id) === String(btn.dataset.id));
      if (event) {
        await openCountingModal(event);
      }
    });
  });
}

async function openCountingModal(event) {
  state.selectedEvent = event;
  state.selectedWorkersByAssignment = new Map();
  state.selectedWorkersAssignmentId = null;
  state.selectedCountAssignment = null;

  els.countingModalTitle.textContent = `ספירה - ${getEventDisplayTitle(event)}`;
  els.countingModalSubtitle.textContent = `${formatDate(event.event_date)} · ${escapeHtml(getEventLocation(event))}`;

  els.countingEventInfoTitle.textContent = getEventDisplayTitle(event);
  els.countingEventInfoType.textContent = event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל";

  els.countingEventInfoMeta.innerHTML = `
    <span>${formatDate(event.event_date)}</span>
    <span>•</span>
    <span>${formatTime(event.arrival_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ""}</span>
    <span>•</span>
    <span>${escapeHtml(getEventLocation(event))}</span>
  `;

  if (els.countingContractorSearch) els.countingContractorSearch.value = "";
  if (els.countingStatusFilter) els.countingStatusFilter.value = "all";

  await loadAssignmentsForSelectedEvent();
  openModal(els.countingModal, els.countingModalBackdrop);
}

function closeCountingModal() {
  closeModal(els.countingModal, els.countingModalBackdrop);
  state.selectedEvent = null;
  state.selectedAssignments = [];
  state.selectedWorkersByAssignment = new Map();
}

async function loadAssignmentsForSelectedEvent() {
  if (!state.selectedEvent?.id) return;

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
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      response_status,
      assignment_status,
      contractor_response_note,
      admin_note,
      counted_at,
      signature_status,
      contractor_signed_at,
      contractor:contractor_id (
        id,
        company_name,
        phone,
        email
      )
    `)
    .eq("event_id", state.selectedEvent.id)
    .eq("assignment_status", "active")
    .eq("response_status", "approved")
    .order("counted_at", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("loadAssignmentsForSelectedEvent error:", error);
    showPageMessage("שגיאה בטעינת קבלנים מאושרים.", "error");
    state.selectedAssignments = [];
    renderSelectedAssignments();
    return;
  }

  state.selectedAssignments = data || [];

  if (state.selectedEvent.requires_workers_list) {
    await loadWorkersListsForSelectedEvent();
  }

  renderSelectedAssignmentsSummary();
  renderSelectedAssignments();
}

async function loadWorkersListsForSelectedEvent() {
  const assignmentIds = state.selectedAssignments.map((row) => row.id);
  state.selectedWorkersByAssignment = new Map();

  if (!assignmentIds.length) return;

  const { data, error } = await supabase
    .from("contractor_assignment_workers")
    .select(`
      id,
      assignment_id,
      contractor_id,
      worker_pool_id,
      full_name,
      id_number,
      is_certified,
      is_spare,
      worker_status,
      review_note,
      reviewed_at
    `)
    .in("assignment_id", assignmentIds)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("loadWorkersListsForSelectedEvent error:", error);
    return;
  }

  for (const worker of data || []) {
    const group = state.selectedWorkersByAssignment.get(worker.assignment_id) || [];
    group.push(worker);
    state.selectedWorkersByAssignment.set(worker.assignment_id, group);
  }
}

function renderSelectedAssignmentsSummary() {
  const approvedContractors = state.selectedAssignments.length;
  const countedContractors = state.selectedAssignments.filter((row) => !!row.counted_at).length;
  const waitingSignature = state.selectedAssignments.filter((row) => isWaitingSignature(row)).length;
  const remaining = state.selectedAssignments.filter((row) => isApprovedWaitingCount(row)).length;

  const requestedWorkers = state.selectedAssignments.reduce((sum, row) => sum + toNumber(row.requested_workers), 0);
  const requestedCertified = state.selectedAssignments.reduce((sum, row) => sum + toNumber(row.requested_certified), 0);
  const requestedCommanders = state.selectedAssignments.reduce((sum, row) => sum + toNumber(row.requested_commanders), 0);
  const requestedEarly = state.selectedAssignments.reduce((sum, row) => sum + toNumber(row.requested_early_workers), 0);

  const approvedPeople = state.selectedAssignments.reduce((sum, row) => sum + getRequestedTotal(row), 0);
  const actualPeople = state.selectedAssignments.reduce((sum, row) => sum + getActualTotal(row), 0);

  if (els.summaryApprovedContractors) els.summaryApprovedContractors.textContent = String(approvedContractors);
  if (els.summaryCountedContractors) els.summaryCountedContractors.textContent = String(countedContractors);
  if (els.summaryRemainingContractors) els.summaryRemainingContractors.textContent = String(remaining);
  if (els.summaryWaitingSignature) els.summaryWaitingSignature.textContent = String(waitingSignature);

  if (els.summaryRequestedWorkers) els.summaryRequestedWorkers.textContent = String(requestedWorkers);
  if (els.summaryRequestedCertified) els.summaryRequestedCertified.textContent = String(requestedCertified);
  if (els.summaryRequestedCommanders) els.summaryRequestedCommanders.textContent = String(requestedCommanders);
  if (els.summaryRequestedEarly) els.summaryRequestedEarly.textContent = String(requestedEarly);

  if (els.summaryApprovedPeople) els.summaryApprovedPeople.textContent = String(approvedPeople);
  if (els.summaryActualPeople) els.summaryActualPeople.textContent = String(actualPeople);
}

function renderSelectedAssignments() {
  const term = normalizeText(els.countingContractorSearch?.value);
  const statusFilter = els.countingStatusFilter?.value || "all";

  const rows = state.selectedAssignments.filter((row) => {
    const contractorName = row.contractor?.company_name || "";
    const contractorPhone = row.contractor?.phone || "";

    if (statusFilter === "approved_waiting_count" && !isApprovedWaitingCount(row)) return false;
    if (statusFilter === "waiting_signature" && !isWaitingSignature(row)) return false;
    if (statusFilter === "signed" && !isSignedAndMonthlyClosed(row)) return false;

    if (!term) return true;

    return [contractorName, contractorPhone].join(" ").toLowerCase().includes(term);
  });

  if (!rows.length) {
    els.countingAssignmentsList.innerHTML = emptyState(
      "אין קבלנים להצגה",
      "נסה לשנות חיפוש או סינון."
    );
    return;
  }

  els.countingAssignmentsList.innerHTML = rows
    .map((row) => {
      const contractorName = row.contractor?.company_name || "קבלן";
      const lifecycle = getAssignmentLifecycleState(row);
      const badge = getCountingLifecycleBadge(lifecycle);
      const workersList = state.selectedWorkersByAssignment.get(row.id) || [];
      const arrivedCount = getArrivedWorkersCount(row.id);

      return `
        <article class="meteor-event-card counting-contractor-card-mobile ${lifecycle}">
          <div class="counting-contractor-card-mobile-head">
            <div class="counting-contractor-card-mobile-main">
              <div class="counting-contractor-card-mobile-badges">
                <span class="meteor-status-badge ${badge.className}">${badge.label}</span>
                ${
                  state.selectedEvent?.requires_workers_list
                    ? `<span class="meteor-mini-badge warning">רשימת עובדים</span>`
                    : ""
                }
              </div>

              <h3>${escapeHtml(contractorName)}</h3>

              <div class="counting-contractor-card-mobile-phone">
                ${escapeHtml(row.contractor?.phone || "-")}
              </div>

              <div class="counting-contractor-card-mobile-qty">
                <span>דיילים <strong>${toNumber(row.requested_workers)}</strong></span>
                <span>תעודה <strong>${toNumber(row.requested_certified)}</strong></span>
                <span>מפקדים <strong>${toNumber(row.requested_commanders)}</strong></span>
                <span>מקדים <strong>${toNumber(row.requested_early_workers)}</strong></span>
              </div>

              <div class="counting-contractor-card-mobile-status-line">
                <span>מאושר <strong>${getRequestedTotal(row)}</strong></span>
                <span>•</span>
                <span>בפועל <strong>${getActualTotal(row)}</strong></span>
                ${
                  state.selectedEvent?.requires_workers_list
                    ? `<span>• עובדים ${workersList.length} / הגיעו ${arrivedCount}</span>`
                    : ""
                }
              </div>
            </div>
          </div>

          <div class="counting-contractor-card-mobile-actions">
            ${
              state.selectedEvent?.requires_workers_list
                ? `
                  <button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-open-workers-list" data-id="${row.id}">
                    עובדים
                  </button>
                `
                : ""
            }

            <button type="button" class="meteor-btn meteor-btn-primary meteor-btn-sm js-open-count-form" data-id="${row.id}">
              ${row.counted_at ? "עדכן ספירה" : "ספירה"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  els.countingAssignmentsList.querySelectorAll(".js-open-workers-list").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = findSelectedAssignment(btn.dataset.id);
      if (row) openWorkersCompareModal(row);
    });
  });

  els.countingAssignmentsList.querySelectorAll(".js-open-count-form").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = findSelectedAssignment(btn.dataset.id);
      if (row) openCountContractorModal(row);
    });
  });
}

function getCountingLifecycleBadge(lifecycle) {
  switch (lifecycle) {
    case "approved_waiting_count":
      return {
        label: "ממתין לספירה",
        className: "is-open"
      };
    case "waiting_signature":
      return {
        label: "ממתין לחתימה",
        className: "is-pending"
      };
    case "monthly_closed":
      return {
        label: "חתום",
        className: "is-success"
      };
    default:
      return {
        label: "מאושר",
        className: "is-open"
      };
  }
}

function openWorkersCompareModal(row) {
  state.selectedWorkersAssignmentId = row.id;

  const contractorName = row.contractor?.company_name || "קבלן";
  els.workersCompareTitle.textContent = `רשימת עובדים - ${contractorName}`;
  els.workersCompareSubtitle.textContent = `בדיקה עבור ${getEventDisplayTitle(state.selectedEvent)}`;

  if (els.workersCompareSearch) els.workersCompareSearch.value = "";
  if (els.workersCompareStatusFilter) els.workersCompareStatusFilter.value = "all";

  renderWorkersCompareTable();
  openModal(els.workersCompareModal, els.workersCompareModalBackdrop);
}

function closeWorkersCompareModal() {
  closeModal(els.workersCompareModal, els.workersCompareModalBackdrop);
  state.selectedWorkersAssignmentId = null;
}

function renderWorkersCompareTable() {
  const assignmentId = state.selectedWorkersAssignmentId;
  const workers = state.selectedWorkersByAssignment.get(assignmentId) || [];

  const term = normalizeText(els.workersCompareSearch?.value);
  const statusFilter = els.workersCompareStatusFilter?.value || "all";

  const filtered = workers.filter((worker) => {
    const arrived = isWorkerMarkedArrived(assignmentId, worker.id);
    const matchesTerm = !term || [worker.full_name, worker.id_number].join(" ").toLowerCase().includes(term);
    if (!matchesTerm) return false;

    if (statusFilter === "arrived" && !arrived) return false;
    if (statusFilter === "not_arrived" && arrived) return false;
    if (statusFilter === "certified" && !worker.is_certified) return false;
    if (statusFilter === "regular" && worker.is_certified) return false;
    if (statusFilter === "approved" && worker.worker_status !== "approved") return false;
    if (statusFilter === "rejected" && worker.worker_status !== "rejected") return false;
    if (statusFilter === "pending" && worker.worker_status !== "pending") return false;

    return true;
  });

  const arrivedCount = workers.filter((worker) => isWorkerMarkedArrived(assignmentId, worker.id)).length;
  const certifiedCount = workers.filter((worker) => !!worker.is_certified).length;

  if (els.workersTotalCount) els.workersTotalCount.textContent = String(workers.length);
  if (els.workersArrivedCount) els.workersArrivedCount.textContent = String(arrivedCount);
  if (els.workersCertifiedCount) els.workersCertifiedCount.textContent = String(certifiedCount);

  if (!filtered.length) {
    els.workersCompareTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4">לא נמצאו עובדים לפי הסינון.</td>
      </tr>
    `;
    return;
  }

  els.workersCompareTableBody.innerHTML = filtered
    .map((worker) => {
      const arrived = isWorkerMarkedArrived(assignmentId, worker.id);

      return `
        <tr>
          <td>
            <label class="worker-arrived-checkbox-wrap">
              <input
                type="checkbox"
                class="worker-arrived-checkbox"
                data-worker-id="${worker.id}"
                ${arrived ? "checked" : ""}
              />
            </label>
          </td>
          <td>${escapeHtml(worker.full_name)}</td>
          <td>${escapeHtml(worker.id_number)}</td>
          <td>${worker.is_certified ? "בעל תעודה" : "רגיל"}</td>
          <td>${worker.is_spare ? "כן" : "לא"}</td>
          <td>${getWorkerStatusLabel(worker.worker_status)}</td>
        </tr>
      `;
    })
    .join("");

  els.workersCompareTableBody.querySelectorAll(".worker-arrived-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      setWorkerArrivedMark(assignmentId, Number(checkbox.dataset.workerId), checkbox.checked);
      renderWorkersCompareTable();
      renderSelectedAssignments();
    });
  });
}

function markAllVisibleWorkersArrived() {
  const assignmentId = state.selectedWorkersAssignmentId;
  if (!assignmentId) return;

  const ids = [...els.workersCompareTableBody.querySelectorAll(".worker-arrived-checkbox")]
    .map((checkbox) => Number(checkbox.dataset.workerId));

  ids.forEach((workerId) => setWorkerArrivedMark(assignmentId, workerId, true));

  renderWorkersCompareTable();
  renderSelectedAssignments();
}

function clearAllVisibleWorkersArrived() {
  const assignmentId = state.selectedWorkersAssignmentId;
  if (!assignmentId) return;

  const ids = [...els.workersCompareTableBody.querySelectorAll(".worker-arrived-checkbox")]
    .map((checkbox) => Number(checkbox.dataset.workerId));

  ids.forEach((workerId) => setWorkerArrivedMark(assignmentId, workerId, false));

  renderWorkersCompareTable();
  renderSelectedAssignments();
}

function saveWorkersArrivalMarks() {
  persistWorkerArrivalMarks();
  showPageMessage("סימוני הגעה ברשימת העובדים נשמרו בדפדפן זה.", "success");
}

function openCountContractorModal(row) {
  state.selectedCountAssignment = row;

  const contractorName = row.contractor?.company_name || "קבלן";
  els.countContractorTitle.textContent = `ספירת קבלן - ${contractorName}`;
  els.countContractorSubtitle.textContent = getEventDisplayTitle(state.selectedEvent);
  els.countAssignmentId.value = row.id;

  els.approvedWorkersValue.textContent = String(toNumber(row.requested_workers));
  els.approvedCertifiedValue.textContent = String(toNumber(row.requested_certified));
  els.approvedCommandersValue.textContent = String(toNumber(row.requested_commanders));
  els.approvedEarlyValue.textContent = String(toNumber(row.requested_early_workers));
  els.approvedGrandValue.textContent = String(getRequestedTotal(row));

  els.actualWorkersInput.value = String(toNumber(row.actual_workers));
  els.actualCertifiedInput.value = String(toNumber(row.actual_certified));
  els.actualCommandersInput.value = String(toNumber(row.actual_commanders));
  els.actualEarlyInput.value = String(toNumber(row.actual_early_workers));
  els.countingNoteInput.value = row.admin_note || "";

  clearCountContractorMessage();
  updateCountLiveSummary();

  if (els.saveCountContractorBtn) {
    els.saveCountContractorBtn.textContent = row.counted_at
      ? "עדכן ושלח מחדש"
      : "שמור ושלח";
  }

  openModal(els.countContractorModal, els.countContractorModalBackdrop);
}

function closeCountContractorModal() {
  closeModal(els.countContractorModal, els.countContractorModalBackdrop);
  state.selectedCountAssignment = null;
  clearCountContractorMessage();
}

function updateCountLiveSummary() {
  const actualTotal =
    toNumber(els.actualWorkersInput.value) +
    toNumber(els.actualCertifiedInput.value) +
    toNumber(els.actualCommandersInput.value) +
    toNumber(els.actualEarlyInput.value);

  const approvedTotal = toNumber(els.approvedGrandValue.textContent);
  const delta = actualTotal - approvedTotal;

  if (els.actualGrandLiveValue) els.actualGrandLiveValue.textContent = String(actualTotal);
  if (els.actualDeltaLiveValue) els.actualDeltaLiveValue.textContent = String(delta);
}

async function handleSaveContractorCount(event) {
  event.preventDefault();

  const row = state.selectedCountAssignment;
  if (!row) return;

  const actual_workers = toNumber(els.actualWorkersInput.value);
  const actual_certified = toNumber(els.actualCertifiedInput.value);
  const actual_commanders = toNumber(els.actualCommandersInput.value);
  const actual_early_workers = toNumber(els.actualEarlyInput.value);
  const admin_note = cleanNullable(els.countingNoteInput.value);

  if (
    actual_workers < 0 ||
    actual_certified < 0 ||
    actual_commanders < 0 ||
    actual_early_workers < 0
  ) {
    showCountContractorMessage("הערכים בפועל חייבים להיות 0 או יותר.", "warning");
    return;
  }

  setCountButtonLoading(true);
  clearCountContractorMessage();

  const updatePayload = {
    actual_workers,
    actual_certified,
    actual_commanders,
    actual_early_workers,
    counted_at: new Date().toISOString(),
    counted_by: state.currentUser?.id || null,
    signature_status: "waiting_signature",
    admin_note
  };

  const { error } = await supabase
    .from("contractor_assignments")
    .update(updatePayload)
    .eq("id", row.id);

  if (error) {
    console.error("handleSaveContractorCount error:", error);
    showCountContractorMessage("שגיאה בשמירת הספירה.", "error");
    setCountButtonLoading(false);
    return;
  }

  const refreshedAssignment = {
    ...row,
    ...updatePayload
  };

  const notifyResult = await sendCountingNotification(refreshedAssignment);

  if (!notifyResult.ok) {
    if (notifyResult.reason === "missing_phone") {
      showPageMessage("הספירה נשמרה, אך אין מספר טלפון תקין לקבלן.", "warning");
    } else {
      showPageMessage("הספירה נשמרה, אך שליחת הווטסאפ לקבלן נכשלה.", "warning");
    }

    await loadAssignmentsForSelectedEvent();
    await loadEventStats();
    applyEventFilters();
    closeCountContractorModal();
    setCountButtonLoading(false);
    return;
  }

  showPageMessage("הספירה נשמרה ונשלחה לקבלן לחתימה.", "success");

  await loadAssignmentsForSelectedEvent();
  await loadEventStats();
  applyEventFilters();
  closeCountContractorModal();
  setCountButtonLoading(false);
}

function setCountButtonLoading(isLoading) {
  if (!els.saveCountContractorBtn) return;
  els.saveCountContractorBtn.disabled = isLoading;
  els.saveCountContractorBtn.textContent = isLoading ? "שומר..." : "שמור ושלח";
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

function buildCountingMessage(row) {
  const contractorName = row.contractor?.company_name || "קבלן";
  const eventTitle = getEventDisplayTitle(state.selectedEvent);
  const eventDate = formatDate(state.selectedEvent?.event_date || "");
  const location = getEventLocation(state.selectedEvent);
  const totalActual = getActualTotal(row);

  return [
    `שלום ${contractorName},`,
    "",
    "בוצעה ספירה בהצלחה במערכת מטאור אבטחה.",
    "",
    `אירוע: ${eventTitle}`,
    `תאריך: ${eventDate}`,
    `מיקום: ${location}`,
    `סה״כ שנספר בפועל: ${totalActual}`,
    "",
    "נא להיכנס לאזור האישי במערכת כדי לאשר את הספירה."
  ].join("\n");
}

async function sendCountingNotification(row) {
  if (!row?.contractor?.phone) {
    return { ok: false, reason: "missing_phone" };
  }

  const message = buildCountingMessage(row);
  return sendWhatsappMessage(row.contractor.phone, message);
}

function findSelectedAssignment(id) {
  return state.selectedAssignments.find((row) => String(row.id) === String(id)) || null;
}

function getEventDisplayTitle(event) {
  if (!event) return "אירוע";

  if (event.event_type === "football") {
    const home = event.home_team?.name || "מארחת";
    const away = event.away_team?.name || "אורחת";
    return `${home} - ${away}`;
  }

  return event.event_name || "אירוע רגיל";
}

function getEventLocation(event) {
  if (!event) return "-";

  if (event.event_type === "football") {
    return event.stadiums?.name || event.cities?.name_he || "-";
  }

  return event.manual_location || event.cities?.name_he || "-";
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

function showPageMessage(message, type = "error") {
  if (!els.countingMsgBox) return;
  els.countingMsgBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.countingMsgBox) els.countingMsgBox.innerHTML = "";
}

function showCountContractorMessage(message, type = "error") {
  if (!els.countContractorMessageBox) return;
  els.countContractorMessageBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearCountContractorMessage() {
  if (els.countContractorMessageBox) els.countContractorMessageBox.innerHTML = "";
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

function cleanNullable(value) {
  const clean = String(value || "").trim();
  return clean ? clean : null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toNumber(value) {
  return Number(value || 0);
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

function getTodayLocalDate() {
  const now = new Date();
  return formatDateISO(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}

function loadWorkerArrivalMarks() {
  try {
    const raw = localStorage.getItem(ARRIVAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.error("loadWorkerArrivalMarks error:", error);
    return {};
  }
}

function persistWorkerArrivalMarks() {
  try {
    localStorage.setItem(ARRIVAL_STORAGE_KEY, JSON.stringify(state.workerArrivalMarks || {}));
  } catch (error) {
    console.error("persistWorkerArrivalMarks error:", error);
  }
}

function getAssignmentArrivalBucket(assignmentId) {
  const key = String(assignmentId);
  if (!state.workerArrivalMarks[key]) {
    state.workerArrivalMarks[key] = {};
  }
  return state.workerArrivalMarks[key];
}

function setWorkerArrivedMark(assignmentId, workerId, isArrived) {
  const bucket = getAssignmentArrivalBucket(assignmentId);
  if (isArrived) {
    bucket[String(workerId)] = true;
  } else {
    delete bucket[String(workerId)];
  }
  persistWorkerArrivalMarks();
}

function isWorkerMarkedArrived(assignmentId, workerId) {
  const bucket = getAssignmentArrivalBucket(assignmentId);
  return !!bucket[String(workerId)];
}

function getArrivedWorkersCount(assignmentId) {
  const workers = state.selectedWorkersByAssignment.get(assignmentId) || [];
  return workers.filter((worker) => isWorkerMarkedArrived(assignmentId, worker.id)).length;
}