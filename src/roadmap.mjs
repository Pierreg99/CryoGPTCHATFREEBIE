// The Markdown document remains the source of truth for all version details.
export function parseRoadmap(markdown) {
  const lines = markdown.split("\n");
  const phases = [];
  const milestones = [];
  let phase;
  for (let i = 0; i < lines.length; i++) {
    const phaseMatch = lines[i].match(/^### Phase (\d+) · (.+) \(v[^)]+\)$/);
    if (phaseMatch) {
      phase = { id: Number(phaseMatch[1]), title: phaseMatch[2] };
      phases.push(phase);
      continue;
    }
    const match = lines[i].match(/^#### (.+?) v(\d+\.\d) · (.+)$/);
    if (!match) continue;
    const paragraph = lines.slice(i + 1).find((line) => line.trim());
    const fields = paragraph?.match(
      /^\*\*Lieferobjekt:\*\* (.+) \*\*Abnahme:\*\* (.+)$/,
    );
    if (!phase || !fields) throw new Error("Ungültiger Roadmap-Meilenstein.");
    const status = match[1].includes("✅")
      ? "implemented"
      : match[1].includes("Teilweise")
        ? "partial"
        : "planned";
    milestones.push({
      version: match[2],
      title: match[3],
      phase: phase.id,
      status,
      deliverable: fields[1],
      acceptance: fields[2],
    });
  }
  if (
    milestones.length !== 100 ||
    phases.length !== 10 ||
    phases.some((phase, i) => phase.id !== i + 1) ||
    milestones.some(
      (m, i) =>
        m.version !== ((i + 1) / 10).toFixed(1) ||
        m.phase !== Math.floor(i / 10) + 1,
    )
  )
    throw new Error("Die Roadmap muss 100 geordnete Versionen enthalten.");
  return { phases, milestones };
}
