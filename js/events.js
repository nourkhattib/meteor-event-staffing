import { requireAuth, logout } from "./auth.js";
import { supabase } from "./supabase.js";

const COMPETITION_OPTIONS = ["ליגת העל", "ליגה לאומית", "גביע"];

const els = {
  adminFullName: document.getElementById("adminFullName"),
  adminAvatar: document.getElementById("adminAvatar"),
  logoutBtn: document.getElementById("logoutBtn"),

  openSidebarBtn: document.getElementById("openSidebarBtn"),
  closeSidebarBtn: document.getElementById("closeSidebarBtn"),
  adminSidebar: document.getElementById("adminSidebar"),
  sidebarBackdrop: document.getElementById("sidebarBackdrop"),

  addEventBtnTop: document.getElementById("addEventBtnTop"),
  addEventBtnHero: document.getElementById("addEventBtnHero"),
  addEventBtnFilters: document.getElementById("addEventBtnFilters"),

  monthFilter: document.getElementById("monthFilter"),
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  statusFilter: document.getElementById("statusFilter"),
  requiresWorkersFilter: document.getElementById("requiresWorkersFilter"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),

  eventsList: document.getElementById("eventsList"),
  eventsSummaryText: document.getElementById("eventsSummaryText"),

  kpiEventsInMonth: document.getElementById("kpiEventsInMonth"),
  kpiEventsInMonthSub: document.getElementById("kpiEventsInMonthSub"),
  kpiFootballEvents: document.getElementById("kpiFootballEvents"),
  kpiFootballEventsSub: document.getElementById("kpiFootballEventsSub"),
  kpiRegularEvents: document.getElementById("kpiRegularEvents"),
  kpiRegularEventsSub: document.getElementById("kpiRegularEventsSub"),
  kpiRequiresWorkers: document.getElementById("kpiRequiresWorkers"),
  kpiRequiresWorkersSub: document.getElementById("kpiRequiresWorkersSub"),

  eventModal: document.getElementById("eventModal"),
  eventModalBackdrop: document.getElementById("eventModalBackdrop"),
  closeEventModalBtn: document.getElementById("closeEventModalBtn"),
  cancelEventBtn: document.getElementById("cancelEventBtn"),
  deleteEventBtn: document.getElementById("deleteEventBtn"),
  eventModalTitle: document.getElementById("eventModalTitle"),
  eventModalSubtitle: document.getElementById("eventModalSubtitle"),
  eventFormMessage: document.getElementById("eventFormMessage"),
  eventForm: document.getElementById("eventForm"),
  saveEventBtn: document.getElementById("saveEventBtn"),

  eventId: document.getElementById("eventId"),
  eventType: document.getElementById("eventType"),
  eventDate: document.getElementById("eventDate"),
  arrivalTime: document.getElementById("arrivalTime"),
  endTime: document.getElementById("endTime"),
  hasEarlyTeam: document.getElementById("hasEarlyTeam"),
  earlyWorkersTime: document.getElementById("earlyWorkersTime"),
  earlyWorkersTimeWrap: document.getElementById("earlyWorkersTimeWrap"),
  requiresWorkersList: document.getElementById("requiresWorkersList"),

  citySearch: document.getElementById("citySearch"),
  cityDropdown: document.getElementById("cityDropdown"),

  stadiumSearch: document.getElementById("stadiumSearch"),
  stadiumDropdown: document.getElementById("stadiumDropdown"),

  manualLocation: document.getElementById("manualLocation"),
  derivedCityName: document.getElementById("derivedCityName"),

  footballFieldsSection: document.getElementById("footballFieldsSection"),
  eventFieldsSection: document.getElementById("eventFieldsSection"),

  competitionType: document.getElementById("competitionType"),
  competitionDropdown: document.getElementById("competitionDropdown"),

  homeTeamSearch: document.getElementById("homeTeamSearch"),
  homeTeamDropdown: document.getElementById("homeTeamDropdown"),

  awayTeamSearch: document.getElementById("awayTeamSearch"),
  awayTeamDropdown: document.getElementById("awayTeamDropdown"),

  eventName: document.getElementById("eventName"),
  notes: document.getElementById("notes"),

  addCityQuickBtn: document.getElementById("addCityQuickBtn"),
  addStadiumQuickBtn: document.getElementById("addStadiumQuickBtn"),
  addHomeTeamQuickBtn: document.getElementById("addHomeTeamQuickBtn"),
  addAwayTeamQuickBtn: document.getElementById("addAwayTeamQuickBtn")
};

const state = {
  user: null,
  events: [],
  filteredEvents: [],
  cities: [],
  stadiums: [],
  leagues: [],
  teams: [],
  selectedCityId: null,
  selectedStadiumId: null,
  selectedHomeTeamId: null,
  selectedAwayTeamId: null,
  editingEventId: null,
  autocomplete: {
    city: { items: [], activeIndex: -1 },
    stadium: { items: [], activeIndex: -1 },
    competition: { items: [], activeIndex: -1 },
    homeTeam: { items: [], activeIndex: -1 },
    awayTeam: { items: [], activeIndex: -1 }
  }
};

init();

async function init() {
  bindUi();

  const user = await requireAuth("admin");
  if (!user) return;

  state.user = user;
  hydrateUser(user);
  setDefaultMonth();

  await Promise.all([
    loadLookupData(),
    loadEvents()
  ]);

  handleUrlPrefill();
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

  [els.addEventBtnTop, els.addEventBtnHero, els.addEventBtnFilters].forEach((btn) => {
    btn?.addEventListener("click", () => openCreateModal());
  });

  els.monthFilter?.addEventListener("change", loadEvents);
  els.searchInput?.addEventListener("input", applyFilters);
  els.typeFilter?.addEventListener("change", applyFilters);
  els.statusFilter?.addEventListener("change", applyFilters);
  els.requiresWorkersFilter?.addEventListener("change", applyFilters);

  els.clearFiltersBtn?.addEventListener("click", () => {
    setDefaultMonth();
    els.searchInput.value = "";
    els.typeFilter.value = "all";
    els.statusFilter.value = "all";
    els.requiresWorkersFilter.value = "all";
    loadEvents();
  });

  els.closeEventModalBtn?.addEventListener("click", closeModal);
  els.cancelEventBtn?.addEventListener("click", closeModal);
  els.eventModalBackdrop?.addEventListener("click", closeModal);
  els.eventForm?.addEventListener("submit", handleSaveEvent);
  els.deleteEventBtn?.addEventListener("click", handleDeleteEvent);

  els.eventType?.addEventListener("change", updateConditionalSections);
  els.competitionType?.addEventListener("input", () => {
    state.selectedHomeTeamId = null;
    state.selectedAwayTeamId = null;
    els.homeTeamSearch.value = "";
    els.awayTeamSearch.value = "";
    renderCompetitionDropdown(els.competitionType.value);
    closeTeamDropdowns();
  });
  els.competitionType?.addEventListener("focus", () => renderCompetitionDropdown(els.competitionType.value));
  els.competitionType?.addEventListener("keydown", (e) => handleAutocompleteKeydown(e, "competition"));

  els.hasEarlyTeam?.addEventListener("change", updateEarlyTeamField);

  els.citySearch?.addEventListener("input", () => {
    state.selectedCityId = null;
    renderCityDropdown(els.citySearch.value);
  });
  els.citySearch?.addEventListener("focus", () => renderCityDropdown(els.citySearch.value));
  els.citySearch?.addEventListener("keydown", (e) => handleAutocompleteKeydown(e, "city"));

  els.stadiumSearch?.addEventListener("input", () => {
    state.selectedStadiumId = null;
    renderStadiumDropdown(els.stadiumSearch.value);
  });
  els.stadiumSearch?.addEventListener("focus", () => renderStadiumDropdown(els.stadiumSearch.value));
  els.stadiumSearch?.addEventListener("keydown", (e) => handleAutocompleteKeydown(e, "stadium"));

  els.homeTeamSearch?.addEventListener("input", () => {
    state.selectedHomeTeamId = null;
    renderHomeTeamDropdown(els.homeTeamSearch.value);
  });
  els.homeTeamSearch?.addEventListener("focus", () => renderHomeTeamDropdown(els.homeTeamSearch.value));
  els.homeTeamSearch?.addEventListener("keydown", (e) => handleAutocompleteKeydown(e, "homeTeam"));

  els.awayTeamSearch?.addEventListener("input", () => {
    state.selectedAwayTeamId = null;
    renderAwayTeamDropdown(els.awayTeamSearch.value);
  });
  els.awayTeamSearch?.addEventListener("focus", () => renderAwayTeamDropdown(els.awayTeamSearch.value));
  els.awayTeamSearch?.addEventListener("keydown", (e) => handleAutocompleteKeydown(e, "awayTeam"));

  els.addCityQuickBtn?.addEventListener("click", handleAddCityQuick);
  els.addStadiumQuickBtn?.addEventListener("click", handleAddStadiumQuick);
  els.addHomeTeamQuickBtn?.addEventListener("click", () => handleAddTeamQuick("home"));
  els.addAwayTeamQuickBtn?.addEventListener("click", () => handleAddTeamQuick("away"));

  document.addEventListener("click", handleGlobalAutocompleteClick);
}

function closeSidebar() {
  els.adminSidebar?.classList.remove("is-open");
  els.sidebarBackdrop?.classList.remove("is-open");
  document.body.classList.remove("sidebar-open");
}

function hydrateUser(user) {
  const name = user?.full_name?.trim() || "משתמש מחובר";
  const firstLetter = name.charAt(0) || "מ";

  if (els.adminFullName) els.adminFullName.textContent = name;
  if (els.adminAvatar) els.adminAvatar.textContent = firstLetter;
}

function setDefaultMonth() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (els.monthFilter) els.monthFilter.value = month;
}

async function loadLookupData() {
  const [citiesRes, stadiumsRes, leaguesRes, teamsRes] = await Promise.all([
    supabase.from("cities").select("city_id, name_he").order("name_he", { ascending: true }),
    supabase.from("stadiums").select("id, name, city_id").order("name", { ascending: true }),
    supabase.from("leagues").select("id, name").order("name", { ascending: true }),
    supabase.from("teams").select("id, name, league_id").order("name", { ascending: true })
  ]);

  state.cities = citiesRes.data || [];
  state.stadiums = stadiumsRes.data || [];
  state.leagues = leaguesRes.data || [];
  state.teams = teamsRes.data || [];
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function filterByQuery(items, query, getLabel) {
  const q = normalizeText(query);
  if (!q) return items.slice(0, 8);
  return items.filter((item) => normalizeText(getLabel(item)).includes(q)).slice(0, 8);
}

function closeAllAutocompleteDropdowns() {
  [
    els.cityDropdown,
    els.stadiumDropdown,
    els.competitionDropdown,
    els.homeTeamDropdown,
    els.awayTeamDropdown
  ].forEach((dropdown) => {
    if (dropdown) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("is-open");
    }
  });

  Object.keys(state.autocomplete).forEach((key) => {
    state.autocomplete[key].items = [];
    state.autocomplete[key].activeIndex = -1;
  });
}

function closeTeamDropdowns() {
  [els.homeTeamDropdown, els.awayTeamDropdown].forEach((dropdown) => {
    if (dropdown) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("is-open");
    }
  });

  state.autocomplete.homeTeam.items = [];
  state.autocomplete.homeTeam.activeIndex = -1;
  state.autocomplete.awayTeam.items = [];
  state.autocomplete.awayTeam.activeIndex = -1;
}

function handleGlobalAutocompleteClick(event) {
  const inside = event.target.closest(".meteor-autocomplete");
  if (!inside) closeAllAutocompleteDropdowns();
}

function renderDropdown(dropdownEl, items, renderItem) {
  if (!dropdownEl) return;

  if (!items.length) {
    dropdownEl.innerHTML = "";
    dropdownEl.classList.remove("is-open");
    return;
  }

  dropdownEl.innerHTML = items.map(renderItem).join("");
  dropdownEl.classList.add("is-open");
}

function renderCityDropdown(query = "") {
  const results = filterByQuery(state.cities, query, (city) => city.name_he);
  state.autocomplete.city.items = results;
  state.autocomplete.city.activeIndex = -1;

  renderDropdown(
    els.cityDropdown,
    results,
    (city, index) => `
      <button type="button" class="meteor-autocomplete-item" data-city-id="${city.city_id}" data-index="${index}">
        <span class="meteor-autocomplete-main">${escapeHtml(city.name_he)}</span>
        <span class="meteor-autocomplete-meta">עיר</span>
      </button>
    `
  );

  els.cityDropdown?.querySelectorAll("[data-city-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cityId = Number(btn.dataset.cityId);
      const city = state.cities.find((item) => Number(item.city_id) === cityId);
      if (!city) return;

      state.selectedCityId = city.city_id;
      els.citySearch.value = city.name_he;
      closeAllAutocompleteDropdowns();
    });
  });
}

function getFilteredStadiums() {
  if (!state.selectedCityId) return [...state.stadiums];
  return state.stadiums.filter((stadium) => Number(stadium.city_id) === Number(state.selectedCityId));
}

function renderStadiumDropdown(query = "") {
  const results = filterByQuery(getFilteredStadiums(), query, (stadium) => stadium.name);
  state.autocomplete.stadium.items = results;
  state.autocomplete.stadium.activeIndex = -1;

  renderDropdown(
    els.stadiumDropdown,
    results,
    (stadium, index) => {
      const city = state.cities.find((c) => Number(c.city_id) === Number(stadium.city_id));
      return `
        <button type="button" class="meteor-autocomplete-item" data-stadium-id="${stadium.id}" data-index="${index}">
          <span class="meteor-autocomplete-main">${escapeHtml(stadium.name)}</span>
          <span class="meteor-autocomplete-meta">${escapeHtml(city?.name_he || "")}</span>
        </button>
      `;
    }
  );

  els.stadiumDropdown?.querySelectorAll("[data-stadium-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const stadiumId = Number(btn.dataset.stadiumId);
      selectStadiumById(stadiumId);
    });
  });
}

function getLeagueIdByCompetition(competitionType) {
  const normalized = normalizeText(competitionType);

  if (!normalized || normalized === normalizeText("גביע")) {
    return null;
  }

  const league = state.leagues.find((item) => normalizeText(item.name) === normalized);
  return league ? Number(league.id) : null;
}

function getFilteredTeams() {
  const competition = cleanNullable(els.competitionType?.value);
  const leagueId = getLeagueIdByCompetition(competition);

  if (!competition || normalizeText(competition) === normalizeText("גביע")) {
    return [...state.teams];
  }

  if (!leagueId) {
    return [...state.teams];
  }

  return state.teams.filter((team) => Number(team.league_id) === Number(leagueId));
}

function renderHomeTeamDropdown(query = "") {
  const results = filterByQuery(getFilteredTeams(), query, (team) => team.name);
  state.autocomplete.homeTeam.items = results;
  state.autocomplete.homeTeam.activeIndex = -1;

  renderDropdown(
    els.homeTeamDropdown,
    results,
    (team, index) => {
      const league = state.leagues.find((l) => Number(l.id) === Number(team.league_id));
      return `
        <button type="button" class="meteor-autocomplete-item" data-home-team-id="${team.id}" data-index="${index}">
          <span class="meteor-autocomplete-main">${escapeHtml(team.name)}</span>
          <span class="meteor-autocomplete-meta">${escapeHtml(league?.name || "")}</span>
        </button>
      `;
    }
  );

  els.homeTeamDropdown?.querySelectorAll("[data-home-team-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const teamId = Number(btn.dataset.homeTeamId);
      const team = state.teams.find((item) => Number(item.id) === teamId);
      if (!team) return;

      state.selectedHomeTeamId = team.id;
      els.homeTeamSearch.value = team.name;
      closeAllAutocompleteDropdowns();
    });
  });
}

function renderAwayTeamDropdown(query = "") {
  const results = filterByQuery(getFilteredTeams(), query, (team) => team.name);
  state.autocomplete.awayTeam.items = results;
  state.autocomplete.awayTeam.activeIndex = -1;

  renderDropdown(
    els.awayTeamDropdown,
    results,
    (team, index) => {
      const league = state.leagues.find((l) => Number(l.id) === Number(team.league_id));
      return `
        <button type="button" class="meteor-autocomplete-item" data-away-team-id="${team.id}" data-index="${index}">
          <span class="meteor-autocomplete-main">${escapeHtml(team.name)}</span>
          <span class="meteor-autocomplete-meta">${escapeHtml(league?.name || "")}</span>
        </button>
      `;
    }
  );

  els.awayTeamDropdown?.querySelectorAll("[data-away-team-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const teamId = Number(btn.dataset.awayTeamId);
      const team = state.teams.find((item) => Number(item.id) === teamId);
      if (!team) return;

      state.selectedAwayTeamId = team.id;
      els.awayTeamSearch.value = team.name;
      closeAllAutocompleteDropdowns();
    });
  });
}

function renderCompetitionDropdown(query = "") {
  const results = filterByQuery(
    COMPETITION_OPTIONS.map((name) => ({ name })),
    query,
    (item) => item.name
  );

  state.autocomplete.competition.items = results;
  state.autocomplete.competition.activeIndex = -1;

  renderDropdown(
    els.competitionDropdown,
    results,
    (item, index) => `
      <button type="button" class="meteor-autocomplete-item" data-competition="${escapeHtml(item.name)}" data-index="${index}">
        <span class="meteor-autocomplete-main">${escapeHtml(item.name)}</span>
        <span class="meteor-autocomplete-meta">מסגרת</span>
      </button>
    `
  );

  els.competitionDropdown?.querySelectorAll("[data-competition]").forEach((btn) => {
    btn.addEventListener("click", () => {
      els.competitionType.value = btn.dataset.competition || "";
      state.selectedHomeTeamId = null;
      state.selectedAwayTeamId = null;
      els.homeTeamSearch.value = "";
      els.awayTeamSearch.value = "";
      closeAllAutocompleteDropdowns();
    });
  });
}

function handleAutocompleteKeydown(event, type) {
  const config = {
    city: { input: els.citySearch, dropdown: els.cityDropdown },
    stadium: { input: els.stadiumSearch, dropdown: els.stadiumDropdown },
    competition: { input: els.competitionType, dropdown: els.competitionDropdown },
    homeTeam: { input: els.homeTeamSearch, dropdown: els.homeTeamDropdown },
    awayTeam: { input: els.awayTeamSearch, dropdown: els.awayTeamDropdown }
  }[type];

  if (!config) return;

  const stateRef = state.autocomplete[type];
  const items = stateRef.items || [];
  if (!items.length && !["ArrowDown", "Escape"].includes(event.key)) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    stateRef.activeIndex = Math.min(stateRef.activeIndex + 1, items.length - 1);
    updateActiveAutocompleteItem(config.dropdown, stateRef.activeIndex);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    stateRef.activeIndex = Math.max(stateRef.activeIndex - 1, 0);
    updateActiveAutocompleteItem(config.dropdown, stateRef.activeIndex);
    return;
  }

  if (event.key === "Enter") {
    if (stateRef.activeIndex >= 0 && items[stateRef.activeIndex]) {
      event.preventDefault();
      const item = items[stateRef.activeIndex];

      if (type === "city") {
        state.selectedCityId = item.city_id;
        els.citySearch.value = item.name_he;
      } else if (type === "stadium") {
        selectStadiumById(item.id);
      } else if (type === "competition") {
        els.competitionType.value = item.name;
        state.selectedHomeTeamId = null;
        state.selectedAwayTeamId = null;
        els.homeTeamSearch.value = "";
        els.awayTeamSearch.value = "";
      } else if (type === "homeTeam") {
        state.selectedHomeTeamId = item.id;
        els.homeTeamSearch.value = item.name;
      } else if (type === "awayTeam") {
        state.selectedAwayTeamId = item.id;
        els.awayTeamSearch.value = item.name;
      }

      closeAllAutocompleteDropdowns();
    }
    return;
  }

  if (event.key === "Escape") {
    closeAllAutocompleteDropdowns();
  }
}

function updateActiveAutocompleteItem(dropdownEl, activeIndex) {
  if (!dropdownEl) return;

  const items = [...dropdownEl.querySelectorAll(".meteor-autocomplete-item")];
  items.forEach((item, index) => {
    item.classList.toggle("is-active", index === activeIndex);
  });

  const activeEl = items[activeIndex];
  if (activeEl) {
    activeEl.scrollIntoView({ block: "nearest" });
  }
}

function selectStadiumById(stadiumId) {
  const stadium = state.stadiums.find((item) => Number(item.id) === Number(stadiumId));
  if (!stadium) return;

  state.selectedStadiumId = stadium.id;
  els.stadiumSearch.value = stadium.name;

  const city = state.cities.find((c) => Number(c.city_id) === Number(stadium.city_id));
  if (city) {
    state.selectedCityId = city.city_id;
    if (els.citySearch) els.citySearch.value = city.name_he;
    if (els.derivedCityName) els.derivedCityName.value = city.name_he;
  }

  closeAllAutocompleteDropdowns();
}

function handleCityInput() {
  const raw = els.citySearch.value.trim();
  const found = state.cities.find((city) => city.name_he === raw);
  state.selectedCityId = found?.city_id || null;
}

function handleStadiumInput() {
  const raw = els.stadiumSearch.value.trim();
  const found = state.stadiums.find((stadium) => stadium.name === raw);
  state.selectedStadiumId = found?.id || null;

  if (found && found.city_id) {
    state.selectedCityId = found.city_id;
    const city = state.cities.find((item) => Number(item.city_id) === Number(found.city_id));
    if (city) {
      if (els.derivedCityName) els.derivedCityName.value = city.name_he;
      if (els.citySearch) els.citySearch.value = city.name_he;
    }
  } else {
    if (els.derivedCityName) els.derivedCityName.value = "";
  }
}

function handleHomeTeamInput() {
  const raw = els.homeTeamSearch.value.trim();
  const found = getFilteredTeams().find((team) => team.name === raw);
  state.selectedHomeTeamId = found?.id || null;
}

function handleAwayTeamInput() {
  const raw = els.awayTeamSearch.value.trim();
  const found = getFilteredTeams().find((team) => team.name === raw);
  state.selectedAwayTeamId = found?.id || null;
}

async function handleAddCityQuick() {
  const suggested = els.citySearch.value.trim();
  const name = window.prompt("הכנס שם עיר חדשה:", suggested || "");
  if (!name) return;

  const clean = name.trim();
  if (!clean) return;

  const existing = state.cities.find((city) => city.name_he === clean);
  if (existing) {
    state.selectedCityId = existing.city_id;
    els.citySearch.value = existing.name_he;
    showFormMessage("העיר כבר קיימת ונבחרה בטופס.", "success");
    return;
  }

  const { data, error } = await supabase
    .from("cities")
    .insert({ name_he: clean })
    .select("city_id, name_he")
    .single();

  if (error || !data) {
    console.error("Add city error:", error);
    showFormMessage("לא ניתן להוסיף עיר כרגע.", "error");
    return;
  }

  state.cities.push(data);
  state.cities.sort((a, b) => a.name_he.localeCompare(b.name_he, "he"));
  state.selectedCityId = data.city_id;
  els.citySearch.value = data.name_he;
  showFormMessage("העיר נוספה בהצלחה.", "success");
}

async function handleAddStadiumQuick() {
  if (els.eventType.value !== "football") {
    showFormMessage("אצטדיון מוסיפים רק במסך של משחק כדורגל.", "warning");
    return;
  }

  const suggested = els.stadiumSearch.value.trim();
  const name = window.prompt("הכנס שם אצטדיון חדש:", suggested || "");
  if (!name) return;

  const clean = name.trim();
  if (!clean) return;

  let cityId = state.selectedCityId || null;

  if (!cityId) {
    const cityName = window.prompt("כדי להוסיף אצטדיון חדש, הזן גם שם עיר קיימת או חדשה:");
    if (!cityName) {
      showFormMessage("בוטל. לא הוזנה עיר לאצטדיון.", "warning");
      return;
    }

    const cleanCity = cityName.trim();
    if (!cleanCity) {
      showFormMessage("שם העיר לא תקין.", "warning");
      return;
    }

    let existingCity = state.cities.find((city) => city.name_he === cleanCity);

    if (!existingCity) {
      const cityInsert = await supabase
        .from("cities")
        .insert({ name_he: cleanCity })
        .select("city_id, name_he")
        .single();

      if (cityInsert.error || !cityInsert.data) {
        console.error("Add city while stadium error:", cityInsert.error);
        showFormMessage("לא ניתן להוסיף את העיר עבור האצטדיון.", "error");
        return;
      }

      existingCity = cityInsert.data;
      state.cities.push(existingCity);
      state.cities.sort((a, b) => a.name_he.localeCompare(b.name_he, "he"));
    }

    cityId = existingCity.city_id;
    state.selectedCityId = cityId;
    els.citySearch.value = existingCity.name_he;
    if (els.derivedCityName) els.derivedCityName.value = existingCity.name_he;
  }

  const existing = state.stadiums.find(
    (stadium) => stadium.name === clean && Number(stadium.city_id) === Number(cityId)
  );

  if (existing) {
    state.selectedStadiumId = existing.id;
    els.stadiumSearch.value = existing.name;
    showFormMessage("האצטדיון כבר קיים ונבחר בטופס.", "success");
    return;
  }

  const { data, error } = await supabase
    .from("stadiums")
    .insert({
      name: clean,
      city_id: cityId
    })
    .select("id, name, city_id")
    .single();

  if (error || !data) {
    console.error("Add stadium error:", error);
    showFormMessage("לא ניתן להוסיף אצטדיון כרגע.", "error");
    return;
  }

  state.stadiums.push(data);
  state.stadiums.sort((a, b) => a.name.localeCompare(b.name, "he"));
  state.selectedStadiumId = data.id;
  els.stadiumSearch.value = data.name;

  const city = state.cities.find((item) => Number(item.city_id) === Number(data.city_id));
  if (city) {
    state.selectedCityId = city.city_id;
    els.citySearch.value = city.name_he;
    if (els.derivedCityName) els.derivedCityName.value = city.name_he;
  }

  showFormMessage("האצטדיון נוסף בהצלחה.", "success");
}

async function handleAddTeamQuick(side) {
  if (els.eventType.value !== "football") {
    showFormMessage("קבוצות מוסיפים רק במשחק כדורגל.", "warning");
    return;
  }

  const competition = cleanNullable(els.competitionType.value);
  if (!competition) {
    showFormMessage("כדי להוסיף קבוצה חדשה, יש לבחור קודם מסגרת.", "warning");
    return;
  }

  let leagueId = getLeagueIdByCompetition(competition);

  if (!leagueId) {
    const leagueName = window.prompt(
      "לקבוצה חדשה בחר ליגה: ליגת העל / ליגה לאומית",
      "ליגת העל"
    );

    const cleanLeagueName = cleanNullable(leagueName);
    if (!cleanLeagueName) {
      showFormMessage("לא נבחרה ליגה לקבוצה החדשה.", "warning");
      return;
    }

    leagueId = getLeagueIdByCompetition(cleanLeagueName);

    if (!leagueId) {
      showFormMessage("הליגה שהוזנה לא קיימת במערכת.", "warning");
      return;
    }
  }

  const inputEl = side === "home" ? els.homeTeamSearch : els.awayTeamSearch;
  const suggested = inputEl.value.trim();
  const name = window.prompt("הכנס שם קבוצה חדשה:", suggested || "");
  if (!name) return;

  const clean = name.trim();
  if (!clean) return;

  const existing = state.teams.find(
    (team) => team.name === clean && Number(team.league_id) === Number(leagueId)
  );

  if (existing) {
    if (side === "home") {
      state.selectedHomeTeamId = existing.id;
    } else {
      state.selectedAwayTeamId = existing.id;
    }
    inputEl.value = existing.name;
    showFormMessage("הקבוצה כבר קיימת ונבחרה בטופס.", "success");
    return;
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: clean,
      league_id: leagueId
    })
    .select("id, name, league_id")
    .single();

  if (error || !data) {
    console.error("Add team error:", error);
    showFormMessage("לא ניתן להוסיף קבוצה כרגע.", "error");
    return;
  }

  state.teams.push(data);
  state.teams.sort((a, b) => a.name.localeCompare(b.name, "he"));

  if (side === "home") {
    state.selectedHomeTeamId = data.id;
  } else {
    state.selectedAwayTeamId = data.id;
  }

  inputEl.value = data.name;
  showFormMessage("הקבוצה נוספה בהצלחה.", "success");
}

async function loadEvents() {
  const monthValue = els.monthFilter?.value;
  if (!monthValue) return;

  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const today = toIsoDate(new Date());

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
      created_at,
      updated_at,
      cities:city_id (
        city_id,
        name_he
      ),
      stadiums:stadium_id (
        id,
        name,
        city_id
      ),
      home_team:home_team_id (
        id,
        name,
        league_id
      ),
      away_team:away_team_id (
        id,
        name,
        league_id
      )
    `)
    .gte("event_date", toIsoDate(start))
    .lte("event_date", toIsoDate(end))
    .order("event_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  if (error) {
    console.error("Failed to load events:", error);
    renderEventsError("שגיאה בטעינת האירועים.");
    return;
  }

  state.events = (data || []).map((item) => ({
    ...item,
    status: item.event_date < today ? "closed" : "open"
  }));

  applyFilters();
}

function applyFilters() {
  const search = (els.searchInput?.value || "").trim().toLowerCase();
  const type = els.typeFilter?.value || "all";
  const status = els.statusFilter?.value || "all";
  const requiresWorkers = els.requiresWorkersFilter?.value || "all";
  const today = toIsoDate(new Date());

  state.filteredEvents = state.events.filter((event) => {
    const computedStatus = event.event_date < today ? "closed" : "open";

    if (type !== "all" && event.event_type !== type) return false;
    if (status !== "all" && computedStatus !== status) return false;
    if (requiresWorkers === "yes" && !event.requires_workers_list) return false;
    if (requiresWorkers === "no" && event.requires_workers_list) return false;

    if (!search) return true;

    const haystack = [
      getEventTitle(event),
      event.event_name,
      event.manual_location,
      event.competition_type,
      event.cities?.name_he,
      event.stadiums?.name,
      event.home_team?.name,
      event.away_team?.name,
      event.notes
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });

  renderKpis();
  renderEventsList();
}

function renderKpis() {
  const total = state.filteredEvents.length;
  const football = state.filteredEvents.filter((event) => event.event_type === "football").length;
  const regular = state.filteredEvents.filter((event) => event.event_type === "event").length;
  const requiresWorkers = state.filteredEvents.filter((event) => event.requires_workers_list).length;

  setKpi(els.kpiEventsInMonth, els.kpiEventsInMonthSub, total, total ? "אירועים מוצגים לפי הסינון הנוכחי" : "אין אירועים בתצוגה זו");
  setKpi(els.kpiFootballEvents, els.kpiFootballEventsSub, football, football ? "משחקים בתצוגה הנוכחית" : "אין משחקי כדורגל");
  setKpi(els.kpiRegularEvents, els.kpiRegularEventsSub, regular, regular ? "אירועים רגילים בתצוגה" : "אין אירועים רגילים");
  setKpi(els.kpiRequiresWorkers, els.kpiRequiresWorkersSub, requiresWorkers, requiresWorkers ? "דורשים רשימת עובדים" : "אין אירועים שדורשים רשימה");
}

function setKpi(valueEl, subEl, value, text) {
  if (valueEl) valueEl.textContent = String(value);
  if (subEl) subEl.textContent = text;
}

function renderEventsList() {
  if (!els.eventsList) return;

  const total = state.filteredEvents.length;
  if (els.eventsSummaryText) {
    els.eventsSummaryText.textContent = total
      ? `${total} אירועים מוצגים כרגע`
      : "לא נמצאו אירועים לפי הסינון שנבחר";
  }

  if (!total) {
    els.eventsList.innerHTML = `
      <div class="meteor-empty-state">
        <strong>לא נמצאו אירועים</strong>
        <span>נסה לשנות סינון או ליצור אירוע חדש.</span>
      </div>
    `;
    return;
  }

  els.eventsList.innerHTML = state.filteredEvents
    .map((event) => {
      const title = getEventTitle(event);
      const typeLabel = event.event_type === "football" ? "משחק כדורגל" : "אירוע רגיל";
      const typeClass = event.event_type === "football" ? "primary" : "muted";
      const statusLabel = getStatusLabel(event.status);
      const statusClass = getStatusClass(event.status);
      const location = getLocationText(event);

      return `
        <article class="meteor-event-card">
          <div class="meteor-event-card-top">
            <div class="meteor-event-card-main">
              <div class="meteor-event-card-badges">
                <span class="meteor-mini-badge ${typeClass}">${typeLabel}</span>
                <span class="meteor-status-badge ${statusClass}">${statusLabel}</span>
                ${event.requires_workers_list ? `<span class="meteor-mini-badge warning">דורש רשימת עובדים</span>` : ""}
                ${event.early_workers_time ? `<span class="meteor-mini-badge primary">צוות מקדים</span>` : ""}
              </div>

              <h3>${escapeHtml(title)}</h3>

              <div class="meteor-event-meta-grid">
                <div class="meteor-event-meta-item">
                  <span>תאריך</span>
                  <strong>${formatDate(event.event_date)}</strong>
                </div>

                <div class="meteor-event-meta-item">
                  <span>שעות</span>
                  <strong>${formatTime(event.arrival_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ""}</strong>
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

              ${event.notes ? `<p class="meteor-event-notes">${escapeHtml(event.notes)}</p>` : ""}
            </div>

            <div class="meteor-event-card-actions">
              <button type="button" class="meteor-btn meteor-btn-outline meteor-btn-sm js-edit-event" data-id="${event.id}">
                ערוך
              </button>
              <button type="button" class="meteor-btn meteor-btn-danger-soft meteor-btn-sm js-delete-event" data-id="${event.id}">
                מחק
              </button>
              <a href="./assignments.html?event_id=${event.id}" class="meteor-btn meteor-btn-primary meteor-btn-sm">
                לשיבוץ קבלנים
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  els.eventsList.querySelectorAll(".js-edit-event").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const event = state.events.find((item) => Number(item.id) === id);
      if (event) openEditModal(event);
    });
  });

  els.eventsList.querySelectorAll(".js-delete-event").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      await deleteEventById(id);
    });
  });
}

function renderEventsError(text) {
  if (!els.eventsList) return;
  els.eventsList.innerHTML = `
    <div class="meteor-empty-state">
      <strong>שגיאה</strong>
      <span>${escapeHtml(text)}</span>
    </div>
  `;
}

function openCreateModal() {
  resetForm();
  state.editingEventId = null;
  els.eventModalTitle.textContent = "יצירת אירוע חדש";
  els.eventModalSubtitle.textContent = "מלא את פרטי האירוע ושמור.";
  els.deleteEventBtn.classList.add("d-none");
  openModal();
}

function openEditModal(event) {
  resetForm();

  state.editingEventId = Number(event.id);

  els.eventModalTitle.textContent = "עריכת אירוע";
  els.eventModalSubtitle.textContent = "עדכן את הפרטים ושמור שינויים.";
  els.deleteEventBtn.classList.remove("d-none");

  els.eventId.value = event.id;
  els.eventType.value = event.event_type || "football";
  els.eventDate.value = event.event_date || "";
  els.arrivalTime.value = event.arrival_time ? String(event.arrival_time).slice(0, 5) : "";
  els.endTime.value = event.end_time ? String(event.end_time).slice(0, 5) : "";
  els.earlyWorkersTime.value = event.early_workers_time ? String(event.early_workers_time).slice(0, 5) : "";
  els.hasEarlyTeam.checked = !!event.early_workers_time;
  els.requiresWorkersList.checked = !!event.requires_workers_list;

  els.manualLocation.value = event.manual_location || "";
  els.competitionType.value = event.competition_type || "";
  els.eventName.value = event.event_name || "";
  els.notes.value = event.notes || "";

  if (event.city_id && event.cities?.name_he) {
    state.selectedCityId = event.city_id;
    els.citySearch.value = event.cities.name_he;
    if (els.derivedCityName && event.event_type === "football") {
      els.derivedCityName.value = event.cities.name_he;
    }
  }

  if (event.stadium_id && event.stadiums?.name) {
    state.selectedStadiumId = event.stadium_id;
    els.stadiumSearch.value = event.stadiums.name;
  }

  if (event.home_team_id && event.home_team?.name) {
    state.selectedHomeTeamId = event.home_team_id;
    els.homeTeamSearch.value = event.home_team.name;
  }

  if (event.away_team_id && event.away_team?.name) {
    state.selectedAwayTeamId = event.away_team_id;
    els.awayTeamSearch.value = event.away_team.name;
  }

  updateConditionalSections();
  openModal();
}

function resetForm() {
  state.selectedCityId = null;
  state.selectedStadiumId = null;
  state.selectedHomeTeamId = null;
  state.selectedAwayTeamId = null;
  state.editingEventId = null;

  els.eventForm.reset();
  els.eventId.value = "";
  els.eventType.value = "football";
  els.requiresWorkersList.checked = false;
  els.hasEarlyTeam.checked = false;
  if (els.derivedCityName) els.derivedCityName.value = "";

  clearFormMessage();
  closeAllAutocompleteDropdowns();
  updateConditionalSections();
}

function openModal() {
  els.eventModal.classList.add("is-open");
  els.eventModalBackdrop.classList.add("is-open");
  document.body.classList.add("modal-open");
  els.eventModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.eventModal.classList.remove("is-open");
  els.eventModalBackdrop.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  els.eventModal.setAttribute("aria-hidden", "true");
  closeAllAutocompleteDropdowns();
}

function updateEarlyTeamField() {
  const isEnabled = !!els.hasEarlyTeam?.checked;
  els.earlyWorkersTimeWrap?.classList.toggle("d-none", !isEnabled);

  if (!isEnabled && els.earlyWorkersTime) {
    els.earlyWorkersTime.value = "";
  }
}

function updateConditionalSections() {
  const isFootball = els.eventType.value === "football";

  els.footballFieldsSection.classList.toggle("d-none", !isFootball);
  els.eventFieldsSection.classList.toggle("d-none", isFootball);

  if (isFootball) {
    els.manualLocation.value = "";
    els.eventName.value = "";
  } else {
    els.stadiumSearch.value = "";
    els.homeTeamSearch.value = "";
    els.awayTeamSearch.value = "";
    els.competitionType.value = "";
    if (els.derivedCityName) els.derivedCityName.value = "";

    state.selectedStadiumId = null;
    state.selectedHomeTeamId = null;
    state.selectedAwayTeamId = null;
  }

  updateEarlyTeamField();
  closeAllAutocompleteDropdowns();
}

async function handleSaveEvent(event) {
  event.preventDefault();
  clearFormMessage();

  const payload = buildPayloadFromForm();
  if (!payload.ok) {
    showFormMessage(payload.message, "warning");
    return;
  }

  setSaveLoading(true);

  try {
    let response;

    if (state.editingEventId) {
      response = await supabase
        .from("events")
        .update(payload.data)
        .eq("id", state.editingEventId)
        .select("id")
        .single();
    } else {
      response = await supabase
        .from("events")
        .insert(payload.data)
        .select("id")
        .single();
    }

    if (response.error) {
      console.error("Save event error:", response.error);
      showFormMessage("אירעה שגיאה בשמירת האירוע.", "error");
      return;
    }

    showFormMessage(state.editingEventId ? "האירוע עודכן בהצלחה." : "האירוע נוצר בהצלחה.", "success");
    await loadEvents();

    setTimeout(() => {
      closeModal();
    }, 500);
  } finally {
    setSaveLoading(false);
  }
}

function buildPayloadFromForm() {
  const eventType = els.eventType.value;
  const eventDate = els.eventDate.value;
  const arrivalTime = els.arrivalTime.value;
  const endTime = els.endTime.value || null;
  const hasEarlyTeam = !!els.hasEarlyTeam.checked;
  const earlyWorkersTime = hasEarlyTeam ? (els.earlyWorkersTime.value || null) : null;
  const requiresWorkersList = !!els.requiresWorkersList.checked;

  const manualLocation = cleanNullable(els.manualLocation.value);
  const competitionType = cleanNullable(els.competitionType.value);
  const eventName = cleanNullable(els.eventName.value);
  const notes = cleanNullable(els.notes.value);

  handleCityInput();
  handleStadiumInput();
  handleHomeTeamInput();
  handleAwayTeamInput();

  if (!eventDate) {
    return { ok: false, message: "יש לבחור תאריך." };
  }

  if (!arrivalTime) {
    return { ok: false, message: "יש לבחור שעת התייצבות." };
  }

  if (hasEarlyTeam && !earlyWorkersTime) {
    return { ok: false, message: "סימנת שיש צוות מקדים, לכן יש למלא שעת התייצבות מקדים." };
  }

  if (eventType === "football") {
    if (!competitionType) {
      return { ok: false, message: "במשחק כדורגל יש למלא מסגרת." };
    }

    if (!COMPETITION_OPTIONS.includes(competitionType)) {
      return { ok: false, message: "המסגרת שנבחרה אינה תקינה. בחר ליגת העל, ליגה לאומית או גביע." };
    }

    if (!state.selectedStadiumId) {
      return { ok: false, message: "במשחק כדורגל יש לבחור אצטדיון מתוך הרשימה." };
    }

    if (!state.selectedHomeTeamId || !state.selectedAwayTeamId) {
      return { ok: false, message: "במשחק כדורגל יש לבחור קבוצה מארחת וקבוצה אורחת." };
    }

    if (Number(state.selectedHomeTeamId) === Number(state.selectedAwayTeamId)) {
      return { ok: false, message: "הקבוצה המארחת והאורחת לא יכולות להיות זהות." };
    }
  }

  if (eventType === "event") {
    if (!state.selectedCityId) {
      return { ok: false, message: "באירוע רגיל יש לבחור עיר." };
    }

    if (!manualLocation) {
      return { ok: false, message: "באירוע רגיל יש למלא מיקום ידני." };
    }

    if (!eventName) {
      return { ok: false, message: "באירוע רגיל יש למלא שם אירוע." };
    }
  }

  const data = {
    event_type: eventType,
    event_date: eventDate,
    arrival_time: arrivalTime,
    end_time: endTime,
    early_workers_time: earlyWorkersTime,
    competition_type: eventType === "football" ? competitionType : null,
    city_id: state.selectedCityId || null,
    stadium_id: eventType === "football" ? state.selectedStadiumId || null : null,
    home_team_id: eventType === "football" ? state.selectedHomeTeamId || null : null,
    away_team_id: eventType === "football" ? state.selectedAwayTeamId || null : null,
    event_name: eventType === "event" ? eventName : null,
    manual_location: eventType === "event" ? manualLocation : null,
    notes,
    requires_workers_list: requiresWorkersList,
    status: "open"
  };

  return { ok: true, data };
}

async function handleDeleteEvent() {
  if (!state.editingEventId) return;
  await deleteEventById(state.editingEventId, true);
}

async function deleteEventById(eventId, closeAfter = false) {
  const confirmed = window.confirm("למחוק את האירוע? הפעולה אינה הפיכה.");
  if (!confirmed) return;

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error("Delete event error:", error);
    showFormMessage("לא ניתן למחוק את האירוע כרגע.", "error");
    return;
  }

  if (closeAfter) {
    closeModal();
  }

  await loadEvents();
}

function setSaveLoading(isLoading) {
  const btn = els.saveEventBtn;
  if (!btn) return;

  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);

  const textEl = btn.querySelector(".btn-text");
  const loaderEl = btn.querySelector(".btn-loader");

  if (textEl) {
    textEl.textContent = isLoading ? "שומר..." : "שמור אירוע";
  }

  if (loaderEl) {
    loaderEl.classList.toggle("d-none", !isLoading);
  }
}

function showFormMessage(message, type = "error") {
  if (!els.eventFormMessage) return;
  els.eventFormMessage.innerHTML = `
    <div class="meteor-alert meteor-alert-${type}">
      <div class="meteor-alert-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function clearFormMessage() {
  if (els.eventFormMessage) els.eventFormMessage.innerHTML = "";
}

function handleUrlPrefill() {
  const params = new URLSearchParams(window.location.search);
  const eventId = Number(params.get("event_id") || 0);
  if (!eventId) return;

  const existing = state.events.find((item) => Number(item.id) === eventId);
  if (existing) {
    openEditModal(existing);
  }
}

function getEventTitle(event) {
  if (event.event_type === "football") {
    const home = event.home_team?.name || "קבוצת בית";
    const away = event.away_team?.name || "קבוצת חוץ";
    return `${home} - ${away}`;
  }
  return event.event_name || "אירוע";
}

function getLocationText(event) {
  if (event.event_type === "football") {
    return event.stadiums?.name || event.cities?.name_he || "ללא מיקום";
  }
  return event.manual_location || event.cities?.name_he || "ללא מיקום";
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

function toIsoDate(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date - tzOffset).toISOString().slice(0, 10);
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