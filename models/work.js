import mongoose from "mongoose";
const { Schema } = mongoose;

const workSchema = new mongoose.Schema(
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
    workImages: [{
      type: String,
      required: true,
    }],
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
  { timestamps: true }
);

const Work = mongoose.models.Work || mongoose.model("Work", workSchema);

export default Work;
