import mongoose from "mongoose";

const summarySchema = new mongoose.Schema(
  {
    sessionid: {
      type: String,
      required: true,
      index: true
    },

    documentId: {
      type: String,
      required: true,
      index: true
    },

    // documentName: {
    //   type: String,
    //   required: true
    // },

    offset: {
      type: Number,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    progress: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Summary", summarySchema);