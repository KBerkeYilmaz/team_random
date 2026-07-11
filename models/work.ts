import mongoose, { Schema, model, models, type Model } from "mongoose";

// Phase 3 (TypeScript migration): typed Mongoose model. `IWork` mirrors the
// schema field-for-field; `createdAt`/`updatedAt` come from `{ timestamps: true }`.
// This is a type-only annotation — the schema definition and runtime behaviour are
// unchanged from the pre-Phase-3 `models/work.js`.
export interface IWork {
  workTitle: string;
  workReadme: string;
  workTechStack: string;
  workGithubURL?: string;
  workAppURL?: string;
  workImages?: string[];
  // FLAG (Phase 3): `workContributors` is kept as a plain String. The
  // commented-out `Schema.Types.ObjectId` ref to `Member` (below) would make this
  // a relational field, but switching it on is a *data-model* change — it requires
  // population and a one-time data migration — which is out of scope for a
  // type-only migration. Recorded here so it is not silently "fixed".
  workContributors?: string;
  createdAt: Date;
  updatedAt: Date;
}

const workSchema = new Schema<IWork>(
  {
    workTitle: {
      type: String,
      required: true,
    },
    workGithubURL: {
      type: String,
      required: false,
    },
    workAppURL: {
      type: String,
      required: false,
    },
    workReadme: {
      type: String,
      required: true,
    },
    workImages: [
      {
        type: String,
        required: true,
      },
    ],
    workTechStack: {
      type: String,
      required: true,
    },
    // workContributors: [{
    //   type: Schema.Types.ObjectId,
    //   ref: 'Member',
    //   required: false,
    // }],
    workContributors: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const Work = (models.Work as Model<IWork>) || model<IWork>("Work", workSchema);

export default Work;
