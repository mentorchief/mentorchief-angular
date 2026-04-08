# Hardcoded Data Migration Checklist

## Completed in this pass

- Added canonical ERD-driven selectors in `src/app/store/data-flow.selectors.ts`
- Added lifecycle status actions for subscriptions:
  - submit report
  - approve report
  - complete subscription
  - cancel subscription
- Added reducer guards for status transitions in `subscriptions.reducer.ts`
- Linked report submission to `subscriptionId` from mentor report form
- Replaced public-page mentor lists with selector-driven profiles:
  - browse mentors
  - landing featured mentors
  - mentor reviews lookup
  - mentor profile lookup/user join
- Replaced hardcoded mentor dashboard average rating with review-derived value

## Remaining migration tasks

- Remove remaining static domain defaults in public profile cards:
  - response time fallback (`N/A`) should be selector-computed when data model exists
  - sessions currently projected from bootstrap catalog where available
- Normalize payments and reports into fully separate entity slices (`payments`, `reportDetails`)
- Move pending-request/pending-subscription merge logic into selectors only
- Replace legacy status labels with final canonical status enum mapping everywhere

## Regression checks

- Build must pass (`ng build --configuration=development`)
- Lint must pass on modified files
- Cross-page consistency:
  - mentor active count == my mentees active rows == mentor messages active conversations
  - mentor pricing on profile matches store user plans
