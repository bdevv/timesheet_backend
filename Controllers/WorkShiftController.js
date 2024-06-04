require("dotenv").config();
const WorkShiftModel = require("../Models/WorkShiftModel");
module.exports.addWorkShift = async (req, res, next) => {
  const newWorkShift = new WorkShiftModel({
    name: req.body.name,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
  });
  await newWorkShift
    .save()
    .then((savedItem) => {
      return res.json({ status: true, data: savedItem });
    })
    .catch((err) => {
      return res.json({ status: false, message: "Something went wrong" });
    });
};
module.exports.getWorkShifts = async (req, res, next) => {
  const items = await WorkShiftModel.find({});
  if (items) {
    return res.json({ status: true, data: items });
  }
};

module.exports.deleteWorkShift = async (req, res, next) => {
  try {
    const item = await WorkShiftModel.findOne({ name: req.body.name });
    if (item) {
      await WorkShiftModel.deleteOne({ _id: item.id });
      return res.json({ status: true });
    }
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
