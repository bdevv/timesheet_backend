const { getAssignments, addAssignment } = require("../Controllers/AssignmentController");
const { CheckPin, ClockIn, ClockOut, getPin, updatePin, BreakIn, BreakOut } = require("../Controllers/AuthController");
const { addBreak, deleteBreak, getBreaks } = require("../Controllers/BreakController");
const { addEmployee, getEmployees, deleteEmployee, getEmployeesByManager } = require("../Controllers/EmployeeController");
const {
  getEmployeeStatus,
  getEmployeeCountsByType,
  getClockInOutByEmployee,
  getAllByEmployee,
  getAllTimeSheets,
  updateTimeSheet,
  deleteTimeSheet,
} = require("../Controllers/TimeSheetController");
const { addMessage, getMessages, deleteMessage, getPublicMessages, getMessagesByEmployee, markAsRead } = require("../Controllers/MessageController");
const { addWorkOrder, getWorkOrders, deleteWorkOrder } = require("../Controllers/WorkOrderController");
const { addWorkShift, getWorkShifts, deleteWorkShift } = require("../Controllers/WorkShiftController");

const router = require("express").Router();
router.post("/checkPin", CheckPin);
router.post("/clockIn", ClockIn);
router.post("/clockOut", ClockOut);
router.post("/breakIn", BreakIn);
router.post("/breakOut", BreakOut);

router.get("/getPin", getPin);
router.post("/updatePin", updatePin);

router.post("/addBreak", addBreak);
router.get("/getBreaks", getBreaks);
router.post("/deleteBreak", deleteBreak);

router.post("/addWorkOrder", addWorkOrder);
router.get("/getWorkOrders", getWorkOrders);
router.post("/deleteWorkOrder", deleteWorkOrder);

router.post("/addMessage", addMessage);
router.get("/getMessages", getMessages);
router.get("/getPublicMessages", getPublicMessages);
router.get("/getMessagesByEmployee", getMessagesByEmployee);
router.post("/deleteMessage", deleteMessage);
router.post("/markAsRead", markAsRead);

router.post("/addWorkShift", addWorkShift);
router.get("/getWorkShifts", getWorkShifts);
router.post("/deleteWorkShift", deleteWorkShift);

router.post("/addEmployee", addEmployee);
router.get("/getEmployees", getEmployees);
router.get("/getEmployeesByManager", getEmployeesByManager);
router.post("/deleteEmployee", deleteEmployee);

router.get("/getAssignments", getAssignments);
router.post("/addAssignment", addAssignment);

router.get("/getEmployeeStatus", getEmployeeStatus);
router.get("/getEmployeeCountsByType", getEmployeeCountsByType);
router.get("/getClockInOutByEmployee", getClockInOutByEmployee);
router.get("/getAllTimeSheets", getAllTimeSheets);
router.get("/getAllByEmployee", getAllByEmployee);
router.post("/updateTimeSheet", updateTimeSheet);
router.post("/deleteTimeSheet", deleteTimeSheet);

router.get("/getCurrentTime", (req, res) => {
  res.send({ status: true, time: new Date() });
});
module.exports = router;
