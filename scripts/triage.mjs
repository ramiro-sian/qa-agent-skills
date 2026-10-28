#!/usr/bin/env node
// Turns Playwright's JSON report into a triage sheet that links every failure
// to its scenario, requirement and acceptance criterion. Zero dependencies.
//
// Usage: node scripts/triage.mjs [reports/results.json] [reports/triage.md]

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] ?? 'reports/results.json';
const output = process.argv[3] ?? 'reports/triage.md';

if (!existsSync(input)) {
  console.error(`No report at ${input}. Run "npm test" first.`);
  process.exit(2);
}

const report = JSON.parse(readFileSync(input, 'utf8'));
const stripAnsi = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '');

function* walk(suite, parents = []) {
  for (const spec of suite.specs ?? []) yield { spec, parents };
  for (const child of suite.suites ?? []) yield* walk(child, [...parents, child.title]);
}

// The first failing test.step tells us which Gherkin step broke.
function failingStep(steps = []) {
  for (const step of steps) {
    const inner = failingStep(step.steps);
    if (inner) return inner;
    if (step.error) return step.title;
  }
  return null;
}

// A first-pass hint only; the failure-triage skill makes the final call.
function hint(status, message) {
  if (status === 'flaky') return 'Flaky: passed on retry';
  if (/Timeout|timed out|net::ERR|ECONNREFUSED|webServer/i.test(message)) return 'Environment or timing';
  if (/locator\.|strict mode violation|waiting for (getBy|locator)/i.test(message)) return 'Test defect (locator) or UI change';
  if (/expect\(.*\)\.(toHaveText|toContainText|toBe|toEqual|toHaveURL)/i.test(message)) return 'Product defect or outdated expectation';
  return 'Needs investigation';
}

const rows = [];
let total = 0;
for (const top of report.suites ?? []) {
  for (const { spec, parents } of walk(top, [top.title])) {
    for (const t of spec.tests ?? []) {
      total += 1;
      if (t.status === 'expected' || t.status === 'skipped') continue;
      const last = t.results?.at(-1) ?? {};
      const firstFail = t.results?.find((r) => r.status !== 'passed') ?? last;
      const message = stripAnsi(firstFail.error?.message ?? '').split('\n').find(Boolean) ?? '';
      const tags = (spec.tags ?? []).map((tag) => (tag.startsWith('@') ? tag : `@${tag}`));
      rows.push({
        feature: parents.find((p) => p.startsWith('Feature:')) ?? parents.at(-1),
        scenario: spec.title,
        reqs: tags.filter((x) => /^@REQ-/.test(x)).join(' '),
        acs: tags.filter((x) => /^@AC-/.test(x)).join(' '),
        step: failingStep(firstFail.steps) ?? '(not inside a test.step)',
        location: `${spec.file}:${spec.line}`,
        status: t.status,
        hint: hint(t.status, message),
        message: message.slice(0, 200),
      });
    }
  }
}

const esc = (s) => String(s).replace(/\|/g, '\\|');
const lines = [
  '# Test triage',
  '',
  `${rows.length} of ${total} tests need attention.`,
  '',
];
if (rows.length) {
  lines.push(
    '| Scenario | Requirement | Criteria | Failing step | First-pass hint | Error | Location |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) =>
      `| ${esc(r.scenario)} | ${r.reqs} | ${r.acs} | ${esc(r.step)} | ${r.hint} | ${esc(r.message)} | ${r.location} |`,
    ),
  );
}
writeFileSync(output, lines.join('\n') + '\n');
console.log(lines.join('\n'));
