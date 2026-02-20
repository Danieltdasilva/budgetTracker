import { api } from "./api.js";

export default class BudgetTracker {
  constructor(querySelectorString) {
    this.root = document.querySelector(querySelectorString);
    this.root.innerHTML = BudgetTracker.html();

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const decoded = jwt_decode(token);
    const email = decoded.email || "User";
    const welcomeEl = this.root.querySelector(".welcome-message");
    if (welcomeEl) {
      welcomeEl.textContent = `Welcome, ${email}`;
    }

    this.root.querySelector(".add-entry")
      .addEventListener("click", () => this.onAddEntryBtnClick());

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
        <input type="text" class="input-description" placeholder="Enter description">
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
          <button type="button" class="delete-entry">✖</button>
        </div>
      </li>
    `;
  }

  async load() {
    try {
      const entries = await api.getEntries();

      this.root.querySelector(".entries").innerHTML = "";

      for (const entry of entries) {
        this.addEntry(entry);
      }

      this.updateSummary();
    } catch (err) {
      console.error("Failed to load entries:", err);
    }
  }

  async onAddEntryBtnClick() {
    const date =
      this.root.querySelector(".input-date").value ||
      new Date().toISOString().split("T")[0];

    const description =
      this.root.querySelector(".input-description").value.trim();

    const type =
      this.root.querySelector(".input-type").value;

    const amount =
      parseFloat(this.root.querySelector(".input-amount").value) || 0;

    const category =
      this.root.querySelector(".input-category").value || "General";

    if (!description || !amount) return;

    try {
      const savedEntry = await api.createEntry({
        date,
        description,
        type,
        amount,
        category
      });

      this.addEntry(savedEntry);
      this.updateSummary();
      
      this.root.querySelector(".input-description").value = "";
      this.root.querySelector(".input-amount").value = "";
    } catch (err) {
      console.error("Failed to add entry:", err);
    }
  }

  async onDeleteEntryBtnClick(e) {
    const row = e.target.closest("li");
    const id = row.dataset.id;

    try {
      await api.deleteEntry(id);
      row.remove();
      this.updateSummary();
    } catch (err) {
      console.error("Delete failed:", err);
    }
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

    if (!updates.description || isNaN(updates.amount)) return;

    try {
      const updated = await api.updateEntry(id, updates);
      this.replaceRowWithDisplay(row, updated);
      this.updateSummary();
    } catch (err) {
      console.error("Update failed:", err);
    }
  }

updateSummary() {
  const rows = Array.from(
    this.root.querySelectorAll(".entries li")
  );

  let income = 0;
  let expenses = 0;

  rows.forEach(row => {
    const amount = parseFloat(
      row.querySelector(".entry-amount")
        .textContent.replace("$", "")
    );

    if (row.classList.contains("expense")) {
      expenses += amount;
    } else {
      income += amount;
    }
  });

  const total = income - expenses;

  // Update total
  this.root.querySelector(".total").textContent =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total);

  // Update chart
  if (this.chart) {
    this.chart.data.datasets[0].data = [income, expenses];
    this.chart.update();
  }
}

  addEntry(entry) {
    this.root.querySelector(".entries")
      .insertAdjacentHTML("beforeend", BudgetTracker.entryHtml(entry));

    const row =
      this.root.querySelector(".entries li:last-of-type");

    row.querySelector(".delete-entry")
      .addEventListener("click", (e) => this.onDeleteEntryBtnClick(e));

    row.querySelector(".edit-entry")
      .addEventListener("click", () => this.enterEditMode(row));
  }

  enterEditMode(row) {
    const id = row.dataset.id;
    const date = row.querySelector(".entry-date").textContent;
    const description = row.querySelector(".entry-description").textContent;
    const type = row.querySelector(".entry-type").textContent;
    const amount = row.querySelector(".entry-amount")
      .textContent.replace("$", "");
    const category = row.querySelector(".entry-category").textContent;

    row.innerHTML = `
      <input type="date" class="edit-date" value="${date}">
      <input type="text" class="edit-description" value="${description}">
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
      </div>
    `;

    row.querySelector(".save-entry")
      .addEventListener("click", (e) => this.onSaveEntryBtnClick(e));
  }

  initChart() {
    const ctx = this.root.querySelector("#summaryChart");

    this.chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Income", "Expenses"],
        datasets: [{
          data: [0, 0],
          backgroundColor: ["#2ecc71", "#e74c3c"],
        }]
      },
      options: {
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }
}
