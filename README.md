# Windows 11 Productivity Dashboard

A lightweight single-page dashboard app with:

- Floating dashboard boxes for:
  - Current Internships
  - Gym
  - School Work
  - Projects
- Per-category detail view with:
  - Priority-based to-do list
  - Reminders
  - Notes
- Dashboard schedule section that can load events from a Google Calendar ICS feed URL (or local ICS file export).

## Run locally

From `/home/runner/work/os/os/monowarz/os`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser on Windows 11.