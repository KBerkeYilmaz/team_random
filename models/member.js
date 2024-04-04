import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
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
      unique: true,
    },
    memberPersonal: {
      type: String,
      required: false,
      unique: true,
    },
    memberLinkedin: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export default Member;
