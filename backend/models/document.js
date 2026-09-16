import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
    },

    sessionid: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    selected: {
  type: Boolean,
  default: false,
},

    size: {
      type: Number,
      default: 0,
    },

    cloudinaryUrl: {
      type: String,
      required: true,
    },

    fileHash: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;