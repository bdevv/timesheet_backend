const mongoose = require("mongoose");
const workShiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
  },
  { collection: "WorkShift" }
);
module.exports = mongoose.model("WorkShift", workShiftSchema);
