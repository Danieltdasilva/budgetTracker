export default class BudgetTracker {
    constructor(querySelectorString) {
        this.root = document.querySelector(querySelectorString);
        this.root.innerHTML = BudgetTracker.html();

        // Bind add button
        this.root.querySelector(".add-entry").addEventListener("click", () => {
            this.onAddEntryBtnClick();
        });

        // Load initial data from backend
        this.load();
    }

    static html() {
        return `
        <h1 class="main-title">Budgeting App</h1>

        <div class="transaction-form">
            <input type="date" class="input-date">
            <input type="text" class="input-description" placeholder="Enter description (bills, groceries, etc.)">
            <select class="input-type">
                <option value="income">Income</option> 
                <option value="expense">Expense</option> 
            </select>
            <input type="number" class="input-amount" placeholder="0">
            <button type="button" class="add-entry">Add</button>
        </div>

        <ul class="entries"></ul>

        <div class="summary">
            <strong>Total: </strong>
            <span class="total">$0.00</span>
        </div>
        `;
    }

    static entryHtml(entry) {
        return `
            <li class="entry ${entry.type}" data-id="${entry._id}">
                <span class="entry-date">${entry.date}</span>
                <span class="entry-description">${entry.description}</span>
                <span class="entry-type">${entry.type}</span>
                <span class="entry-amount">$${entry.amount.toFixed(2)}</span>
                <button type="button" class="delete-entry">✖</button>
            </li>
        `;
    }

    // --- API Calls ---
    async load() {
        const res = await fetch("http://localhost:5000/entries");
        const entries = await res.json();

        for (const entry of entries) {
            this.addEntry(entry);
        }

        this.updateSummary();
    }

    async addEntryToBackend(entry) {
        const res = await fetch("http://localhost:5000/entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry)
        });
        return await res.json();
    }

    async deleteEntryFromBackend(id) {
        await fetch(`http://localhost:5000/entries/${id}`, {
            method: "DELETE"
        });
    }

    // --- UI Logic ---
    addEntry(entry) {
        this.root.querySelector(".entries").insertAdjacentHTML("beforeend", BudgetTracker.entryHtml(entry));

        const row = this.root.querySelector(".entries li:last-of-type");

        row.querySelector(".delete-entry").addEventListener("click", e => {
            this.onDeleteEntryBtnClick(e);
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

        if (!description.trim() || !amount) return;

        const entry = { date, description, type, amount };

        // Save to backend
        const savedEntry = await this.addEntryToBackend(entry);

        // Show in UI
        this.addEntry(savedEntry);

        // Clear inputs
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
    }
}
