# Trek data (spreadsheets)

> **The admin panel is now the main way to add and edit this data** (sign in, then open /admin). These CSV files are an optional way to bulk-load or back up data. Importing never deletes records unless you pass `--prune`, so it is safe to use alongside the panel.

Durations, permits and costs come from **CSV files you fill in**, not from code. Every row must say
where the figure came from and when it was checked. The importer refuses the whole import if any row
is missing that, so a published number can always be traced to a source.

## How to use

1. Copy the files from `templates/` into this folder (`treks.csv`, `permits.csv`, `costs.csv`).
   You can open and edit them in Excel or Google Sheets and save as **CSV (UTF-8)**.
2. Fill them in (rules below). You may skip a file; a file that exists replaces its table.
3. Check without writing anything: `pnpm db:import-trek-data --dry-run`
4. Import: `pnpm db:import-trek-data`

Every problem is reported with its file and row number, and nothing is imported until all are fixed.

## Rules for every row

| Column | Rule |
|---|---|
| `sourceName` | Who published the figure, e.g. the organisation or the document title. Required. |
| `sourceUrl` | A full link (`https://...`) where the figure can be checked. Required. |
| `verifiedAt` | The date you checked it, as `YYYY-MM-DD`. Required, cannot be in the future. Rows over 18 months old import with a warning. |

- Amounts are whole numbers in **NPR** (no commas, no currency symbol).
- Slugs are lowercase words joined by dashes and unique within a file.
- Do not guess. If you do not have a source for a figure, leave the row out.

## treks.csv

One row per trek.

| Column | Meaning |
|---|---|
| `slug` | Short id, lowercase with dashes. Used by the other files. |
| `name`, `region` | Display name and region (e.g. the area of Nepal). |
| `trailName` | Optional. Must exactly match the name of a trail on the map (for example the name shown when you click a trail). Leave blank for treks with no mapped trail yet. |
| `minDays`, `maxDays` | Typical duration range in days (`maxDays` cannot be smaller than `minDays`). |
| `highestPointM` | Optional. Highest point of the whole trek in metres, from the source. If blank, the partly mapped trail is used, which can understate it. |
| `startPlace`, `endPlace`, `notes` | Optional text. |

## permits.csv

One row per permit or fee.

| Column | Meaning |
|---|---|
| `slug`, `name`, `authority` | Id, permit name and who issues it. |
| `appliesTo` | Where it applies, in words (for example the conservation area or national park). |
| `amountNpr`, `unit` | Amount and what it is charged per: `PER_PERSON`, `PER_PERSON_PER_DAY` or `PER_GROUP`. |
| `trekSlugs` | Treks it applies to, separated by `;` (every slug must exist in `treks.csv`). |
| `notes` | Optional conditions, such as who it applies to. |

## costs.csv

One row per price.

| Column | Meaning |
|---|---|
| `slug`, `label` | Id and a readable description. |
| `category` | `GUIDE_DAILY`, `PORTER_DAILY`, `FOOD_DAILY`, `LODGING_BUDGET`, `LODGING_STANDARD`, `LODGING_COMFORT`, `TRANSPORT` or `OTHER`. |
| `amountNpr`, `unit` | Amount and what it is charged per: `PER_DAY`, `PER_NIGHT`, `PER_PERSON` or `PER_TRIP`. |
| `trekSlug` | Leave blank for a general rate that applies to every trek, or give a trek slug for a trek-specific rate (which takes priority). |
| `notes` | Optional. |
