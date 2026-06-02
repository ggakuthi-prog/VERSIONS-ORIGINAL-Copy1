# File Tracking System

A simple file tracking frontend with JSON import, archive/history support, and an optional backend REST API.

## Features

- Login page with remember-me support
- Add, edit, archive, restore, and delete files
- CSV import from JSON files
- Export all data and history to JSON
- Archive section with restore/delete behavior
- Activity history log
- Optional backend-ready REST API server with Express

## Run the static frontend

Open `index.html` in your browser.

## Run the backend server

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

3. Open your browser at:

```text
http://localhost:3000
```

## Backend endpoints

- `GET /api/files`
- `GET /api/history`
- `POST /api/files`
- `PUT /api/files/:id`
- `DELETE /api/files/:id`
- `POST /api/import`
- `POST /api/archive`
