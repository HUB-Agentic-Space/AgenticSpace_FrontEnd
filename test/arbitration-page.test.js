import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";

describe("Frontend — DAO CAS Token Arbitration Page", () => {
  const pagePath = path.resolve(__dirname, "..", "src", "app", "dao", "cas-token", "page.js");

  it("should have the cas-token arbitration page file", () => {
    expect(fs.existsSync(pagePath), `Expected page at ${pagePath}`).to.be.true;
  });

  it("should be a client component", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("'use client'");
  });

  it("should import DIAMOND_ADDRESS and CAS_TOKEN_ADDRESS", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("DIAMOND_ADDRESS");
    expect(content).to.include("CAS_TOKEN_ADDRESS");
  });

  it("should define ARBITRATION_ABI with getCase, getCaseCount and voting periods", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("getCaseCount");
    expect(content).to.include("getCase");
    expect(content).to.include("votingPeriod");
    expect(content).to.include("disclosureDeadline");
  });

  it("should have translations for pt, en, and fr", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("pt:");
    expect(content).to.include("en:");
    expect(content).to.include("fr:");
  });

  it("should have auto-refresh functionality", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("autoRefresh");
    expect(content).to.include("setInterval");
  });

  it("should have 3 voting periods (Disclosure, Voting, Result)", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("PERIOD_LABELS");
    expect(content).to.include("Megaphone");
    expect(content).to.include("Lock");
    expect(content).to.include("Unlock");
  });

  it("should link back to /dao", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include('href="/dao"');
  });

  it("should use Rapport color palette CSS variables", () => {
    if (!fs.existsSync(pagePath)) return;
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).to.include("var(--color-bg-main)");
    expect(content).to.include("var(--color-primary)");
    expect(content).to.include("var(--color-text-main)");
  });
});
