const mongoose = require("mongoose");
const breakSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    limit: {
      type: Number,
    },
    isPaid: {
      type: Boolean,
    },
  },
  { collection: "Break" }
);
module.exports = mongoose.model("Break", breakSchema);
