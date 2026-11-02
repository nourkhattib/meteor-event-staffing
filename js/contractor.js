import { supabase } from "./supabase.js";
import { requireAuth, logout, saveSession, getSession } from "./auth.js";

const CHANGE_CREDENTIALS_URL =
  "https://lfjzqxnvddynzetpztrd.functions.supabase.co/change-credentials";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  refreshPageBtn: document.getElementById("refreshPageBtn"),
  openProfileBtn: document.getElementById("openProfileBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  contractorSidebar: document.getElementById("contractorSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  contractorFullName: document.getElementById("contractorFullName"),
  contractorCompanyName: document.getElementById("contractorCompanyName"),
  contractorAvatar: document.getElementById("contractorAvatar"),
  contractorNameInline: document.getElementById("contractorNameInline"),

  pageMessageBox: document.getElementById("pageMessageBox"),

  kpiPendingInvites: document.getElementById("kpiPendingInvites"),
  kpiPendingInvitesSub: document.getElementById("kpiPendingInvitesSub"),
  kpiWaitingCount: document.getElementById("kpiWaitingCount"),
  kpiWaitingCountSub: document.getElementById("kpiWaitingCountSub"),
  kpiWaitingSignature: document.getElementById("kpiWaitingSignature"),
  kpiWaitingSignatureSub: document.getElementById("kpiWaitingSignatureSub"),
  kpiWorkersPool: document.getElementById("kpiWorkersPool"),
  kpiWorkersPoolSub: document.getElementById("kpiWorkersPoolSub"),

  pendingAssignmentsList: document.getElementById("pendingAssignmentsList"),
  approvedAssignmentsList: document.getElementById("approvedAssignmentsList"),
  signatureAssignmentsList: document.getElementById("signatureAssignmentsList"),

  pendingSearchInput: document.getElementById("pendingSearchInput"),
  pendingDateFilter: document.getElementById("pendingDateFilter"),
  approvedSearchInput: document.getElementById("approvedSearchInput"),
  approvedDateFilter: document.getElementById("approvedDateFilter"),
  signatureSearchInput: document.getElementById("signatureSearchInput"),
  signatureDateFilter: document.getElementById("signatureDateFilter"),

  quickPendingBtn: document.getElementById("quickPendingBtn"),
  quickWorkersBtn: document.getElementById("quickWorkersBtn"),

  workersSearchInput: document.getElementById("workersSearchInput"),
  workersCertifiedFilter: document.getElementById("workersCertifiedFilter"),
  workersPoolList: document.getElementById("workersPoolList"),

  monthlyFilter: document.getElementById("monthlyFilter"),
  monthlySearchInput: document.getElementById("monthlySearchInput"),
  monthlyDateFilter: document.getElementById("monthlyDateFilter"),
  monthlySummaryCards: document.getElementById("monthlySummaryCards"),
  monthlyAssignmentsList: document.getElementById("monthlyAssignmentsList"),
  monthlyStageStatusBox: document.getElementById("monthlyStageStatusBox"),

  // change request modal
  changeRequestModal: document.getElementById("changeRequestModal"),
  changeRequestModalBackdrop: document.getElementById("changeRequestModalBackdrop"),
  closeChangeRequestModalBtn: document.getElementById("closeChangeRequestModalBtn"),
  cancelChangeRequestBtn: document.getElementById("cancelChangeRequestBtn"),
  changeRequestMessageBox: document.getElementById("changeRequestMessageBox"),
  changeRequestForm: document.getElementById("changeRequestForm"),
  changeAssignmentId: document.getElementById("changeAssignmentId"),
  changeWorkers: document.getElementById("changeWorkers"),
  changeCertified: document.getElementById("changeCertified"),
  changeCommanders: document.getElementById("changeCommanders"),
  changeEarly: document.getElementById("changeEarly"),
  changeRequestNote: document.getElementById("changeRequestNote"),
  changeRequestModalSubtitle: document.getElementById("changeRequestModalSubtitle"),

  // signature modal
  signatureModal: document.getElementById("signatureModal"),
  signatureModalBackdrop: document.getElementById("signatureModalBackdrop"),
  closeSignatureModalBtn: document.getElementById("closeSignatureModalBtn"),
  cancelSignatureBtn: document.getElementById("cancelSignatureBtn"),
  signatureMessageBox: document.getElementById("signatureMessageBox"),
  signatureForm: document.getElementById("signatureForm"),
  signatureAssignmentId: document.getElementById("signatureAssignmentId"),
  signatureModalSubtitle: document.getElementById("signatureModalSubtitle"),
  signatureStatsBox: document.getElementById("signatureStatsBox"),
  signatureNote: document.getElementById("signatureNote"),
  signatureConfirmCheckbox: document.getElementById("signatureConfirmCheckbox"),
  signatureCanvas: document.getElementById("signatureCanvas"),
  clearSignatureBtn: document.getElementById("clearSignatureBtn"),
  saveSignatureBtn: document.getElementById("saveSignatureBtn"),

  // profile modal
  profileModal: document.getElementById("profileModal"),
  profileModalBackdrop: document.getElementById("profileModalBackdrop"),
  closeProfileModalBtn: document.getElementById("closeProfileModalBtn"),
  cancelProfileBtn: document.getElementById("cancelProfileBtn"),
  profileMessageBox: document.getElementById("profileMessageBox"),
  profileForm: document.getElementById("profileForm"),
  profileFullName: document.getElementById("profileFullName"),
  profilePhone: document.getElementById("profilePhone"),
  profileUsername: document.getElementById("profileUsername"),
  profileNewPassword: document.getElementById("profileNewPassword"),
  profileCurrentPassword: document.getElementById("profileCurrentPassword"),

  // worker pool modal
  openAddWorkerBtn: document.getElementById("openAddWorkerBtn"),
  workerModal: document.getElementById("workerModal"),
  workerModalBackdrop: document.getElementById("workerModalBackdrop"),
  closeWorkerModalBtn: document.getElementById("closeWorkerModalBtn"),
  cancelWorkerBtn: document.getElementById("cancelWorkerBtn"),
  workerModalTitle: document.getElementById("workerModalTitle"),
  workerModalMessageBox: document.getElementById("workerModalMessageBox"),
  workerForm: document.getElementById("workerForm"),
  workerPoolId: document.getElementById("workerPoolId"),
  workerFullName: document.getElementById("workerFullName"),
  workerIdNumber: document.getElementById("workerIdNumber"),
  workerIsCertified: document.getElementById("workerIsCertified"),

  // event workers modal
  eventWorkersModal: document.getElementById("eventWorkersModal"),
  eventWorkersModalBackdrop: document.getElementById("eventWorkersModalBackdrop"),
  closeEventWorkersModalBtn: document.getElementById("closeEventWorkersModalBtn"),
  eventWorkersModalTitle: document.getElementById("eventWorkersModalTitle"),
  eventWorkersModalSubtitle: document.getElementById("eventWorkersModalSubtitle"),
  eventWorkersMessageBox: document.getElementById("eventWorkersMessageBox"),
  eventWorkerForm: document.getElementById("eventWorkerForm"),
  eventWorkerAssignmentId: document.getElementById("eventWorkerAssignmentId"),
  eventWorkerFullName: document.getElementById("eventWorkerFullName"),
  eventWorkerIdNumber: document.getElementById("eventWorkerIdNumber"),
  eventWorkerIsCertified: document.getElementById("eventWorkerIsCertified"),
  eventWorkerIsSpare: document.getElementById("eventWorkerIsSpare"),
  saveWorkerToPoolCheckbox: document.getElementById("saveWorkerToPoolCheckbox"),
  eventPoolSearchInput: document.getElementById("eventPoolSearchInput"),
  eventPoolResults: document.getElementById("eventPoolResults"),
  eventWorkersSearchInput: document.getElementById("eventWorkersSearchInput"),
  eventWorkersListWrap: document.getElementById("eventWorkersListWrap")
};

const state = {
  currentUser: null,
  contractor: null,
  assignments: [],
  workersPool: [],
  monthlyAssignments: [],
  monthlyPriceDefaults: [],
  monthlyComputedRows: [],
  monthlySummaryTotals: emptyMonthlyTotals(),
  monthlyBlockedRows: [],
  activeStage: "pendingStage",
  selectedChangeAssignment: null,
  selectedSignatureAssignment: null,
  selectedEventWorkerAssignment: null,
  selectedEventWorkerRows: [],

  signaturePad: {
    ctx: null,
    isDrawing: false,
    hasInk: false,
    lastX: 0,
    lastY: 0,
    pointerId: null,
    dpr: Math.max(window.devicePixelRatio || 1, 1)
  }
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("contractor");
  if (!user) return;

  state.currentUser = user;
  hydrateUser(user);
  setDefaultMonth();
  initSignaturePad();

  await Promise.all([
    loadContractorDetails(),
    loadAllData()
  ]);
}

function bindUi() {
  els.logoutBtn?.addEventListener("click", logout);
  els.refreshPageBtn?.addEventListener("click", loadAllData);

  els.openSidebarBtn?.addEventListener("click", () => {
    els.contractorSidebar?.classList.add("is-open");
    els.sidebarBackdrop?.classList.add("is-open");
    document.body.classList.add("sidebar-open");
  });

  els.closeSidebarBtn?.addEventListener("click", closeSidebar);
  els.sidebarBackdrop?.addEventListener("click", closeSidebar);

  document.querySelectorAll(".contractor-stage-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => activateStage(btn.dataset.stage || "pendingStage"));
  });

  els.quickPendingBtn?.addEventListener("click", () => activateStage("pendingStage"));
  els.quickWorkersBtn?.addEventListener("click", () => activateStage("workersStage"));

  els.openProfileBtn?.addEventListener("click", openProfileModal);

  els.pendingSearchInput?.addEventListener("input", renderPendingAssignments);
  els.pendingDateFilter?.addEventListener("change", renderPendingAssignments);
  els.approvedSearchInput?.addEventListener("input", renderApprovedAssignments);
  els.approvedDateFilter?.addEventListener("change", renderApprovedAssignments);
  els.signatureSearchInput?.addEventListener("input", renderSignatureAssignments);
  els.signatureDateFilter?.addEventListener("change", renderSignatureAssignments);

  els.workersSearchInput?.addEventListener("input", renderWorkersPool);
  els.workersCertifiedFilter?.addEventListener("change", renderWorkersPool);

  els.monthlyFilter?.addEventListener("change", loadMonthlyAssignments);
  els.monthlySearchInput?.addEventListener("input", renderMonthlyAssignments);
  els.monthlyDateFilter?.addEventListener("change", renderMonthlyAssignments);

  els.closeChangeRequestModalBtn?.addEventListener("click", closeChangeRequestModal);
  els.cancelChangeRequestBtn?.addEventListener("click", closeChangeRequestModal);
  els.changeRequestModalBackdrop?.addEventListener("click", closeChangeRequestModal);
  els.changeRequestForm?.addEventListener("submit", handleSubmitChangeRequest);

  els.closeSignatureModalBtn?.addEventListener("click", closeSignatureModal);
  els.cancelSignatureBtn?.addEventListener("click", closeSignatureModal);
  els.signatureModalBackdrop?.addEventListener("click", closeSignatureModal);
  els.signatureForm?.addEventListener("submit", handleSubmitSignature);
  els.clearSignatureBtn?.addEventListener("click", () => {
    clearSignaturePad();
    clearBox(els.signatureMessageBox);
  });

  els.closeProfileModalBtn?.addEventListener("click", closeProfileModal);
  els.cancelProfileBtn?.addEventListener("click", closeProfileModal);
  els.profileModalBackdrop?.addEventListener("click", closeProfileModal);
  els.profileForm?.addEventListener("submit", handleSaveProfile);

  els.openAddWorkerBtn?.addEventListener("click", () => openWorkerModal());
  els.closeWorkerModalBtn?.addEventListener("click", closeWorkerModal);
  els.cancelWorkerBtn?.addEventListener("click", closeWorkerModal);
  els.workerModalBackdrop?.addEventListener("click", closeWorkerModal);
  els.workerForm?.addEventListener("submit", handleSaveWorkerPoolItem);

  els.closeEventWorkersModalBtn?.addEventListener("click", closeEventWorkersModal);
  els.eventWorkersModalBackdrop?.addEventListener("click", closeEventWorkersModal);
  els.eventWorkerForm?.addEventListener("submit", handleSaveEventWorker);
  els.eventPoolSearchInput?.addEventListener("input", renderPoolPickerForEvent);
  els.eventWorkersSearchInput?.addEventListener("input", renderEventWorkersRows);

  window.addEventListener("resize", debounce(() => {
    if (isModalOpen(els.signatureModal)) {
      resizeSignatureCanvas();
      if (!state.signaturePad.hasInk) {
        redrawSignaturePlaceholder();
      }
    }
  }, 80));
}

/* =========================
   SIGNATURE PAD
========================= */

function initSignaturePad() {
  const canvas = els.signatureCanvas;
  if (!canvas) return;

  resizeSignatureCanvas();
  redrawSignaturePlaceholder();

  canvas.style.touchAction = "none";

  canvas.addEventListener("pointerdown", handleSignaturePointerDown);
  canvas.addEventListener("pointermove", handleSignaturePointerMove);
  canvas.addEventListener("pointerup", handleSignaturePointerUp);
  canvas.addEventListener("pointercancel", handleSignaturePointerUp);
  canvas.addEventListener("pointerleave", handleSignaturePointerUp);
}

function resizeSignatureCanvas() {
  const canvas = els.signatureCanvas;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(Math.floor(rect.width || 600), 320);
  const height = Math.max(Math.floor(rect.height || 180), 180);
  const dpr = Math.max(window.devicePixelRatio || 1, 1);

  const prevData = state.signaturePad.hasInk ? canvas.toDataURL("image/png") : null;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.2;

  state.signaturePad.ctx = ctx;
  state.signaturePad.dpr = dpr;

  if (prevData) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = prevData;
  }
}

function redrawSignaturePlaceholder() {
  const canvas = els.signatureCanvas;
  const ctx = state.signaturePad.ctx;
  if (!canvas || !ctx || state.signaturePad.hasInk) return;

  const width = canvas.getBoundingClientRect().width || 600;
  const height = canvas.getBoundingClientRect().height || 180;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(18, height - 28);
  ctx.lineTo(width - 18, height - 28);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = '14px Rubik, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("יש לחתום כאן", width / 2, height / 2);

  ctx.restore();
}

function clearSignaturePad() {
  const canvas = els.signatureCanvas;
  const ctx = state.signaturePad.ctx;
  if (!canvas || !ctx) return;

  const width = canvas.getBoundingClientRect().width || 600;
  const height = canvas.getBoundingClientRect().height || 180;

  ctx.clearRect(0, 0, width, height);
  state.signaturePad.isDrawing = false;
  state.signaturePad.hasInk = false;
  state.signaturePad.pointerId = null;
  redrawSignaturePlaceholder();
}

function getCanvasPoint(event) {
  const rect = els.signatureCanvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function handleSignaturePointerDown(event) {
  if (!els.signatureCanvas || !state.signaturePad.ctx) return;

  const { x, y } = getCanvasPoint(event);

  if (!state.signaturePad.hasInk) {
    const width = els.signatureCanvas.getBoundingClientRect().width || 600;
    const height = els.signatureCanvas.getBoundingClientRect().height || 180;
    state.signaturePad.ctx.clearRect(0, 0, width, height);
  }

  state.signaturePad.isDrawing = true;
  state.signaturePad.pointerId = event.pointerId;
  state.signaturePad.lastX = x;
  state.signaturePad.lastY = y;
  state.signaturePad.hasInk = true;

  state.signaturePad.ctx.beginPath();
  state.signaturePad.ctx.moveTo(x, y);
  state.signaturePad.ctx.lineTo(x + 0.01, y + 0.01);
  state.signaturePad.ctx.stroke();

  try {
    els.signatureCanvas.setPointerCapture(event.pointerId);
  } catch {
    // no-op
  }
}

function handleSignaturePointerMove(event) {
  if (!state.signaturePad.isDrawing) return;
  if (state.signaturePad.pointerId !== null && event.pointerId !== state.signaturePad.pointerId) return;

  const { x, y } = getCanvasPoint(event);
  const ctx = state.signaturePad.ctx;
  if (!ctx) return;

  ctx.beginPath();
  ctx.moveTo(state.signaturePad.lastX, state.signaturePad.lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  state.signaturePad.lastX = x;
  state.signaturePad.lastY = y;
}

function handleSignaturePointerUp(event) {
  if (state.signaturePad.pointerId !== null && event.pointerId !== state.signaturePad.pointerId) return;
  state.signaturePad.isDrawing = false;
  state.signaturePad.pointerId = null;
}

function getSignatureImageDataUrl() {
  const canvas = els.signatureCanvas;
  if (!canvas || !state.signaturePad.hasInk) return null;

  try {
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("getSignatureImageDataUrl error:", error);
    return null;
  }
}

/* =========================
   GENERAL LOAD / STATE
========================= */

function closeSidebar() {
  els.contractorSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function hydrateUser(user) {
  const name = user?.full_name?.trim() || "קבלן";
  const firstLetter = name.charAt(0) || "ק";

  if (els.contractorFullName) els.contractorFullName.textContent = name;
  if (els.contractorNameInline) els.contractorNameInline.textContent = name;
  if (els.contractorAvatar) els.contractorAvatar.textContent = firstLetter;
}

function setDefaultMonth() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (els.monthlyFilter) els.monthlyFilter.value = month;
}

async function loadContractorDetails() {
  if (!state.currentUser?.contractor_id) return;

  const { data, error } = await supabase
    .from("contractors")
    .select("id, company_name, phone, email")
    .eq("id", state.currentUser.contractor_id)
    .maybeSingle();

  if (error) {
    console.error("loadContractorDetails error:", error);
    return;
  }

  state.contractor = data || null;

  if (els.contractorCompanyName) {
    els.contractorCompanyName.textContent = state.contractor?.company_name || "ללא חברה";
  }
}

async function loadAllData() {
  clearPageMessage();

  await Promise.all([
    loadAssignments(),
    loadWorkersPool(),
    loadMonthlyAssignments()
  ]);

  renderKpis();
  renderPendingAssignments();
  renderApprovedAssignments();
  renderSignatureAssignments();
  renderWorkersPool();
  activateStage(state.activeStage || "pendingStage");
}

function activateStage(stageId = "pendingStage") {
  state.activeStage = stageId;

  document.querySelectorAll(".contractor-stage-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === stageId);
  });

  document.querySelectorAll(".contractor-stage-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.stage === stageId);
  });

  if (els.quickPendingBtn) {
    els.quickPendingBtn.classList.toggle("meteor-btn-primary", stageId === "pendingStage");
    els.quickPendingBtn.classList.toggle("meteor-btn-ghost", stageId !== "pendingStage");
  }

  if (els.quickWorkersBtn) {
    els.quickWorkersBtn.classList.toggle("meteor-btn-primary", stageId === "workersStage");
    els.quickWorkersBtn.classList.toggle("meteor-btn-ghost", stageId !== "workersStage");
  }

  if (stageId === "pendingStage") renderPendingAssignments();
  if (stageId === "approvedStage") renderApprovedAssignments();
  if (stageId === "signatureStage") renderSignatureAssignments();
  if (stageId === "workersStage") renderWorkersPool();
  if (stageId === "monthlyStage") renderMonthlyAssignments();

  requestAnimationFrame(() => {
    const activePanel = document.getElementById(stageId);
    const scrollBox = activePanel?.querySelector(".contractor-stage-list-scroll");
    if (scrollBox) scrollBox.scrollTop = 0;
  });
}

async function loadAssignments() {
  if (!state.currentUser?.contractor_id) return;

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
      requested_change_workers,
      requested_change_certified,
      requested_change_commanders,
      requested_change_early_workers,
      response_status,
      assignment_status,
      contractor_response_note,
      admin_note,
      actual_workers,
      actual_certified,
      actual_commanders,
      actual_early_workers,
      counted_at,
      signature_status,
      contractor_signed_at,
      override_arrival_time,
      override_end_time,
      override_early_workers_time,
      created_at,
      updated_at,
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
        requires_workers_list,
        status,
        city_id,
        stadium_id,
        stadiums:stadium_id (
          id,
          name
        ),
        cities:city_id (
          city_id,
          name_he
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
    .eq("contractor_id", state.currentUser.contractor_id)
    .neq("assignment_status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadAssignments error:", error);
    state.assignments = [];
    showPageMessage("לא ניתן לטעון את השיבוצים כרגע.", "error");
    return;
  }

  state.assignments = (data || []).filter(Boolean);
}

async function loadWorkersPool() {
  if (!state.currentUser?.contractor_id) return;

  const { data, error } = await supabase
    .from("contractor_workers_pool")
    .select("id, contractor_id, full_name, id_number, is_certified")
    .eq("contractor_id", state.currentUser.contractor_id)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("loadWorkersPool error:", error);
    state.workersPool = [];
    return;
  }

  state.workersPool = data || [];
}

async function loadMonthlyAssignments() {
  if (!state.currentUser?.contractor_id || !els.monthlyFilter?.value) return;

  const [monthStart, monthEnd] = getMonthRange(els.monthlyFilter.value);

  const [assignmentsRes, pricesRes] = await Promise.all([
    supabase
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
        counted_at,
        signature_status,
        contractor_signed_at,
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
          stadiums:stadium_id (
            id,
            name
          ),
          cities:city_id (
            city_id,
            name_he
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
      .eq("contractor_id", state.currentUser.contractor_id)
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
      .eq("contractor_id", state.currentUser.contractor_id)
  ]);

  if (assignmentsRes.error) {
    console.error("loadMonthlyAssignments error:", assignmentsRes.error);
    state.monthlyAssignments = [];
    state.monthlyPriceDefaults = [];
    state.monthlyComputedRows = [];
    state.monthlySummaryTotals = emptyMonthlyTotals();
    state.monthlyBlockedRows = [];
    renderMonthlyAssignments();
    return;
  }

  if (pricesRes.error) {
    console.error("loadMonthlyPrices error:", pricesRes.error);
  }

  state.monthlyAssignments = assignmentsRes.data || [];
  state.monthlyPriceDefaults = pricesRes.data || [];
  state.monthlyComputedRows = state.monthlyAssignments.map(computeMonthlyAssignmentRow);
  state.monthlyBlockedRows = state.monthlyComputedRows.filter((row) => row.isBlocked);
  state.monthlySummaryTotals = state.monthlyComputedRows.reduce((acc, row) => {
    acc.events += 1;
    acc.workers += toNumber(row.assignment.actual_workers);
    acc.certified += toNumber(row.assignment.actual_certified);
    acc.commanders += toNumber(row.assignment.actual_commanders);
    acc.early += toNumber(row.assignment.actual_early_workers);
    acc.people += row.totalPeople;
    acc.amount += row.totalAmount;
    if (row.isBlocked) acc.blocked += 1;
    return acc;
  }, emptyMonthlyTotals());

  renderMonthlyAssignments();
}

/* =========================
   KPI
========================= */

function renderKpis() {
  const pending = state.assignments.filter(isPendingAssignment).length;
  const waitingCount = state.assignments.filter(isApprovedWaitingCount).length;
  const waitingSignature = state.assignments.filter(isWaitingSignature).length;
  const pool = state.workersPool.length;

  setKpi(
    els.kpiPendingInvites,
    els.kpiPendingInvitesSub,
    pending,
    pending ? "הזמנות שעדיין מחכות לפעולה" : "אין הזמנות פתוחות"
  );

  setKpi(
    els.kpiWaitingCount,
    els.kpiWaitingCountSub,
    waitingCount,
    waitingCount ? "אירועים שאושרו וממתינים לספירה" : "אין אירועים שממתינים לספירה"
  );

  setKpi(
    els.kpiWaitingSignature,
    els.kpiWaitingSignatureSub,
    waitingSignature,
    waitingSignature ? "ספירות שדורשות חתימה" : "אין ספירות פתוחות לחתימה"
  );

  setKpi(
    els.kpiWorkersPool,
    els.kpiWorkersPoolSub,
    pool,
    pool ? "עובדים שמורים במאגר האישי" : "עדיין אין עובדים במאגר"
  );
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

/* =========================
   PENDING
========================= */

function renderPendingAssignments() {
  const term = normalizeText(els.pendingSearchInput?.value);
  const dateFilter = els.pendingDateFilter?.value || "";

  const rows = state.assignments.filter((row) => {
    if (!isPendingAssignment(row)) return false;
    return matchesAssignmentFilters(row, term, dateFilter);
  });

  if (!els.pendingAssignmentsList) return;

  if (!rows.length) {
    els.pendingAssignmentsList.innerHTML = emptyState(
      "אין הזמנות פתוחות",
      "כל ההזמנות שלך כבר טופלו."
    );
    return;
  }

  els.pendingAssignmentsList.innerHTML = rows.map((row) => renderPendingCard(row)).join("");

  els.pendingAssignmentsList.querySelectorAll(".js-approve-assignment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await approveAssignment(row);
    });
  });

  els.pendingAssignmentsList.querySelectorAll(".js-reject-assignment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await rejectAssignment(row);
    });
  });

  els.pendingAssignmentsList.querySelectorAll(".js-open-change-request").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) openChangeRequestModal(row);
    });
  });

  els.pendingAssignmentsList.querySelectorAll(".js-open-workers-list").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await openEventWorkersModal(row);
    });
  });
}

function renderPendingCard(row) {
  const event = row.events || {};
  const requiresWorkersList = !!event.requires_workers_list;

  return `
    <article class="meteor-event-card contractor-event-card">
      <div class="meteor-event-card-top">
        <div class="meteor-event-card-main">
          <div class="meteor-event-card-badges">
            <span class="meteor-mini-badge warning">ממתין לתגובה</span>
            <span class="meteor-mini-badge muted">${event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל"}</span>
            ${requiresWorkersList ? '<span class="meteor-mini-badge primary">דורש רשימת עובדים</span>' : ""}
          </div>

          <h3>${escapeHtml(getEventDisplayTitle(event))}</h3>

          <div class="meteor-event-meta-grid">
            <div class="meteor-event-meta-item">
              <span>תאריך</span>
              <strong>${formatDate(event.event_date)}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>מיקום</span>
              <strong>${escapeHtml(getEventLocation(event))}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>שעת התייצבות</span>
              <strong>${formatTime(getAssignmentArrivalTime(row))}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>שעת סיום</span>
              <strong>${formatTime(getAssignmentEndTime(row))}</strong>
            </div>
          </div>

          <div class="contractor-quantity-strip">
            <span>דיילים: <strong>${toNumber(row.requested_workers)}</strong></span>
            <span>בעלי תעודה: <strong>${toNumber(row.requested_certified)}</strong></span>
            <span>מפקדים: <strong>${toNumber(row.requested_commanders)}</strong></span>
            <span>כוח מקדים: <strong>${toNumber(row.requested_early_workers)}</strong></span>
            <span>סה״כ: <strong>${getRequestedTotal(row)}</strong></span>
          </div>

          ${
            row.contractor_response_note
              ? `
              <div class="contractor-card-subactions">
                <span class="meteor-mini-badge muted">הערה קיימת: ${escapeHtml(row.contractor_response_note)}</span>
              </div>
            `
              : ""
          }
        </div>

        <div class="meteor-event-card-actions contractor-card-actions">
          <button class="meteor-btn meteor-btn-primary w-100 js-approve-assignment" data-id="${row.id}" type="button">
            אישור הגעה
          </button>
          <button class="meteor-btn meteor-btn-outline w-100 js-open-change-request" data-id="${row.id}" type="button">
            בקשת שינוי כמות
          </button>
          <button class="meteor-btn meteor-btn-ghost w-100 js-reject-assignment" data-id="${row.id}" type="button">
            דחייה
          </button>
          ${
            requiresWorkersList
              ? `
                <button class="meteor-btn meteor-btn-ghost w-100 js-open-workers-list" data-id="${row.id}" type="button">
                  רשימת עובדים
                </button>
              `
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

async function approveAssignment(row) {
  const confirmed = window.confirm(`לאשר הגעה עבור "${getEventDisplayTitle(row.events || {})}"?`);
  if (!confirmed) return;

  const payload = {
    response_status: "approved",
    contractor_response_note: cleanNullable(row.contractor_response_note),
    requested_change_workers: null,
    requested_change_certified: null,
    requested_change_commanders: null,
    requested_change_early_workers: null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("contractor_assignments")
    .update(payload)
    .eq("id", row.id)
    .eq("contractor_id", state.currentUser.contractor_id);

  if (error) {
    console.error("approveAssignment error:", error);
    showPageMessage("לא ניתן לאשר הגעה כרגע.", "error");
    return;
  }

  showPageMessage("אישור ההגעה נשמר בהצלחה.", "success");
  await loadAllData();
}

async function rejectAssignment(row) {
  const confirmed = window.confirm(`לדחות את ההזמנה עבור "${getEventDisplayTitle(row.events || {})}"?`);
  if (!confirmed) return;

  const payload = {
    response_status: "rejected",
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("contractor_assignments")
    .update(payload)
    .eq("id", row.id)
    .eq("contractor_id", state.currentUser.contractor_id);

  if (error) {
    console.error("rejectAssignment error:", error);
    showPageMessage("לא ניתן לדחות את ההזמנה כרגע.", "error");
    return;
  }

  showPageMessage("ההזמנה נדחתה.", "success");
  await loadAllData();
}

/* =========================
   CHANGE REQUEST
========================= */

function openChangeRequestModal(row) {
  state.selectedChangeAssignment = row;

  els.changeAssignmentId.value = String(row.id);
  els.changeWorkers.value = toNumber(row.requested_workers);
  els.changeCertified.value = toNumber(row.requested_certified);
  els.changeCommanders.value = toNumber(row.requested_commanders);
  els.changeEarly.value = toNumber(row.requested_early_workers);
  els.changeRequestNote.value = row.contractor_response_note || "";
  els.changeRequestModalSubtitle.textContent =
    `${getEventDisplayTitle(row.events || {})} · ${formatDate(row.events?.event_date)}`;

  clearBox(els.changeRequestMessageBox);
  openModal(els.changeRequestModal, els.changeRequestModalBackdrop);
}

function closeChangeRequestModal() {
  state.selectedChangeAssignment = null;
  els.changeRequestForm?.reset();
  clearBox(els.changeRequestMessageBox);
  closeModal(els.changeRequestModal, els.changeRequestModalBackdrop);
}

async function handleSubmitChangeRequest(event) {
  event.preventDefault();

  if (!state.selectedChangeAssignment) return;

  const assignmentId = Number(els.changeAssignmentId.value || 0);
  if (!assignmentId) return;

  const payload = {
    response_status: "change_requested",
    requested_change_workers: sanitizeInt(els.changeWorkers.value),
    requested_change_certified: sanitizeInt(els.changeCertified.value),
    requested_change_commanders: sanitizeInt(els.changeCommanders.value),
    requested_change_early_workers: sanitizeInt(els.changeEarly.value),
    contractor_response_note: cleanNullable(els.changeRequestNote.value),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("contractor_assignments")
    .update(payload)
    .eq("id", assignmentId)
    .eq("contractor_id", state.currentUser.contractor_id);

  if (error) {
    console.error("handleSubmitChangeRequest error:", error);
    showBoxMessage(els.changeRequestMessageBox, "לא ניתן לשמור את בקשת השינוי כרגע.", "error");
    return;
  }

  showPageMessage("בקשת שינוי הכמות נשלחה בהצלחה.", "success");
  closeChangeRequestModal();
  await loadAllData();
}

/* =========================
   APPROVED / WAITING COUNT
========================= */

function renderApprovedAssignments() {
  const term = normalizeText(els.approvedSearchInput?.value);
  const dateFilter = els.approvedDateFilter?.value || "";

  const rows = state.assignments.filter((row) => {
    if (!isApprovedWaitingCount(row)) return false;
    return matchesAssignmentFilters(row, term, dateFilter);
  });

  if (!els.approvedAssignmentsList) return;

  if (!rows.length) {
    els.approvedAssignmentsList.innerHTML = emptyState(
      "אין אירועים שממתינים לספירה",
      "אירועים שאישרת יופיעו כאן עד שהמנהל יספור אותם."
    );
    return;
  }

  els.approvedAssignmentsList.innerHTML = rows.map((row) => renderApprovedCard(row)).join("");

  els.approvedAssignmentsList.querySelectorAll(".js-open-workers-list").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await openEventWorkersModal(row);
    });
  });
}

function renderApprovedCard(row) {
  const event = row.events || {};
  const requiresWorkersList = !!event.requires_workers_list;

  return `
    <article class="meteor-event-card contractor-event-card">
      <div class="meteor-event-card-top">
        <div class="meteor-event-card-main">
          <div class="meteor-event-card-badges">
            <span class="meteor-mini-badge success">אושר הגעה</span>
            <span class="meteor-mini-badge muted">ממתין לספירה</span>
            ${requiresWorkersList ? '<span class="meteor-mini-badge primary">דורש רשימת עובדים</span>' : ""}
          </div>

          <h3>${escapeHtml(getEventDisplayTitle(event))}</h3>

          <div class="meteor-event-meta-grid">
            <div class="meteor-event-meta-item">
              <span>תאריך</span>
              <strong>${formatDate(event.event_date)}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>מיקום</span>
              <strong>${escapeHtml(getEventLocation(event))}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>התייצבות</span>
              <strong>${formatTime(getAssignmentArrivalTime(row))}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>סיום</span>
              <strong>${formatTime(getAssignmentEndTime(row))}</strong>
            </div>
          </div>

          <div class="contractor-quantity-strip">
            <span>דיילים: <strong>${toNumber(row.requested_workers)}</strong></span>
            <span>בעלי תעודה: <strong>${toNumber(row.requested_certified)}</strong></span>
            <span>מפקדים: <strong>${toNumber(row.requested_commanders)}</strong></span>
            <span>כוח מקדים: <strong>${toNumber(row.requested_early_workers)}</strong></span>
            <span>סה״כ: <strong>${getRequestedTotal(row)}</strong></span>
          </div>
        </div>

        <div class="meteor-event-card-actions contractor-card-actions">
          <div class="contractor-waiting-badge">ממתין לספירה ע״י מנהל</div>
          ${
            requiresWorkersList
              ? `
                <button class="meteor-btn meteor-btn-ghost w-100 js-open-workers-list" data-id="${row.id}" type="button">
                  ניהול רשימת עובדים
                </button>
              `
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

/* =========================
   SIGNATURE WAITING
========================= */

function renderSignatureAssignments() {
  const term = normalizeText(els.signatureSearchInput?.value);
  const dateFilter = els.signatureDateFilter?.value || "";

  const rows = state.assignments.filter((row) => {
    if (!isWaitingSignature(row)) return false;
    return matchesAssignmentFilters(row, term, dateFilter);
  });

  if (!els.signatureAssignmentsList) return;

  if (!rows.length) {
    els.signatureAssignmentsList.innerHTML = emptyState(
      "אין ספירות שממתינות לחתימה",
      "לאחר שהמנהל יספור אותך, האירוע יופיע כאן לחתימה."
    );
    return;
  }

  els.signatureAssignmentsList.innerHTML = rows.map((row) => renderSignatureCard(row)).join("");

  els.signatureAssignmentsList.querySelectorAll(".js-open-signature").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.assignments.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) openSignatureModal(row);
    });
  });
}

function renderSignatureCard(row) {
  const event = row.events || {};

  return `
    <article class="meteor-event-card contractor-event-card">
      <div class="meteor-event-card-top">
        <div class="meteor-event-card-main">
          <div class="meteor-event-card-badges">
            <span class="meteor-mini-badge primary">ממתין לחתימה</span>
            <span class="meteor-mini-badge muted">${event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל"}</span>
          </div>

          <h3>${escapeHtml(getEventDisplayTitle(event))}</h3>

          <div class="meteor-event-meta-grid">
            <div class="meteor-event-meta-item">
              <span>תאריך</span>
              <strong>${formatDate(event.event_date)}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>מיקום</span>
              <strong>${escapeHtml(getEventLocation(event))}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>נספר בתאריך</span>
              <strong>${row.counted_at ? formatDateTime(row.counted_at) : "-"}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>סה״כ בפועל</span>
              <strong>${getActualTotal(row)}</strong>
            </div>
          </div>

          <div class="contractor-quantity-strip contractor-actual-strip">
            <span>דיילים בפועל: <strong>${toNumber(row.actual_workers)}</strong></span>
            <span>בעלי תעודה בפועל: <strong>${toNumber(row.actual_certified)}</strong></span>
            <span>מפקדים בפועל: <strong>${toNumber(row.actual_commanders)}</strong></span>
            <span>כוח מקדים בפועל: <strong>${toNumber(row.actual_early_workers)}</strong></span>
          </div>
        </div>

        <div class="meteor-event-card-actions contractor-card-actions">
          <button class="meteor-btn meteor-btn-primary w-100 js-open-signature" data-id="${row.id}" type="button">
            חתימה על הספירה
          </button>
        </div>
      </div>
    </article>
  `;
}

function openSignatureModal(row) {
  state.selectedSignatureAssignment = row;
  els.signatureAssignmentId.value = String(row.id);
  els.signatureNote.value = row.contractor_signature_note || "";
  els.signatureConfirmCheckbox.checked = false;
  els.signatureModalSubtitle.textContent =
    `${getEventDisplayTitle(row.events || {})} · ${formatDate(row.events?.event_date)}`;

  els.signatureStatsBox.innerHTML = `
    <article class="contractor-signature-stat-card">
      <span>דיילים בפועל</span>
      <strong>${Number(row.actual_workers || 0)}</strong>
    </article>
    <article class="contractor-signature-stat-card">
      <span>בעלי תעודה בפועל</span>
      <strong>${Number(row.actual_certified || 0)}</strong>
    </article>
    <article class="contractor-signature-stat-card">
      <span>מפקדים בפועל</span>
      <strong>${Number(row.actual_commanders || 0)}</strong>
    </article>
    <article class="contractor-signature-stat-card">
      <span>כוח מקדים בפועל</span>
      <strong>${Number(row.actual_early_workers || 0)}</strong>
    </article>
    <article class="contractor-signature-stat-card contractor-signature-stat-card-total">
      <span>סה״כ בפועל</span>
      <strong>${getActualTotal(row)}</strong>
    </article>
  `;

  clearSignaturePad();
  clearBox(els.signatureMessageBox);
  openModal(els.signatureModal, els.signatureModalBackdrop);

  requestAnimationFrame(() => {
    resizeSignatureCanvas();
    clearSignaturePad();
  });
}

function closeSignatureModal() {
  state.selectedSignatureAssignment = null;
  els.signatureForm?.reset();
  clearBox(els.signatureMessageBox);
  clearSignaturePad();
  closeModal(els.signatureModal, els.signatureModalBackdrop);
}

async function handleSubmitSignature(event) {
  event.preventDefault();

  const assignmentId = Number(els.signatureAssignmentId.value || 0);
  if (!assignmentId) return;

  if (!els.signatureConfirmCheckbox.checked) {
    showBoxMessage(els.signatureMessageBox, "יש לסמן שהספירה אושרה לפני החתימה.", "warning");
    return;
  }

  if (!state.signaturePad.hasInk) {
    showBoxMessage(els.signatureMessageBox, "יש לחתום בתוך המלבן לפני אישור.", "warning");
    return;
  }

  const note = cleanNullable(els.signatureNote.value);
  const signedAt = new Date().toISOString();
  const signatureImageUrl = getSignatureImageDataUrl();

  if (!signatureImageUrl) {
    showBoxMessage(els.signatureMessageBox, "לא ניתן לקרוא את החתימה כרגע. נסה שוב.", "error");
    return;
  }

  const updateRes = await supabase
    .from("contractor_assignments")
    .update({
      signature_status: "signed",
      contractor_signed_at: signedAt,
      contractor_signature_note: note,
      updated_at: signedAt
    })
    .eq("id", assignmentId)
    .eq("contractor_id", state.currentUser.contractor_id);

  if (updateRes.error) {
    console.error("handleSubmitSignature update error:", updateRes.error);
    showBoxMessage(els.signatureMessageBox, "לא ניתן לשמור את אישור החתימה כרגע.", "error");
    return;
  }

  const existingSignatureRes = await supabase
    .from("contractor_signatures")
    .select("id")
    .eq("assignment_id", assignmentId)
    .eq("contractor_id", state.currentUser.contractor_id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSignatureRes.error) {
    console.error("existing signature lookup error:", existingSignatureRes.error);
  }

  let signError = null;

  if (existingSignatureRes.data?.id) {
    const res = await supabase
      .from("contractor_signatures")
      .update({
        signed_by_user_id: state.currentUser.id,
        signature_status: "signed",
        signature_image_url: signatureImageUrl,
        sign_note: note,
        signed_at: signedAt
      })
      .eq("id", existingSignatureRes.data.id);

    signError = res.error;
  } else {
    const res = await supabase
      .from("contractor_signatures")
      .insert({
        assignment_id: assignmentId,
        contractor_id: state.currentUser.contractor_id,
        signed_by_user_id: state.currentUser.id,
        signature_status: "signed",
        signature_image_url: signatureImageUrl,
        sign_note: note,
        signed_at: signedAt
      });

    signError = res.error;
  }

  if (signError) {
    console.error("contractor_signatures save error:", signError);
    showBoxMessage(
      els.signatureMessageBox,
      "אישור הספירה נשמר, אבל שמירת תמונת החתימה נכשלה. בדוק הרשאות/מבנה טבלה.",
      "error"
    );
    return;
  }

  showPageMessage("החתימה נשמרה בהצלחה והאירוע עבר לפירוט החודשי.", "success");
  closeSignatureModal();
  await loadAllData();
}

/* =========================
   PROFILE
========================= */

function openProfileModal() {
  els.profileFullName.value = state.currentUser?.full_name || "";
  els.profilePhone.value = state.currentUser?.phone || "";
  els.profileUsername.value = state.currentUser?.username || "";
  els.profileNewPassword.value = "";
  els.profileCurrentPassword.value = "";
  clearBox(els.profileMessageBox);
  openModal(els.profileModal, els.profileModalBackdrop);
}

function closeProfileModal() {
  els.profileForm?.reset();
  clearBox(els.profileMessageBox);
  closeModal(els.profileModal, els.profileModalBackdrop);
}

async function handleSaveProfile(event) {
  event.preventDefault();

  const oldPassword = els.profileCurrentPassword.value.trim();
  if (!oldPassword) {
    showBoxMessage(els.profileMessageBox, "יש להזין את הסיסמה הנוכחית.", "warning");
    return;
  }

  const payload = {
    user_id: state.currentUser.id,
    old_password: oldPassword,
    new_username: cleanNullable(els.profileUsername.value),
    new_password: cleanNullable(els.profileNewPassword.value),
    new_full_name: cleanNullable(els.profileFullName.value),
    new_phone: cleanNullable(els.profilePhone.value)
  };

  try {
    const response = await fetch(CHANGE_CREDENTIALS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok || !result?.ok || !result?.user) {
      showBoxMessage(els.profileMessageBox, mapProfileError(result?.error), "error");
      return;
    }

    state.currentUser = result.user;
    hydrateUser(result.user);

    const session = getSession();
    saveSession({
      session_token: session?.session_token || "",
      user: result.user
    });

    showPageMessage("הפרטים עודכנו בהצלחה.", "success");
    closeProfileModal();
  } catch (error) {
    console.error("handleSaveProfile error:", error);
    showBoxMessage(els.profileMessageBox, "לא ניתן לעדכן פרטים כרגע.", "error");
  }
}

function mapProfileError(error) {
  switch (String(error || "")) {
    case "Missing required fields":
      return "חסרים נתונים חובה.";
    case "No changes submitted":
      return "לא בוצע שינוי בפרטים.";
    case "User not found":
      return "המשתמש לא נמצא.";
    case "Current password is incorrect":
      return "הסיסמה הנוכחית שגויה.";
    case "Username already exists":
      return "שם המשתמש כבר תפוס.";
    case "Failed to update credentials":
      return "עדכון הפרטים נכשל.";
    default:
      return "לא ניתן לעדכן את הפרטים כרגע.";
  }
}

/* =========================
   WORKERS POOL
========================= */

function renderWorkersPool() {
  if (!els.workersPoolList) return;

  const term = normalizeText(els.workersSearchInput?.value);
  const certifiedFilter = els.workersCertifiedFilter?.value || "all";

  const rows = state.workersPool.filter((row) => {
    const matchText = [row.full_name, row.id_number].filter(Boolean).join(" ").toLowerCase();
    if (term && !matchText.includes(term)) return false;

    if (certifiedFilter === "certified" && !row.is_certified) return false;
    if (certifiedFilter === "regular" && row.is_certified) return false;

    return true;
  });

  if (!rows.length) {
    els.workersPoolList.innerHTML = emptyState("אין עובדים במאגר", "הוסף עובדים כדי להתחיל.");
    return;
  }

  els.workersPoolList.innerHTML = rows.map((row) => `
    <article class="meteor-simple-row-card">
      <div class="meteor-simple-row-main">
        <h4>${escapeHtml(row.full_name)}</h4>
        <div class="meteor-simple-row-meta">
          <span>ת״ז: ${escapeHtml(row.id_number)}</span>
          <span>${row.is_certified ? "בעל תעודה" : "דייל"}</span>
        </div>
      </div>

      <div class="meteor-simple-row-actions">
        <button class="meteor-btn meteor-btn-outline js-edit-worker" data-id="${row.id}" type="button">עריכה</button>
        <button class="meteor-btn meteor-btn-ghost js-delete-worker" data-id="${row.id}" type="button">מחיקה</button>
      </div>
    </article>
  `).join("");

  els.workersPoolList.querySelectorAll(".js-edit-worker").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.workersPool.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) openWorkerModal(row);
    });
  });

  els.workersPoolList.querySelectorAll(".js-delete-worker").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const row = state.workersPool.find((x) => String(x.id) === String(btn.dataset.id));
      if (row) await deleteWorkerPoolItem(row);
    });
  });
}

function openWorkerModal(row = null) {
  clearBox(els.workerModalMessageBox);
  els.workerForm?.reset();

  if (row) {
    els.workerModalTitle.textContent = "עריכת עובד";
    els.workerPoolId.value = String(row.id);
    els.workerFullName.value = row.full_name || "";
    els.workerIdNumber.value = row.id_number || "";
    els.workerIsCertified.checked = !!row.is_certified;
  } else {
    els.workerModalTitle.textContent = "הוספת עובד";
    els.workerPoolId.value = "";
    els.workerIsCertified.checked = false;
  }

  openModal(els.workerModal, els.workerModalBackdrop);
}

function closeWorkerModal() {
  els.workerForm?.reset();
  clearBox(els.workerModalMessageBox);
  closeModal(els.workerModal, els.workerModalBackdrop);
}

async function handleSaveWorkerPoolItem(event) {
  event.preventDefault();

  const id = Number(els.workerPoolId.value || 0);
  const fullName = els.workerFullName.value.trim();
  const idNumber = els.workerIdNumber.value.trim();
  const isCertified = !!els.workerIsCertified.checked;

  if (!fullName || !idNumber) {
    showBoxMessage(els.workerModalMessageBox, "יש למלא שם ותעודת זהות.", "warning");
    return;
  }

  const duplicate = state.workersPool.find((row) => {
    if (id && Number(row.id) === id) return false;
    return String(row.id_number) === idNumber;
  });

  if (duplicate) {
    showBoxMessage(els.workerModalMessageBox, "עובד עם אותה תעודת זהות כבר קיים במאגר.", "warning");
    return;
  }

  let error = null;

  if (id) {
    const res = await supabase
      .from("contractor_workers_pool")
      .update({
        full_name: fullName,
        id_number: idNumber,
        is_certified: isCertified
      })
      .eq("id", id)
      .eq("contractor_id", state.currentUser.contractor_id);

    error = res.error;
  } else {
    const res = await supabase
      .from("contractor_workers_pool")
      .insert({
        contractor_id: state.currentUser.contractor_id,
        full_name: fullName,
        id_number: idNumber,
        is_certified: isCertified
      });

    error = res.error;
  }

  if (error) {
    console.error("handleSaveWorkerPoolItem error:", error);
    showBoxMessage(els.workerModalMessageBox, "לא ניתן לשמור את העובד כרגע.", "error");
    return;
  }

  closeWorkerModal();
  showPageMessage("העובד נשמר בהצלחה.", "success");
  await loadWorkersPool();
  renderWorkersPool();
  renderKpis();
}

async function deleteWorkerPoolItem(row) {
  const confirmed = window.confirm(`למחוק את ${row.full_name} מהמאגר?`);
  if (!confirmed) return;

  const { error } = await supabase
    .from("contractor_workers_pool")
    .delete()
    .eq("id", row.id);

  if (error) {
    console.error("deleteWorkerPoolItem error:", error);
    showPageMessage("לא ניתן למחוק את העובד כרגע.", "error");
    return;
  }

  showPageMessage("העובד נמחק מהמאגר.", "success");
  await loadWorkersPool();
  renderWorkersPool();
  renderKpis();
}

/* =========================
   EVENT WORKERS MODAL
========================= */

async function openEventWorkersModal(assignmentRow) {
  state.selectedEventWorkerAssignment = assignmentRow;
  els.eventWorkerAssignmentId.value = assignmentRow.id;
  els.eventWorkersModalTitle.textContent = `רשימת עובדים - ${getEventDisplayTitle(assignmentRow.events || {})}`;
  els.eventWorkersModalSubtitle.textContent = `${formatDate(assignmentRow.events?.event_date)} · ${getEventLocation(assignmentRow.events || {})}`;

  els.eventWorkerForm?.reset();
  els.eventWorkerAssignmentId.value = assignmentRow.id;
  if (els.saveWorkerToPoolCheckbox) els.saveWorkerToPoolCheckbox.checked = true;
  if (els.eventPoolSearchInput) els.eventPoolSearchInput.value = "";
  if (els.eventWorkersSearchInput) els.eventWorkersSearchInput.value = "";

  clearBox(els.eventWorkersMessageBox);

  await loadEventWorkersRows(assignmentRow.id);
  renderPoolPickerForEvent();
  renderEventWorkersRows();

  openModal(els.eventWorkersModal, els.eventWorkersModalBackdrop);
}

function closeEventWorkersModal() {
  state.selectedEventWorkerAssignment = null;
  state.selectedEventWorkerRows = [];
  els.eventWorkerForm?.reset();
  clearBox(els.eventWorkersMessageBox);

  if (els.eventPoolResults) {
    els.eventPoolResults.innerHTML = emptyState("חפש עובד", "כאן יופיעו תוצאות מתוך המאגר שלך.");
  }

  if (els.eventWorkersListWrap) {
    els.eventWorkersListWrap.innerHTML = emptyState("אין עובדים ברשימה", "הוסף עובדים כדי לבנות את הרשימה.");
  }

  closeModal(els.eventWorkersModal, els.eventWorkersModalBackdrop);
}

async function loadEventWorkersRows(assignmentId) {
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
    .eq("assignment_id", assignmentId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("loadEventWorkersRows error:", error);
    state.selectedEventWorkerRows = [];
    showBoxMessage(els.eventWorkersMessageBox, "לא ניתן לטעון את רשימת העובדים כרגע.", "error");
    return;
  }

  state.selectedEventWorkerRows = data || [];
}

function renderPoolPickerForEvent() {
  if (!els.eventPoolResults) return;

  const term = normalizeText(els.eventPoolSearchInput?.value);
  const rows = state.workersPool.filter((row) => {
    const haystack = [row.full_name, row.id_number].filter(Boolean).join(" ").toLowerCase();
    if (!term) return true;
    return haystack.includes(term);
  }).slice(0, 12);

  if (!rows.length) {
    els.eventPoolResults.innerHTML = emptyState("לא נמצאו עובדים", "נסה חיפוש אחר.");
    return;
  }

  els.eventPoolResults.innerHTML = rows.map((row) => `
    <button class="meteor-pick-row js-pick-pool-worker" type="button" data-id="${row.id}">
      <div>
        <strong>${escapeHtml(row.full_name)}</strong>
        <span>ת״ז: ${escapeHtml(row.id_number)}</span>
      </div>
      <span>${row.is_certified ? "בעל תעודה" : "דייל"}</span>
    </button>
  `).join("");

  els.eventPoolResults.querySelectorAll(".js-pick-pool-worker").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = state.workersPool.find((x) => String(x.id) === String(btn.dataset.id));
      if (!row) return;

      els.eventWorkerFullName.value = row.full_name || "";
      els.eventWorkerIdNumber.value = row.id_number || "";
      els.eventWorkerIsCertified.checked = !!row.is_certified;
    });
  });
}

function renderEventWorkersRows() {
  if (!els.eventWorkersListWrap) return;

  const term = normalizeText(els.eventWorkersSearchInput?.value);
  const rows = state.selectedEventWorkerRows.filter((row) => {
    const haystack = [row.full_name, row.id_number, row.worker_status].filter(Boolean).join(" ").toLowerCase();
    return !term || haystack.includes(term);
  });

  if (!rows.length) {
    els.eventWorkersListWrap.innerHTML = emptyState("אין עובדים ברשימה", "הוסף עובדים כדי להתחיל.");
    return;
  }

  els.eventWorkersListWrap.innerHTML = rows.map((row) => `
    <article class="meteor-simple-row-card">
      <div class="meteor-simple-row-main">
        <h4>${escapeHtml(row.full_name)}</h4>
        <div class="meteor-simple-row-meta">
          <span>ת״ז: ${escapeHtml(row.id_number)}</span>
          <span>${row.is_certified ? "בעל תעודה" : "דייל"}</span>
          ${row.is_spare ? "<span>ספייר</span>" : ""}
          <span>${getWorkerStatusLabel(row.worker_status)}</span>
        </div>
        ${
          row.review_note
            ? `<div class="meteor-inline-note">הערת חברה: ${escapeHtml(row.review_note)}</div>`
            : ""
        }
      </div>

      <div class="meteor-simple-row-actions">
        <button class="meteor-btn meteor-btn-ghost js-delete-event-worker" data-id="${row.id}" type="button">
          מחיקה
        </button>
      </div>
    </article>
  `).join("");

  els.eventWorkersListWrap.querySelectorAll(".js-delete-event-worker").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteEventWorker(btn.dataset.id);
    });
  });
}

async function handleSaveEventWorker(event) {
  event.preventDefault();

  if (!state.selectedEventWorkerAssignment) return;

  const assignmentId = Number(els.eventWorkerAssignmentId.value || 0);
  const fullName = els.eventWorkerFullName.value.trim();
  const idNumber = els.eventWorkerIdNumber.value.trim();

  if (!fullName || !idNumber) {
    showBoxMessage(els.eventWorkersMessageBox, "יש למלא שם ותעודת זהות.", "warning");
    return;
  }

  const duplicateInEvent = state.selectedEventWorkerRows.find((row) => row.id_number === idNumber);
  if (duplicateInEvent) {
    showBoxMessage(els.eventWorkersMessageBox, "העובד כבר קיים ברשימת האירוע.", "warning");
    return;
  }

  let workerPoolId = null;

  if (els.saveWorkerToPoolCheckbox.checked) {
    const existingPoolWorker = state.workersPool.find((row) => row.id_number === idNumber);

    if (existingPoolWorker) {
      workerPoolId = existingPoolWorker.id;
    } else {
      const poolInsert = await supabase
        .from("contractor_workers_pool")
        .insert({
          contractor_id: state.currentUser.contractor_id,
          full_name: fullName,
          id_number: idNumber,
          is_certified: !!els.eventWorkerIsCertified.checked
        })
        .select("id")
        .single();

      if (poolInsert.error || !poolInsert.data) {
        console.error("handleSaveEventWorker pool insert error:", poolInsert.error);
        showBoxMessage(els.eventWorkersMessageBox, "לא ניתן לשמור את העובד במאגר כרגע.", "error");
        return;
      }

      workerPoolId = poolInsert.data.id;
      await loadWorkersPool();
      renderKpis();
      renderWorkersPool();
    }
  }

  const { error } = await supabase
    .from("contractor_assignment_workers")
    .insert({
      assignment_id: assignmentId,
      contractor_id: state.currentUser.contractor_id,
      worker_pool_id: workerPoolId,
      full_name: fullName,
      id_number: idNumber,
      is_certified: !!els.eventWorkerIsCertified.checked,
      is_spare: !!els.eventWorkerIsSpare.checked,
      worker_status: "pending"
    });

  if (error) {
    console.error("handleSaveEventWorker error:", error);
    showBoxMessage(els.eventWorkersMessageBox, "לא ניתן להוסיף את העובד לרשימת האירוע.", "error");
    return;
  }

  els.eventWorkerForm.reset();
  if (els.saveWorkerToPoolCheckbox) els.saveWorkerToPoolCheckbox.checked = true;

  await loadEventWorkersRows(assignmentId);
  renderPoolPickerForEvent();
  renderEventWorkersRows();
  showBoxMessage(els.eventWorkersMessageBox, "העובד נוסף לרשימת האירוע.", "success");
}

async function deleteEventWorker(workerRowId) {
  const row = state.selectedEventWorkerRows.find((x) => String(x.id) === String(workerRowId));
  if (!row) return;

  const confirmed = window.confirm(`למחוק את ${row.full_name} מרשימת האירוע?`);
  if (!confirmed) return;

  const { error } = await supabase
    .from("contractor_assignment_workers")
    .delete()
    .eq("id", row.id)
    .eq("contractor_id", state.currentUser.contractor_id);

  if (error) {
    console.error("deleteEventWorker error:", error);
    showBoxMessage(els.eventWorkersMessageBox, "לא ניתן למחוק את העובד כרגע.", "error");
    return;
  }

  await loadEventWorkersRows(state.selectedEventWorkerAssignment.id);
  renderEventWorkersRows();
  showBoxMessage(els.eventWorkersMessageBox, "העובד הוסר מהרשימה.", "success");
}

/* =========================
   MONTHLY
========================= */

function renderMonthlyAssignments() {
  if (!els.monthlyAssignmentsList || !els.monthlySummaryCards) return;

  const term = normalizeText(els.monthlySearchInput?.value);
  const dateFilter = els.monthlyDateFilter?.value || "";

  const rows = state.monthlyComputedRows.filter((row) => {
    const event = row.event || {};
    if (dateFilter && event.event_date !== dateFilter) return false;

    const haystack = [
      row.title,
      event.event_name,
      event.competition_type,
      event.stadiums?.name,
      event.cities?.name_he,
      event.home_team?.name,
      event.away_team?.name,
      event.manual_location
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(term);
  });

  renderMonthlySummary(rows);
  renderMonthlyStatus(rows);

  if (!rows.length) {
    els.monthlyAssignmentsList.innerHTML = emptyState(
      "אין פירוט חודשי להצגה",
      "בחודש זה עדיין אין אירועים חתומים שתואמים לסינון."
    );
    return;
  }

  els.monthlyAssignmentsList.innerHTML = rows.map((row) => `
    <article class="meteor-event-card contractor-monthly-card ${row.isBlocked ? "is-blocked" : ""}">
      <div class="meteor-event-card-top">
        <div class="meteor-event-card-main">
          <div class="meteor-event-card-badges">
            <span class="meteor-mini-badge primary">חתום</span>
            <span class="meteor-mini-badge muted">${row.event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל"}</span>
            ${
              row.isBlocked
                ? `<span class="meteor-mini-badge warning">חסום לחישוב</span>`
                : `<span class="meteor-mini-badge success">${escapeHtml(row.pricingMode)}</span>`
            }
          </div>

          <h3>${escapeHtml(row.title)}</h3>

          <div class="meteor-event-meta-grid">
            <div class="meteor-event-meta-item">
              <span>תאריך</span>
              <strong>${formatDate(row.event.event_date)}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>מיקום</span>
              <strong>${escapeHtml(row.location)}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>סה״כ בפועל</span>
              <strong>${row.totalPeople}</strong>
            </div>
            <div class="meteor-event-meta-item">
              <span>נחתם בתאריך</span>
              <strong>${row.assignment.contractor_signed_at ? formatDateTime(row.assignment.contractor_signed_at) : "-"}</strong>
            </div>
          </div>

          <div class="contractor-quantity-strip contractor-actual-strip">
            <span>דיילים בפועל: <strong>${toNumber(row.assignment.actual_workers)}</strong></span>
            <span>בעלי תעודה בפועל: <strong>${toNumber(row.assignment.actual_certified)}</strong></span>
            <span>מפקדים בפועל: <strong>${toNumber(row.assignment.actual_commanders)}</strong></span>
            <span>כוח מקדים בפועל: <strong>${toNumber(row.assignment.actual_early_workers)}</strong></span>
            <span>שעות ראשיות: <strong>${row.mainHours}</strong></span>
            <span>שעות מוקדם: <strong>${row.earlyHours}</strong></span>
          </div>

          <div class="contractor-quantity-strip">
            <span>מקור מחיר: <strong>${escapeHtml(row.pricingSource)}</strong></span>
            <span>תמחור: <strong>${escapeHtml(row.pricingMode)}</strong></span>
            ${
              row.pricingExplain
                ? `<span>פירוט: <strong>${escapeHtml(row.pricingExplain)}</strong></span>`
                : ""
            }
          </div>

          ${
            row.isBlocked
              ? `
                <div class="meteor-alert meteor-alert-warning mt-3">
                  <div class="meteor-alert-text">${escapeHtml(row.blockReason)}</div>
                </div>
              `
              : `
                <div class="contractor-quantity-strip contractor-actual-strip">
                  <span>סכום דיילים: <strong>${formatCurrency(row.amounts.workers)}</strong></span>
                  <span>סכום בעלי תעודה: <strong>${formatCurrency(row.amounts.certified)}</strong></span>
                  <span>סכום מפקדים: <strong>${formatCurrency(row.amounts.commanders)}</strong></span>
                  <span>סכום כוח מקדים: <strong>${formatCurrency(row.amounts.early)}</strong></span>
                  <span>סה״כ לאירוע: <strong>${formatCurrency(row.totalAmount)}</strong></span>
                </div>
              `
          }
        </div>
      </div>
    </article>
  `).join("");
}

function renderMonthlySummary(rows) {
  if (!els.monthlySummaryCards) return;

  const totals = rows.reduce((acc, row) => {
    acc.events += 1;
    acc.workers += toNumber(row.assignment.actual_workers);
    acc.certified += toNumber(row.assignment.actual_certified);
    acc.commanders += toNumber(row.assignment.actual_commanders);
    acc.early += toNumber(row.assignment.actual_early_workers);
    acc.people += row.totalPeople;
    acc.amount += row.totalAmount;
    if (row.isBlocked) acc.blocked += 1;
    return acc;
  }, emptyMonthlyTotals());

  els.monthlySummaryCards.innerHTML = `
    <article class="contractor-monthly-summary-card">
      <span>אירועים חתומים</span>
      <strong>${totals.events}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>סה״כ כוח אדם</span>
      <strong>${totals.people}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>דיילים בפועל</span>
      <strong>${totals.workers}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>בעלי תעודה בפועל</span>
      <strong>${totals.certified}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>מפקדים בפועל</span>
      <strong>${totals.commanders}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>כוח מקדים בפועל</span>
      <strong>${totals.early}</strong>
    </article>
    <article class="contractor-monthly-summary-card contractor-monthly-summary-card-highlight">
      <span>סה״כ שנצבר החודש</span>
      <strong>${formatCurrency(totals.amount)}</strong>
    </article>
    <article class="contractor-monthly-summary-card">
      <span>אירועים חסומים</span>
      <strong>${totals.blocked}</strong>
    </article>
  `;
}

function renderMonthlyStatus(rows) {
  if (!els.monthlyStageStatusBox) return;

  const blocked = rows.filter((row) => row.isBlocked);

  if (!blocked.length) {
    els.monthlyStageStatusBox.innerHTML = `
      <div class="meteor-alert meteor-alert-success">
        <div class="meteor-alert-text">כל האירועים המוצגים מחושבים עם סכומים תקינים.</div>
      </div>
    `;
    return;
  }

  els.monthlyStageStatusBox.innerHTML = `
    <div class="meteor-alert meteor-alert-warning">
      <div class="meteor-alert-text">
        יש ${blocked.length} אירועים שלא חושב להם כסף כי חסר מחיר או שיש חוסר בנתוני תמחור.
      </div>
    </div>
  `;
}

function computeMonthlyAssignmentRow(row) {
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

  const resolved = resolveMonthlyPricing(row, mainHours, earlyHours, counts);
  const title = getEventDisplayTitle(event);
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

  const amounts = calculateMonthlyAmounts(row, resolved.priceSet, resolved.effectiveMode, mainHours, earlyHours);
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

function resolveMonthlyPricing(row, mainHours, earlyHours, counts) {
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
  } else if (event.event_type === "football") {
    priceSet = state.monthlyPriceDefaults.find((price) =>
      price.event_type === "football" &&
      Number(price.stadium_id || 0) === Number(event.stadium_id || event.stadiums?.id || 0)
    ) || null;
  } else {
    priceSet = state.monthlyPriceDefaults.find((price) =>
      price.event_type === "event" &&
      Number(price.city_id || 0) === Number(event.city_id || event.cities?.city_id || 0)
    ) || null;
  }

  if (!priceSet) {
    return {
      ok: false,
      reason: "לא נמצא מחיר ברירת מחדל מתאים לקבלן עבור האירוע הזה.",
      source,
      mode: "לא מוגדר",
      explain: ""
    };
  }

  const mode = cleanNullable(priceSet.pricing_mode);
  if (!mode) {
    return {
      ok: false,
      reason: "למחיר שנמצא אין pricing_mode.",
      source,
      mode: "לא מוגדר",
      explain: ""
    };
  }

  if (mode === "daily") {
    if (
      counts.workers > 0 && toNumber(priceSet.price_worker) <= 0 ||
      counts.certified > 0 && toNumber(priceSet.price_certified) <= 0 ||
      counts.commanders > 0 && toNumber(priceSet.price_commander) <= 0
    ) {
      return {
        ok: false,
        reason: "חסר מחיר יומי באחד מהתפקידים.",
        source,
        mode,
        explain: ""
      };
    }

    if (counts.early > 0) {
      const hasDailyEarly = toNumber(priceSet.price_early_worker) > 0;
      const hasBaseWorkerDaily = toNumber(priceSet.price_worker) > 0;

      if (!hasDailyEarly && !hasBaseWorkerDaily) {
        return {
          ok: false,
          reason: "חסר מחיר לכוח מקדים במסלול יומי.",
          source,
          mode,
          explain: ""
        };
      }
    }

    return {
      ok: true,
      priceSet,
      source,
      effectiveMode: "daily",
      explain: "חישוב יומי"
    };
  }

  if (mode === "hourly") {
    if (
      counts.workers > 0 && toNumber(priceSet.hourly_worker) <= 0 ||
      counts.certified > 0 && toNumber(priceSet.hourly_certified) <= 0 ||
      counts.commanders > 0 && toNumber(priceSet.hourly_commander) <= 0 ||
      counts.early > 0 && toNumber(priceSet.hourly_early_worker) <= 0
    ) {
      return {
        ok: false,
        reason: "חסר מחיר שעתי באחד מהתפקידים.",
        source,
        mode,
        explain: ""
      };
    }

    return {
      ok: true,
      priceSet,
      source,
      effectiveMode: "hourly",
      explain: `חישוב שעתי · ${mainHours} שעות`
    };
  }

  if (mode === "mixed") {
    const okDaily =
      (counts.workers === 0 || toNumber(priceSet.price_worker) > 0) &&
      (counts.certified === 0 || toNumber(priceSet.price_certified) > 0) &&
      (counts.commanders === 0 || toNumber(priceSet.price_commander) > 0);

    const okEarly =
      counts.early === 0 ||
      toNumber(priceSet.hourly_early_worker) > 0 ||
      toNumber(priceSet.price_early_worker) > 0 ||
      toNumber(priceSet.price_worker) > 0;

    if (!okDaily || !okEarly) {
      return {
        ok: false,
        reason: "חסר תמחור במסלול משולב.",
        source,
        mode,
        explain: ""
      };
    }

    return {
      ok: true,
      priceSet,
      source,
      effectiveMode: "mixed",
      explain: `ראשי יומי + מוקדם שעתי (${earlyHours} שעות)`
    };
  }

  return {
    ok: false,
    reason: "pricing_mode לא מוכר.",
    source,
    mode,
    explain: ""
  };
}

function calculateMonthlyAmounts(row, priceSet, mode, mainHours, earlyHours) {
  const counts = {
    workers: toNumber(row.actual_workers),
    certified: toNumber(row.actual_certified),
    commanders: toNumber(row.actual_commanders),
    early: toNumber(row.actual_early_workers)
  };

  if (mode === "daily") {
    const dailyEarlyBase =
      toNumber(priceSet.price_early_worker) > 0
        ? toNumber(priceSet.price_early_worker)
        : toNumber(priceSet.price_worker);

    return {
      workers: round2(counts.workers * toNumber(priceSet.price_worker)),
      certified: round2(counts.certified * toNumber(priceSet.price_certified)),
      commanders: round2(counts.commanders * toNumber(priceSet.price_commander)),
      early: round2(counts.early * dailyEarlyBase)
    };
  }

  if (mode === "hourly") {
    return {
      workers: round2(counts.workers * toNumber(priceSet.hourly_worker) * mainHours),
      certified: round2(counts.certified * toNumber(priceSet.hourly_certified) * mainHours),
      commanders: round2(counts.commanders * toNumber(priceSet.hourly_commander) * mainHours),
      early: round2(counts.early * toNumber(priceSet.hourly_early_worker) * earlyHours)
    };
  }

  // mixed
  const mixedDailyEarly =
    toNumber(priceSet.price_early_worker) > 0
      ? toNumber(priceSet.price_early_worker)
      : 0;

  const mixedHourlyEarly =
    toNumber(priceSet.hourly_early_worker) > 0
      ? toNumber(priceSet.hourly_early_worker)
      : (toNumber(priceSet.price_worker) > 0 ? round2(toNumber(priceSet.price_worker) / 6) : 0);

  return {
    workers: round2(counts.workers * toNumber(priceSet.price_worker)),
    certified: round2(counts.certified * toNumber(priceSet.price_certified)),
    commanders: round2(counts.commanders * toNumber(priceSet.price_commander)),
    early: mixedDailyEarly > 0
      ? round2(counts.early * mixedDailyEarly)
      : round2(counts.early * mixedHourlyEarly * earlyHours)
  };
}

function computeMainHours(row) {
  const start = normalizeTimeValue(getAssignmentArrivalTime(row));
  const end = normalizeTimeValue(getAssignmentEndTime(row));
  return computeHoursBetween(start, end);
}

function computeEarlyHours(row) {
  const event = row.events || {};
  const earlyStart = normalizeTimeValue(row.override_early_workers_time || event.early_workers_time || "");
  const end = normalizeTimeValue(getAssignmentArrivalTime(row));

  if (!earlyStart || !end) return 0;
  return computeHoursBetween(earlyStart, end);
}

function getPricingModeLabel(mode) {
  switch (String(mode || "")) {
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

function emptyMonthlyTotals() {
  return {
    events: 0,
    workers: 0,
    certified: 0,
    commanders: 0,
    early: 0,
    people: 0,
    amount: 0,
    blocked: 0
  };
}

/* =========================
   GENERIC MODAL
========================= */

function openModal(modalEl, backdropEl) {
  modalEl?.classList.add("is-open");
  backdropEl?.classList.add("is-open");
  document.body.classList.add("modal-open");
}

function closeModal(modalEl, backdropEl) {
  modalEl?.classList.remove("is-open");
  backdropEl?.classList.remove("is-open");
  document.body.classList.remove("modal-open");
}

function isModalOpen(modalEl) {
  return !!modalEl?.classList.contains("is-open");
}

/* =========================
   MESSAGES
========================= */

function showPageMessage(message, type = "error") {
  if (!els.pageMessageBox) return;
  els.pageMessageBox.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearPageMessage() {
  if (els.pageMessageBox) els.pageMessageBox.innerHTML = "";
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

/* =========================
   STATUS HELPERS
========================= */

function isPendingAssignment(row) {
  return row?.assignment_status !== "cancelled" && row?.response_status === "pending";
}

function isApprovedWaitingCount(row) {
  return row?.assignment_status !== "cancelled" &&
    row?.response_status === "approved" &&
    !row?.counted_at;
}

function isWaitingSignature(row) {
  return row?.assignment_status !== "cancelled" &&
    !!row?.counted_at &&
    row?.signature_status === "waiting_signature";
}

function getRequestedTotal(row) {
  return toNumber(row.requested_workers) +
    toNumber(row.requested_certified) +
    toNumber(row.requested_commanders) +
    toNumber(row.requested_early_workers);
}

function getActualTotal(row) {
  return toNumber(row.actual_workers) +
    toNumber(row.actual_certified) +
    toNumber(row.actual_commanders) +
    toNumber(row.actual_early_workers);
}

function getWorkerStatusLabel(status) {
  switch (String(status || "")) {
    case "approved":
      return "אושר";
    case "rejected":
      return "נדחה";
    default:
      return "ממתין";
  }
}

/* =========================
   EVENT HELPERS
========================= */

function matchesAssignmentFilters(row, term, dateFilter) {
  const event = row.events || {};
  if (dateFilter && event.event_date !== dateFilter) return false;

  const haystack = [
    getEventDisplayTitle(event),
    event.event_name,
    event.competition_type,
    event.stadiums?.name,
    event.cities?.name_he,
    event.home_team?.name,
    event.away_team?.name,
    event.manual_location
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function getEventDisplayTitle(event = {}) {
  if (event.event_type === "football") {
    const home = event.home_team?.name || "מארחת";
    const away = event.away_team?.name || "אורחת";
    return `${home} - ${away}`;
  }

  return event.event_name || "אירוע";
}

function getEventLocation(event = {}) {
  if (event.event_type === "football") {
    return event.stadiums?.name || event.cities?.name_he || "ללא מיקום";
  }

  return event.manual_location || event.cities?.name_he || "ללא מיקום";
}

function getAssignmentArrivalTime(row) {
  return row.override_arrival_time || row.events?.arrival_time || "";
}

function getAssignmentEndTime(row) {
  return row.override_end_time || row.events?.end_time || "";
}

/* =========================
   UTILS
========================= */

function cleanNullable(value) {
  const clean = String(value ?? "").trim();
  return clean ? clean : null;
}

function sanitizeInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDateISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthRange(monthValue) {
  const [year, month] = String(monthValue || "").split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = formatDateISO(new Date(year, month, 1));
  return [start, end];
}

function normalizeTimeValue(value) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function computeHoursBetween(startTime, endTime) {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = String(startTime).split(":").map(Number);
  const [endH, endM] = String(endTime).split(":").map(Number);

  if (
    !Number.isFinite(startH) || !Number.isFinite(startM) ||
    !Number.isFinite(endH) || !Number.isFinite(endM)
  ) {
    return 0;
  }

  let start = startH * 60 + startM;
  let end = endH * 60 + endM;

  if (end < start) {
    end += 24 * 60;
  }

  return round2((end - start) / 60);
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function debounce(fn, wait = 120) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}