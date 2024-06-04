const mongoose = require("mongoose");
const timesheetSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    pinTime: {
      type: mongoose.Schema.Types.Date,
    },
    pinType: {
      type: String,
    },
    breakName: {
      type: String,
    },
    break_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Break",
    },
    description: {
      type: String,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    modified_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "Timesheet" }
);
module.exports = mongoose.model("Timesheet", timesheetSchema);
