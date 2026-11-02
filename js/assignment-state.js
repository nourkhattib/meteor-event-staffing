// js/assignment-state.js

export const ASSIGNMENT_RESPONSE_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  CHANGE_REQUESTED: "change_requested",
  REJECTED: "rejected"
});

export const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: "active",
  CANCELLED: "cancelled",
  CLOSED: "closed"
});

export const SIGNATURE_STATUS = Object.freeze({
  NOT_SENT: "not_sent",
  WAITING_SIGNATURE: "waiting_signature",
  SIGNED: "signed"
});

/**
 * מנרמל רשומת שיבוץ כך שגם אם חלק מהשדות חסרים / null
 * תהיה לנו צורה אחידה לעבוד איתה.
 */
export function normalizeAssignmentRow(row = {}) {
  return {
    ...row,
    requested_workers: toNumber(row.requested_workers),
    requested_certified: toNumber(row.requested_certified),
    requested_commanders: toNumber(row.requested_commanders),
    requested_early_workers: toNumber(row.requested_early_workers),

    requested_change_workers: nullableNumber(row.requested_change_workers),
    requested_change_certified: nullableNumber(row.requested_change_certified),
    requested_change_commanders: nullableNumber(row.requested_change_commanders),
    requested_change_early_workers: nullableNumber(row.requested_change_early_workers),

    actual_workers: toNumber(row.actual_workers),
    actual_certified: toNumber(row.actual_certified),
    actual_commanders: toNumber(row.actual_commanders),
    actual_early_workers: toNumber(row.actual_early_workers),

    response_status: row.response_status || ASSIGNMENT_RESPONSE_STATUS.PENDING,
    assignment_status: row.assignment_status || ASSIGNMENT_STATUS.ACTIVE,
    signature_status: row.signature_status || SIGNATURE_STATUS.NOT_SENT,
    counted_at: row.counted_at || null
  };
}

export function toNumber(value) {
  return Number(value || 0);
}

export function nullableNumber(value) {
  return value === null || value === undefined || value === "" ? null : Number(value);
}

/* =========================
   TOTALS
========================= */

export function getRequestedTotal(row) {
  const r = normalizeAssignmentRow(row);
  return (
    r.requested_workers +
    r.requested_certified +
    r.requested_commanders +
    r.requested_early_workers
  );
}

export function getRequestedChangeTotal(row) {
  const r = normalizeAssignmentRow(row);

  return (
    toMaybeNumber(r.requested_change_workers) +
    toMaybeNumber(r.requested_change_certified) +
    toMaybeNumber(r.requested_change_commanders) +
    toMaybeNumber(r.requested_change_early_workers)
  );
}

export function getActualTotal(row) {
  const r = normalizeAssignmentRow(row);
  return (
    r.actual_workers +
    r.actual_certified +
    r.actual_commanders +
    r.actual_early_workers
  );
}

function toMaybeNumber(value) {
  return value === null || value === undefined ? 0 : Number(value);
}

/* =========================
   STATE HELPERS
========================= */

/**
 * שיבוץ פעיל תפעולית
 */
export function isActiveAssignment(row) {
  const r = normalizeAssignmentRow(row);
  return r.assignment_status === ASSIGNMENT_STATUS.ACTIVE;
}

/**
 * שיבוץ שבוטל/נמחק תפעולית
 */
export function isCancelledAssignment(row) {
  const r = normalizeAssignmentRow(row);
  return r.assignment_status === ASSIGNMENT_STATUS.CANCELLED;
}

/**
 * שיבוץ סגור לגמרי
 */
export function isClosedAssignment(row) {
  const r = normalizeAssignmentRow(row);
  return r.assignment_status === ASSIGNMENT_STATUS.CLOSED;
}

/**
 * הקבלן עוד לא הגיב
 */
export function isPendingResponse(row) {
  const r = normalizeAssignmentRow(row);
  return isActiveAssignment(r) && r.response_status === ASSIGNMENT_RESPONSE_STATUS.PENDING;
}

/**
 * הקבלן ביקש שינוי והמנהל עוד לא סגר את זה
 */
export function isWaitingManagerChangeApproval(row) {
  const r = normalizeAssignmentRow(row);
  return isActiveAssignment(r) && r.response_status === ASSIGNMENT_RESPONSE_STATUS.CHANGE_REQUESTED;
}

/**
 * הקבלן אישר, אבל עוד לא בוצעה ספירה
 */
export function isApprovedWaitingCount(row) {
  const r = normalizeAssignmentRow(row);
  return (
    isActiveAssignment(r) &&
    r.response_status === ASSIGNMENT_RESPONSE_STATUS.APPROVED &&
    !r.counted_at
  );
}

/**
 * בוצעה ספירה, מחכה לחתימת קבלן
 */
export function isWaitingSignature(row) {
  const r = normalizeAssignmentRow(row);
  return (
    isActiveAssignment(r) &&
    !!r.counted_at &&
    r.signature_status === SIGNATURE_STATUS.WAITING_SIGNATURE
  );
}

/**
 * השיבוץ חתום וסיים תהליך תפעולי
 */
export function isSignedAndMonthlyClosed(row) {
  const r = normalizeAssignmentRow(row);
  return (
    isActiveAssignment(r) &&
    !!r.counted_at &&
    r.signature_status === SIGNATURE_STATUS.SIGNED
  );
}

/**
 * הקבלן דחה את ההזמנה
 */
export function isRejectedAssignment(row) {
  const r = normalizeAssignmentRow(row);
  return isActiveAssignment(r) && r.response_status === ASSIGNMENT_RESPONSE_STATUS.REJECTED;
}

/**
 * האם יש שינוי כמות שמור בתוך הרשומה
 */
export function hasRequestedChangeValues(row) {
  const r = normalizeAssignmentRow(row);

  return [
    r.requested_change_workers,
    r.requested_change_certified,
    r.requested_change_commanders,
    r.requested_change_early_workers
  ].some((value) => value !== null && value !== undefined);
}

/**
 * המצב הראשי של השיבוץ - אחד בלבד
 */
export function getAssignmentLifecycleState(row) {
  const r = normalizeAssignmentRow(row);

  if (isCancelledAssignment(r)) return "cancelled";
  if (isClosedAssignment(r)) return "closed";
  if (isRejectedAssignment(r)) return "rejected";
  if (isSignedAndMonthlyClosed(r)) return "monthly_closed";
  if (isWaitingSignature(r)) return "waiting_signature";
  if (isApprovedWaitingCount(r)) return "approved_waiting_count";
  if (isWaitingManagerChangeApproval(r)) return "waiting_manager_change";
  if (isPendingResponse(r)) return "pending_response";

  return "unknown";
}

export function getAssignmentLifecycleLabel(row) {
  switch (getAssignmentLifecycleState(row)) {
    case "pending_response":
      return "ממתין לתגובת קבלן";
    case "waiting_manager_change":
      return "בקשת שינוי ממתינה למנהל";
    case "approved_waiting_count":
      return "אושר וממתין לספירה";
    case "waiting_signature":
      return "נספר וממתין לחתימה";
    case "monthly_closed":
      return "חתום ועבר לפירוט חודשי";
    case "rejected":
      return "נדחה";
    case "cancelled":
      return "בוטל";
    case "closed":
      return "סגור";
    default:
      return "לא ידוע";
  }
}

export function getAssignmentLifecycleBadgeClass(row) {
  switch (getAssignmentLifecycleState(row)) {
    case "pending_response":
      return "is-closed";
    case "waiting_manager_change":
      return "is-closed";
    case "approved_waiting_count":
      return "is-open";
    case "waiting_signature":
      return "is-open";
    case "monthly_closed":
      return "is-open";
    case "rejected":
      return "is-cancelled";
    case "cancelled":
      return "is-cancelled";
    case "closed":
      return "is-closed";
    default:
      return "";
  }
}

/* =========================
   FILTER GROUPS FOR SCREENS
========================= */

export function filterPendingAssignments(rows = []) {
  return rows.filter(isPendingResponse);
}

export function filterChangeRequestedAssignments(rows = []) {
  return rows.filter(isWaitingManagerChangeApproval);
}

export function filterApprovedWaitingCountAssignments(rows = []) {
  return rows.filter(isApprovedWaitingCount);
}

export function filterWaitingSignatureAssignments(rows = []) {
  return rows.filter(isWaitingSignature);
}

export function filterMonthlyClosedAssignments(rows = []) {
  return rows.filter(isSignedAndMonthlyClosed);
}

export function filterRejectedAssignments(rows = []) {
  return rows.filter(isRejectedAssignment);
}

export function filterCancelledAssignments(rows = []) {
  return rows.filter(isCancelledAssignment);
}

/* =========================
   ADMIN ACTION PRESETS
========================= */

export function buildApproveResponseUpdate() {
  return {
    response_status: ASSIGNMENT_RESPONSE_STATUS.APPROVED
  };
}

export function buildRejectResponseUpdate() {
  return {
    response_status: ASSIGNMENT_RESPONSE_STATUS.REJECTED
  };
}

export function buildChangeRequestUpdate({
  requested_workers,
  requested_certified,
  requested_commanders,
  requested_early_workers
}) {
  return {
    response_status: ASSIGNMENT_RESPONSE_STATUS.CHANGE_REQUESTED,
    requested_change_workers: toNumber(requested_workers),
    requested_change_certified: toNumber(requested_certified),
    requested_change_commanders: toNumber(requested_commanders),
    requested_change_early_workers: toNumber(requested_early_workers)
  };
}

export function buildApproveChangeRequestApply(row) {
  const r = normalizeAssignmentRow(row);

  return {
    requested_workers: r.requested_change_workers ?? r.requested_workers,
    requested_certified: r.requested_change_certified ?? r.requested_certified,
    requested_commanders: r.requested_change_commanders ?? r.requested_commanders,
    requested_early_workers: r.requested_change_early_workers ?? r.requested_early_workers,

    requested_change_workers: null,
    requested_change_certified: null,
    requested_change_commanders: null,
    requested_change_early_workers: null,

    response_status: ASSIGNMENT_RESPONSE_STATUS.APPROVED
  };
}

export function buildCancelAssignmentUpdate() {
  return {
    assignment_status: ASSIGNMENT_STATUS.CANCELLED
  };
}

export function buildCountCompletedUpdate({
  actual_workers,
  actual_certified,
  actual_commanders,
  actual_early_workers
}) {
  return {
    actual_workers: toNumber(actual_workers),
    actual_certified: toNumber(actual_certified),
    actual_commanders: toNumber(actual_commanders),
    actual_early_workers: toNumber(actual_early_workers),
    counted_at: new Date().toISOString(),
    signature_status: SIGNATURE_STATUS.WAITING_SIGNATURE
  };
}

export function buildSignedUpdate(note = null) {
  return {
    signature_status: SIGNATURE_STATUS.SIGNED,
    contractor_signature_note: note || null,
    contractor_signed_at: new Date().toISOString()
  };
}
export function getApprovedTotal(row) {
  const r = normalizeAssignmentRow(row);

  if (!isActiveAssignment(r)) return 0;
  if (r.response_status !== ASSIGNMENT_RESPONSE_STATUS.APPROVED) return 0;

  const actualTotal = getActualTotal(r);
  if (actualTotal > 0) return actualTotal;

  return getRequestedTotal(r);
}