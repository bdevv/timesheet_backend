const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    to: {
      type: String,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],
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
    readers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    subject: {
      type: String,
    },
    type: {
      type: String,
    },
    message: {
      type: String,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "Message" }
);
module.exports = mongoose.model("Message", messageSchema);
