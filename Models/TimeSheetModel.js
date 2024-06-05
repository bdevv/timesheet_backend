const mongoose = require("mongoose");
const timesheetSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    clockInTimeStamp: {
      type: mongoose.Schema.Types.Date,
    },
    clockOutTimeStamp: {
      type: mongoose.Schema.Types.Date,
    },
    breaks: [
      {
        breakInTimeStamp: { type: mongoose.Schema.Types.Date },
        breakOutTimeStamp: { type: mongoose.Schema.Types.Date },
        break_id: { type: mongoose.Schema.Types.ObjectId, ref: "Break" },
      },
    ],
    history: [
      {
        clockInTimeStamp: {
          type: mongoose.Schema.Types.Date,
        },
        clockOutTimeStamp: {
          type: mongoose.Schema.Types.Date,
        },
        breaks: [
          {
            breakInTimeStamp: { type: mongoose.Schema.Types.Date },
            breakOutTimeStamp: { type: mongoose.Schema.Types.Date },
            break_id: { type: mongoose.Schema.Types.ObjectId },
          },
        ],
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
    ],
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
