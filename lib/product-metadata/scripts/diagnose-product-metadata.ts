import { runProductMetadataDiagnostics, writeDiagnosticReport } from "../services/product-metadata-diagnostics";

function getArg(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArg(name: string) {
  return process.argv.includes(`--${name}`);
}

function render(report: Awaited<ReturnType<typeof runProductMetadataDiagnostics>>, reportPath: string) {
  console.log(`Product metadata diagnostics`);
  console.log(`Executed at: ${report.executedAt}`);
  console.log(`Cases: ${report.summary.cases} | Strategies: ${report.summary.strategies}`);
  console.log("");
  for (const entry of report.cases) {
    console.log(`Store: ${entry.storeId}`);
    console.log(`Case: ${entry.id}`);
    console.log(`URL type: ${entry.urlType}`);
    console.log(`URL: ${entry.url}`);
    for (const attempt of entry.strategies) {
      console.log(`Strategy: ${attempt.strategyId}`);
      console.log(`  duration: ${attempt.durationMs} ms`);
      console.log(`  status: ${attempt.status}${attempt.statusCode ? ` HTTP ${attempt.statusCode}` : ""}${attempt.errorCode ? ` ${attempt.errorCode}` : ""}`);
      console.log(`  title: ${attempt.foundFields.includes("title") ? "found" : "not found"}`);
      console.log(`  description: ${attempt.foundFields.includes("description") ? "found" : "not found"}`);
      console.log(`  image: ${attempt.foundFields.includes("imageUrl") ? "found" : "not found"}`);
      console.log(`  canonicalUrl: ${attempt.foundFields.includes("canonicalUrl") ? "found" : "not found"}`);
    }
    console.log(`Final result: ${entry.finalStatus}`);
    console.log(`  title: ${entry.fields.title ? "found" : "not found"}`);
    console.log(`  description: ${entry.fields.description ? "found" : "not found"}`);
    console.log(`  image: ${entry.fields.imageUrl ? "found" : "not found"}`);
    console.log(`  canonicalUrl: ${entry.fields.canonicalUrl ? "found" : "not found"}`);
    console.log("");
  }
  console.log("Field matrix");
  console.log("Store/Case                 TITLE       DESCRIPTION IMAGE       CANONICAL");
  for (const entry of report.cases) {
    const label = `${entry.storeId}/${entry.id}`.padEnd(26, " ");
    console.log(`${label}${entry.fields.title ? "SUCCESS" : "FAILED "}     ${entry.fields.description ? "SUCCESS    " : "FAILED     "}${entry.fields.imageUrl ? "SUCCESS" : "FAILED "}     ${entry.fields.canonicalUrl ? "SUCCESS" : "FAILED"}`);
  }
  console.log("");
  console.log("Store strategy matrix");
  const strategyIds = [...new Set(report.cases.flatMap((entry) => entry.strategies.map((strategy) => strategy.strategyId)))];
  console.log(`Store/Case                 ${strategyIds.map((id) => id.padEnd(16, " ")).join("")}`);
  for (const entry of report.cases) {
    const label = `${entry.storeId}/${entry.id}`.padEnd(26, " ");
    const row = strategyIds.map((id) => (entry.strategies.find((strategy) => strategy.strategyId === id)?.status ?? "skipped").toUpperCase().padEnd(16, " ")).join("");
    console.log(`${label}${row}`);
  }
  console.log("");
  console.log("Strategy summary");
  for (const strategy of report.strategies) {
    console.log(`${strategy.strategyId}: full ${strategy.fullSuccess}, partial ${strategy.partialSuccess}, failed ${strategy.failed}, timeouts ${strategy.timeouts}`);
    if (strategy.ineffective) console.log(`  Result: ineffective`);
  }
  if (report.comparison?.regressions.length) console.log(`REGRESSIONS: ${report.comparison.regressions.join("; ")}`);
  if (report.comparison?.improvements.length) console.log(`IMPROVEMENTS: ${report.comparison.improvements.join("; ")}`);
  console.log(`JSON report: ${reportPath}`);
}

async function main() {
  const report = await runProductMetadataDiagnostics({
    store: getArg("store"),
    strategy: getArg("strategy"),
    field: getArg("field") as any,
    shortLinksOnly: hasArg("short-links")
  });
  const reportPath = await writeDiagnosticReport(report);
  render(report, reportPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
