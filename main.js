// ─── Gamete generation ───────────────────────────────────────────

/**
 * Returns all possible gametes for a genotype string.
 * E.g. "AaBb" → ["AB", "Ab", "aB", "ab"]
 */

// document.getElementById("f1-label").classList.add("hidden");
// document.getElementById("f2-label").classList.add("hidden");

function getGametes(genes) {
    const genePairs = [];

    for (let i = 0; i < genes.length / 2; i++) {
        const allele1 = genes[2 * i];
        const allele2 = genes[2 * i + 1];
        // Use Set to avoid duplicate gametes for homozygous (AA → just "A")
        genePairs.push([...new Set([allele1, allele2])]);
    }

    // Cartesian product via recursion
    const results = [];
    function combine(current, index) {
        if (index === genePairs.length) {
            results.push(current);
            return;
        }
        for (const allele of genePairs[index]) {
            combine(current + allele, index + 1);
        }
    }
    combine("", 0);
    return results;
}

// ─── Genotype helpers ────────────────────────────────────────────

/**
 * Merges two gametes into a sorted genotype string.
 * E.g. "Ab" + "aB" → "AaBb"
 */
function mergeGametes(g1, g2) {
    const combined = g1 + g2;
    // Group by letter: for each letter pair keep dominant first
    const letters = [...new Set(combined.toLowerCase().split(""))];
    return letters.map(letter => {
        const alleles = combined.split("").filter(c => c.toLowerCase() === letter);
        return alleles.sort((a, b) => a < b ? -1 : 1).join("");
    }).join("");
}

/**
 * Classifies a genotype cell for colour coding.
 * Works only for single-gene (2-char) genotypes; skips for multi-gene.
 */
function classifyGenotype(genotype) {
    if (genotype.length !== 2) return "";
    const [a, b] = genotype.split("");
    if (a === b && a === a.toUpperCase()) return "hom-dom";
    if (a === b && a === a.toLowerCase()) return "hom-rec";
    return "het";
}

// ─── Validation ──────────────────────────────────────────────────

function validate(genotype) {
    if (!genotype) return "Генотип не може бути порожнім.";
    if (genotype.length % 2 !== 0) return `"${genotype}": кількість алелей має бути парною.`;
    // Each pair: first char uppercase letter, second char same letter (any case)
    for (let i = 0; i < genotype.length; i += 2) {
        const a = genotype[i], b = genotype[i + 1];
        // if (!/\p{Lu}/u.test(a)) return `Позиція ${i + 1}: алель "${a}" повинна бути великою літерою.`;
        if (a.toLowerCase() !== b.toLowerCase()) return `Пара "${a}${b}": алелі мають бути однієї букви.`;
    }
    return null;
}

// ─── Table rendering ─────────────────────────────────────────────

function drawTable(p1Gametes, p2Gametes) {
    const container = document.getElementById("grid-container");
    container.innerHTML = "";

    const table = document.createElement("table");

    // Header row (p1 gametes)
    const headerRow = document.createElement("tr");
    const corner = document.createElement("td");
    corner.className = "corner";
    headerRow.appendChild(corner);

    for (const g1 of p1Gametes) {
        const th = document.createElement("th");
        th.className = "gamete-header";
        th.textContent = g1;
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Data rows
    for (const g2 of p2Gametes) {
        const row = document.createElement("tr");

        const sideCell = document.createElement("td");
        sideCell.className = "gamete-header";
        sideCell.textContent = g2;
        row.appendChild(sideCell);

        for (const g1 of p1Gametes) {
            const cell = document.createElement("td");
            cell.className = "genotype";

            const genotype = mergeGametes(g1, g2);
            cell.textContent = genotype;

            const cls = classifyGenotype(genotype);
            if (cls) cell.classList.add(cls);

            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    container.appendChild(table);

        // Hover — подсветка одинаковых генотипов
    const allCells = table.querySelectorAll("td.genotype");
    allCells.forEach(cell => {
        cell.addEventListener("mouseenter", () => {
            allCells.forEach(c => {
                if (c.textContent === cell.textContent) c.classList.add("highlight");
            });
        });
        cell.addEventListener("mouseleave", () => {
            allCells.forEach(c => c.classList.remove("highlight"));
        });
    });
}

// ─── Stats ───────────────────────────────────────────────────────

function renderStats(p1Gametes, p2Gametes) {
    const statsEl = document.getElementById("stats");

    const counts = {};
    for (const g2 of p2Gametes) {
        for (const g1 of p1Gametes) {
            const gt = mergeGametes(g1, g2);
            counts[gt] = (counts[gt] || 0) + 1;
        }
    }

    const total = p1Gametes.length * p2Gametes.length;
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const statGrid = document.createElement("div");
    statGrid.className = "stat-grid";

    for (const [genotype, count] of entries) {
        const item = document.createElement("div");
        item.className = "stat-item";
        item.innerHTML = `
            <span class="genotype-label">${genotype}</span>
            <span class="ratio">${count}/${total}</span>
        `;
        statGrid.appendChild(item);
    }

    statsEl.innerHTML = "<h3>Частоти генотипів</h3>";
    statsEl.appendChild(statGrid);
    statsEl.classList.remove("hidden");
}

// ─── Live preview ────────────────────────────────────────────────

function updatePreview(inputId, previewId) {
    const value = document.getElementById(inputId).value.trim();
    const preview = document.getElementById(previewId);

    const error = validate(value);
    if (error || !value) {
        preview.innerHTML = "";
        return;
    }

    const gametes = getGametes(value);
    preview.innerHTML = gametes.map(g => `<span>${g}</span>`).join("");
}

document.getElementById("parent1").addEventListener("input", () => {
    updatePreview("parent1", "preview1");
});
document.getElementById("parent2").addEventListener("input", () => {
    updatePreview("parent2", "preview2");
});

// ─── Main ────────────────────────────────────────────────────────

function showError(msg) {
    const el = document.getElementById("error-msg");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function hideError() {
    document.getElementById("error-msg").classList.add("hidden");
}

function makeGrid() {
    hideError();
    document.getElementById("f1-label").classList.add("hidden");
    document.getElementById("f2-label").classList.add("hidden");
    document.getElementById("grid-container").innerHTML = "";
    document.getElementById("stats").classList.add("hidden");

    const p1Value = document.getElementById("parent1").value.trim();
    const p2Value = document.getElementById("parent2").value.trim();

    const err1 = validate(p1Value);
    const err2 = validate(p2Value);

    if (err1) { showError("Батько 1 — " + err1); return; }
    if (err2) { showError("Батько 2 — " + err2); return; }

    if (p1Value.length !== p2Value.length) {
        showError("Батьки мають мати однакову кількість генів.");
        return;
    }

    const p1Gametes = getGametes(p1Value);
    const p2Gametes = getGametes(p2Value);

    drawTable(p1Gametes, p2Gametes);
    renderStats(p1Gametes, p2Gametes);
    document.getElementById("f1-label").classList.remove("hidden");
    document.getElementById("f2-label").classList.remove("hidden");
}

// Allow Enter key to trigger
document.addEventListener("keydown", e => {
    if (e.key === "Enter") makeGrid();
});
