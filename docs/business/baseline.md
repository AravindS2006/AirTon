# Commercial and financial baseline - 2026-10-04

First target: home IOP monitoring for patients already under a doctor's care.
Company incorporation, actual financing, purchase orders, invoices, executed
clinic agreements, regulatory approval and commercial launch remain unverified.

## Historical numbers and reconciliation

The June2025 Financial Budget Sheet is a planning workbook with multiple budget
variants and template carryover names. It is not an audited account. The July
deck and August pitch use different assumptions.

| Input | Recovered source | Correct interpretation / conflict |
|---|---|---|
| Prototype cost approx INR7,000 | August2025 pitch | Reported cost; no itemized quoted/as-built BOM recovered |
| Grant/project budget INR5lakh | August2025 pitch | Proposed; listed ranges total INR4.30-5.00lakh, so5lakh is upper case |
| Startup INR6.40lakh | First Sheet budget | Alternative planning scenario |
| Startup INR13lakh | Second Sheet budget | Planning scenario, not cash raised |
| Equity / loan INR5.50/7.50lakh | Sheet | Conflicts with deck3.50/9.50lakh funding mix |
| Price / COGS INR35,000/25,000 | Sheet/deck | Forecast unit assumptions;10,000 contribution=28.57% of hardware price |
| Monthly units5,8,10,13,17,19,17,20,16,17,18,20 | Sheet | Sum is200, despite stated total180 |
| Hardware revenue | Monthly rows |200*35,000=INR70lakh; stated63lakh corresponds to180units |
| Hardware COGS | Monthly rows |200*25,000=INR50lakh; stated45lakh corresponds to180units |
| Consulting20,000/month | Sheet | INR2.40lakh/year; delivery cost/contract evidence absent |
| Fixed expenses | Sheet | Monthly entries sum INR12.59lakh |
| Hardware profit before other omitted costs | Correct200unit case |20lakh-12.59lakh=INR7.41lakh |
| Stated net profit5.41lakh | Sheet | Matches180unit hardware case; excludes consulting contribution |
| Hardware-only break-even |35k price/25k cost/12.59lakh fixed |125.9=>126units; approximate revenue44.065lakh |
| Named salary founders in workbook | Sheet template | Names differ from team; not a verified personnel/payroll record |

The old deck-only analysis accepted the displayed180unit total. Access to the
actual monthly Sheet now establishes the200unit sum and supersedes that narrow
conclusion. Both scenarios are retained in
[forecast configuration](../../business/financial-assumptions.json) and generated
by [the scenario script](../../scripts/financial_scenarios.py). Results are
arithmetic scenarios, not forecasts validated by customers.

The INR25,000 COGS is not reconciled with the component rows:17,000raw material,
1,000packaging and2,000labour sum20,000, while a displayed 'Total Variable Costs'
row says5,000. Clarify whether categories overlap and include yield/calibration/
service before making pricing commitments.

## First commercial pathway to evaluate

A clinic-managed loan/rental pathway may reduce upfront patient cost and improve
training/service control. Compare it with direct device purchase using actual
device lifetime, utilization, loss, cleaning/return, calibration, support and
replacement estimates. Treat clinician review fees separately; connected reports
do not establish reimbursable services or a doctor's availability.

Proposed discovery needs: established glaucoma/ocular-hypertension care context,
doctor reasons for home measurement, patient/caregiver usability, frequency and
care-plan workflow, rental vs purchase preference, support willingness, clinic
review workload and alternative measurements. Existing21/25respondent summaries
are concept feedback, not home-use outcome or representative demand evidence.

Use [cost/market planning](cost-and-market.md) for a sourced bottom-up approach.
Define eligible supported patients, prescribing clinics, adoption constraints,
service capacity and actual sales channel. Disease prevalence is not automatically
the addressable purchasing market. Current supplier or competitor prices require
dated attributable quotes; none are invented here.

## Startup records and priorities

Preserve founder agreements, equity/IP assignments, institutional rights, company
registration and any grants/contracts in controlled private records with
non-sensitive index metadata. Establish device liability/service responsibilities,
terms, privacy, study contracts, accounting and actual expense receipts.

Fund measurement feasibility and home-use evidence before scaling marketing.
A pitch timeline or a prototype's low component cost is not a validated total
product cost. Manufacturing yield, calibration fixtures, electrical/optical tests,
clinical work, quality/regulatory support, warranty and replacements can dominate
early economics. Record new assumptions separately from the historical baseline.
