export default class BudgetTracker {
    constructor(querySelectorString) {
        this.root = document.querySelector(querySelectorString);
        this.root.innerHTML = BudgetTracker.html();

        this.root.querySelector(".new-entry").addEventListener("click", () => {
            this.onNewEntryBtnClick();
        });

        //Load initial data from local storage
        this.load();

    }

    static html () {
        return ``;
    }

    static entryHtml () {

    }

    load () {

    }

    updateSummary () {

    }

    save () {

    }

    addEntry (entry= {}) {

    }

    getEntryRows () {

    }

    onNewEntryBtnClick () {

    }

    onDeleteEntryBtnClick (e) {

    }
}

