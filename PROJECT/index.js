const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const rememberMe = document.getElementById("rememberMe");
const loginSection = document.getElementById("loginSection");
const homeSection = document.getElementById("homeSection");
const logoutBtn = document.getElementById("logoutBtn");
const importBtn = document.getElementById("importBtn");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFileInput");
const fileForm = document.getElementById("fileForm");
const fileNameInput = document.getElementById("fileNameInput");
const fileOwnerInput = document.getElementById("fileOwnerInput");
const fileTypeInput = document.getElementById("fileTypeInput");
const fileStatusInput = document.getElementById("fileStatusInput");
const fileDueInput = document.getElementById("fileDueInput");
const fileNotesInput = document.getElementById("fileNotesInput");
const editCard = document.getElementById("editCard");
const editForm = document.getElementById("editForm");
const editIdInput = document.getElementById("editIdInput");
const editNameInput = document.getElementById("editNameInput");
const editOwnerInput = document.getElementById("editOwnerInput");
const editTypeInput = document.getElementById("editTypeInput");
const editStatusInput = document.getElementById("editStatusInput");
const editDueInput = document.getElementById("editDueInput");
const editNotesInput = document.getElementById("editNotesInput");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const sortSelect = document.getElementById("sortSelect");
const fileTableBody = document.getElementById("fileTableBody");
const archivedTableBody = document.getElementById("archivedTableBody");
const totalFiles = document.getElementById("totalFiles");
const pendingFiles = document.getElementById("pendingFiles");
const inReviewFiles = document.getElementById("inReviewFiles");
const completedFiles = document.getElementById("completedFiles");
const archivedFilesCount = document.getElementById("archivedFiles");
const archiveCount = document.getElementById("archiveCount");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
const selectedCount = document.getElementById("selectedCount");
const archiveSelectedBtn = document.getElementById("archiveSelectedBtn");
const completeSelectedBtn = document.getElementById("completeSelectedBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const historyList = document.getElementById("historyList");

const AUTH_USER = "admin";
const AUTH_PASS = "1234";
const STORAGE_KEY = "fileTrackerData";
const USE_BACKEND = false;
const API_BASE = "/api";

let trackedFiles = [];
let historyLog = [];
let selectedIds = new Set();

function getStoredData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Invalid stored data:", error);
    return null;
  }
}

function saveData() {
  if (USE_BACKEND) return;
  const data = { trackedFiles, historyLog };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function isUserLoggedIn() {
  return localStorage.getItem("fileTrackerLoggedIn") === "true" || sessionStorage.getItem("fileTrackerLoggedIn") === "true";
}

function setLoginState(remember) {
  sessionStorage.setItem("fileTrackerLoggedIn", "true");
  if (remember) {
    localStorage.setItem("fileTrackerLoggedIn", "true");
    localStorage.setItem("fileTrackerRemember", "true");
  } else {
    localStorage.removeItem("fileTrackerRemember");
  }
}

function clearLoginState() {
  sessionStorage.removeItem("fileTrackerLoggedIn");
  localStorage.removeItem("fileTrackerLoggedIn");
  localStorage.removeItem("fileTrackerRemember");
}

function createFileEntry(name, owner, type, status, dueDate = "", notes = "", archived = false) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name,
    owner,
    type,
    status,
    dueDate,
    notes,
    archived,
    createdAt: now,
    updatedAt: now,
  };
}

function initializeApp() {
  loadInitialData();

  if (isUserLoggedIn()) {
    showHomePage();
  }

  if (localStorage.getItem("fileTrackerRemember") === "true") {
    rememberMe.checked = true;
  }
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === AUTH_USER && password === AUTH_PASS) {
    setLoginState(rememberMe.checked);
    showHomePage();
  } else {
    alert("Invalid username or password. Use admin / 1234.");
  }
});

logoutBtn.addEventListener("click", () => {
  clearLoginState();
  loginSection.classList.remove("hidden");
  homeSection.classList.add("hidden");
  loginForm.reset();
  editCard.classList.add("hidden");
  selectedIds.clear();
  renderFileTable();
  renderArchivedTable();
  updateSelectionSummary();
});

fileForm.addEventListener("submit", event => {
  event.preventDefault();
  addFileEntry();
});

editForm.addEventListener("submit", event => {
  event.preventDefault();
  updateFileEntry();
});

cancelEditBtn.addEventListener("click", () => {
  editCard.classList.add("hidden");
  editForm.reset();
});

searchInput.addEventListener("input", renderFileTable);
statusFilter.addEventListener("change", renderFileTable);
sortSelect.addEventListener("change", renderFileTable);
selectAllCheckbox.addEventListener("change", toggleSelectAllRows);
archiveSelectedBtn.addEventListener("click", archiveSelectedFiles);
completeSelectedBtn.addEventListener("click", completeSelectedFiles);
deleteSelectedBtn.addEventListener("click", deleteSelectedFiles);
exportBtn.addEventListener("click", exportToJson);
importBtn.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", importFileFromInput);

function loadInitialData() {
  if (USE_BACKEND) {
    loadFromBackend();
    return;
  }

  const stored = getStoredData();
  if (stored && Array.isArray(stored.trackedFiles)) {
    trackedFiles = stored.trackedFiles;
    historyLog = Array.isArray(stored.historyLog) ? stored.historyLog : [];
  } else {
    trackedFiles = [
      createFileEntry("Project Brief.docx", "Mia Chen", "Document", "Pending", "2026-06-01", "Approve budget details."),
      createFileEntry("Expense Report.xlsx", "Noah Clark", "Spreadsheet", "In Review", "2026-06-05", "Review expense tracking."),
      createFileEntry("Release Notes.pdf", "Ava Patel", "Document", "Completed", "2026-05-15", "Finalize release notes."),
    ];
    historyLog = [];
    saveData();
  }
}

async function loadFromBackend() {
  try {
    const response = await fetch(`${API_BASE}/files`);
    const data = await response.json();
    trackedFiles = Array.isArray(data) ? data : [];
    const historyResponse = await fetch(`${API_BASE}/history`);
    const historyData = await historyResponse.json();
    historyLog = Array.isArray(historyData) ? historyData : [];
    renderFileTable();
    renderArchivedTable();
    renderHistory();
    updateStats();
  } catch (error) {
    console.error("Could not load data from backend:", error);
  }
}

function showHomePage() {
  loginSection.classList.add("hidden");
  homeSection.classList.remove("hidden");
  renderFileTable();
  renderArchivedTable();
  renderHistory();
  updateStats();
}

function addFileEntry() {
  const name = fileNameInput.value.trim();
  const owner = fileOwnerInput.value.trim();
  const type = fileTypeInput.value;
  const status = fileStatusInput.value;
  const dueDate = fileDueInput.value;
  const notes = fileNotesInput.value.trim();

  if (!name || !owner) {
    alert("Please provide both file name and owner.");
    return;
  }

  const file = createFileEntry(name, owner, type, status, dueDate, notes);
  trackedFiles.unshift(file);
  saveData();
  trackHistory("Added", file);
  fileForm.reset();
  renderFileTable();
  updateStats();
}

function prepareEditForm(file) {
  editIdInput.value = file.id;
  editNameInput.value = file.name;
  editOwnerInput.value = file.owner;
  editTypeInput.value = file.type;
  editStatusInput.value = file.status;
  editDueInput.value = file.dueDate;
  editNotesInput.value = file.notes;
  editCard.classList.remove("hidden");
  editNameInput.focus();
}

function updateFileEntry() {
  const id = editIdInput.value;
  const file = trackedFiles.find(item => item.id === id);
  if (!file) return;

  file.name = editNameInput.value.trim() || file.name;
  file.owner = editOwnerInput.value.trim() || file.owner;
  file.type = editTypeInput.value;
  file.status = editStatusInput.value;
  file.dueDate = editDueInput.value;
  file.notes = editNotesInput.value.trim();
  file.updatedAt = new Date().toISOString();

  saveData();
  trackHistory("Updated", file);
  renderFileTable();
  renderArchivedTable();
  updateStats();
  editForm.reset();
  editCard.classList.add("hidden");
}

function renderFileTable() {
  const query = searchInput.value.trim().toLowerCase();
  const filterStatus = statusFilter.value;
  const sortBy = sortSelect.value;

  const rows = trackedFiles
    .filter(file => !file.archived)
    .filter(file => {
      const content = `${file.name} ${file.owner} ${file.type} ${file.notes}`.toLowerCase();
      const matchesQuery = content.includes(query);
      const matchesStatus = filterStatus === "All" || file.status === filterStatus;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => compareFiles(a, b, sortBy))
    .map(file => {
      const dueLabel = file.dueDate ? formatDate(file.dueDate) : "TBD";
      const checked = selectedIds.has(file.id) ? "checked" : "";

      return `
        <tr>
          <td><input type="checkbox" class="row-checkbox" data-id="${file.id}" ${checked} onchange="toggleRowSelection(event)" /></td>
          <td>
            <strong>${escapeHtml(file.name)}</strong>
            <div class="row-meta">${escapeHtml(file.notes || "No notes")}</div>
          </td>
          <td>${escapeHtml(file.type)}</td>
          <td>${escapeHtml(file.owner)}</td>
          <td><span class="status-chip status-${file.status.replace(/\s/g, "\\ ")}">${escapeHtml(file.status)}</span></td>
          <td>${dueLabel}</td>
          <td>
            <button class="action-btn details" type="button" onclick="showFileDetails('${file.id}')">Details</button>
            <button class="action-btn edit" type="button" onclick="editFile('${file.id}')">Edit</button>
            <button class="action-btn delete" type="button" onclick="deleteFile('${file.id}')">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  fileTableBody.innerHTML = rows || "<tr><td colspan='7'>No files match your search or filter.</td></tr>";
  updateSelectionSummary();
  updateSelectAllCheckbox();
}

function renderArchivedTable() {
  const rows = trackedFiles
    .filter(file => file.archived)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(file => {
      return `
        <tr>
          <td>
            <strong>${escapeHtml(file.name)}</strong>
            <div class="row-meta">${escapeHtml(file.notes || "No notes")}</div>
          </td>
          <td>${escapeHtml(file.owner)}</td>
          <td><span class="status-chip status-${file.status.replace(/\s/g, "\\ ")}">${escapeHtml(file.status)}</span></td>
          <td>
            <button class="action-btn edit" type="button" onclick="restoreFile('${file.id}')">Restore</button>
            <button class="action-btn delete" type="button" onclick="deleteArchivedFile('${file.id}')">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");

  archivedTableBody.innerHTML = rows || "<tr><td colspan='4'>No archived files yet.</td></tr>";
  archiveCount.textContent = trackedFiles.filter(file => file.archived).length;
}

function renderHistory() {
  const rows = historyLog
    .slice(-10)
    .reverse()
    .map(entry => {
      return `<li>${formatDate(entry.timestamp)} – <strong>${escapeHtml(entry.action)}</strong> ${escapeHtml(entry.fileName)}${entry.details ? ` (${escapeHtml(entry.details)})` : ""}</li>`;
    })
    .join("");

  historyList.innerHTML = rows || "<li>No activity recorded yet.</li>";
}

function compareFiles(a, b, sortBy) {
  if (sortBy === "name") {
    return a.name.localeCompare(b.name);
  }
  if (sortBy === "owner") {
    return a.owner.localeCompare(b.owner);
  }
  if (sortBy === "status") {
    return a.status.localeCompare(b.status);
  }
  if (sortBy === "dueDate") {
    return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
  }
  if (sortBy === "oldest") {
    return new Date(a.createdAt) - new Date(b.createdAt);
  }
  return new Date(b.createdAt) - new Date(a.createdAt);
}

function updateStats() {
  totalFiles.textContent = trackedFiles.filter(file => !file.archived).length;
  pendingFiles.textContent = trackedFiles.filter(file => !file.archived && file.status === "Pending").length;
  inReviewFiles.textContent = trackedFiles.filter(file => !file.archived && file.status === "In Review").length;
  completedFiles.textContent = trackedFiles.filter(file => !file.archived && file.status === "Completed").length;
  archivedFilesCount.textContent = trackedFiles.filter(file => file.archived).length;
}

function toggleRowSelection(event) {
  const id = event.target.dataset.id;
  if (!id) return;

  if (event.target.checked) {
    selectedIds.add(id);
  } else {
    selectedIds.delete(id);
  }
  updateSelectionSummary();
  updateSelectAllCheckbox();
}

function toggleSelectAllRows() {
  const checkboxes = fileTableBody.querySelectorAll(".row-checkbox");
  const shouldSelect = selectAllCheckbox.checked;

  checkboxes.forEach(input => {
    const id = input.dataset.id;
    input.checked = shouldSelect;
    if (shouldSelect) {
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
  });
  updateSelectionSummary();
}

function updateSelectionSummary() {
  selectedCount.textContent = selectedIds.size;
}

function archiveSelectedFiles() {
  if (selectedIds.size === 0) {
    alert("Select at least one file to archive.");
    return;
  }

  trackedFiles.forEach(file => {
    if (selectedIds.has(file.id) && !file.archived) {
      file.archived = true;
      file.updatedAt = new Date().toISOString();
      trackHistory("Archived", file);
    }
  });

  selectedIds.clear();
  saveData();
  renderFileTable();
  renderArchivedTable();
  updateStats();
}

function completeSelectedFiles() {
  if (selectedIds.size === 0) {
    alert("Select at least one file to mark completed.");
    return;
  }

  trackedFiles.forEach(file => {
    if (selectedIds.has(file.id) && !file.archived) {
      file.status = "Completed";
      file.updatedAt = new Date().toISOString();
      trackHistory("Completed", file);
    }
  });
  saveData();
  renderFileTable();
  updateStats();
}

function deleteSelectedFiles() {
  if (selectedIds.size === 0) {
    alert("Select at least one file to delete.");
    return;
  }

  if (!confirm("Delete selected files permanently?")) return;
  trackedFiles = trackedFiles.filter(file => {
    if (selectedIds.has(file.id)) {
      trackHistory("Deleted", file);
      return false;
    }
    return true;
  });
  selectedIds.clear();
  saveData();
  renderFileTable();
  renderArchivedTable();
  updateStats();
}

function showFileDetails(id) {
  const file = trackedFiles.find(item => item.id === id);
  if (!file) return;

  const details = [
    `Name: ${file.name}`,
    `Owner: ${file.owner}`,
    `Type: ${file.type}`,
    `Status: ${file.status}`,
    `Due date: ${file.dueDate ? formatDate(file.dueDate) : "TBD"}`,
    `Notes: ${file.notes || "None"}`,
    `Archived: ${file.archived ? "Yes" : "No"}`,
    `Created: ${formatDate(file.createdAt)}`,
    `Updated: ${formatDate(file.updatedAt)}`,
  ].join("\n");

  alert(details);
}

function editFile(id) {
  const file = trackedFiles.find(item => item.id === id);
  if (!file) return;
  prepareEditForm(file);
}

function deleteFile(id) {
  if (!confirm("Remove this file from tracking?")) return;
  const file = trackedFiles.find(item => item.id === id);
  trackedFiles = trackedFiles.filter(item => item.id !== id);
  if (file) {
    trackHistory("Deleted", file);
  }
  selectedIds.delete(id);
  saveData();
  renderFileTable();
  renderArchivedTable();
  updateStats();
}

function restoreFile(id) {
  const file = trackedFiles.find(item => item.id === id);
  if (!file) return;
  file.archived = false;
  file.updatedAt = new Date().toISOString();
  trackHistory("Restored", file);
  saveData();
  renderFileTable();
  renderArchivedTable();
  updateStats();
}

function deleteArchivedFile(id) {
  if (!confirm("Permanently delete this archived file?")) return;
  const file = trackedFiles.find(item => item.id === id);
  trackedFiles = trackedFiles.filter(item => item.id !== id);
  if (file) {
    trackHistory("Deleted archive", file);
  }
  saveData();
  renderArchivedTable();
  updateStats();
}

function importFileFromInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = JSON.parse(reader.result);
      importJsonData(json);
    } catch (error) {
      alert("Invalid JSON file.");
    }
    importFileInput.value = "";
  };
  reader.readAsText(file);
}

function importJsonData(json) {
  if (!Array.isArray(json)) {
    alert("Import file must be an array of file records.");
    return;
  }

  const imported = json.reduce((acc, item) => {
    if (!item.name || !item.owner) return acc;
    const file = createFileEntry(
      item.name,
      item.owner,
      item.type || "Document",
      item.status || "Pending",
      item.dueDate || "",
      item.notes || "",
      Boolean(item.archived)
    );
    acc.push(file);
    return acc;
  }, []);

  if (imported.length === 0) {
    alert("No valid file records were found in the import.");
    return;
  }

  trackedFiles = [...imported, ...trackedFiles];
  saveData();
  imported.forEach(file => trackHistory("Imported", file, "JSON import"));
  renderFileTable();
  renderArchivedTable();
  renderHistory();
  updateStats();
  alert(`${imported.length} file(s) imported successfully.`);
}

function exportToJson() {
  const data = JSON.stringify({ trackedFiles, historyLog }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `file-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function trackHistory(action, file, details = "") {
  historyLog.push({ timestamp: new Date().toISOString(), action, fileName: file.name, fileId: file.id, details });
  if (historyLog.length > 50) {
    historyLog = historyLog.slice(-50);
  }
  saveData();
  renderHistory();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

window.toggleRowSelection = toggleRowSelection;
window.showFileDetails = showFileDetails;
window.editFile = editFile;
window.deleteFile = deleteFile;
window.restoreFile = restoreFile;
window.deleteArchivedFile = deleteArchivedFile;

initializeApp();
