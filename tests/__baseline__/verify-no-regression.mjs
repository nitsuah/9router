// Gate: so kết quả test hiện tại với baseline known-fails.
// PASS nếu KHÔNG có test nào pass(baseline) → fail(now). Test mới được phép.
// Usage: node tests/__baseline__/verify-no-regression.mjs <current-results.json>
import { readFileSync } from "fs";

const knownFails = new Set(
  readFileSync(new URL("./known-fails.txt", import.meta.url), "utf8")
    .split("\n").map(s => s.trim()).filter(Boolean)
);

const resultsPath = process.argv[2];
if (!resultsPath) { console.error("Missing results.json path"); process.exit(2); }

const r = JSON.parse(readFileSync(resultsPath, "utf8"));
const normalizeTestFile = (name) => {
  if (typeof name !== "string") return null;
  // Jest-style JSON reports may use /app/... in Docker or the GitHub runner's
  // /home/runner/work/<repo>/<repo>/... path. Baseline entries are repo-relative.
  const normalized = name.replace(/\\\\/g, "/");
  const testsIndex = normalized.lastIndexOf("/tests/");
  if (testsIndex >= 0) return normalized.slice(testsIndex + 1);
  if (normalized.startsWith("tests/")) return normalized;
  return normalized.split("/app/")[1] || normalized;
};

const nowFails = r.testResults.flatMap(f => {
  const testFile = normalizeTestFile(f.name);
  return f.assertionResults
    .filter(a => a.status === "failed")
    .map(a => (testFile ? testFile + " :: " : "") + a.fullName);
});

// Regression = fail bây giờ NHƯNG không có trong baseline known-fails
const regressions = nowFails.filter(f => !knownFails.has(f));

if (regressions.length) {
  console.error(`\n❌ REGRESSION: ${regressions.length} test pass→fail:\n`);
  regressions.forEach(f => console.error("  - " + f));
  process.exit(1);
}
console.log(`✅ No regression. (now fails=${nowFails.length}, baseline known=${knownFails.size}, all known)`);
