export default class BudgetTracker {
    constructor(querySelectorString) {
        this.root = document.querySelector(querySelectorString);
        this.root.innerHTML = BudgetTracker.html();

        // Add entry button
        this.root.querySelector(".add-entry").addEventListener("click", () => {
            this.onAddEntryBtnClick();
        });

        // Load data from local storage
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
            <li class="entry ${entry.type}">
                <span class="entry-date">${entry.date}</span>
                <span class="entry-description">${entry.description}</span>
                <span class="entry-type">${entry.type}</span>
                <span class="entry-amount">$${entry.amount.toFixed(2)}</span>
                <button type="button" class="delete-entry">✖</button>
            </li>
        `;
    }

    load() {
        const entries = JSON.parse(localStorage.getItem("budget-tracker-entries") || "[]");

        for (const entry of entries) {
            this.addEntry(entry);
        }

        this.updateSummary();
    }

    save() {
        const data = this.getEntryRows().map(row => {
            return {
                date: row.querySelector(".entry-date").textContent,
                description: row.querySelector(".entry-description").textContent,
                type: row.querySelector(".entry-type").textContent,
                amount: parseFloat(row.querySelector(".entry-amount").textContent.replace("$", "")),
            };
        });

        localStorage.setItem("budget-tracker-entries", JSON.stringify(data));
        this.updateSummary();
    }

    updateSummary() {
        const total = this.getEntryRows().reduce((total, row) => {
            const amount = parseFloat(row.querySelector(".entry-amount").textContent.replace("$", ""));
            const isExpense = row.classList.contains("expense");
            const modifier = isExpense ? -1 : 1;

            return total + (amount * modifier);
        }, 0);

        const totalFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(total);

        this.root.querySelector(".total").textContent = totalFormatted;
    }

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

    onAddEntryBtnClick() {
        const date = this.root.querySelector(".input-date").value || new Date().toISOString().split("T")[0];
        const description = this.root.querySelector(".input-description").value;
        const type = this.root.querySelector(".input-type").value;
        const amount = parseFloat(this.root.querySelector(".input-amount").value) || 0;

        if (!description.trim() || !amount) return;

        const entry = { date, description, type, amount };
        this.addEntry(entry);
        this.save();

        // Reset form inputs
        this.root.querySelector(".input-description").value = "";
        this.root.querySelector(".input-amount").value = "";
    }

    onDeleteEntryBtnClick(e) {
        e.target.closest("li").remove();
        this.save();
    }
}
