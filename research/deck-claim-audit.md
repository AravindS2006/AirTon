# Audit of the supplied AirTon deck

Source: 38-page supplied deck, filename dated 2025-07-03. Page numbers below are
PDF page numbers. Original language and figures remain preserved in the PDF.
This audit records evidence strength; it does not rewrite the historical artifact.

| Page(s) | Deck statement or artifact | Assessment | Repository treatment |
|---|---|---|---|
| 3-5, 18 | Portable, affordable, non-contact air-puff IOP measurement | Product goal; measurement performance not documented | Preserve as proposed requirement; verify bench and clinical agreement separately |
| 4-5, 11-12 | Glaucoma detection depends on high IOP / IOP measurement | Incomplete clinical framing; normal-pressure glaucoma exists (S01) | Distinguish pressure monitoring from multimodal glaucoma assessment |
| 4, 15, 18 | Interference patterns ensure precision / higher accuracy | Optical geometry, coherent source, detection, data and calibration absent | Feasibility hypothesis with a go/no-go experiment |
| 13 | Pi 4, pump, valve, sensor, optical system, app and portal | Conceptual block diagram | Add independent safety/timing controller, quality gate, provenance and offline delivery requirements |
| 19 | Simultaneous dual-eye measurement improves accuracy | Product ambition; no bilateral comparison provided | Prove one channel first; evaluate sequential and simultaneous workflows later |
| 20 | Proteus screenshot displays IOP 17 mmHg, normal | Figure shows Arduino UNO and BMP180; no editable circuit, code, transfer model or paired reference readings | Simulation illustration only; pressure value and normal label are not validation |
| 23 | Fundus images with glaucoma probabilities, DR/AMD outputs | UI demonstration; model provenance, modality and evaluation absent | Fundus research is a separate path; no disease probabilities reproduced |
| 6-7 | Interview count 21 and response percentages | Reported discovery sample; raw anonymized responses unavailable | Not a prevalence estimate or clinical study; require denominators per question |
| 24-25 | MVP validation from 25 respondents / 3D model | Concept/usability feedback, not clinical accuracy or safety | Preserve reported counts; clinical evaluation requires its own protocol |
| 8 | TAM 62.9 million; SAM described as 50% = 18.87 million | Unsourced population assumptions and arithmetic inconsistency: half is 31.45 million | Withdraw as verified market sizing; rebuild from geography, care pathway and payer data |
| 14-16 | iCare characterized as non-contact | Rebound measurement uses a probe (S08) | Correct comparator modality |
| 14 | Keeler PSL One characterized as non-contact tonometer | Portable slit lamp (S09) | Remove from direct tonometer comparison |
| 14-16 | INR prices, acceptance ratings, superiority | No attributable quotes, dates or rating methodology | Historical assumptions only; obtain dated authorized supplier quotes |
| 18, 26, 31 | Under INR 50,000; other prices INR 20-30k / 25k / 40k / 25-35k | Multiple positioning targets | Select one approved total-cost target after feasibility and BOM review |
| 15, 18, 26 | Screen time and eye strain define glaucoma target group | No supporting evidence established in this review | Do not use as eligibility or a risk label |
| 27 | Final product and regulatory approvals in months 1-3 | Unsupported schedule | Use evidence-dependent stage gates |
| 28, 32-33 | 4,860 annual funnel customers versus 180 unit sales | Different assumptions not reconciled | Separate leads, qualified clinics, conversion and actual unit sales |
| 31 | INR 3.5 lakh equity + INR 9.5 lakh loans; text totals INR 6 lakh | Arithmetic error: sum is INR 13 lakh | Retain historical budget; annotate discrepancy |
| 32-35 | Consulting revenue folded into hardware unit economics | Mixed denominators and margin definitions | Separate hardware contribution and service P&L |
| 35 | Monthly 8 to 7 customers, churn 12.5; lifespan 0.08 | Percent/fraction inconsistency; 12.5% churn = 0.125, simple reciprocal = 8 periods | Rebuild assumptions; no confirmed CLV or CAC |
| 23 | Four paper citations | Bibliographic checks below | Use corrected records or mark unverified |

## Reference reconciliation

1. **On imaging based non-contact tonometer for intraocular pressure measurement**:
   exact-title search did not corroborate the deck's Koirala/Shrestha, 2012,
   Manchester citation. A similarly titled 2013 proceedings listing exists with
   different authors. Keep the deck reference unverified until an original DOI
   or paper is supplied; do not substitute a similarly named paper automatically.
2. **Intraocular Pressure Monitoring Using IoT**, Kodali/Mandal, 2022: no primary
   record was established by this review. Bibliographic verification remains open.
3. **Understanding eye deformation in non-contact tonometry**: PubMed identifies
   Kempf and colleagues, 2006, pages 5428-5431, DOI 10.1109/IEMBS.2006.259905
   (S04), rather than the deck's 2008 author/page details.
4. **Intraocular Pressure Monitoring System for Glaucoma Patients Using IoT and
   Machine Learning**: DOI 10.3390/engproc2023059179 resolves to a January 2024
   publication in a 2023 proceedings volume with four authors including Revathy
   Gurumurthy (S30). Treat it as related prototype work, not a validated AirTon
   pressure-to-IOP conversion.

The absence of source design files or raw results means these artifacts are
unavailable in this workspace; it does not establish that the team never made them.
