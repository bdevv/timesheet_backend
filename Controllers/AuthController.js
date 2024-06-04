const BreakModel = require("../Models/BreakModel");
const EmployeeModel = require("../Models/EmployeeModel");
const TimeSheetModel = require("../Models/TimeSheetModel");
const { createSecretToken, createRefreshToken } = require("../Util/SecretToken");

module.exports.CheckPin = async (req, res, next) => {
  try {
    const { name, pin } = req.body;
    if (!pin) {
      return res.json({ message: "All fields are required" });
    }
    if (name === "admin" && pin === "0000") {
      const token = createSecretToken("admin", "employee");
      const refreshToken = createRefreshToken("admin", "employee");
      res.cookie("token", token, {
        domain: "employee.pastiansbakery.com",
        withCredentials: true,
        httpOnly: false,
      });
      res.cookie("refreshToken", refreshToken, {
        domain: "employee.pastiansbakery.com",
        withCredentials: true,
        httpOnly: false,
      });
      return res.status(201).json({
        message: "Admin logged in successfully",
        name: "admin",
        employee_id: "admin",
        status: true,
        accessToken: token,
        refreshToken: refreshToken,
      });
    }
    const results = await EmployeeModel.find({ name: name, pin: pin });
    if (results.length > 0) {
      if (results[0]._id) {
        const token = createSecretToken(results[0]._id, "employee");
        const refreshToken = createRefreshToken(results[0]._id, "employee");
        res.cookie("token", token, {
          domain: "employee.pastiansbakery.com",
          withCredentials: true,
          httpOnly: false,
        });
        res.cookie("refreshToken", refreshToken, {
          domain: "employee.pastiansbakery.com",
          withCredentials: true,
          httpOnly: false,
        });
        return res.status(201).json({
          message: "User logged in successfully",
          name: results[0].name,
          employee_id: results[0]._id,
          isManager: results[0].isManager,
          status: true,
          accessToken: token,
          refreshToken: refreshToken,
        });
      } else {
        return res.json({
          status: false,
          message: results.data,
        });
      }

      next();
    } else return res.json({ status: false });
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "Error occurred while logging in. Please try again.",
    });
  }
};
module.exports.getPin = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const result = await EmployeeModel.findOne({ id: employee_id });
    if (result) {
      return res.json({ status: true, pin: result.pin });
    } else return res.json({ status: false });
  } catch (error) {
    return res.send({
      status: false,
      message: "Error occurred while getting pin. Please try again.",
    });
  }
};
module.exports.updatePin = async (req, res, next) => {
  try {
    const { employee_id, newPin } = req.body;
    const result = await EmployeeModel.findOneAndUpdate({ _id: employee_id }, { pin: newPin });
    if (result) {
      return res.json({ status: true, message: "Pin updated" });
    } else return res.json({ status: false, message: "Pin not updated" });
  } catch (error) {
    return res.send({
      status: false,
      message: "Error occurred while getting pin. Please try again.",
    });
  }
};
module.exports.ClockIn = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.json({ message: "Employee not found" });
    }
    const result = await EmployeeModel.findOne({ name: name });
    if (result) {
      if (result._id) {
        const newTimeSheet = new TimeSheetModel({
          employee_id: result._id,
          pinTime: new Date(),
          pinType: "clocked-in",
        });
        await newTimeSheet
          .save()
          .then((savedItem) => {
            return res.json({ status: true, data: savedItem });
          })
          .catch((err) => {
            return res.json({ status: false, message: "Something went wrong" });
          });
      } else {
        return res.json({
          status: false,
          message: result.data,
        });
      }

      next();
    } else return res.json({ status: false });
  } catch (error) {
    return res.send({
      status: false,
      message: "Error clocking-in. Please try again.",
    });
  }
};
module.exports.ClockOut = async (req, res, next) => {
  try {
    const { name, breakName, breakingTypeName } = req.body;
    if (!name) {
      return res.json({ message: "Employee not found" });
    }
    const result = await EmployeeModel.findOne({ name: name });
    if (result) {
      if (result._id) {
        const breakRow = await BreakModel.findOne({
          name: breakingTypeName,
        });
        const newTimeSheet = new TimeSheetModel({
          employee_id: result._id,
          pinTime: new Date(),
          pinType: "clocked-out",
          breakName: breakName,
          break_id: breakRow?._id ?? null,
        });
        await newTimeSheet
          .save()
          .then((savedItem) => {
            return res.json({ status: true, data: savedItem, message: "Employee clocked out successfully" });
          })
          .catch((err) => {
            return res.json({ status: false, message: "Something went wrong" });
          });
      } else {
        return res.json({
          status: false,
          message: "Employee not found",
        });
      }

      next();
    } else return res.json({ status: false, message: "Employee not found" });
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "Error clocking-out. Please try again.",
    });
  }
};
