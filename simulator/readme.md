# Federal Budget Simulator — App Specification

## Overview

A single-page HTML/CSS/JS application that lets 12 students simulate fixing the U.S. federal deficit. Students are assigned income cards and can propose changes to tax policy and government spending. The app tracks the fiscal impact of every change in real time, shows a running deficit/surplus total, and automatically reflects job losses when programs are cut — including indirect job losses in the private sector.

Everything lives on **one screen** with no scrolling required. Use a dense, dashboard-style layout with panels.

---

## Layout — One Screen, Four Panels

```
+---------------------------+----------------------------+
|   REVENUE PANEL           |   SPENDING PANEL           |
|   (left column)           |   (right column)           |
|                           |                            |
|   Tax revenue sources     |   Program spending         |
|   Flat vs progressive     |   breakdown by subgroup    |
|   toggles + sliders       |   with sliders             |
+---------------------------+----------------------------+
|   DEFICIT / SURPLUS BAR   |   (spans full width)       |
|   Running total           |   Big bold number          |
+---------------------------+----------------------------+
|   JOBS PANEL              |   (spans full width)       |
|   12 student cards        |   Tax owed auto-updates    |
|   Job status indicators   |   Lost job = visual change |
+-------------------------------------------------------+
```

---

## Panel 1 — Revenue Panel (Top Left)

### Purpose
Shows all sources of federal tax revenue. Each source can be adjusted. Flat taxes can be converted to progressive taxes and vice versa.

### Revenue Sources to Include

Use approximate FY2024 federal revenue figures:

| Source | Base Amount | Type | Adjustable? |
|---|---|---|---|
| Individual Income Tax | \$2,400B | Progressive | Yes |
| Payroll Tax — Social Security | \$1,100B | Flat (6.2% up to \$184,500 cap) | Yes |
| Payroll Tax — Medicare | \$400B | Flat (1.45%) | Yes |
| Corporate Income Tax | \$530B | Flat (21%) | Yes |
| Excise Taxes | \$90B | Flat | Yes |
| Estate & Gift Tax | \$35B | Progressive | Yes |
| Customs / Tariffs | \$77B | Flat | Yes |
| Other Revenue | \$268B | — | Yes |

**Total Baseline Revenue: ~\$4,900B**

### Controls Per Revenue Source

Each revenue source row should have:
- **Label** — name of the tax
- **Type badge** — toggleable pill button: `FLAT` or `PROGRESSIVE`
  - Toggling changes the tax type and applies a revenue multiplier (progressive generally raises more from high earners; use a configurable multiplier, e.g. switching corporate tax from flat to progressive increases yield by ~15%)
- **Rate slider or input** — adjust the rate (e.g. corporate tax from 21% up or down)
- **Revenue display** — live dollar amount in billions, updates as rate changes
- **% of total revenue** — small label showing share of total

### Progressive vs Flat Toggle Behavior

When a tax is toggled from flat to progressive (or vice versa):
- Apply a revenue multiplier to reflect the structural change
- Show a small tooltip or note explaining the impact
- The jobs panel should reflect any income tax changes automatically

---

## Panel 2 — Spending Panel (Top Right)

### Purpose
Shows federal spending broken into program categories with subgroups. Each subgroup has a slider to cut or increase spending. Cuts beyond a threshold trigger job losses in the Jobs Panel.

### Spending Categories and Subgroups

Use approximate FY2024 figures. All amounts in billions.

#### 🪖 Defense & Military — \$872B total
| Subgroup | Amount |
|---|---|
| Active military personnel & salaries | \$180B |
| Operations & maintenance | \$280B |
| Weapons procurement | \$170B |
| Military research & development | \$130B |
| Veterans benefits & healthcare | \$112B |

#### 🏥 Health Programs — \$1,700B total
| Subgroup | Amount |
|---|---|
| Medicare (elderly healthcare) | \$860B |
| Medicaid (low-income healthcare) | \$590B |
| ACA subsidies & CHIP | \$250B |

#### 👴 Social Security — \$1,500B total
| Subgroup | Amount |
|---|---|
| Retirement benefits | \$1,100B |
| Disability benefits | \$260B |
| Survivor benefits | \$140B |

#### 🏫 Education — \$90B total
| Subgroup | Amount |
|---|---|
| K-12 federal funding (Title I etc.) | \$40B |
| Pell Grants & higher education | \$30B |
| Special education (IDEA) | \$20B |

#### 🛣️ Infrastructure & Transportation — \$115B total
| Subgroup | Amount |
|---|---|
| Highway & road funding | \$60B |
| Public transit & rail (Amtrak) | \$25B |
| Airports & aviation (FAA) | \$20B |
| Water infrastructure | \$10B |

#### 🔬 Science & Environment — \$60B total
| Subgroup | Amount |
|---|---|
| NASA | \$25B |
| National Institutes of Health (NIH) | \$20B |
| EPA & environmental programs | \$15B |

#### 🌍 International & Foreign Aid — \$78B total
| Subgroup | Amount |
|---|---|
| Foreign economic assistance | \$35B |
| Diplomatic & State Dept operations | \$28B |
| International security assistance | \$15B |

#### 🏛️ Government Operations — \$150B total
| Subgroup | Amount |
|---|---|
| IRS & tax collection | \$14B |
| Federal courts & justice system | \$40B |
| Congress & executive branch | \$10B |
| General Services Administration | \$36B |
| Other federal agencies | \$50B |

#### 💸 Interest on National Debt — \$1,127B total
| Subgroup | Amount |
|---|---|
| Interest on debt held by public | \$909B |
| Interest on intragovernmental debt | \$218B |
> Note: Interest is **not adjustable** via slider — it can only be reduced by running a surplus over time. Display it as locked/read-only with an explanatory tooltip.

**Total Baseline Spending: ~\$6,900B**

### Controls Per Spending Subgroup

Each subgroup row should have:
- **Label** — program name
- **Slider** — range from 0% (eliminated) to 150% (50% increase) of baseline
- **Dollar amount** — live display in billions
- **Change indicator** — colored +/- badge showing change from baseline
- **Job impact zone** — icon or indicator that lights up when cuts cross thresholds (see Job Loss Thresholds below)

---

## Panel 3 — Deficit / Surplus Bar (Middle, Full Width)

### Purpose
Real-time fiscal scorecard. Always visible. Big and bold.

### Display Elements

- **Baseline deficit**: \$2,000B (\$2 trillion) — shown as anchor
- **Current deficit/surplus**: Large number, updates live
  - Red = deficit
  - Green = surplus
- **Progress bar**: Visual bar showing how close to balance
- **Change from baseline**: +/- from the \$2T starting deficit
- **Breakdown**: Small text showing "Revenue: \$X | Spending: \$X | Gap: \$X"

---

## Panel 4 — Jobs Panel (Bottom, Full Width)

### Purpose
Shows all 12 student cards. Each card auto-calculates tax owed based on current tax policy. Cards dim or show a "JOB LOST" indicator when their program is cut enough.

### The 12 Student Cards

| # | Name/Role | Income | Sector | Tied To |
|---|---|---|---|---|
| 1 | Part-time retail worker | \$22,000 | Private | Medicaid (uses it) |
| 2 | Warehouse worker | \$38,000 | Private | Medicaid (uses it) |
| 3 | Public school teacher | \$54,000 | Government | Federal education funding (indirect) |
| 4 | Registered nurse | \$85,000 | Private | Medicare/Medicaid (employer revenue) |
| 5 | Software engineer | \$140,000 | Private | None direct |
| 6 | Physician | \$320,000 | Private | Medicare/Medicaid (employer revenue) |
| 7 | Business owner | \$900,000 | Private | General economy |
| 8 | Hedge fund manager | \$4,000,000 | Private | Capital gains tax rate |
| 9 | Billionaire | \$3,000,000,000 | Private | Capital gains / wealth tax |
| 10 | Military contractor | \$48,000 | Government | Defense — Operations & Maintenance |
| 11 | Medicaid caseworker | \$42,000 | Government | Medicaid |
| 12 | National Park ranger | \$36,000 | Government | Science & Environment / Interior |

### Per-Card Display

Each card shows:
- **Name / role label**
- **Income** (assigned, fixed)
- **Est. federal income tax owed** — calculated live based on current bracket settings
- **Effective tax rate** — calculated live
- **Job status indicator** — Normal / AT RISK / JOB LOST
- **Program dependency note** — small text e.g. "Depends on: Medicaid"

### Tax Calculation Logic

For each card, calculate federal income tax using the current bracket settings from the Revenue Panel. The app should:

1. Use the current bracket rates (which change if sliders are adjusted)
2. Apply the standard deduction (\$16,100 for single filer, 2026)
3. Calculate tax bracket by bracket
4. Display total tax owed and effective rate

For investment/capital gains income (cards 8 and 9):
- Default: long-term capital gains rates (0% / 15% / 20%)
- If user toggles capital gains to be taxed as ordinary income, recalculate at regular brackets

### Job Loss Thresholds

Jobs are lost when spending on linked programs is cut below a threshold. Use these rules:

| Card | Job Lost When... | Also show indirect losses |
|---|---|---|
| Card 10 (military contractor) | Operations & Maintenance cut >20% | Also: nearby restaurant loses a customer — show tooltip "3 local businesses affected" |
| Card 11 (Medicaid caseworker) | Medicaid cut >15% | Also: Card 1 and Card 2 lose healthcare coverage — highlight their cards |
| Card 12 (Park ranger) | Science/Environment cut >25% | Also: nearby tourism businesses affected — tooltip |
| Card 4 (nurse) | Medicare + Medicaid combined cut >30% | Hospital loses funding, nurse laid off |
| Card 3 (public school teacher) | Federal education cut >40% | Indirect — competing public schools get cheaper, public school loses students |

### Indirect Job Loss — Restaurant / Business Ripple Effect

When a government job is lost, show a small ripple panel near the card:
- A tooltip or pop-out that says e.g.: *"When a military base loses \$1B in operations funding, an estimated 3,000 civilian jobs in surrounding communities are also lost — restaurants, shops, contractors."*
- Use real approximate multiplier: every \$1B cut in defense = ~3,000–5,000 indirect civilian jobs lost (use DoD economic impact estimates)

---

## Technical Architecture

### Stack
- **Pure HTML / CSS / JavaScript** — no frameworks, no build tools
- Single `.html` file — open directly in browser or VS Code Live Server
- No external dependencies except optionally one CDN font

### JavaScript Architecture

```javascript
// Core state object
const state = {
  revenue: {
    individualIncomeTax: { amount: 2400, rate: null, type: 'progressive' },
    socialSecurity: { amount: 1100, rate: 6.2, cap: 184500, type: 'flat' },
    medicare: { amount: 400, rate: 1.45, type: 'flat' },
    corporateIncomeTax: { amount: 530, rate: 21, type: 'flat' },
    // ... etc
  },
  spending: {
    defense: {
      personnel: { amount: 180, baseline: 180 },
      operations: { amount: 280, baseline: 280 },
      // ... etc
    },
    // ... etc
  },
  students: [
    { id: 1, role: 'Retail worker', income: 22000, sector: 'private', dependsOn: 'medicaid' },
    // ... etc
  ]
}

// Core calculation functions
function calculateTotalRevenue() { ... }
function calculateTotalSpending() { ... }
function calculateDeficitSurplus() { ... }
function calculateStudentTax(student) { ... }
function checkJobLossThresholds() { ... }
function updateAllDisplays() { ... }

// Called on every slider/toggle change
function onStateChange() {
  calculateTotalRevenue()
  calculateTotalSpending()
  calculateDeficitSurplus()
  updateAllDisplays()
  checkJobLossThresholds()
}
```

### Tax Bracket Calculation Function

```javascript
// 2026 brackets for single filer
const brackets2026 = [
  { min: 0, max: 12400, rate: 0.10 },
  { min: 12400, max: 50400, rate: 0.12 },
  { min: 50400, max: 105700, rate: 0.22 },
  { min: 105700, max: 201775, rate: 0.24 },
  { min: 201775, max: 256225, rate: 0.32 },
  { min: 256225, max: 640600, rate: 0.35 },
  { min: 640600, max: Infinity, rate: 0.37 },
]

const STANDARD_DEDUCTION = 16100

function calculateIncomeTax(grossIncome, brackets) {
  const taxableIncome = Math.max(0, grossIncome - STANDARD_DEDUCTION)
  let tax = 0
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
    tax += taxableInBracket * bracket.rate
  }
  return tax
}
```

### Progressive Toggle Multiplier Logic

When toggling a flat tax to progressive, apply a revenue multiplier:
```javascript
const progressiveMultipliers = {
  corporateIncomeTax: 1.15,  // progressive corporate raises ~15% more
  socialSecurity: 1.35,      // removing the cap raises ~35% more
  exciseTax: 0.92,           // progressive excise slightly less efficient
}
```

---

## Visual Design Notes

- **Color scheme**: Dark background (policy/government feel), with green for surplus, red for deficit, amber for warning states
- **Font**: Something authoritative — suggest `IBM Plex Mono` or `Courier Prime` for numbers, clean sans for labels
- **Dense but readable**: This is a dashboard, not a landing page. Information density is a feature, not a bug
- **Job cards**: Should feel like physical cards — slight shadow, rounded corners, status badge in top corner
- **Deficit bar**: Should be the most visually prominent element — the "score" of the game
- **Sliders**: Custom styled, color coded by category (defense = olive/khaki, health = blue, education = yellow, etc.)
- **Tooltips**: Used extensively for explaining indirect effects and policy nuance

---

## Suggested File Structure

```
budget-simulator/
│
├── index.html          ← entire app lives here
├── style.css           ← all styles (or inline in index.html)
├── app.js              ← all logic (or inline in index.html)
└── README.md           ← this file
```

If keeping everything in one file (recommended for simplicity):
```
index.html
  ├── <style> block — all CSS
  ├── <body> — all HTML panels
  └── <script> block — all JS
```

---

## Key Interactions Summary

| User Action | What Updates |
|---|---|
| Move any revenue slider | Revenue total, deficit bar, all student tax cards |
| Toggle flat ↔ progressive | Revenue total, deficit bar, student tax cards, type badge |
| Move any spending slider | Spending total, deficit bar, job loss thresholds |
| Spending cut crosses threshold | Student card status changes to AT RISK or JOB LOST |
| Hover job lost card | Tooltip shows indirect business losses |
| Spending increased above baseline | Cards recover, status returns to normal |

---

## Stretch Features (Optional, Build Later)

- **Reset button** — returns all sliders to baseline
- **Scenario presets** — e.g. "Reagan-era tax cuts", "1990s Clinton surplus", "Post-2017 tax reform"
- **Export summary** — print or download a summary of the student's proposed budget
- **Animated deficit bar** — smooth transitions as numbers change
- **Class vote mode** — average all 12 students' proposals into one combined result

---

## Data Sources for Verification

All dollar figures should be verified against:
- CBO: https://www.cbo.gov
- Treasury Fiscal Data: https://fiscaldata.treasury.gov
- Tax Foundation: https://taxfoundation.org
- IRS 2026 brackets: https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026

---

*This app is designed for classroom use in a 4-day tax education course for students with no prior financial or policy background. All numbers should be approximately real but rounded for clarity. The goal is intuition and debate, not accounting precision.*