const categories = [
  { id: "internships", title: "Current Internships", overview: "Track internship tasks, interview prep, and weekly wins." },
  { id: "gym", title: "Gym", overview: "Manage workouts, goals, and progress reminders." },
  { id: "school", title: "School Work", overview: "Organize assignments, deadlines, and study notes." },
  { id: "projects", title: "Projects", overview: "Plan milestones, tasks, and project ideas." }
];

const priorityRank = { high: 0, medium: 1, low: 2 };
const dashboardView = document.getElementById("dashboard-view");
const detailView = document.getElementById("detail-view");
const cardsGrid = document.getElementById("cards-grid");
const detailTitle = document.getElementById("detail-title");
const detailOverview = document.getElementById("detail-overview");

let currentCategory = null;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function storageKey(kind) {
  return `${kind}:${currentCategory}`;
}

function read(kind) {
  if (!currentCategory) return [];
  const raw = localStorage.getItem(storageKey(kind));
  return raw ? JSON.parse(raw) : [];
}

function write(kind, value) {
  if (!currentCategory) return;
  localStorage.setItem(storageKey(kind), JSON.stringify(value));
}

function renderCards() {
  cardsGrid.innerHTML = categories
    .map(
      (category) => `
      <article class="card">
        <h2>${category.title}</h2>
        <p>${category.overview}</p>
        <button type="button" data-open="${category.id}">Open</button>
      </article>
    `
    )
    .join("");
}

function showDashboard() {
  detailView.classList.remove("active");
  dashboardView.classList.add("active");
}

function openCategory(id) {
  const category = categories.find((item) => item.id === id);
  if (!category) return;

  currentCategory = category.id;
  detailTitle.textContent = category.title;
  detailOverview.textContent = category.overview;
  dashboardView.classList.remove("active");
  detailView.classList.add("active");
  renderCategoryData();
}

function renderTodos() {
  const list = document.getElementById("todo-list");
  const todos = read("todos").sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  list.innerHTML = todos
    .map(
      (todo, index) => `
      <li>
        <div class="item-head">
          <strong>${escapeHtml(todo.text)}</strong>
          <span class="priority ${todo.priority}">${todo.priority}</span>
        </div>
        <button type="button" data-delete-todo="${index}">Delete</button>
      </li>`
    )
    .join("");
}

function renderReminders() {
  const list = document.getElementById("reminder-list");
  const reminders = read("reminders").sort((a, b) => new Date(a.when) - new Date(b.when));

  list.innerHTML = reminders
    .map(
      (reminder, index) => `
      <li>
        <div class="item-head">
          <strong>${escapeHtml(reminder.text)}</strong>
          <button type="button" data-delete-reminder="${index}">Delete</button>
        </div>
        <div class="tiny">${new Date(reminder.when).toLocaleString()} • Repeat: ${reminder.repeat}</div>
      </li>`
    )
    .join("");
}

function renderNotes() {
  const grid = document.getElementById("notes-grid");
  const notes = read("notes");

  grid.innerHTML = notes
    .map(
      (note, index) => `
      <article class="note">
        <div class="item-head">
          <strong>${escapeHtml(note.title)}</strong>
          <button type="button" data-delete-note="${index}">Delete</button>
        </div>
        <p>${escapeHtml(note.body)}</p>
      </article>`
    )
    .join("");
}

function renderCategoryData() {
  renderTodos();
  renderReminders();
  renderNotes();
}

function addTodo(event) {
  event.preventDefault();
  const text = document.getElementById("todo-text");
  const priority = document.getElementById("todo-priority");
  const value = text.value.trim();
  if (!value) return;
  const todos = read("todos");
  todos.push({ text: value, priority: priority.value });
  write("todos", todos);
  event.target.reset();
  renderTodos();
}

function addReminder(event) {
  event.preventDefault();
  const text = document.getElementById("reminder-text");
  const when = document.getElementById("reminder-when");
  const repeat = document.getElementById("reminder-repeat");
  const value = text.value.trim();
  if (!value || !when.value) return;
  const reminders = read("reminders");
  reminders.push({ text: value, when: when.value, repeat: repeat.value });
  write("reminders", reminders);
  event.target.reset();
  renderReminders();
}

function addNote(event) {
  event.preventDefault();
  const title = document.getElementById("note-title");
  const body = document.getElementById("note-body");
  const noteTitle = title.value.trim();
  const noteBody = body.value.trim();
  if (!noteTitle || !noteBody) return;
  const notes = read("notes");
  notes.push({ title: noteTitle, body: noteBody });
  write("notes", notes);
  event.target.reset();
  renderNotes();
}

function removeItem(kind, index) {
  const entries = read(kind);
  entries.splice(index, 1);
  write(kind, entries);
  renderCategoryData();
}

function parseIcsDate(value) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/);
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00", isUtc] = match;
  if (isUtc) {
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
  }
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
}

function parseIcs(text) {
  const events = [];
  const blocks = text.split("BEGIN:VEVENT").slice(1);
  for (const block of blocks) {
    const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim();
    const start = block.match(/DTSTART(?:;[^:]+)?:([0-9]{8}(?:T[0-9]{6}Z?)?)/)?.[1];
    const end = block.match(/DTEND(?:;[^:]+)?:([0-9]{8}(?:T[0-9]{6}Z?)?)/)?.[1];
    const parsedStart = start ? parseIcsDate(start) : null;
    const parsedEnd = end ? parseIcsDate(end) : null;
    if (summary && parsedStart) {
      events.push({
        summary,
        start: parsedStart,
        end: parsedEnd
      });
    }
  }
  return events.sort((a, b) => a.start - b.start);
}

function renderCalendarEvents(events) {
  const list = document.getElementById("calendar-events");
  const now = new Date();
  const upcoming = events.filter((event) => event.start >= now).slice(0, 15);
  list.innerHTML = upcoming.length
    ? upcoming
        .map(
          (event) =>
            `<li><strong>${escapeHtml(event.summary)}</strong><div class="tiny">${event.start.toLocaleString()}</div></li>`
        )
        .join("")
    : "<li>No upcoming events found.</li>";
}

async function loadCalendarFromUrl() {
  const input = document.getElementById("calendar-url");
  const status = document.getElementById("calendar-status");
  const url = input.value.trim();
  if (!url) {
    status.textContent = "Enter a Google Calendar ICS URL first.";
    return;
  }
  status.textContent = "Loading calendar...";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const events = parseIcs(text);
    localStorage.setItem("calendar-url", url);
    renderCalendarEvents(events);
    status.textContent = `Loaded ${events.length} events.`;
  } catch (error) {
    status.textContent = `Failed to load calendar: ${error?.message || "unknown error"}. Import an exported Google Calendar ICS file if URL loading is blocked.`;
  }
}

async function loadCalendarFromFile(event) {
  const status = document.getElementById("calendar-status");
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const events = parseIcs(text);
  renderCalendarEvents(events);
  status.textContent = `Loaded ${events.length} events from file.`;
}

function bootstrap() {
  renderCards();
  const savedUrl = localStorage.getItem("calendar-url");
  if (savedUrl) document.getElementById("calendar-url").value = savedUrl;

  cardsGrid.addEventListener("click", (event) => {
    const id = event.target.dataset.open;
    if (id) openCategory(id);
  });

  document.getElementById("back-button").addEventListener("click", showDashboard);
  document.getElementById("todo-form").addEventListener("submit", addTodo);
  document.getElementById("reminder-form").addEventListener("submit", addReminder);
  document.getElementById("note-form").addEventListener("submit", addNote);
  document.getElementById("load-calendar").addEventListener("click", loadCalendarFromUrl);
  document.getElementById("calendar-file").addEventListener("change", loadCalendarFromFile);

  detailView.addEventListener("click", (event) => {
    const deleteTodo = event.target.getAttribute("data-delete-todo");
    const deleteReminder = event.target.getAttribute("data-delete-reminder");
    const deleteNote = event.target.getAttribute("data-delete-note");
    if (deleteTodo !== null) {
      removeItem("todos", Number(deleteTodo));
    }
    if (deleteReminder !== null) {
      removeItem("reminders", Number(deleteReminder));
    }
    if (deleteNote !== null) {
      removeItem("notes", Number(deleteNote));
    }
  });
}

bootstrap();
