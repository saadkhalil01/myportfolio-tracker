# MyPortfolio

A personal investment dashboard that replaces the "MyPortFolio" Google Sheet.

## Features

- Editable investment categories with auto-calculated gain and change %
- Summary stats: overall investment, current valuation, profit/loss, dividend reinvested, yield on cost
- Allocation donut, investments vs liabilities, and invested vs valuation charts
- Liabilities list with total, targets (Car 2030, House 2035), and savings goals (Qurbani 2027)
- Data auto-saves to your browser (localStorage), with JSON export/import for backup

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Build for production

```bash
npm run build
```

The static site is output to `dist/` and can be hosted anywhere (or opened via `npm run preview`).
