const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const dataPath = path.join(__dirname, "data.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function loadData() {
  if (!fs.existsSync(dataPath)) {
    return { trackedFiles: [], historyLog: [] };
  }

  const raw = fs.readFileSync(dataPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("Could not parse data.json:", error);
    return { trackedFiles: [], historyLog: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf8");
}

function createFileEntry({ name, owner, type = "Document", status = "Pending", dueDate = "", notes = "", archived = false }) {
  const timestamp = new Date().toISOString();
  return {
    id: Math.random().toString(36).slice(2, 10),
    name,
    owner,
    type,
    status,
    dueDate,
    notes,
    archived,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function addHistory(data, action, fileName, details = "") {
  data.historyLog = data.historyLog || [];
  data.historyLog.push({ timestamp: new Date().toISOString(), action, fileName, details });
  if (data.historyLog.length > 50) {
    data.historyLog = data.historyLog.slice(-50);
  }
}

app.get("/api/files", (req, res) => {
  const data = loadData();
  res.json(data.trackedFiles || []);
});

app.get("/api/history", (req, res) => {
  const data = loadData();
  res.json(data.historyLog || []);
});

app.post("/api/files", (req, res) => {
  const data = loadData();
  const file = createFileEntry(req.body);
  data.trackedFiles = [file, ...(data.trackedFiles || [])];
  addHistory(data, "Added", file.name);
  saveData(data);
  res.status(201).json(file);
});

app.put("/api/files/:id", (req, res) => {
  const data = loadData();
  const file = data.trackedFiles.find(item => item.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: "File not found." });
  }
  const updates = req.body;
  Object.assign(file, updates, { updatedAt: new Date().toISOString() });
  addHistory(data, "Updated", file.name);
  saveData(data);
  res.json(file);
});

app.delete("/api/files/:id", (req, res) => {
  const data = loadData();
  const file = data.trackedFiles.find(item => item.id === req.params.id);
  if (!file) {
    return res.status(404).json({ error: "File not found." });
  }
  data.trackedFiles = data.trackedFiles.filter(item => item.id !== req.params.id);
  addHistory(data, file.archived ? "Deleted archive" : "Deleted", file.name);
  saveData(data);
  res.json({ success: true });
});

app.post("/api/import", (req, res) => {
  const payload = req.body;
  if (!Array.isArray(payload)) {
    return res.status(400).json({ error: "Import payload must be an array." });
  }
  const data = loadData();
  const imported = payload.reduce((acc, item) => {
    if (!item.name || !item.owner) return acc;
    const file = createFileEntry(item);
    acc.push(file);
    return acc;
  }, []);
  data.trackedFiles = [...imported, ...(data.trackedFiles || [])];
  imported.forEach(file => addHistory(data, "Imported", file.name, "JSON import"));
  saveData(data);
  res.status(201).json({ imported: imported.length, files: imported });
});

app.post("/api/archive", (req, res) => {
  const { ids = [], archived = true } = req.body;
  const data = loadData();
  const updated = data.trackedFiles.map(item => {
    if (ids.includes(item.id)) {
      item.archived = archived;
      item.updatedAt = new Date().toISOString();
      addHistory(data, archived ? "Archived" : "Restored", item.name);
    }
    return item;
  });
  data.trackedFiles = updated;
  saveData(data);
  res.json({ updated: ids.length });
});

app.listen(port, () => {
  console.log(`File Tracking System server running at http://localhost:${port}`);
});
