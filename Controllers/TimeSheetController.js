require("dotenv").config();
const moment = require("moment");
const AssignmentModel = require("../Models/AssignmentModel");
const EmployeeModel = require("../Models/EmployeeModel");
const TimeSheetModel = require("../Models/TimeSheetModel");

module.exports.getEmployeeStatus = async (req, res, next) => {
  try {
    const employees = await EmployeeModel.find({});

    const response = await Promise.all(
      employees.map(async (employee) => {
        const assignment = await AssignmentModel.findOne({
          employee_id: employee._id,
        })
          .sort({ assigned_date: -1 }) // Sort assignments by assigned_date in descending order
          .populate("workOrders")
          .populate("workShifts");
        const timeSheet = await TimeSheetModel.findOne({
          employee_id: employee._id,
        })
          .populate("breaks.break_id")
          .sort({ clockInTimeStamp: -1 });
        // Check if the current time is between the start and end times
        let isAssigned = false;
        if (assignment !== null) {
          assignment.workShifts.map((shift) => {
            let startTime = moment();
            startTime.set("hour", parseInt(shift.startTime.split(":")[0]));
            startTime.set("minute", parseInt(shift.startTime.split(":")[1]));
            startTime.set("second", 0);
            let endTime = moment();
            endTime.set("hour", parseInt(shift.endTime.split(":")[0]));
            endTime.set("minute", parseInt(shift.endTime.split(":")[1]));
            endTime.set("second", 0);
            if (startTime > endTime) endTime.add(1, "day");
            if (moment() >= startTime && moment() <= endTime) isAssigned = true;
          });
        }
        return {
          _id: employee._id,
          name: employee.name,
          assignment: assignment,
          clockInTimeStamp: timeSheet?.clockInTimeStamp ?? null,
          clockOutTimeStamp: timeSheet?.clockOutTimeStamp ?? null,
          breaks: timeSheet?.breaks ?? [],
          history: timeSheet?.history ?? [],
          description: timeSheet?.description ?? "",
          updated_by: timeSheet?.updated_by ?? null,
          modified_at: timeSheet?.modified_at ?? null,
          isAssigned: isAssigned,
        };
      })
    );

    const sortedData = response.sort((a, b) => {
      if (a.assignment && b.assignment) {
        // Sort by workorder
        if (a.assignment.workOrders[0]?.name < b.assignment?.workOrders[0].name) return -1;
        if (a.assignment.workOrders[0]?.name > b.assignment?.workOrders[0].name) return 1;
      }

      // Sort by employee name
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;

      // Sort by status
      if (a.status < b.status) return -1;
      if (a.status > b.status) return 1;

      return 0;
    });

    return res.json({ status: true, data: sortedData });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getEmployeeCountsByType = async (req, res, next) => {
  try {
    const employees = await EmployeeModel.find({});
    let employeeCounts = { Working: 0, Break: 0, Lunch: 0, Home: 0 };
    const response = await Promise.all(
      employees.map(async (employee) => {
        const timeSheet = await TimeSheetModel.findOne({
          employee_id: employee._id,
        }).sort({ pinTime: -1 });
        if (timeSheet) {
          if (timeSheet.pinType === "clocked-out") {
            if (timeSheet.breakName === "Home") employeeCounts.Home++;
            else if (timeSheet.breakName === "Break") employeeCounts.Break++;
            else if (timeSheet.breakName === "Lunch") employeeCounts.Lunch++;
          } else {
            employeeCounts.Working++;
          }
        } else {
          employeeCounts.Home++;
        }
      })
    );
    return res.json({ status: true, data: employeeCounts });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getClockInOutByEmployee = async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    const timeSheets = await TimeSheetModel.find({
      employee_id: employee_id,
    })
      .populate("employee_id")
      .populate("breaks.break_id")
      .sort({ clockInTimeStamp: -1 });
    return res.json({
      status: true,
      data: timeSheets,
    });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getAllTimeSheets = async (req, res, next) => {
  const { currentDate } = req.query;
  try {
    const timeSheets = await TimeSheetModel.find({}).populate("employee_id").populate("breaks.break_id").sort({ clockInTimeStamp: -1 });
    const filteredTimeSheets = timeSheets
      .map((timeSheet) => {
        if (currentDate == moment(timeSheet.clockInTimeStamp).local().format("YYYY-MM-DD")) {
          return timeSheet;
        } else return null;
      })
      .filter((item) => item !== null);
    return res.json({
      status: true,
      data: filteredTimeSheets,
    });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.updateTimeSheet = async (req, res, next) => {
  const { row, employee_id } = req.body;
  try {
    let timeSheet = await TimeSheetModel.findOne({
      _id: row.id,
    });
    timeSheet.breaks = row.breaks;
    timeSheet.clockInTimeStamp = row.clockInTimeStamp;
    timeSheet.clockOutTimeStamp = row.clockOutTimeStamp;
    if (employee_id != "admin") timeSheet.updated_by = employee_id;
    await timeSheet
      .save()
      .then((savedItem) => {
        return res.json({ status: true, data: savedItem, message: "Timesheet updated successfully" });
      })
      .catch((err) => {
        console.log(err);
        return res.json({ status: false, message: "Something went wrong" });
      });
  } catch (err) {}
};
module.exports.deleteTimeSheet = async (req, res, next) => {
  const { id } = req.body;
  try {
    let timeSheet = await TimeSheetModel.deleteOne({
      _id: id,
    });
    return res.json({ status: true, message: "TimeSheet removed successfully" });
  } catch (err) {
    return res.json({ status: false, message: "Something went wrong" });
  }
};
module.exports.getAllByEmployee = async (req, res, next) => {
  try {
    const { employee_id, todayDate } = req.query;
    const timeSheets = await TimeSheetModel.find({
      employee_id: employee_id,
    })
      .populate("employee_id")
      .populate("breaks.break_id");

    const data = timeSheets
      .map((timeSheet) => {
        let unpaidBreakingHours = 0;
        let paidBreakingHours = 0;
        for (i = 0; i < timeSheet.breaks.length; i++) {
          const breaking = timeSheet.breaks[i];
          console.log("Breaking=" + breaking);
          if (breaking.break_id.isPaid) {
            if (breaking.breakOutTimeStamp !== null && breaking.breakInTimeStamp !== undefined) {
              paidBreakingHours += breaking.breakOutTimeStamp - breaking.breakInTimeStamp;
            } else {
              paidBreakingHours += new Date() - breaking.breakInTimeStamp;
            }
          } else {
            if (breaking.breakOutTimeStamp !== null && breaking.breakInTimeStamp !== undefined) {
              unpaidBreakingHours += breaking.breakOutTimeStamp - breaking.breakInTimeStamp;
            } else {
              unpaidBreakingHours += new Date() - breaking.breakInTimeStamp;
            }
          }
        }
        return {
          startTime: timeSheet.clockInTimeStamp,
          endTime: timeSheet.clockOutTimeStamp === null || timeSheet.clockOutTimeStamp === undefined ? new Date() : timeSheet.clockOutTimeStamp,
          paidBreaking: paidBreakingHours,
          unpaidBreaking: unpaidBreakingHours,
          time:
            timeSheet.clockOutTimeStamp === undefined || timeSheet.clockOutTimeStamp === null
              ? new Date().getTime() - timeSheet.clockInTimeStamp
              : timeSheet.clockOutTimeStamp - timeSheet.clockInTimeStamp,
        };
      })
      .filter((item) => item !== null);
    // Function to sum up time by date
    function sumTimeByDate(data) {
      let result = {};
      data.forEach((item) => {
        // console.log(item);
        let startDate = moment(item.startTime).local().format("YYYY-MM-DD");
        let currentDate = startDate;
        let endDate = moment(item.endTime).local().format("YYYY-MM-DD");
        while (currentDate <= endDate) {
          const isFirstDay = currentDate === startDate;
          const isLastDay = currentDate === endDate;

          if (!result[currentDate]) {
            result[currentDate] = {
              working: 0,
              breaking: 0,
              paidBreaking: 0,
              unpaidBreaking: 0,
            };
          }

          let startTime = item.startTime;
          if (!isFirstDay) {
            startTime.setUTCHours(0, 0, 0, 0);
          }

          let endTime = item.endTime;
          if (!isLastDay) {
            endTime.setUTCHours(23, 59, 59, 999);
          }

          const duration = endTime.getTime() - startTime.getTime();
          result[currentDate]["working"] += duration;
          currentDate = moment(currentDate).add(1, "d").format("YYYY-MM-DD");
        }
        result[startDate]["paidBreaking"] = item.paidBreaking;
        result[startDate]["unpaidBreaking"] = item.unpaidBreaking;
        result[startDate]["breaking"] = item.paidBreaking + item.unpaidBreaking;
      });
      return Object.entries(result).map(([date, times]) => ({
        date,
        ...times,
      }));
    }
    const dataByDate = sumTimeByDate(data);
    console.log("🚀 ~ module.exports.getAllByEmployee= ~ dataByDate:", dataByDate);
    // Sum up time by date
    const employee = await EmployeeModel.findOne({ _id: employee_id });
    const payDays = [];
    if (employee.payType === "weekly") {
      const lastPayDay = new Date(todayDate);
      lastPayDay.setDate(
        lastPayDay.getDate() -
          (lastPayDay.getDay() - employee.payDay > 0 ? lastPayDay.getDay() - employee.payDay : 7 - (employee.payDay - lastPayDay.getDay()))
      );
      for (let i = 0; i < 7; i++) {
        const date = new Date(lastPayDay);
        date.setDate(date.getDate() + i);
        payDays.push(date.toISOString().split("T")[0]);
      }
    } else if (employee.payType === "biweekly") {
      const today = new Date(todayDate);
      const weekNumber = getWeekNumber(today);
      let lastPayDay;
      if (weekNumber % 2 === 0) {
        lastPayDay = new Date(today);
        lastPayDay.setDate(today.getDate() - 14 - (today.getDay() - employee.payDay));
      } else {
        lastPayDay = new Date(today);
        lastPayDay.setDate(today.getDate() - 7 - (today.getDay() - employee.payDay));
      }
      for (let i = 0; i < 14; i++) {
        const date = new Date(lastPayDay);
        date.setDate(date.getDate() + i);
        payDays.push(date.toISOString().split("T")[0]);
      }
    } else if (employee.payType === "monthly") {
      const today = new Date(todayDate);
      const thisMonthPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), employee.payDay));

      let lastPayDay;
      let curMonthPayDay;
      if (thisMonthPayDay <= today) {
        lastPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), employee.payDay));
        curMonthPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, employee.payDay));
      } else {
        lastPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, employee.payDay));
        curMonthPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), employee.payDay));
      }

      while (lastPayDay < curMonthPayDay) {
        payDays.push(lastPayDay.toISOString().split("T")[0]);
        lastPayDay.setDate(lastPayDay.getDate() + 1);
      }
    }

    // total data
    const todayData = dataByDate.find((item) => item.date === todayDate);
    const payData = dataByDate.reduce(
      (acc, curr) => {
        const index = payDays.indexOf(curr.date);
        if (index !== -1) {
          acc.working += curr.working;
          acc.breaking += curr.breaking;
          acc.paidBreaking += curr.paidBreaking;
          acc.unpaidBreaking += curr.unpaidBreaking;
          acc.dates[index] = curr.date;
        }
        return acc;
      },
      { working: 0, breaking: 0, paidBreaking: 0, unpaidBreaking: 0, dates: new Array(payDays.length).fill("") }
    );
    const totalData = dataByDate.reduce(
      (acc, curr) => {
        const index = payDays.indexOf(curr.date);
        if (index !== -1) {
          acc.working += curr.working;
          acc.breaking += curr.breaking;
          acc.paidBreaking += curr.paidBreaking;
          acc.unpaidBreaking += curr.unpaidBreaking;
          acc.dates[index] = curr.date;
        }
        acc.total = acc.working + acc.breaking + acc.paidBreaking;
        return acc;
      },
      { working: 0, breaking: 0, paidBreaking: 0, unpaidBreaking: 0, dates: new Array(payDays.length).fill(""), total: 0 }
    );
    return res.json({
      status: true,
      todayData: todayData
        ? todayData
        : {
            working: 0,
            breaking: 0,
            paidBreaking: 0,
            unpaidBreaking: 0,
          },
      payData: payData,
      totalData: totalData,
    });
  } catch (err) {
    console.log(err);
    return res.json({ status: false, message: "Something went wrong" });
  }
};

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
