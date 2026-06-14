import { sampleContacts } from "../data/sample-notes.js";
import { targetCompanies } from "../data/target-companies.js";

const STORAGE_KEY = "data-ai-summit-relationship-agent.contacts";

const keywordMap = [
  { tag: "FDE", className: "fde", words: ["fde", "forward deployed", "deployed engineer"] },
  { tag: "Applied AI", className: "fde", words: ["applied ai", "ai engineer", "genai", "agent", "rag", "llm"] },
  { tag: "Hiring", className: "risk", words: ["hiring", "recruiter", "open role", "interview", "manager"] },
  { tag: "Databricks", className: "company", words: ["databricks", "lakehouse", "mosaic", "data + ai"] },
  { tag: "Customer", className: "fde", words: ["customer", "client", "stakeholder", "enterprise", "field"] },
  { tag: "Workflow", className: "fde", words: ["workflow", "process", "operations", "internal tool", "automation"] },
  { tag: "Media AI", className: "company", words: ["video", "avatar", "voice", "audio", "multimodal", "creative"] },
  { tag: "Developer Platform", className: "company", words: ["api", "sdk", "developer", "platform", "docs"] }
];

const sampleNote =
  "Met after the GenAI apps session. She leads an AI FDE team and said the best candidates can scope ambiguous customer problems, build prototypes quickly, explain tradeoffs to executives, and turn the pattern into reusable playbooks. Follow up today with the Summit relationship-agent demo and ask who owns applied AI hiring.";

const pipelineColumns = [
  { id: "capture", label: "Captured" },
  { id: "follow-up", label: "Follow-up" },
  { id: "warm", label: "Warm path" },
  { id: "apply", label: "Apply / intro" }
];

let contacts = loadContacts();

const elements = {
  contactForm: document.querySelector("#contactForm"),
  nameInput: document.querySelector("#nameInput"),
  companyInput: document.querySelector("#companyInput"),
  roleInput: document.querySelector("#roleInput"),
  notesInput: document.querySelector("#notesInput"),
  warmthInput: document.querySelector("#warmthInput"),
  timingInput: document.querySelector("#timingInput"),
  contactList: document.querySelector("#contactList"),
  targetList: document.querySelector("#targetList"),
  pipelineBoard: document.querySelector("#pipelineBoard"),
  filterSelect: document.querySelector("#filterSelect"),
  exportOutput: document.querySelector("#exportOutput"),
  loadDemoButton: document.querySelector("#loadDemoButton"),
  resetButton: document.querySelector("#resetButton"),
  sampleNoteButton: document.querySelector("#sampleNoteButton"),
  copyJsonButton: document.querySelector("#copyJsonButton"),
  copyCsvButton: document.querySelector("#copyCsvButton"),
  copyMarkdownButton: document.querySelector("#copyMarkdownButton"),
  metricContacts: document.querySelector("#metricContacts"),
  metricPriority: document.querySelector("#metricPriority"),
  metricFde: document.querySelector("#metricFde"),
  metricFollowups: document.querySelector("#metricFollowups")
};

elements.contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const contact = analyzeContact({
    name: elements.nameInput.value.trim(),
    company: elements.companyInput.value.trim(),
    role: elements.roleInput.value.trim(),
    notes: elements.notesInput.value.trim(),
    warmth: elements.warmthInput.value,
    timing: elements.timingInput.value
  });

  contacts = [contact, ...contacts];
  saveContacts();
  elements.contactForm.reset();
  elements.warmthInput.value = "warm";
  elements.timingInput.value = "today";
  render();
});

elements.filterSelect.addEventListener("change", render);

elements.loadDemoButton.addEventListener("click", () => {
  contacts = sampleContacts.map(analyzeContact);
  saveContacts();
  render();
});

elements.resetButton.addEventListener("click", () => {
  contacts = [];
  saveContacts();
  render();
});

elements.sampleNoteButton.addEventListener("click", () => {
  elements.nameInput.value = "AI FDE hiring manager";
  elements.companyInput.value = "Databricks";
  elements.roleInput.value = "AI Forward Deployed Engineering";
  elements.notesInput.value = sampleNote;
  elements.warmthInput.value = "warm";
  elements.timingInput.value = "today";
});

elements.copyJsonButton.addEventListener("click", async () => {
  const text = JSON.stringify(contacts, null, 2);
  elements.exportOutput.value = text;
  await copyToClipboard(text);
});

elements.copyCsvButton.addEventListener("click", async () => {
  const text = toCsv(contacts);
  elements.exportOutput.value = text;
  await copyToClipboard(text);
});

elements.copyMarkdownButton.addEventListener("click", async () => {
  const text = toMarkdownBrief(contacts);
  elements.exportOutput.value = text;
  await copyToClipboard(text);
});

function loadContacts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function analyzeContact(input) {
  const text = `${input.name} ${input.company} ${input.role} ${input.notes}`.toLowerCase();
  const tags = keywordMap
    .filter((entry) => entry.words.some((word) => text.includes(word)))
    .map((entry) => ({ label: entry.tag, className: entry.className }));

  const matchedCompany = targetCompanies.find((company) => {
    const names = [company.name, ...(company.aliases || [])].map((name) => name.toLowerCase());
    return names.some((name) => text.includes(name));
  });

  const score = calculateScore(input, tags, matchedCompany);
  const stage = chooseStage(input, tags, score);
  const summary = summarize(input, tags, matchedCompany);
  const nextAction = chooseNextAction(input, tags, matchedCompany, score);
  const followUp = draftFollowUp(input, tags, matchedCompany, nextAction);

  return {
    id: input.id || crypto.randomUUID(),
    name: input.name || "Unknown contact",
    company: input.company || "Unknown company",
    role: input.role || "Unknown role",
    notes: input.notes || "",
    warmth: input.warmth || "new",
    timing: input.timing || "this-week",
    createdAt: input.createdAt || new Date().toISOString(),
    tags,
    targetCompany: matchedCompany?.name || null,
    score,
    stage,
    summary,
    nextAction,
    followUp
  };
}

function calculateScore(input, tags, matchedCompany) {
  let score = 35;
  const tagLabels = tags.map((tag) => tag.label);

  if (tagLabels.includes("FDE")) score += 18;
  if (tagLabels.includes("Applied AI")) score += 14;
  if (tagLabels.includes("Hiring")) score += 14;
  if (tagLabels.includes("Customer")) score += 10;
  if (tagLabels.includes("Workflow")) score += 8;
  if (matchedCompany) score += matchedCompany.priority;
  if (input.warmth === "strong") score += 12;
  if (input.warmth === "warm") score += 8;
  if (input.timing === "today") score += 8;
  if (input.timing === "tomorrow") score += 4;

  return Math.max(0, Math.min(100, score));
}

function chooseStage(input, tags, score) {
  const tagLabels = tags.map((tag) => tag.label);
  if (score >= 82 && tagLabels.includes("Hiring")) return "apply";
  if (score >= 72) return "warm";
  if (input.timing === "today" || input.timing === "tomorrow") return "follow-up";
  return "capture";
}

function summarize(input, tags, matchedCompany) {
  const signals = tags.map((tag) => tag.label).slice(0, 3).join(", ") || "general relationship";
  const target = matchedCompany ? ` Matches ${matchedCompany.name} target thesis.` : "";
  return `${signals} signal from ${input.company}.${target}`;
}

function chooseNextAction(input, tags, matchedCompany, score) {
  const tagLabels = tags.map((tag) => tag.label);

  if (tagLabels.includes("Hiring") && tagLabels.includes("FDE")) {
    return "Send proof artifact and ask who owns AI FDE hiring or team-fit conversations.";
  }

  if (matchedCompany) {
    return `Send a company-specific note tied to ${matchedCompany.bestAngle}.`;
  }

  if (score >= 75) {
    return "Send follow-up today with a clear ask for a 10-minute compare-notes conversation.";
  }

  return "Log context, connect on LinkedIn, and follow up after the Summit with a concise note.";
}

function draftFollowUp(input, tags, matchedCompany, nextAction) {
  const angle = matchedCompany?.bestAngle || "applied AI systems that move from idea to workflow";
  const proof = "Data + AI Summit relationship-agent prototype";

  return `Hey ${firstName(input.name)}, great meeting you at Data + AI Summit.

I appreciated the conversation around ${angle}.

I have been building systems that turn messy workflows into usable software and AI-assisted tools. I put together a small proof artifact from the Summit itself: a ${proof} that turns hallway notes into company-fit signals, follow-up drafts, and next actions.

${nextAction}

Would be glad to compare notes for 10 minutes while I am in SF.`;
}

function firstName(name) {
  return String(name || "there").split(" ")[0];
}

function render() {
  renderMetrics();
  renderContacts();
  renderPipeline();
  renderTargets();
  elements.exportOutput.value = toMarkdownBrief(contacts);
}

function renderMetrics() {
  elements.metricContacts.textContent = contacts.length;
  elements.metricPriority.textContent = contacts.filter((contact) => contact.score >= 75).length;
  elements.metricFde.textContent = contacts.filter((contact) => contact.tags.some((tag) => tag.label === "FDE")).length;
  elements.metricFollowups.textContent = contacts.filter((contact) => ["today", "tomorrow"].includes(contact.timing)).length;
}

function renderContacts() {
  const filter = elements.filterSelect.value;
  const visibleContacts = contacts.filter((contact) => {
    if (filter === "high") return contact.score >= 75;
    if (filter === "fde") return contact.tags.some((tag) => tag.label === "FDE");
    if (filter === "follow-up") return ["today", "tomorrow"].includes(contact.timing);
    return true;
  });

  elements.contactList.innerHTML = "";

  if (!visibleContacts.length) {
    elements.contactList.innerHTML = `<div class="contact-card"><p class="contact-summary">No contacts yet. Load demo data or add the first Summit note.</p></div>`;
    return;
  }

  visibleContacts
    .sort((a, b) => b.score - a.score)
    .forEach((contact) => {
      const template = document.querySelector("#contactCardTemplate");
      const card = template.content.cloneNode(true);
      const scorePill = card.querySelector(".score-pill");

      card.querySelector("h3").textContent = contact.name;
      card.querySelector(".contact-role").textContent = `${contact.role || "Unknown role"} · ${contact.company}`;
      card.querySelector(".contact-summary").textContent = contact.summary;
      scorePill.textContent = `${contact.score}`;
      scorePill.classList.toggle("hot", contact.score >= 82);
      scorePill.classList.toggle("warm", contact.score >= 70 && contact.score < 82);

      const tagRow = card.querySelector(".tag-row");
      contact.tags.forEach((tag) => {
        const tagElement = document.createElement("span");
        tagElement.className = `tag ${tag.className}`;
        tagElement.textContent = tag.label;
        tagRow.append(tagElement);
      });

      card.querySelector(".next-action").textContent = contact.nextAction;
      card.querySelector("pre").textContent = contact.followUp;
      elements.contactList.append(card);
    });
}

function renderPipeline() {
  elements.pipelineBoard.innerHTML = "";

  pipelineColumns.forEach((column) => {
    const columnElement = document.createElement("article");
    columnElement.className = "pipeline-column";
    columnElement.innerHTML = `<h3>${column.label}</h3>`;

    contacts
      .filter((contact) => contact.stage === column.id)
      .sort((a, b) => b.score - a.score)
      .forEach((contact) => {
        const item = document.createElement("div");
        item.className = "pipeline-item";
        item.innerHTML = `<strong>${escapeHtml(contact.name)}</strong><span>${escapeHtml(contact.company)} · ${contact.score}</span>`;
        columnElement.append(item);
      });

    elements.pipelineBoard.append(columnElement);
  });
}

function renderTargets() {
  const contactText = contacts.map((contact) => `${contact.company} ${contact.role} ${contact.notes}`).join(" ").toLowerCase();

  const ranked = targetCompanies
    .map((company) => {
      const aliases = [company.name, ...(company.aliases || [])].map((alias) => alias.toLowerCase());
      const mentions = aliases.reduce((count, alias) => count + countOccurrences(contactText, alias), 0);
      const score = Math.min(100, company.priority * 8 + mentions * 12);
      return { ...company, score, mentions };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  elements.targetList.innerHTML = "";

  ranked.forEach((company) => {
    const card = document.createElement("article");
    card.className = "target-card";
    card.innerHTML = `
      <div class="contact-topline">
        <h3>${escapeHtml(company.name)}</h3>
        <span class="score-pill">${company.score}</span>
      </div>
      <p>${escapeHtml(company.bestAngle)}</p>
      <div class="target-bar"><span style="width: ${company.score}%"></span></div>
      <div class="tag-row">${company.signals.map((signal) => `<span class="tag company">${escapeHtml(signal)}</span>`).join("")}</div>
    `;
    elements.targetList.append(card);
  });
}

function countOccurrences(text, term) {
  if (!term) return 0;
  return text.split(term).length - 1;
}

function toCsv(rows) {
  const headers = ["name", "company", "role", "score", "stage", "tags", "nextAction"];
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(
      headers
        .map((key) => {
          const value = key === "tags" ? row.tags.map((tag) => tag.label).join("; ") : row[key];
          return `"${String(value ?? "").replaceAll('"', '""')}"`
        })
        .join(",")
    );
  });
  return lines.join("\n");
}

function toMarkdownBrief(rows) {
  if (!rows.length) {
    return "# Summit Follow-up Brief\n\nNo contacts captured yet.";
  }

  const sorted = [...rows].sort((a, b) => b.score - a.score);
  return [
    "# Summit Follow-up Brief",
    "",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "## Highest Priority",
    "",
    ...sorted.slice(0, 5).map((contact, index) =>
      `${index + 1}. ${contact.name} at ${contact.company} (${contact.score})\n   - Role: ${contact.role}\n   - Signal: ${contact.summary}\n   - Next: ${contact.nextAction}`
    ),
    "",
    "## Follow-up Drafts",
    "",
    ...sorted.slice(0, 3).map((contact) => `### ${contact.name}\n\n${contact.followUp}`)
  ].join("\n");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // The textarea still receives the value when clipboard permission is unavailable.
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
