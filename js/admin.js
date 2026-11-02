import { requireAuth, logout } from "./auth.js";
import { supabase } from "./supabase.js";

const els = {
  adminFullName: document.getElementById("adminFullName"),
  adminRoleLabel: document.getElementById("adminRoleLabel"),
  adminNameInline: document.getElementById("adminNameInline"),
  adminAvatar: document.getElementById("adminAvatar"),
  logoutBtn: document.getElementById("logoutBtn"),

  kpiMonthEvents: document.getElementById("kpiMonthEvents"),
  kpiMonthEventsSub: document.getElementById("kpiMonthEventsSub"),
  kpiPendingResponses: document.getElementById("kpiPendingResponses"),
  kpiPendingResponsesSub: document.getElementById("kpiPendingResponsesSub"),
  kpiWaitingSignatures: document.getElementById("kpiWaitingSignatures"),
  kpiWaitingSignaturesSub: document.getElementById("kpiWaitingSignaturesSub"),
  kpiMonthlyReports: document.getElementById("kpiMonthlyReports"),
  kpiMonthlyReportsSub: document.getElementById("kpiMonthlyReportsSub"),

  adminAlertsList: document.getElementById("adminAlertsList"),
  pendingAssignmentsList: document.getElementById("pendingAssignmentsList"),
  waitingSignaturesList: document.getElementById("waitingSignaturesList"),

  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  calendarMonthTitle: document.getElementById("calendarMonthTitle"),
  monthCalendarGrid: document.getElementById("monthCalendarGrid"),
  selectedDayTitle: document.getElementById("selectedDayTitle"),
  selectedDaySubtitle: document.getElementById("selectedDaySubtitle"),
  selectedDayEventsList: document.getElementById("selectedDayEventsList"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop")
};

const state = {
  currentMonth: null,
  selectedDate: null,
  monthEvents: []
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  hydrateUser(user);

  const today = getTodayLocalDate();
  state.currentMonth = new Date(`${today}T00:00:00`);
  state.selectedDate = today;

  await loadDashboard();
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

  els.prevMonthBtn?.addEventListener("click", async () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1);
    await loadMonthCalendar();
  });

  els.nextMonthBtn?.addEventListener("click", async () => {
    state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1);
    await loadMonthCalendar();
  });
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function hydrateUser(user) {
  const name = user?.full_name?.trim() || "מנהל מערכת";
  const firstLetter = name.charAt(0) || "מ";

  if (els.adminFullName) els.adminFullName.textContent = name;
  if (els.adminNameInline) els.adminNameInline.textContent = name;
  if (els.adminAvatar) els.adminAvatar.textContent = firstLetter;
  if (els.adminRoleLabel) els.adminRoleLabel.textContent = "מנהל";
}

async function loadDashboard() {
  const today = getTodayLocalDate();
  const monthRange = getMonthRangeFromDate(state.currentMonth);

  const [
    monthEventsResult,
    pendingAssignmentsResult,
    waitingSignaturesResult,
    monthlyReportsResult
  ] = await Promise.all([
    fetchMonthEvents(monthRange.start, monthRange.end),
    fetchPendingAssignments(today),
    fetchWaitingSignatures(),
    fetchMonthlyReportsReady(monthRange.start, monthRange.end)
  ]);

  state.monthEvents = monthEventsResult.data || [];

  const pendingAssignments = pendingAssignmentsResult.data || [];
  const waitingSignatures = waitingSignaturesResult.data || [];
  const monthlyReportsReady = monthlyReportsResult.data || [];

  renderKpis(state.monthEvents, pendingAssignments, waitingSignatures, monthlyReportsReady);
  renderPendingAssignments(pendingAssignments);
  renderWaitingSignatures(waitingSignatures);
  renderAlerts(state.monthEvents, pendingAssignments, waitingSignatures, monthlyReportsReady);

  renderMonthCalendar();

  if (!state.selectedDate || !isDateInCurrentMonth(state.selectedDate, state.currentMonth)) {
    state.selectedDate = monthRange.start;
  }

  renderSelectedDayEvents(state.selectedDate);
}

async function loadMonthCalendar() {
  const monthRange = getMonthRangeFromDate(state.currentMonth);

  const monthEventsResult = await fetchMonthEvents(monthRange.start, monthRange.end);
  state.monthEvents = monthEventsResult.data || [];

  renderMonthCalendar();

  const today = getTodayLocalDate();
  if (isDateInCurrentMonth(today, state.currentMonth)) {
    state.selectedDate = today;
  } else {
    state.selectedDate = monthRange.start;
  }

  renderSelectedDayEvents(state.selectedDate);
  updateMonthEventsKpi();
}

async function fetchMonthEvents(monthStart, monthEnd) {
  return supabase
    .from("events")
    .select(`
      id,
      event_date,
      arrival_time,
      end_time,
      event_type,
      competition_type,
      event_name,
      manual_location,
      notes,
      status,
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
    `)
    .gte("event_date", monthStart)
    .lte("event_date", monthEnd)
    .order("event_date", { ascending: true })
    .order("arrival_time", { ascending: true });
}

async function fetchPendingAssignments(today) {
  return supabase
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
      contractor_response_note,
      response_status,
      assignment_status,
      updated_at,
      contractors:contractor_id (
        id,
        company_name,
        phone
      ),
      events:event_id (
        id,
        event_date,
        arrival_time,
        event_name,
        event_type,
        status,
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
    .in("response_status", ["pending", "change_requested"])
    .eq("assignment_status", "active")
    .gte("events.event_date", today)
    .order("updated_at", { ascending: false })
    .limit(8);
}

async function fetchWaitingSignatures() {
  return supabase
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
      signature_status,
      contractors:contractor_id (
        id,
        company_name,
        phone
      ),
      events:event_id (
        id,
        event_date,
        arrival_time,
        event_name,
        event_type,
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
    .eq("signature_status", "waiting_signature")
    .order("counted_at", { ascending: false })
    .limit(8);
}

async function fetchMonthlyReportsReady(monthStart, monthEnd) {
  return supabase
    .from("contractor_assignments")
    .select(`
      id,
      contractor_id,
      signature_status,
      counted_at,
      events:event_id (
        id,
        event_date
      )
    `)
    .eq("signature_status", "signed")
    .gte("events.event_date", monthStart)
    .lte("events.event_date", monthEnd);
}

function renderKpis(monthEvents, pendingAssignments, waitingSignatures, monthlyReportsReady) {
  setKpi(
    els.kpiMonthEvents,
    els.kpiMonthEventsSub,
    monthEvents.length,
    monthEvents.length ? "אירועים מתוכננים בחודש הנוכחי" : "אין אירועים בחודש זה"
  );

  setKpi(
    els.kpiPendingResponses,
    els.kpiPendingResponsesSub,
    pendingAssignments.length,
    pendingAssignments.length ? "דורש טיפול מנהל" : "אין תגובות פתוחות כרגע"
  );

  setKpi(
    els.kpiWaitingSignatures,
    els.kpiWaitingSignaturesSub,
    waitingSignatures.length,
    waitingSignatures.length ? "נשלחו לקבלן ומחכים לאישור" : "אין חתימות פתוחות"
  );

  const uniqueContractors = new Set(
    monthlyReportsReady
      .map((row) => row.contractor_id)
      .filter(Boolean)
  ).size;

  setKpi(
    els.kpiMonthlyReports,
    els.kpiMonthlyReportsSub,
    uniqueContractors,
    uniqueContractors ? "קבלנים עם נתונים חתומים החודש" : "עדיין אין דוחות חתומים החודש"
  );
}

function updateMonthEventsKpi() {
  setKpi(
    els.kpiMonthEvents,
    els.kpiMonthEventsSub,
    state.monthEvents.length,
    state.monthEvents.length ? "אירועים מתוכננים בחודש הנוכחי" : "אין אירועים בחודש זה"
  );
}

function setKpi(valueEl, subEl, value, subText) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = subText;
}

function renderMonthCalendar() {
  if (!els.monthCalendarGrid || !els.calendarMonthTitle) return;

  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();

  els.calendarMonthTitle.textContent = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric"
  }).format(state.currentMonth);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const eventsMap = buildEventsMap(state.monthEvents);
  const today = getTodayLocalDate();

  let html = "";

  for (let i = 0; i < firstWeekday; i += 1) {
    html += `<button type="button" class="meteor-calendar-day is-empty" disabled></button>`;
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const isoDate = toIsoDate(new Date(year, month, day));
    const dayEvents = eventsMap.get(isoDate) || [];
    const isToday = isoDate === today;
    const isSelected = isoDate === state.selectedDate;
    const hasEvents = dayEvents.length > 0;

    html += `
      <button
        type="button"
        class="meteor-calendar-day ${isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""} ${hasEvents ? "has-events" : ""}"
        data-date="${isoDate}"
      >
        <span class="meteor-calendar-day-number">${day}</span>
        ${
          hasEvents
            ? `
              <span class="meteor-calendar-day-indicator">
                <span class="meteor-calendar-dot"></span>
                <span class="meteor-calendar-count">${dayEvents.length}</span>
              </span>
            `
            : `<span class="meteor-calendar-day-indicator empty"></span>`
        }
      </button>
    `;
  }

  els.monthCalendarGrid.innerHTML = html;

  els.monthCalendarGrid.querySelectorAll(".meteor-calendar-day[data-date]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedDate = btn.dataset.date;
      renderMonthCalendar();
      renderSelectedDayEvents(state.selectedDate);
    });
  });
}

function renderSelectedDayEvents(dateString) {
  if (!els.selectedDayEventsList || !els.selectedDayTitle || !els.selectedDaySubtitle) return;

  const dayEvents = state.monthEvents.filter((event) => event.event_date === dateString);

  els.selectedDayTitle.textContent = `אירועי ${formatDateLong(dateString)}`;
  els.selectedDaySubtitle.textContent = dayEvents.length
    ? `${dayEvents.length} אירועים נמצאו ביום זה`
    : "אין אירועים ביום זה";

  if (!dayEvents.length) {
    els.selectedDayEventsList.innerHTML = emptyState("אין אירועים ביום זה", "בחר יום אחר מהקלנדר או צור אירוע חדש.");
    return;
  }

  els.selectedDayEventsList.innerHTML = dayEvents
    .map((event) => {
      const title = getEventTitle(event);
      const location = getEventLocation(event);
      const statusLabel = getEventStatusLabel(event.status);
      const statusClass = getEventStatusClass(event.status);

      return `
        <article class="meteor-row-card meteor-row-card-rich">
          <div class="meteor-row-main">
            <div class="meteor-row-title-wrap">
              <h4>${escapeHtml(title)}</h4>
              <span class="meteor-status-badge ${statusClass}">${statusLabel}</span>
            </div>

            <div class="meteor-row-meta">
              <span>🕒 ${formatTime(event.arrival_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ""}</span>
              <span>📍 ${escapeHtml(location)}</span>
              <span>🏷️ ${event.event_type === "football" ? "משחק כדורגל" : "אירוע"}</span>
            </div>
          </div>

          <div class="meteor-row-actions">
            <a href="./events.html?event_id=${event.id}" class="meteor-inline-link">פתח אירוע</a>
            <a href="./assignments.html?event_id=${event.id}" class="meteor-inline-link">שיבוצים</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPendingAssignments(assignments) {
  if (!els.pendingAssignmentsList) return;

  if (!assignments.length) {
    els.pendingAssignmentsList.innerHTML = emptyState("אין קבלנים ממתינים כרגע", "כל האישורים מסודרים.");
    return;
  }

  els.pendingAssignmentsList.innerHTML = assignments
    .map((assignment) => {
      const contractorName = assignment.contractors?.company_name || "קבלן";
      const event = assignment.events || {};
      const eventTitle = getEventTitle(event);
      const responseText =
        assignment.response_status === "change_requested"
          ? "בקשת שינוי כמות"
          : "ממתין לאישור";

      return `
        <article class="meteor-mini-card">
          <div class="meteor-mini-card-top">
            <strong>${escapeHtml(contractorName)}</strong>
            <span class="meteor-mini-badge ${assignment.response_status === "change_requested" ? "warning" : "muted"}">
              ${responseText}
            </span>
          </div>

          <div class="meteor-mini-card-body">
            <div class="meteor-mini-line">אירוע: ${escapeHtml(eventTitle)}</div>
            <div class="meteor-mini-line">תאריך: ${formatDate(event.event_date)} · ${formatTime(event.arrival_time)}</div>
            <div class="meteor-mini-line">
              הוזמן: ${assignment.requested_workers || 0} עובדים,
              ${assignment.requested_certified || 0} תעודות,
              ${assignment.requested_commanders || 0} מפקדים
              ${(assignment.requested_early_workers || 0) ? `, ${assignment.requested_early_workers} מקדים` : ""}
            </div>
            ${
              assignment.response_status === "change_requested"
                ? `
                  <div class="meteor-mini-line text-warning-emphasis">
                    ביקש שינוי ל:
                    ${assignment.requested_change_workers ?? 0} עובדים,
                    ${assignment.requested_change_certified ?? 0} תעודות,
                    ${assignment.requested_change_commanders ?? 0} מפקדים
                    ${(assignment.requested_change_early_workers ?? 0) ? `, ${assignment.requested_change_early_workers} מקדים` : ""}
                  </div>
                `
                : ""
            }
          </div>

          <div class="meteor-mini-card-actions">
            <a href="./assignments.html?assignment_id=${assignment.id}" class="meteor-inline-link">טפל עכשיו</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWaitingSignatures(assignments) {
  if (!els.waitingSignaturesList) return;

  if (!assignments.length) {
    els.waitingSignaturesList.innerHTML = emptyState("אין חתימות ממתינות", "כל החתימות טופלו.");
    return;
  }

  els.waitingSignaturesList.innerHTML = assignments
    .map((assignment) => {
      const contractorName = assignment.contractors?.company_name || "קבלן";
      const eventTitle = getEventTitle(assignment.events || {});

      return `
        <article class="meteor-mini-card">
          <div class="meteor-mini-card-top">
            <strong>${escapeHtml(contractorName)}</strong>
            <span class="meteor-mini-badge primary">ממתין לחתימה</span>
          </div>

          <div class="meteor-mini-card-body">
            <div class="meteor-mini-line">אירוע: ${escapeHtml(eventTitle)}</div>
            <div class="meteor-mini-line">תאריך: ${formatDate(assignment.events?.event_date)} · ${formatTime(assignment.events?.arrival_time)}</div>
            <div class="meteor-mini-line">
              נספר בפועל:
              ${assignment.actual_workers || 0} עובדים,
              ${assignment.actual_certified || 0} תעודות,
              ${assignment.actual_commanders || 0} מפקדים
              ${(assignment.actual_early_workers || 0) ? `, ${assignment.actual_early_workers} מקדים` : ""}
            </div>
          </div>

          <div class="meteor-mini-card-actions">
            <a href="./reports.html?assignment_id=${assignment.id}" class="meteor-inline-link">צפה בפרטים</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAlerts(monthEvents, pendingAssignments, waitingSignatures, monthlyReportsReady) {
  if (!els.adminAlertsList) return;

  const alerts = [];

  if (pendingAssignments.length) {
    alerts.push({
      type: "warning",
      title: `${pendingAssignments.length} קבלנים ממתינים לטיפול`,
      text: "יש אישורי הגעה או בקשות שינוי כמות שדורשות תגובת מנהל."
    });
  }

  if (waitingSignatures.length) {
    alerts.push({
      type: "info",
      title: `${waitingSignatures.length} חתימות ממתינות`,
      text: "יש אירועים שנספרו והועברו לקבלן, אך עדיין לא נחתמו."
    });
  }

  if (!monthEvents.length) {
    alerts.push({
      type: "muted",
      title: "אין אירועים בחודש זה",
      text: "אפשר להתמקד בהכנת החודש הבא, במחירים ובדוחות."
    });
  } else {
    alerts.push({
      type: "success",
      title: `${monthEvents.length} אירועים בחודש הנוכחי`,
      text: "בדוק שכל האירועים הקרובים מסודרים מבחינת שיבוץ, תגובות וספירה."
    });
  }

  const uniqueContractors = new Set(monthlyReportsReady.map((x) => x.contractor_id).filter(Boolean)).size;
  if (uniqueContractors) {
    alerts.push({
      type: "primary",
      title: `${uniqueContractors} קבלנים עם דוח חודשי מוכן`,
      text: "אפשר לעבור לפירוט החודשי ולהפיק נתונים לחשבונות."
    });
  }

  els.adminAlertsList.innerHTML = alerts
    .slice(0, 6)
    .map(
      (alert) => `
        <article class="meteor-admin-alert ${alert.type}">
          <strong>${escapeHtml(alert.title)}</strong>
          <span>${escapeHtml(alert.text)}</span>
        </article>
      `
    )
    .join("");
}

function buildEventsMap(events) {
  const map = new Map();
  for (const event of events) {
    const key = event.event_date;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  }
  return map;
}

function getEventTitle(event) {
  if (!event) return "אירוע";
  if (event.event_type === "football") {
    const home = event.home_team?.name || "קבוצת בית";
    const away = event.away_team?.name || "קבוצת חוץ";
    return `${home} - ${away}`;
  }
  return event.event_name || "אירוע";
}

function getEventLocation(event) {
  return (
    event?.stadiums?.name ||
    event?.cities?.name_he ||
    event?.manual_location ||
    "ללא מיקום"
  );
}

function getEventStatusLabel(status) {
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

function getEventStatusClass(status) {
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

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatDateLong(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatTime(timeString) {
  if (!timeString) return "--:--";
  return String(timeString).slice(0, 5);
}

function getTodayLocalDate() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffset).toISOString().slice(0, 10);
}

function getMonthRangeFromDate(dateObj) {
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);

  return {
    start: toIsoDate(start),
    end: toIsoDate(end)
  };
}

function isDateInCurrentMonth(dateString, monthDate) {
  const d = new Date(`${dateString}T00:00:00`);
  return d.getFullYear() === monthDate.getFullYear() && d.getMonth() === monthDate.getMonth();
}

function toIsoDate(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0, 10);
}

function emptyState(title, text) {
  return `
    <div class="meteor-empty-state small">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}