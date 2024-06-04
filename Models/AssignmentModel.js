const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    workOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkOrder",
        required: true,
      },
    ],
    workShifts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkShift",
        required: true,
      },
    ],
    assigned_date: {
      type: Date,
      required: true,
    },
    history: [Object],
  },
  { collection: "Assignment" }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
