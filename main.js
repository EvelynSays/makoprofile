// ===== Navbar Active Highlight =====
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop();
  document.querySelectorAll(".navbar-nav .nav-link").forEach(link => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    } else {
      link.classList.remove("active");
      link.removeAttribute("aria-current");
    }
  });
});

// ===== JSONBin Setup =====
const BIN_IDS = {
  thoughts: "68eadc1cae596e708f0f0225",     // Thoughts Bin (index.html)
  notes: "68ebc5ebd0ea881f409f233d",          // Notes Bin
  knowledge: "68ebccdd43b1c97be9643b6c"   // Knowledgebase Bin
};

const API_KEY = "$2a$10$tBoWRuKgJazbxaIkWwI3zOw.ty9yIi13TolWMkDPCofyQNFAWV7jq";

// Determine page + correct BIN
const pageName = window.location.pathname.split("/").pop().replace(".html", "") || "index";
let BIN_ID = BIN_IDS.thoughts; // default

if (pageName === "notes") BIN_ID = BIN_IDS.notes;
if (pageName === "knowledgebase") BIN_ID = BIN_IDS.knowledge;

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
let thoughts = {};

// ===== Thoughts / Notes / Knowledge Logic =====
async function fetchThoughts() {
  try {
    const res = await fetch(BIN_URL + "/latest", { headers: { "X-Master-Key": API_KEY } });
    const data = await res.json();
    thoughts = data.record.thoughts || {};
    renderThoughts();
  } catch (err) {
    console.error(err);
  }
}

async function saveThoughts() {
  try {
    await fetch(BIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ thoughts })
    });
  } catch (err) {
    console.error(err);
  }
}

function renderThoughts() {
  const container = document.getElementById('thoughtList');
  if (!container) return;
  container.innerHTML = '';

  for (const [name, entries] of Object.entries(thoughts)) {
    const personDiv = document.createElement('div');
    personDiv.classList.add('person-box');

    const nameHeader = document.createElement('h5');
    nameHeader.textContent = name;
    nameHeader.classList.add('text-info');
    personDiv.appendChild(nameHeader);

    entries.forEach((entry, index) => {
      const entryDiv = document.createElement('div');
      entryDiv.classList.add('d-flex', 'justify-content-between', 'align-items-start', 'thought-box', 'p-2', 'rounded', 'mb-2', 'flex-column');

      const textSpan = document.createElement('span');
      textSpan.textContent = entry;
      entryDiv.appendChild(textSpan);

      const delBtn = document.createElement('button');
      delBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'mt-2');
      delBtn.textContent = '×';
      delBtn.onclick = async () => {
        thoughts[name].splice(index, 1);
        if (thoughts[name].length === 0) delete thoughts[name];
        renderThoughts();
        await saveThoughts();
      };
      entryDiv.appendChild(delBtn);

      personDiv.appendChild(entryDiv);
    });

    container.appendChild(personDiv);
  }
}

const form = document.getElementById('thoughtForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('personName').value.trim();
    const thought = document.getElementById('personThought').value.trim();
    if (!name || !thought) return;
    if (!thoughts[name]) thoughts[name] = [];
    thoughts[name].push(thought);
    document.getElementById('personName').value = '';
    document.getElementById('personThought').value = '';
    renderThoughts();
    await saveThoughts();
  });

  fetchThoughts();
}

// Notes Bin
const notesBinId = BIN_IDS.notes; // make sure this exists in BIN_IDS
let notes = {};
let editingNoteId = null;

// Fetch notes from JSONBin
async function fetchNotes() {
  if (!notesBinId) return;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${notesBinId}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    notes = data.record.notes || {};
    renderNotes();
  } catch (err) {
    console.error(err);
  }
}

// Save notes
async function saveNotes() {
  if (!notesBinId) return;
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${notesBinId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify({ notes })
    });
  } catch (err) {
    console.error(err);
  }
}

// Render notes list (left panel)
function renderNotes() {
  const list = document.getElementById('noteList');
  const details = document.getElementById('noteDetails');
  if (!list || !details) return;

  list.innerHTML = '';

  const sortedKeys = Object.keys(notes).sort((a, b) => b - a); // most recent first

  sortedKeys.forEach(key => {
    const note = notes[key];

    const li = document.createElement('li');
    li.classList.add('list-group-item');
    const weeksAgo = Math.floor((new Date() - new Date(note.date)) / (1000*60*60*24*7));
    li.textContent = `${weeksAgo} weeks ago — ${note.title}`;
    li.style.cursor = 'pointer';
    li.onclick = () => showNoteDetails(key);

    list.appendChild(li);
  });

  if (sortedKeys.length === 0) {
    details.textContent = "No notes yet.";
  } else if (!editingNoteId && sortedKeys.length > 0) {
    // Show most recent note by default
    showNoteDetails(sortedKeys[0]);
  }
}

// Show note details in right panel with Edit/Delete buttons
function showNoteDetails(noteId) {
  const details = document.getElementById('noteDetails');
  const note = notes[noteId];
  editingNoteId = null; // reset editing mode when selecting
  details.innerHTML = `
    <h5>${note.title}</h5>
    <small>${note.date}</small>
    <p>${note.body}</p>
    <div class="mt-2">
      <button id="editNoteBtn" class="btn btn-sm btn-warning me-2">Edit</button>
      <button id="deleteNoteBtn" class="btn btn-sm btn-danger">Delete</button>
    </div>
  `;

  document.getElementById('editNoteBtn').onclick = () => {
    editingNoteId = noteId;
    document.getElementById('noteDate').value = note.date;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteBody').value = note.body;
  };

  document.getElementById('deleteNoteBtn').onclick = async () => {
    delete notes[noteId];
    renderNotes();
    details.textContent = "Select a note to view details.";
    await saveNotes();
  };
}

// Add/Edit note form
const noteForm = document.getElementById('noteForm');
if (noteForm) {
  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('noteDate').value;
    const title = document.getElementById('noteTitle').value.trim();
    const body = document.getElementById('noteBody').value.trim();
    if (!date || !title || !body) return;

    if (editingNoteId) {
      // Update existing note
      notes[editingNoteId] = { date, title, body };
      editingNoteId = null;
    } else {
      // Add new note
      const id = Date.now();
      notes[id] = { date, title, body };
    }

    // Clear form
    document.getElementById('noteDate').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteBody').value = '';

    renderNotes();
    await saveNotes();
  });

  fetchNotes();
}

// ------------------------
// Knowledgebase Section
// ------------------------
const kbBinId = BIN_IDS.knowledge;
let knowledge = {};
let editingEntryId = null;

// Fetch knowledge
async function fetchKnowledge() {
    if (!kbBinId) return;
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${kbBinId}/latest`, {
            headers: { "X-Master-Key": API_KEY }
        });
        const data = await res.json();
        knowledge = data.record.knowledge || {};
        renderKnowledge();
    } catch (err) {
        console.error(err);
    }
}

// Save knowledge
async function saveKnowledge() {
    if (!kbBinId) return;
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${kbBinId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
            body: JSON.stringify({ knowledge })
        });
    } catch (err) {
        console.error(err);
    }
}

// Navigate to connection
function navigateToConnection(connId) {
    const conn = knowledge[connId];
    if (!conn) return;
    const categoryButton = Array.from(document.querySelectorAll('#entryList .btn'))
        .find(btn => btn.textContent === conn.category);
    if (!categoryButton) return;
    const collapseId = categoryButton.getAttribute('data-bs-target').substring(1);
    showEntryDetails(connId, collapseId);
}

// Render categories and entries
function renderKnowledge() {
    const listContainer = document.getElementById('entryList');
    const details = document.getElementById('entryDetails');
    if (!listContainer || !details) return;

    listContainer.innerHTML = '';

    const categoriesMap = {};
    Object.entries(knowledge).forEach(([id, entry]) => {
        if (!categoriesMap[entry.category]) categoriesMap[entry.category] = [];
        categoriesMap[entry.category].push({ ...entry, id });
    });

    const sortedCategories = Object.keys(categoriesMap).sort();

    sortedCategories.forEach((cat, idx) => {
        const collapseId = `catCollapse${idx}`;
        const catDiv = document.createElement('div');
        catDiv.classList.add('mb-2');

        const header = document.createElement('button');
        header.classList.add('btn', 'btn-secondary', 'w-100', 'text-start');
        header.setAttribute('data-bs-toggle', 'collapse');
        header.setAttribute('data-bs-target', `#${collapseId}`);
        header.setAttribute('aria-expanded', 'false');
        header.textContent = cat;

        const collapseDiv = document.createElement('div');
        collapseDiv.classList.add('collapse', 'mt-1');
        collapseDiv.id = collapseId;

        const ul = document.createElement('ul');
        ul.classList.add('list-group');

        categoriesMap[cat].sort((a, b) => a.name.localeCompare(b.name)).forEach(entry => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'text-end');
            li.style.width = '90%';
            li.style.cursor = 'pointer';
            li.textContent = entry.name;
            li.onclick = () => showEntryDetails(entry.id, collapseId);
            ul.appendChild(li);
        });

        collapseDiv.appendChild(ul);
        catDiv.appendChild(header);
        catDiv.appendChild(collapseDiv);
        listContainer.appendChild(catDiv);
    });

    if (Object.keys(knowledge).length === 0) {
        details.textContent = "No entries yet.";
    }
}

// Show entry details with connections and delete
function showEntryDetails(entryId, openCategoryId = null) {
    const details = document.getElementById('entryDetails');
    const entry = knowledge[entryId];
    if (!entry) return;

    // Collapse other categories
    document.querySelectorAll('#entryList .collapse').forEach(c => {
        if (c.id !== openCategoryId) bootstrap.Collapse.getOrCreateInstance(c).hide();
    });

    // Open this category
    if (openCategoryId) {
        const collapseEl = document.getElementById(openCategoryId);
        bootstrap.Collapse.getOrCreateInstance(collapseEl).show();
    }

    editingEntryId = null;

    const formattedBody = `<div class="p-2 border rounded mb-3" style="white-space: pre-wrap; background-color: #1e1e1e;">${entry.body}</div>`;

    // Build connections display with delete buttons
    let connectionsHTML = '';
    if (entry.connections && entry.connections.length) {
        connectionsHTML = '<h6>Connections:</h6><ul class="list-group">';
        entry.connections.forEach(connId => {
            const conn = knowledge[connId];
            if (!conn) return;
            connectionsHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center" style="cursor: default;">
                <span class="connection-link" onclick="navigateToConnection('${connId}')">
                    ${conn.name} (${conn.category})
                </span>
                <button class="btn btn-sm btn-danger" onclick="removeConnection('${entryId}', '${connId}')">×</button>
            </li>`;

        });
        connectionsHTML += '</ul>';
    }

    details.innerHTML = `
        <h5>${entry.name}</h5>
        <small>Category: ${entry.category}</small>
        ${formattedBody}
        <div class="mt-3">
            <button id="editEntryBtn" class="btn btn-warning btn-sm me-2">Edit</button>
            <button id="deleteEntryBtn" class="btn btn-danger btn-sm me-2">Delete</button>
            <button id="addConnBtn" class="btn btn-secondary btn-sm">Add Connection</button>
        </div>
        <div class="mt-3" id="connectionsList">${connectionsHTML}</div>
    `;

    // Edit entry
    document.getElementById('editEntryBtn').onclick = () => {
        editingEntryId = entryId;
        document.getElementById('entryName').value = entry.name;
        document.getElementById('entryCategory').value = entry.category;
        document.getElementById('entryBody').value = entry.body;
    };

    // Delete entry
    document.getElementById('deleteEntryBtn').onclick = async () => {
        delete knowledge[entryId];
        details.textContent = "Select an entry to view details.";
        renderKnowledge();
        await saveKnowledge();
    };

    // Delete individual connection
    document.querySelectorAll('#connectionsList button').forEach((btn, i) => {
        btn.onclick = async () => {
            const connId = entry.connections[i];
            // Remove both directions
            entry.connections = entry.connections.filter(id => id !== connId);
            if (knowledge[connId]?.connections) {
                knowledge[connId].connections = knowledge[connId].connections.filter(id => id !== entryId);
            }
            showEntryDetails(entryId, openCategoryId);
            await saveKnowledge();
        };
    });

    // Add connection dropdown
    document.getElementById('addConnBtn').onclick = () => {
        const detailsDiv = document.getElementById('entryDetails');
        const existing = document.getElementById('connSelectDiv');
        if (existing) existing.remove();

        const dropdownHTML = `
            <div id="connSelectDiv" class="mt-2 d-flex gap-2">
                <select id="connSelect" class="form-select form-select-sm">
                    <option value="">-- Select Entry --</option>
                    ${Object.entries(knowledge)
                        .filter(([id]) => id !== entryId)
                        .map(([id, e]) => `<option value="${id}">${e.name} (${e.category})</option>`).join('')}
                </select>
                <button id="connAddBtn" class="btn btn-primary btn-sm">Add</button>
            </div>`;
        detailsDiv.insertAdjacentHTML('beforeend', dropdownHTML);

        document.getElementById('connAddBtn').onclick = async () => {
            const selectedId = document.getElementById('connSelect').value;
            if (!selectedId) return;
            if (!entry.connections) entry.connections = [];
            if (!knowledge[selectedId].connections) knowledge[selectedId].connections = [];

            if (!entry.connections.includes(selectedId)) entry.connections.push(selectedId);
            if (!knowledge[selectedId].connections.includes(entryId)) knowledge[selectedId].connections.push(entryId);

            document.getElementById('connSelectDiv').remove();
            renderKnowledge();
            showEntryDetails(entryId, openCategoryId);
            await saveKnowledge();
        };
    };
}

// Handle add/edit form submission
const entryForm = document.getElementById('entryForm');
if (entryForm) {
    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('entryName').value.trim();
        const category = document.getElementById('entryCategory').value.trim();
        const body = document.getElementById('entryBody').value.trim();
        if (!name || !category || !body) return;

        if (editingEntryId) {
            knowledge[editingEntryId] = { ...knowledge[editingEntryId], name, category, body };
            editingEntryId = null;
        } else {
            const id = Date.now();
            knowledge[id] = { name, category, body, connections: [] };
        }

        document.getElementById('entryName').value = '';
        document.getElementById('entryCategory').value = '';
        document.getElementById('entryBody').value = '';

        renderKnowledge();
        await saveKnowledge();
    });

    fetchKnowledge();
}
