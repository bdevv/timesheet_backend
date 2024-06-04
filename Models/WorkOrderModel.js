const mongoose = require("mongoose");
const workOrderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
  },
  { collection: "WorkOrder" }
);
module.exports = mongoose.model("WorkOrder", workOrderSchema);
