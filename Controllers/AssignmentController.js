require("dotenv").config();
const AssignmentModel = require("../Models/AssignmentModel");
const EmployeeModel = require("../Models/EmployeeModel");
module.exports.getAssignments = async (req, res, next) => {
  try {
    const employees = await EmployeeModel.find({});

    const response = await Promise.all(
      employees.map(async (employee) => {
        const assignments = await AssignmentModel.findOne({
          employee_id: employee._id,
        })
          .sort({ assigned_date: -1 }) // Sort assignments by assigned_date in descending order
          .populate("workOrders")
          .populate("workShifts");
        return {
          _id: employee._id,
          name: employee.name,
          pin: employee.pin,
          assignments: assignments,
        };
      })
    );
    return res.json({ status: true, data: response });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.addAssignment = async (req, res, next) => {
  const oldAssignment = await AssignmentModel.findOne({ employee_id: req.body.employee_id });
  if (!oldAssignment) {
    const newAssignment = new AssignmentModel({
      employee_id: req.body.employee_id,
      workOrders: req.body.workOrders,
      workShifts: req.body.workShifts,
      assigned_date: new Date(),
      history: [],
    });
    await newAssignment
      .save()
      .then((savedItem) => {
        return res.json({ status: true, data: savedItem });
      })
      .catch((err) => {
        console.log(err);
        return res.json({ status: false, message: "Something went wrong" });
      });
  } else {
    let newHistory = oldAssignment.history;
    newHistory.push({
      employee_id: oldAssignment.employee_id,
      workOrders: oldAssignment.workOrders,
      workShifts: oldAssignment.workShifts,
      assigned_date: oldAssignment.assigned_date,
    });
    const newAssignment = await AssignmentModel.findOneAndUpdate(
      { employee_id: req.body.employee_id },
      {
        workOrders: req.body.workOrders,
        workShifts: req.body.workShifts,
        assigned_date: new Date(),
        history: newHistory,
      }
    );
    return res.json({ status: true, data: newAssignment });
  }
};
