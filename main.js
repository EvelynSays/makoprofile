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


const BIN_IDS = {
  thoughts: "68eadc1cae596e708f0f0225",
  notes: "68ebc5ebd0ea881f409f233d",
  knowledge: "68ebccdd43b1c97be9643b6c"
};

const API_KEY = "$2a$10$tBoWRuKgJazbxaIkWwI3zOw.ty9yIi13TolWMkDPCofyQNFAWV7jq";

const pageName = window.location.pathname.split("/").pop().replace(".html", "") || "index";
let BIN_ID = BIN_IDS.thoughts; 

if (pageName === "notes") BIN_ID = BIN_IDS.notes;
if (pageName === "knowledgebase") BIN_ID = BIN_IDS.knowledge;

const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
let thoughts = {};

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

const notesBinId = BIN_IDS.notes; 
let notes = {};
let editingNoteId = null;

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

function renderNotes() {
  const list = document.getElementById('noteList');
  const details = document.getElementById('noteDetails');
  if (!list || !details) return;

  list.innerHTML = '';

  const sortedKeys = Object.keys(notes).sort((a, b) => b - a);

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
    showNoteDetails(sortedKeys[0]);
  }
}

function showNoteDetails(noteId) {
  const details = document.getElementById('noteDetails');
  const note = notes[noteId];
  editingNoteId = null;
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

const noteForm = document.getElementById('noteForm');
if (noteForm) {
  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const date = document.getElementById('noteDate').value;
    const title = document.getElementById('noteTitle').value.trim();
    const body = document.getElementById('noteBody').value.trim();
    if (!date || !title || !body) return;

    if (editingNoteId) {
      notes[editingNoteId] = { date, title, body };
      editingNoteId = null;
    } else {
      const id = Date.now();
      notes[id] = { date, title, body };
    }

    document.getElementById('noteDate').value = '';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteBody').value = '';

    renderNotes();
    await saveNotes();
  });

  fetchNotes();
}

const kbBinId = BIN_IDS.knowledge;
let knowledge = {};
let editingEntryId = null;

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

function navigateToConnection(connId) {
    const conn = knowledge[connId];
    if (!conn) return;
    const categoryButton = Array.from(document.querySelectorAll('#entryList .btn'))
        .find(btn => btn.textContent === conn.category);
    if (!categoryButton) return;
    const collapseId = categoryButton.getAttribute('data-bs-target').substring(1);
    showEntryDetails(connId, collapseId);
}

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

function showEntryDetails(entryId, openCategoryId = null) {
    const details = document.getElementById('entryDetails');
    const entry = knowledge[entryId];
    if (!entry) return;

    document.querySelectorAll('#entryList .collapse').forEach(c => {
        if (c.id !== openCategoryId) bootstrap.Collapse.getOrCreateInstance(c).hide();
    });

    if (openCategoryId) {
        const collapseEl = document.getElementById(openCategoryId);
        bootstrap.Collapse.getOrCreateInstance(collapseEl).show();
    }

    editingEntryId = null;

    const formattedBody = `<div class="p-2 border rounded mb-3" style="white-space: pre-wrap; background-color: #1e1e1e;">${entry.body}</div>`;

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

    document.getElementById('editEntryBtn').onclick = () => {
        editingEntryId = entryId;
        document.getElementById('entryName').value = entry.name;
        document.getElementById('entryCategory').value = entry.category;
        document.getElementById('entryBody').value = entry.body;
    };

    document.getElementById('deleteEntryBtn').onclick = async () => {
        delete knowledge[entryId];
        details.textContent = "Select an entry to view details.";
        renderKnowledge();
        await saveKnowledge();
    };

    document.querySelectorAll('#connectionsList button').forEach((btn, i) => {
        btn.onclick = async () => {
            const connId = entry.connections[i];
            entry.connections = entry.connections.filter(id => id !== connId);
            if (knowledge[connId]?.connections) {
                knowledge[connId].connections = knowledge[connId].connections.filter(id => id !== entryId);
            }
            showEntryDetails(entryId, openCategoryId);
            await saveKnowledge();
        };
    });

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

    document.getElementById('expandAllBtn').onclick = () => {
      document.querySelectorAll('#entryList .collapse').forEach(collapseEl => {
      bootstrap.Collapse.getOrCreateInstance(collapseEl).show();
    });
};


    fetchKnowledge();
}

const suits = ['ratar', 'stain', 'dominus', 'giltar'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'A'];
const suitEmojis = { 
  ratar: '❤️', 
  stain: '♠️', 
  dominus: '♣️', 
  giltar: '♦️' 
};

function getSuitDisplayName(suit) {
  const displayNames = {
    ratar: 'Ratar',
    stain: 'The Stain',
    dominus: 'Dominus',
    giltar: 'Giltar'
  };
  return displayNames[suit];
}

function capitalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

let players = [];
let playerSuits = {};
let dice = {};
let deck = [];
let gameActive = false;

const drawHistoryEl = document.getElementById('drawHistory');
const diceTableEl = document.getElementById('diceTable');
const diceTableContainer = document.getElementById('diceTableContainer');
const setupForm = document.getElementById('setupForm');
const gameControls = document.getElementById('gameControls');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const finalRollBtn = document.getElementById('finalRollBtn');

document.getElementById('gameSetupForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const namesInput = document.getElementById('playerNames').value.trim();
  let names = namesInput.split(',')
    .map(n => capitalizeName(n.trim()))
    .filter(n => n.length > 0)
    .slice(0, 4);

  if (names.length < 2) {
    alert('Please enter at least 2 player names.');
    return;
  }

  players = names;
  initGame();
  setupForm.classList.add('d-none');
  gameControls.classList.remove('d-none');
  nextRoundBtn.classList.remove('d-none');
});

function initGame() {
  const shuffledSuits = [...suits];
  shuffleArray(shuffledSuits);
  playerSuits = {};
  players.forEach((player, i) => {
    playerSuits[player] = shuffledSuits[i];
  });

  deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  shuffleArray(deck);

  dice = {};
  players.forEach(p => {
    dice[p] = { d4: 0, d6: 0, d12: 0, d20: 0 };
  });

  drawHistoryEl.innerHTML = `<p class="text-muted">Game started! ${players.length} players.</p>`;
  updateDiceTable();

  gameActive = true;
  finalRollBtn.classList.add('d-none');
}

nextRoundBtn.addEventListener('click', function() {
  if (!gameActive || deck.length < players.length) {
    drawHistoryEl.innerHTML += `<div class="mt-3 text-info">
      <strong>Deck empty! Proceeding to final rolls.</strong>
    </div>`;
    nextRoundBtn.classList.add('d-none');
    finalRollBtn.classList.remove('d-none');
    return;
  }

  drawHistoryEl.innerHTML += `<div class="mt-3"><strong>=== Next Round ===</strong></div>`;

  for (const player of players) {
    const card = deck.pop();
    const suitType = getSuitType(player, card.suit);
    const gain = applyCardEffect(player, card);

    const emoji = suitEmojis[card.suit];
    const typeEmoji = suitType === 'friendly' ? '💚' : suitType === 'enemy' ? '💔' : '💛';

    drawHistoryEl.innerHTML += `
      <div class="mt-2">
        <strong>${player}</strong> draws <strong>${card.rank} ${emoji}</strong> ${typeEmoji}<br>
        <em>→ ${suitType} ${getCardDesc(card.rank)} → ${gain}</em>
      </div>`;
  }

  updateDiceTable();
  drawHistoryEl.scrollTop = drawHistoryEl.scrollHeight;
});

document.getElementById('resetGameBtn').addEventListener('click', function() {
  diceTableContainer.classList.add('d-none');
  gameControls.classList.add('d-none');
  drawHistoryEl.innerHTML = '<p class="text-muted text-center">Game will start here...</p>';

  setupForm.classList.remove('d-none');

  nextRoundBtn.classList.add('d-none');
  finalRollBtn.classList.add('d-none');
  finalRollBtn.disabled = false;

  players = [];
  playerSuits = {};
  dice = {};
  deck = [];
  gameActive = false;
});

finalRollBtn.addEventListener('click', function() {
  let results = [];
  let maxScore = 0;

  drawHistoryEl.innerHTML += `<div class="mt-4"><strong>⚔️ FINAL ROLLS ⚔️</strong></div>`;

  players.forEach(player => {
    const d = dice[player];
    const roll4 = rollDice(d.d4, 4);
    const roll6 = rollDice(d.d6, 6);
    const roll12 = rollDice(d.d12, 12);
    const roll20 = rollDice(d.d20, 20);
    const total = roll4 + roll6 + roll12 + roll20;

    results.push({ player, total });
    if (total > maxScore) maxScore = total;

    drawHistoryEl.innerHTML += `
      <div class="mt-3">
        <strong>${player}</strong>: <strong>${total}</strong><br>
        <small>${d.d4}d4 → ${roll4} | ${d.d6}d6 → ${roll6} | ${d.d12}d12 → ${roll12} | ${d.d20}d20 → ${roll20}</small>
      </div>`;
  });

  const winners = results.filter(r => r.total === maxScore).map(r => r.player);

  drawHistoryEl.innerHTML += `<div class="mt-4 alert alert-success">
    <strong>👑 Winner${winners.length > 1 ? 's' : ''}: ${winners.join(', ')} with ${maxScore} points! 👑</strong>
  </div>`;

  finalRollBtn.disabled = true;
  gameActive = false;
  drawHistoryEl.scrollTop = drawHistoryEl.scrollHeight;
});

function getSuitType(player, suit) {
  if (playerSuits[player] === suit) return 'friendly';
  if (Object.values(playerSuits).includes(suit)) return 'enemy';
  return 'neutral';
}

function getCardDesc(rank) {
  if (rank === 'J') return 'Jack';
  if (rank === 'Q') return 'Queen';
  if (rank === 'A') return 'Ace';
  return 'number card';
}

function applyCardEffect(player, card) {
  const type = getSuitType(player, card.suit);
  let gain = '';

  if (['2','3','4','5','6','7','8','9','10'].includes(card.rank)) {
    if (type === 'neutral') { dice[player].d4 += 1; gain = '+1 d4 🛡️'; }
    else if (type === 'enemy') { dice[player].d6 += 1; gain = '+1 d6 ⚔️'; }
    else { dice[player].d12 += 1; gain = '+1 d12 🌟'; }
  } else if (card.rank === 'J') {
    if (type === 'neutral') { dice[player].d12 += 1; gain = '+1 d12 🛡️'; }
    else if (type === 'enemy') { dice[player].d20 += 1; gain = '+1 d20 ⚔️'; }
    else { dice[player].d20 += 2; gain = '+2 d20 🌟'; }
  } else if (card.rank === 'A') {
    if (type === 'neutral') { dice[player].d12 += 1; gain = '+1 d12 🛡️'; }
    else if (type === 'enemy') { dice[player].d12 += 2; gain = '+2 d12 ⚔️'; }
    else { dice[player].d12 += 4; gain = '+4 d12 🌟'; }
  } else if (card.rank === 'Q') {
    if (type === 'neutral') { dice[player].d20 += 2; gain = '+2 d20 🛡️'; }
    else if (type === 'enemy') { dice[player].d20 += 3; gain = '+3 d20 ⚔️'; }
    else { dice[player].d20 += 4; gain = '+4 d20 🌟'; }
  }

  return gain;
}

function updateDiceTable() {
  diceTableEl.innerHTML = '';
  players.forEach(player => {
    const d = dice[player];
    const totalDice = d.d4 + d.d6 + d.d12 + d.d20;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${player}</strong></td>
      <td>${getSuitDisplayName(playerSuits[player])} ${suitEmojis[playerSuits[player]]}</td>
      <td>${d.d4}</td>
      <td>${d.d6}</td>
      <td>${d.d12}</td>
      <td>${d.d20}</td>
      <td><strong>${totalDice}</strong></td>
    `;
    diceTableEl.appendChild(row);
  });
  diceTableContainer.classList.remove('d-none');
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function rollDice(count, sides) {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += Math.floor(Math.random() * sides) + 1;
  }
  return sum;
}