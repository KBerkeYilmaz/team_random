import mongoose, { Schema, model, models, type Model } from "mongoose";

// Phase 3 (TypeScript migration): typed Mongoose model. `IMember` mirrors the
// schema field-for-field; `createdAt`/`updatedAt` come from `{ timestamps: true }`.
// Type-only annotation — schema definition and runtime behaviour are unchanged
// from the pre-Phase-3 `models/member.js`.
export interface IMember {
  memberName: string;
  memberLastName: string;
  memberTitle: string;
  memberBio?: string;
  memberGithub?: string;
  memberPersonal?: string;
  memberLinkedin?: string;
  memberImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    memberName: {
      type: String,
      required: true,
    },
    memberLastName: {
      type: String,
      required: true,
    },
    memberTitle: {
      type: String,
      required: true,
    },
    memberBio: {
      type: String,
      required: false,
    },
    memberGithub: {
      type: String,
      required: false,
    },
    memberPersonal: {
      type: String,
      required: false,
    },
    memberLinkedin: {
      type: String,
      required: false,
    },
    memberImage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

const Member =
  (models.Member as Model<IMember>) || model<IMember>("Member", memberSchema);

export default Member;
