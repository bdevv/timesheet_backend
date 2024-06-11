const mongoose = require("mongoose");
const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    pin: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
    },
    isManager: {
      type: Boolean,
    },
    payType: {
      type: String,
    },
    payDay: {
      type: Number,
    },
    created_date: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "Employee" }
);
module.exports = mongoose.model("Employee", employeeSchema);
