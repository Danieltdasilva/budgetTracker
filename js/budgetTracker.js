const API_URL = "http://localhost:5000";

export default class BudgetTracker {
  constructor(querySelectorString) {
    this.root = document.querySelector(querySelectorString);
    this.root.innerHTML = BudgetTracker.html();

    // 🔒 Redirect to login if no token exists
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    // ✅ Decode token and show email in the existing welcome-message div
    const decoded = jwt_decode(token);
    const email = decoded.email || "User";
    const welcomeEl = this.root.querySelector(".welcome-message");
    if (welcomeEl) {
      welcomeEl.textContent = `Welcome, ${email}`;
    }

    this.root.querySelector(".add-entry").addEventListener("click", () => {
      this.onAddEntryBtnClick();
    });

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "login.html";
      });
    }

    this.load();
    this.initChart();
  }

  static html() {
    return `
      <div class="header-bar">
        <h1 class="main-title">Budgeting App</h1>
        <div class="header-right">
          <div class="welcome-message"></div>
          <button id="logout-btn">Logout</button>
        </div>
      </div>

      <div class="transaction-form">
        <input type="date" class="input-date">
        <input type="text" class="input-description" placeholder="Enter description (bills, groceries, etc.)">
        <select class="input-type">
            <option value="income">Income</option> 
            <option value="expense">Expense</option> 
        </select>
        <input type="number" class="input-amount" placeholder="0">
        <select class="input-category">
          <option value="General">General</option>
          <option value="Food">Food</option>
          <option value="Transportation">Transportation</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Health">Health</option>
          <option value="Utilities">Utilities</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
        <button type="button" class="add-entry">Add</button>
      </div>
      
      <div class="layout">
        <div class="left-panel">
          <ul class="entries"></ul>
          <div class="summary">
              <strong>Total: </strong>
              <span class="total">$0.00</span>
          </div>
        </div>

        <div class="right-panel">
          <h2>Overview</h2>
          <canvas id="summaryChart"></canvas>
        </div>
      </div>
    `;
  }

  static entryHtml(entry) {
    return `
      <li class="entry ${entry.type}" data-id="${entry._id}">
        <span class="entry-date">${entry.date}</span>
        <span class="entry-description">${entry.description}</span>
        <span class="entry-type">${entry.type}</span>
        <span class="entry-category">${entry.category || "General"}</span>
        <span class="entry-amount">$${Number(entry.amount).toFixed(2)}</span>
        <div class="row-actions">
          <button type="button" class="edit-entry">Edit</button>
          <button type="button" class="delete-entry" aria-label="Delete">✖</button>
        </div>
      </li>
    `;
  }

  // --- API Calls ---
  async load() {
    const res = await fetch(`${API_URL}/entries`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
    const entries = await res.json();

    this.root.querySelector(".entries").innerHTML = "";

    for (const entry of entries) {
      this.addEntry(entry);
    }

    this.updateSummary();
  }

  async addEntryToBackend(entry) {
    const res = await fetch(`${API_URL}/entries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(entry)
    });
    return await res.json();
  }

  async deleteEntryFromBackend(id) {
    await fetch(`${API_URL}/entries/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });
  }

  // --- UI Logic ---
  addEntry(entry) {
    this.root.querySelector(".entries").insertAdjacentHTML(
      "beforeend",
      BudgetTracker.entryHtml(entry)
    );

    const row = this.root.querySelector(".entries li:last-of-type");

    row.querySelector(".delete-entry").addEventListener("click", e => {
      this.onDeleteEntryBtnClick(e);
    });

    row.querySelector(".edit-entry").addEventListener("click", (e) => {
      this.onEditEntryBtnClick(e);
    });

    this.updateSummary();
  }

  getEntryRows() {
    return Array.from(this.root.querySelectorAll(".entries li"));
  }

  async onAddEntryBtnClick() {
    const date = this.root.querySelector(".input-date").value || new Date().toISOString().split("T")[0];
    const description = this.root.querySelector(".input-description").value;
    const type = this.root.querySelector(".input-type").value;
    const amount = parseFloat(this.root.querySelector(".input-amount").value) || 0;
    const category = this.root.querySelector(".input-category").value || "General";

    if (!description.trim() || !amount) return;

    const entry = { date, description, type, amount, category };

    const savedEntry = await this.addEntryToBackend(entry);
    this.addEntry(savedEntry);

    this.root.querySelector(".input-description").value = "";
    this.root.querySelector(".input-amount").value = "";
  }

  async onDeleteEntryBtnClick(e) {
    const row = e.target.closest("li");
    const id = row.dataset.id;

    await this.deleteEntryFromBackend(id);

    row.remove();
    this.updateSummary();
  }

  updateSummary() {
    const total = this.getEntryRows().reduce((total, row) => {
      const amount = parseFloat(row.querySelector(".entry-amount").textContent.replace("$", ""));
      const isExpense = row.classList.contains("expense");
      return total + (isExpense ? -amount : amount);
    }, 0);

    const totalFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total);

    this.root.querySelector(".total").textContent = totalFormatted;
    if (this.chart) {
      const income = this.getEntryRows()
        .filter(row => row.classList.contains("income"))
        .reduce((sum, row) => sum + parseFloat(row.querySelector(".entry-amount").textContent.replace("$", "")), 0);

      const expenses = this.getEntryRows()
        .filter(row => row.classList.contains("expense"))
        .reduce((sum, row) => sum + parseFloat(row.querySelector(".entry-amount").textContent.replace("$", "")), 0);

      this.chart.data.datasets[0].data = [income, expenses];
      this.chart.update();
    }
  }

  // PUT to backend
  async updateEntryInBackend(id, updates) {
    const res = await fetch(`${API_URL}/entries/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Update failed: ${res.status} ${err}`);
    }
    return await res.json();
  }

  onEditEntryBtnClick(e) {
    const row = e.target.closest("li");
    this.enterEditMode(row);
  }

  enterEditMode(row) {
    const id = row.dataset.id;
    const date = row.querySelector(".entry-date").textContent.trim();
    const description = row.querySelector(".entry-description").textContent.trim();
    const type = row.querySelector(".entry-type").textContent.trim();
    const amount = parseFloat(row.querySelector(".entry-amount").textContent.replace("$", "")) || 0;
    const category = row.querySelector(".entry-category") ? row.querySelector(".entry-category").textContent.trim() : "General";

    // store original for Cancel
    row.dataset.original = JSON.stringify({ _id: id, date, description, type, amount });

    row.innerHTML = `
      <input type="date" class="edit-date" value="${date}">
      <input type="text" class="edit-description" value="${BudgetTracker.escapeHtml(description)}" placeholder="Description">
      <select class="edit-type">
          <option value="income" ${type === "income" ? "selected" : ""}>Income</option>
          <option value="expense" ${type === "expense" ? "selected" : ""}>Expense</option>
      </select>
      <input type="number" class="edit-amount" value="${amount}">
      <select class="edit-category">
          <option value="General" ${category === "General" ? "selected" : ""}>General</option>
          <option value="Food" ${category === "Food" ? "selected" : ""}>Food</option>
          <option value="Transportation" ${category === "Transportation" ? "selected" : ""}>Transportation</option>
          <option value="Entertainment" ${category === "Entertainment" ? "selected" : ""}>Entertainment</option>
          <option value="Health" ${category === "Health" ? "selected" : ""}>Health</option>
          <option value="Utilities" ${category === "Utilities" ? "selected" : ""}>Utilities</option>
          <option value="Miscellaneous" ${category === "Miscellaneous" ? "selected" : ""}>Miscellaneous</option>
      </select>
      <div class="row-actions">
          <button type="button" class="save-entry">Save</button>
          <button type="button" class="cancel-edit">Cancel</button>
      </div>
    `;

    // re-bind actions
    row.querySelector(".save-entry").addEventListener("click", (ev) => this.onSaveEntryBtnClick(ev));
    row.querySelector(".cancel-edit").addEventListener("click", (ev) => this.onCancelEditBtnClick(ev));
  }

  async onSaveEntryBtnClick(e) {
    const row = e.target.closest("li");
    const id = row.dataset.id;

    const updates = {
      date: row.querySelector(".edit-date").value,
      description: row.querySelector(".edit-description").value.trim(),
      type: row.querySelector(".edit-type").value,
      amount: parseFloat(row.querySelector(".edit-amount").value) || 0,
      category: row.querySelector(".edit-category").value
    };

    // basic guard
    if (!updates.description || isNaN(updates.amount)) return;

    const updated = await this.updateEntryInBackend(id, updates);
    this.replaceRowWithDisplay(row, updated);
    this.updateSummary();
  }

  onCancelEditBtnClick(e) {
    const row = e.target.closest("li");
    const original = JSON.parse(row.dataset.original);
    this.replaceRowWithDisplay(row, original);
    this.updateSummary();
  }

  initChart() {
    const ctx = this.root.querySelector("#summaryChart");

    this.chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [
          {
            label: "Budget Breakdown",
            data: [0, 0],
            backgroundColor: ["#2ecc71", "#e74c3c"], // green, red
          },
        ],
      },
      options: {
        plugins: {
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 14 },
            formatter: (value, context) => {
              const dataset = context.chart.data.datasets[0].data;
              const total = dataset.reduce((a, b) => a + b, 0);
              if (total === 0) return "0%";
              const percentage = Math.round((value / total) * 100);
              return percentage + "%";
            },
          },
          legend: {
            position: "bottom",
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

  replaceRowWithDisplay(row, entry) {
    // rebuild the row using the standard renderer
    const html = BudgetTracker.entryHtml(entry);
    // keep the <li> element but replace its content so event delegation stays simple
    row.className = `entry ${entry.type}`;
    row.setAttribute("data-id", entry._id);
    row.innerHTML = new DOMParser().parseFromString(html, "text/html").body.firstElementChild.innerHTML;

    // re-bind buttons
    row.querySelector(".delete-entry").addEventListener("click", (e) => this.onDeleteEntryBtnClick(e));
    row.querySelector(".edit-entry").addEventListener("click", (e) => this.onEditEntryBtnClick(e));
  }

  // small helper to safely place text inside value=""
  static escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
