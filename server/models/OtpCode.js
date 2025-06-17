import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export default mongoose.model("OtpCode", otpSchema);
