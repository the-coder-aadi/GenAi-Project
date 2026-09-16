import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    plan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },

    planExpiresAt: {
      type: Date,
      default: null,
    },

    razorpayOrderId: {
  type: String,
  default: null,
},

pendingPlan: {
  type: String,
  enum: ["pro", "premium"],
  default: null,
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;