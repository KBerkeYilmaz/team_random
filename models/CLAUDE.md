# models/ — Mongoose models

Read before adding or editing a model. Domain data moves to Prisma/Postgres in a later
phase (see `docs/migration/plan.md`); until then these Mongoose models are the domain
layer.

## Files
- `member.ts` — `Member` (`interface IMember`): name/last-name/title required; bio,
  links and image optional; `timestamps: true`.
- `work.ts` — `Work` (`interface IWork`).

## Conventions
- **Registration guard** (avoids `OverwriteModelError` under HMR / serverless):
  `const X = (models.X as Model<IX>) || model<IX>("X", xSchema);`. Reuse this exact
  pattern for every model.
- Interfaces are exported type-only; schemas are typed `Schema<IX>`.
- Access models through `connectDB()` (`lib/database.ts`) — never call
  `mongoose.connect()` per request.

## Gotcha / flag
- **`work.workContributors` is a plain `String`** (free text), *not* a `Member`
  `ObjectId` ref. The ref version sits commented out directly above it with a deferred
  data-model flag — there is **no `.populate()`**. Don't write code that assumes it's a
  populated relation. `workImages` is a `String[]`.
