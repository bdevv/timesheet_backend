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
module.exports.updateWorkOrder = async (req, res, next) => {
  try {
    const workOrder_id = req.body._id;
    if (workOrder_id === undefined || workOrder_id === null) {
      const newWorkOrder = new WorkOrderModel({
        name: req.body.name,
      });
      await newWorkOrder
        .save()
        .then((savedItem) => {
          return res.json({ status: true, data: savedItem });
        })
        .catch((err) => {
          return res.json({ status: false, message: "Something went wrong" });
        });
    } else {
      await WorkOrderModel.updateOne(
        { _id: workOrder_id },
        {
          name: req.body.name,
        }
      );
      return res.json({ status: true });
    }
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getWorkOrders = async (req, res, next) => {
  const items = await WorkOrderModel.find({});
  if (items) {
    return res.json({ status: true, data: items });
  }
};
module.exports.deleteWorkOrder = async (req, res, next) => {
  try {
    await WorkOrderModel.deleteOne({ _id: req.body.id });
    return res.json({ status: true });
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
