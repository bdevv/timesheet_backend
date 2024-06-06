require("dotenv").config();
const AssignmentModel = require("../Models/AssignmentModel");
const EmployeeModel = require("../Models/EmployeeModel");
module.exports.addEmployee = async (req, res, next) => {
  const newEmployee = new EmployeeModel({
    name: req.body.name,
    pin: req.body.pin,
    isAdmin: req.body.isAdmin,
    isManager: req.body.isManager,
    payDay: req.body.payDay,
    payType: req.body.payType,
    created_date: new Date(),
  });
  await newEmployee
    .save()
    .then((savedItem) => {
      return res.json({ status: true, data: savedItem });
    })
    .catch((err) => {
      return res.json({ status: false, message: "Something went wrong" });
    });
};
module.exports.updateEmployee = async (req, res, next) => {
  try {
    const employee_id = req.body._id;
    if (employee_id === undefined || employee_id === null) {
      const newEmployee = new EmployeeModel({
        name: req.body.name,
        pin: req.body.pin,
        isManager: req.body.isManager,
        payType: req.body.payType,
        payDay: req.body.payDay,
      });
      await newEmployee
        .save()
        .then((savedItem) => {
          return res.json({ status: true, data: savedItem });
        })
        .catch((err) => {
          return res.json({ status: false, message: "Something went wrong" });
        });
    } else {
      await EmployeeModel.updateOne(
        { _id: employee_id },
        {
          name: req.body.name,
          pin: req.body.pin,
          isManager: req.body.isManager,
          payType: req.body.payType,
          payDay: req.body.payDay,
        }
      );
      return res.json({ status: true });
    }
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getEmployees = async (req, res, next) => {
  const items = await EmployeeModel.find({});
  if (items) {
    return res.json({ status: true, data: items });
  } else {
    return res.json({ status: false, message: "Employee not found" });
  }
};
module.exports.getEmployeesByManager = async (req, res, next) => {
  const { manager_id } = req.query;

  const employeeIds = await AssignmentModel.distinct("employee_id", {
    workShifts: { $in: await AssignmentModel.find({ employee_id: manager_id }).distinct("workShifts") },
  });
  const employees = await EmployeeModel.find({ _id: { $in: employeeIds } });

  return res.json({ status: true, data: employees });
};
module.exports.deleteEmployee = async (req, res, next) => {
  try {
    const item = await EmployeeModel.findOne({ name: req.body.name });

    if (item) {
      await EmployeeModel.deleteOne({ _id: item.id });
      return res.json({ status: true });
    } else {
      return res.json({ status: false, message: "Employee not found" });
    }
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
