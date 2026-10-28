#!/usr/bin/env node
// Quality harness for agent-written tests. Zero dependencies.
//
// It is the deterministic gate an AI agent must pass before its work is accepted:
//   1. Feature rules     - Gherkin is well formed, declarative, tagged and small.
//   2. Coverage          - every acceptance criterion in requirements/ has a scenario.
//   3. Traceability      - every scenario has a Playwright test whose test.step titles
//                          match the Gherkin steps word for word, and no test is orphaned.
//
// Usage: node scripts/validate.mjs [--json reports/validation.json]

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const DIRS = { features: 'features', requirements: 'requirements', tests: 'tests' };
const PRIORITY_TAGS = ['@smoke', '@regression'];
const MAX_STEPS = 8;
// Words that leak UI mechanics into business-readable scenarios.
const IMPERATIVE_WORDS = /\b(click|clicks|button|textbox|field|xpath|css|selector|locator|wait|waits|sleep|scroll|hover|type into)\b/i;
const STEP_RE = /^(Given|When|Then|And|But)\s+(.+)$/;

const issues = [];
const report = (rule, file, message) => issues.push({ rule, file, message });

const listFiles = (dir, ext) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { recursive: true })
        .filter((f) => f.endsWith(ext))
        .map((f) => join(dir, f))
    : [];

// ---------- Requirements ----------
const requirements = new Map(); // REQ-001 -> Set(AC-001.1, ...)
for (const file of listFiles(DIRS.requirements, '.md')) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const req = text.match(/\bREQ-\d{3}\b/)?.[0];
  if (!req) {
    report('R1', file, 'Requirement file has no REQ-### identifier.');
    continue;
  }
  requirements.set(req, new Set(text.match(/\bAC-\d{3}\.\d+\b/g) ?? []));
}

// ---------- Gherkin parsing ----------
function parseFeature(file) {
  const lines = readFileSync(join(ROOT, file), 'utf8').split(/\r?\n/);
  const feature = { file, name: '', tags: [], background: [], scenarios: [] };
  let pendingTags = [];
  let current = null; // scenario or 'background'
  let inExamples = false;

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const at = `${file}:${i + 1}`;
    if (!line || line.startsWith('#')) return;

    if (line.startsWith('@')) {
      pendingTags.push(...line.split(/\s+/));
      return;
    }
    let m;
    if ((m = line.match(/^Feature:\s*(.+)$/))) {
      feature.name = m[1];
      feature.tags = pendingTags;
      pendingTags = [];
      return;
    }
    if (line.startsWith('Background:')) {
      current = 'background';
      inExamples = false;
      return;
    }
    if ((m = line.match(/^Scenario( Outline)?:\s*(.+)$/))) {
      current = { name: m[2], outline: Boolean(m[1]), tags: pendingTags, steps: [], examples: [], at };
      feature.scenarios.push(current);
      pendingTags = [];
      inExamples = false;
      return;
    }
    if (line.startsWith('Examples:')) {
      inExamples = true;
      return;
    }
    if (line.startsWith('|')) {
      if (inExamples && current && current !== 'background') {
        current.examples.push(line.split('|').slice(1, -1).map((c) => c.trim()));
      }
      return;
    }
    if ((m = line.match(STEP_RE))) {
      const step = { keyword: m[1], text: m[2], full: line, at };
      if (current === 'background') feature.background.push(step);
      else if (current) current.steps.push(step);
      else report('F1', at, 'Step found outside of a Scenario or Background.');
      return;
    }
    // Anything else is free-text description under Feature/Scenario.
  });

  if (!feature.name) report('F1', file, 'Missing "Feature:" line.');
  return feature;
}

// Effective keyword: And/But inherit the previous primary keyword.
function primaryKeywords(steps) {
  let last = 'Given';
  return steps.map((s) => (s.keyword === 'And' || s.keyword === 'But' ? last : (last = s.keyword)));
}

const features = listFiles(DIRS.features, '.feature').map(parseFeature);
const coveredAcs = new Set();

for (const feature of features) {
  const reqTags = feature.tags.filter((t) => /^@REQ-\d{3}$/.test(t));
  if (reqTags.length !== 1) {
    report('F2', feature.file, 'Feature must carry exactly one @REQ-### tag.');
  }
  const req = reqTags[0]?.slice(1);
  if (req && !requirements.has(req)) report('F2', feature.file, `${req} has no file in ${DIRS.requirements}/.`);

  const names = new Set();
  for (const sc of feature.scenarios) {
    if (names.has(sc.name)) report('F3', sc.at, `Duplicate scenario name "${sc.name}".`);
    names.add(sc.name);

    const priority = sc.tags.filter((t) => PRIORITY_TAGS.includes(t));
    if (priority.length !== 1) report('F4', sc.at, `Scenario needs exactly one of ${PRIORITY_TAGS.join(', ')}.`);

    const acs = sc.tags.filter((t) => /^@AC-\d{3}\.\d+$/.test(t)).map((t) => t.slice(1));
    if (acs.length === 0) report('F5', sc.at, 'Scenario must reference at least one @AC-###.# tag.');
    for (const ac of acs) {
      if (req && !ac.startsWith(req.replace('REQ-', 'AC-') + '.')) report('F5', sc.at, `${ac} does not belong to ${req}.`);
      else if (req && requirements.has(req) && !requirements.get(req).has(ac)) report('F5', sc.at, `${ac} is not defined in ${req}.`);
      coveredAcs.add(ac);
    }

    const kinds = primaryKeywords([...feature.background, ...sc.steps]);
    if (!kinds.includes('When')) report('F6', sc.at, 'Scenario has no When step (the action under test).');
    if (!kinds.includes('Then')) report('F6', sc.at, 'Scenario has no Then step (the expected outcome).');
    if (sc.steps.length > MAX_STEPS) report('F7', sc.at, `Scenario has ${sc.steps.length} steps; keep it to ${MAX_STEPS} or split it.`);

    for (const step of [...sc.steps]) {
      const hit = step.text.replace(/"[^"]*"/g, '""').match(IMPERATIVE_WORDS);
      if (hit) report('F8', step.at, `Imperative UI wording "${hit[0]}" — describe behavior, not mechanics.`);
    }

    if (sc.outline) {
      const [header, ...rows] = sc.examples;
      if (!header || rows.length === 0) report('F9', sc.at, 'Scenario Outline needs an Examples table with at least one row.');
      const params = new Set(sc.steps.flatMap((s) => [...s.text.matchAll(/<([^>]+)>/g)].map((m) => m[1])));
      for (const p of params) if (header && !header.includes(p)) report('F9', sc.at, `Placeholder <${p}> is missing from Examples.`);
    } else if (/<[^>]+>/.test(sc.steps.map((s) => s.text).join(' '))) {
      report('F9', sc.at, 'Placeholders are only allowed in a Scenario Outline.');
    }
  }
}

// ---------- Coverage ----------
for (const [req, acs] of requirements) {
  for (const ac of acs) if (!coveredAcs.has(ac)) report('C1', `${DIRS.requirements}/${req}`, `${ac} has no scenario covering it.`);
}

// ---------- Traceability ----------
// Normalize "<param>" (Gherkin) and "${expr}" (template literals) to the same token.
const norm = (s) => s.replace(/<[^>]+>/g, '<>').replace(/\$\{[^}]+\}/g, '<>').replace(/\s+/g, ' ').trim();
const STRING = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/.source;
const unescape = (s) => s.replace(/\\(['"`\\])/g, '$1');

const specs = listFiles(DIRS.tests, '.spec.ts').map((file) => {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const tests = [...text.matchAll(new RegExp(`\\btest\\(\\s*${STRING}`, 'g'))].map((m) => ({
    title: norm(unescape(m[2])),
    index: m.index,
  }));
  const steps = [...text.matchAll(new RegExp(`\\btest\\.step\\(\\s*${STRING}`, 'g'))].map((m) => ({
    text: norm(unescape(m[2])),
    index: m.index,
  }));
  const describes = [...text.matchAll(new RegExp(`\\btest\\.describe\\(\\s*${STRING}`, 'g'))].map((m) => norm(unescape(m[2])));
  return { file, tests, steps, describes, used: new Set() };
});

for (const feature of features) {
  const spec = specs.find((s) => s.describes.includes(`Feature: ${feature.name}`));
  if (!spec) {
    report('T1', feature.file, `No spec has test.describe('Feature: ${feature.name}').`);
    continue;
  }
  const firstTest = spec.tests[0]?.index ?? Infinity;
  for (const bg of feature.background) {
    if (!spec.steps.some((s) => s.index < firstTest && s.text === norm(bg.full))) {
      report('T2', bg.at, `Background step not implemented before the first test in ${spec.file}: "${bg.full}"`);
    }
  }
  for (const sc of feature.scenarios) {
    const title = norm(sc.name);
    const matches = spec.tests.filter((t) => (sc.outline ? t.title.startsWith(`${title}:`) : t.title === title));
    if (matches.length === 0) {
      report('T1', sc.at, `No test titled "${sc.name}${sc.outline ? ': <case>' : ''}" in ${spec.file}.`);
      continue;
    }
    for (const t of matches) {
      spec.used.add(t.index);
      const next = spec.tests.find((o) => o.index > t.index)?.index ?? Infinity;
      const bodySteps = spec.steps.filter((s) => s.index > t.index && s.index < next).map((s) => s.text);
      const expected = sc.steps.map((s) => norm(s.full));
      if (JSON.stringify(bodySteps) !== JSON.stringify(expected)) {
        const missing = expected.filter((e) => !bodySteps.includes(e));
        const extra = bodySteps.filter((b) => !expected.includes(b));
        const detail = [
          missing.length ? `missing: ${missing.map((x) => `"${x}"`).join(', ')}` : '',
          extra.length ? `not in Gherkin: ${extra.map((x) => `"${x}"`).join(', ')}` : '',
          !missing.length && !extra.length ? 'steps are out of order' : '',
        ].filter(Boolean).join('; ');
        report('T2', sc.at, `Steps in ${spec.file} do not mirror the scenario (${detail}).`);
      }
    }
  }
}
for (const spec of specs) {
  for (const t of spec.tests) if (!spec.used.has(t.index)) report('T3', spec.file, `Orphan test "${t.title}" has no scenario.`);
}

// ---------- Output ----------
const summary = {
  features: features.length,
  scenarios: features.reduce((n, f) => n + f.scenarios.length, 0),
  acceptanceCriteria: [...requirements.values()].reduce((n, s) => n + s.size, 0),
  covered: [...requirements.values()].reduce((n, s) => n + [...s].filter((ac) => coveredAcs.has(ac)).length, 0),
  issues,
};

const jsonFlag = process.argv.indexOf('--json');
if (jsonFlag !== -1) {
  const out = join(ROOT, process.argv[jsonFlag + 1] ?? 'reports/validation.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(summary, null, 2));
}

console.log(`Features: ${summary.features} | Scenarios: ${summary.scenarios} | AC coverage: ${summary.covered}/${summary.acceptanceCriteria}`);
if (issues.length === 0) {
  console.log('✔ Harness checks passed.');
} else {
  for (const i of issues) console.log(`✖ [${i.rule}] ${i.file} — ${i.message}`);
  console.log(`\n${issues.length} issue(s). Rules are documented in docs/harness-rules.md.`);
  process.exitCode = 1;
}
