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
  notes: "YOUR_NOTES_BIN_ID_HERE",          // Notes Bin
  knowledge: "YOUR_KNOWLEDGE_BIN_ID_HERE"   // Knowledgebase Bin
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
