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
  { timestamps: true }
);

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export default Member;
