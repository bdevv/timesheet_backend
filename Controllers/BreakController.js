require("dotenv").config();
const BreakModel = require("../Models/BreakModel");
module.exports.addBreak = async (req, res, next) => {
  const newBreak = new BreakModel({
    name: req.body.name,
    limit: req.body.limit,
    isPaid: req.body.isPaid,
  });
  await newBreak
    .save()
    .then((savedItem) => {
      return res.json({ status: true, data: savedItem });
    })
    .catch((err) => {
      return res.json({ status: false, message: "Something went wrong" });
    });
};

module.exports.updateBreak = async (req, res, next) => {
  try {
    const break_id = req.body._id;
    if (break_id === undefined || break_id === null) {
      const newBreak = new BreakModel({
        name: req.body.name,
        limit: req.body.limit,
        isPaid: req.body.isPaid,
      });
      await newBreak
        .save()
        .then((savedItem) => {
          return res.json({ status: true, data: savedItem });
        })
        .catch((err) => {
          return res.json({ status: false, message: "Something went wrong" });
        });
    } else {
      await BreakModel.updateOne(
        { _id: break_id },
        {
          name: req.body.name,
          limit: req.body.limit,
          isPaid: req.body.isPaid,
        }
      );
      return res.json({ status: true });
    }
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getBreaks = async (req, res, next) => {
  const items = await BreakModel.find({});
  if (items) {
    return res.json({ status: true, data: items });
  }
};

module.exports.deleteBreak = async (req, res, next) => {
  try {
    await BreakModel.deleteOne({ _id: req.body.id });
    return res.json({ status: true });
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
