require("dotenv").config();
const WorkOrderModel = require("../Models/WorkOrderModel");
module.exports.addWorkOrder = async (req, res, next) => {
  const newWorkOrder = new WorkOrderModel({
    name: req.body.name,
    isPaid: req.body.isPaid,
  });
  await newWorkOrder
    .save()
    .then((savedItem) => {
      return res.json({ status: true, data: savedItem });
    })
    .catch((err) => {
      return res.json({ status: false, message: "Something went wrong" });
    });
};
module.exports.getWorkOrders = async (req, res, next) => {
  const items = await WorkOrderModel.find({});
  if (items) {
    return res.json({ status: true, data: items });
  }
};

module.exports.deleteWorkOrder = async (req, res, next) => {
  try {
    const item = await WorkOrderModel.findOne({ name: req.body.name });
    if (item) {
      await WorkOrderModel.deleteOne({ _id: item.id });
      return res.json({ status: true });
    }
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
