require("dotenv").config();
const AssignmentModel = require("../Models/AssignmentModel");
const MessageModel = require("../Models/MessageModel");
module.exports.addMessage = async (req, res, next) => {
  const { employee_id, to, employees, workShifts, workOrders, subject, type, message } = req.body;
  if (employee_id === "admin") {
    const newMessage = new MessageModel({
      to,
      employees,
      workShifts,
      workOrders,
      subject,
      type,
      message,
    });
    await newMessage
      .save()
      .then((savedItem) => {
        return res.json({ status: true, data: savedItem });
      })
      .catch((err) => {
        console.log(err);
        return res.json({ status: false, message: "Something went wrong" });
      });
  } else {
    const newMessage = new MessageModel({
      employee_id,
      to,
      employees,
      workShifts,
      workOrders,
      subject,
      type,
      message,
    });
    await newMessage
      .save()
      .then((savedItem) => {
        return res.json({ status: true, data: savedItem });
      })
      .catch((err) => {
        console.log(err);
        return res.json({ status: false, message: "Something went wrong" });
      });
  }
};
module.exports.getMessages = async (req, res, next) => {
  const { employee_id } = req.query;
  let items;
  if (employee_id == "null" || employee_id == "undefined") {
    items = await MessageModel.find({})
      .populate({ path: "employees", select: "-pin" })
      .populate({
        path: "employee_id",
        select: "-pin",
      })
      .populate("workShifts")
      .populate("workOrders")
      .sort({ created_at: -1 });
  } else {
    items = await MessageModel.find({ employee_id: employee_id })
      .populate({ path: "employees", select: "-pin" })
      .populate({
        path: "employee_id",
        select: "-pin",
      })
      .populate("workShifts")
      .populate("workOrders")
      .sort({ created_at: -1 });
  }
  if (items) {
    return res.json({ status: true, data: items });
  }
};
module.exports.getPublicMessages = async (req, res, next) => {
  const items = await MessageModel.find({ to: "Home" })
    .populate({ path: "employees", select: "-pin" })
    .populate({
      path: "employee_id",
      select: "-pin",
    })
    .populate("workShifts")
    .populate("workOrders")
    .sort({ created_at: -1 });
  if (items) {
    return res.json({ status: true, data: items });
  }
};

module.exports.getMessagesByEmployee = async (req, res, next) => {
  const { employee_id } = req.query;
  if (employee_id === undefined || !employee_id) return res.json({ status: false, message: "employee_id is required" });
  const items = await MessageModel.find({ to: { $ne: "Home" } })
    .populate({ path: "employees", select: "-pin" })
    .populate({
      path: "employee_id",
      select: "-pin",
    })
    .populate("workShifts")
    .populate("workOrders")
    .sort({ created_at: -1 });
  const filteredItems = (
    await Promise.all(
      items.map(async (item) => {
        if (item.readers.includes(employee_id)) return null;
        if (item.to === "All") {
          return item;
        } else if (item.to === "Employees") {
          const employeeIds = item.employees.map((employee) => employee._id);
          return employeeIds.map((id) => id.toString()).includes(employee_id.toString()) ? item : null;
        } else if (item.to === "WorkOrder") {
          const assignment = await AssignmentModel.findOne({ employee_id: employee_id }).sort({ assigned_date: -1 });
          if (assignment) {
            const assignedOrders = assignment.workOrders;
            const workOrderIds = item.workOrders.map((order) => order._id);
            const hasMatchingItem = assignedOrders.some((assignedOrder) =>
              workOrderIds.map((id) => id.toString()).includes(assignedOrder.toString())
            );
            return hasMatchingItem ? item : null;
          } else return null;
        } else if (item.to === "WorkShift") {
          const assignment = await AssignmentModel.findOne({ employee_id: employee_id }).sort({ assigned_date: -1 });
          if (assignment) {
            const assignedShifts = assignment.workShifts;
            const workShiftIds = item.workShifts.map((shift) => shift._id);
            const hasMatchingItem = assignedShifts.some((assignedShift) =>
              workShiftIds.map((id) => id.toString()).includes(assignedShift.toString())
            );
            return hasMatchingItem ? item : null;
          } else return null;
        } else {
          return null;
        }
      })
    )
  ).filter((item) => item !== null);
  if (items) {
    return res.json({ status: true, data: filteredItems });
  }
};

module.exports.deleteMessage = async (req, res, next) => {
  try {
    await MessageModel.deleteOne({ _id: req.body.id });
    return res.json({ status: true });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};

module.exports.markAsRead = async (req, res, next) => {
  const { id, employee_id } = req.body;
  try {
    // Update the `readers` array in the MessageModel document
    const updatedMessage = await MessageModel.findByIdAndUpdate(
      id,
      { $addToSet: { readers: employee_id } }, // Add the employee_id to the readers array
      { new: true } // Return the updated document
    );
    if (!updatedMessage) {
      return res.status(404).json({ status: false, message: "Message not found" });
    }
    return res.json({ status: true, message: "Message marked as read" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, message: "Something went wrong" });
  }
};
