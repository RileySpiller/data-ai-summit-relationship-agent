import { readFile } from "node:fs/promises";
import { sampleContacts } from "../data/sample-notes.js";
import { targetCompanies } from "../data/target-companies.js";

const inputFile = process.argv[2];
const contacts = inputFile ? JSON.parse(await readFile(inputFile, "utf8")) : sampleContacts;

const keywordWeights = [
  { label: "FDE", words: ["fde", "forward deployed", "deployed engineer"], weight: 18 },
  { label: "Applied AI", words: ["applied ai", "genai", "agent", "rag", "llm"], weight: 14 },
  { label: "Hiring", words: ["hiring", "recruiter", "open role", "interview", "manager"], weight: 14 },
  { label: "Customer", words: ["customer", "client", "stakeholder", "enterprise", "field"], weight: 10 },
  { label: "Workflow", words: ["workflow", "process", "operations", "internal tool", "automation"], weight: 8 },
  { label: "Developer Platform", words: ["api", "sdk", "developer", "platform", "docs"], weight: 8 }
];

const results = contacts
  .map((contact) => classify(contact))
  .sort((a, b) => b.score - a.score);

console.log(JSON.stringify(results, null, 2));

function classify(contact) {
  const text = `${contact.name} ${contact.company} ${contact.role} ${contact.notes}`.toLowerCase();
  const tags = keywordWeights.filter((entry) => entry.words.some((word) => text.includes(word)));
  const target = targetCompanies.find((company) =>
    [company.name, ...(company.aliases || [])].some((name) => text.includes(name.toLowerCase()))
  );
  const warmthBonus = contact.warmth === "strong" ? 12 : contact.warmth === "warm" ? 8 : 0;
  const timingBonus = contact.timing === "today" ? 8 : contact.timing === "tomorrow" ? 4 : 0;
  const score = Math.min(
    100,
    35 + tags.reduce((sum, tag) => sum + tag.weight, 0) + (target?.priority || 0) + warmthBonus + timingBonus
  );

  return {
    name: contact.name,
    company: contact.company,
    role: contact.role,
    score,
    tags: tags.map((tag) => tag.label),
    targetCompany: target?.name || null,
    nextAction: chooseNextAction(tags, target)
  };
}

function chooseNextAction(tags, target) {
  const labels = tags.map((tag) => tag.label);
  if (labels.includes("Hiring") && labels.includes("FDE")) {
    return "Send proof artifact and ask who owns AI FDE hiring conversations.";
  }
  if (target) {
    return `Send a company-specific note tied to ${target.bestAngle}.`;
  }
  return "Connect, log context, and follow up with a concise compare-notes ask.";
}
