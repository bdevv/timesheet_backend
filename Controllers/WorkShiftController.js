const moment = require("moment");
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
  try {
    const items = await WorkShiftModel.find({});
    if (items) {
      return res.json({ status: true, data: items });
    }
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};

module.exports.updateWorkShift = async (req, res, next) => {
  try {
    const workShift_id = req.body._id;
    if (workShift_id === undefined || workShift_id === null) {
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
    } else {
      await WorkShiftModel.updateOne(
        { _id: workShift_id },
        {
          name: req.body.name,
          startTime: req.body.startTime,
          endTime: req.body.endTime,
        }
      );
      return res.json({ status: true });
    }
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.deleteWorkShift = async (req, res, next) => {
  try {
    await WorkShiftModel.deleteOne({ _id: req.body.id });
    return res.json({ status: true });
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
