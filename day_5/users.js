// ---------- Select elements ----------
const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusEl = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

const API_URL = "https://jsonplaceholder.typicode.com/users";

// All loaded users are stored here, so filtering needs no new request
let users = [];

// ---------- Draw any array of users ----------
function renderUsers(list) {
  usersList.textContent = ""; // empty the list first

  // Only show "no match" if users have been loaded
  if (list.length === 0 && users.length > 0) {
    const li = document.createElement("li");
    li.textContent = "No users match your filter.";
    usersList.appendChild(li);
    return;
  }

  list.forEach(function (user) {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("div");
    email.textContent = "Email: " + user.email;

    const city = document.createElement("div");
    city.textContent = "City: " + user.address.city;

    const company = document.createElement("div");
    company.textContent = "Company: " + user.company.name;

    li.appendChild(name);
    li.appendChild(email);
    li.appendChild(city);
    li.appendChild(company);
    usersList.appendChild(li);
  });
}

// ---------- Fetch users from the API ----------
async function loadUsers() {
  statusEl.textContent = "Loading users...";
  loadBtn.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    users = await response.json();
    filterInput.value = "";
    renderUsers(users);
    statusEl.textContent = "Loaded " + users.length + " users.";
  } catch (error) {
    statusEl.textContent = "Error: could not load users. " + error.message;
  } finally {
    loadBtn.disabled = false; // runs whether it worked or failed
  }
}

// ---------- Filter the stored array (no new request) ----------
function filterUsers() {
  const term = filterInput.value.trim().toLowerCase();

  const matches = users.filter(function (user) {
    return user.name.toLowerCase().includes(term);
  });

  renderUsers(matches);
}

// ---------- Events ----------
loadBtn.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);