# Runner-up idea: "Subscription detective"

A privacy-first web app: drop in a bank or credit-card CSV export and it finds every recurring charge — subscriptions, annual renewals, free trials that converted, price increases, duplicate billing, and ones you stopped using — then totals the yearly cost and gives a cancellation checklist. All parsing in-browser; no bank login (unlike Rocket Money, which links accounts through an aggregator).

Evidence: C+R Research survey (2022, via CNBC): 54% of consumers underestimated monthly subscription spending by ≥$100, average gap ~$133/month; 42% had forgotten a subscription they no longer used.
Competition: Rocket Money (bank-linked), ChargeSift (Chrome extension, local CSV), Subscription Killer (iOS, on-device), getfin (open-source Python CLI).
Spike: detector written blind; on a synthetic 5-account, 13-month held-out dataset (3 CSV layouts, messy descriptors): recall 0.68, precision 0.86, cadence correct 40/43, price increases found 6/6. Most misses were merchant-descriptor grouping (truncated/variant descriptors) — fixable with fuzzy clustering.
Demo: drag in a CSV → "You pay $1,140/yr across 14 recurring charges; 3 raised their price; 2 you may have forgotten."
