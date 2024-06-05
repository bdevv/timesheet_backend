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
            startTime.set("second", parseInt(shift.startTime.split(":")[2]));
            let endTime = moment();
            endTime.set("hour", parseInt(shift.endTime.split(":")[0]));
            endTime.set("minute", parseInt(shift.endTime.split(":")[1]));
            endTime.set("second", parseInt(shift.endTime.split(":")[2]));
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
    const today = new Date();
    const timeSheets = await TimeSheetModel.find({
      employee_id: employee_id,
    })
      .populate("employee_id")
      .populate("break_id")
      .sort({ pinTime: -1 });
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
    const timeSheets = await TimeSheetModel.find({}).populate("employee_id").populate("break_id").sort({ pinTime: -1 });
    const filteredTimeSheets = timeSheets
      .map((timeSheet) => {
        if (currentDate == moment(timeSheet.pinTime).local().format("YYYY-MM-DD")) {
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
  const { id, pinTime, break_id, description, employee_id } = req.body;
  try {
    const data = { updated_by: employee_id, description: description, pinTime: pinTime };
    if (break_id !== "") data.break_id = break_id;
    const updatedRow = await TimeSheetModel.findOneAndUpdate({ _id: id }, data);
    return res.json({
      status: true,
      data: updatedRow,
    });
  } catch (err) {
    console.log(err);
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
      .populate("break_id");

    let startTime = null;
    let paidBreakStartTime = null;
    let paidBreakLimit = 0;
    let index = 0;
    const timezoneOffset = moment().utcOffset();
    const data = timeSheets
      .map((timeSheet) => {
        index++;
        if (timeSheet.pinType === "clocked-in") {
          startTime = timeSheet.pinTime;
          if (paidBreakStartTime != null) {
            let endTime = timeSheet.pinTime;
            let timeDiff = endTime - paidBreakStartTime;
            if (timeDiff > paidBreakLimit * 60 * 1000) {
              timeDiff = paidBreakLimit * 60 * 1000;
              endTime = new Date(paidBreakStartTime.getTime() + paidBreakLimit * 60 * 1000);
            }
            paidBreakLimit = 0;
            const temp = paidBreakStartTime;
            paidBreakStartTime = null;
            return {
              startTime: new Date(temp.getTime() + timezoneOffset * 60 * 1000),
              endTime: new Date(endTime.getTime() + timezoneOffset * 60 * 1000),
              type: "paidBreaking",
              time: timeDiff,
            };
          } else return null;
        } else if (timeSheet.pinType === "clocked-out") {
          if (timeSheet?.break_id?.isPaid === true) {
            paidBreakStartTime = timeSheet.pinTime;
            paidBreakLimit = timeSheet?.break_id?.limit;
          }
          if (startTime != null) {
            const endTime = timeSheet.pinTime;
            const timeDiff = endTime - startTime;

            return {
              startTime: new Date(startTime.getTime() + timezoneOffset * 60 * 1000),
              endTime: new Date(endTime.getTime() + timezoneOffset * 60 * 1000),
              type: "working",
              time: timeDiff,
            };
          } else return null;
        }
      })
      .filter((item) => item !== null);
    // Function to sum up time by date
    function sumTimeByDate(data) {
      const result = {};

      data.forEach((item) => {
        // console.log(item);
        const startDate = new Date(item.startTime).toISOString().split("T")[0];
        const endDate = new Date(item.endTime).toISOString().split("T")[0];
        let currentDate = new Date(startDate);

        while (currentDate.toISOString().split("T")[0] <= endDate) {
          const date = currentDate.toISOString().split("T")[0];
          const isFirstDay = date === startDate;
          const isLastDay = date === endDate;

          if (!result[date]) {
            result[date] = {
              working: 0,
              breaking: 0,
              paidBreaking: 0,
            };
          }

          let startTime = new Date(currentDate);
          startTime.setUTCHours(0, 0, 0, 0);
          if (isFirstDay) {
            startTime = new Date(item.startTime);
          }

          let endTime = new Date(currentDate);
          endTime.setUTCHours(23, 59, 59, 999);
          if (isLastDay) {
            endTime = new Date(item.endTime);
          }

          const duration = endTime.getTime() - startTime.getTime();
          result[date][item.type] += duration;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      return Object.entries(result).map(([date, times]) => ({
        date,
        ...times,
      }));
    }
    const dataByDate = sumTimeByDate(data);
    console.log(data);
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
        // If current week is even, the last pay day was on the previous odd week
        lastPayDay = new Date(today);
        lastPayDay.setDate(today.getDate() - 14 - (today.getDay() - employee.payDay));
      } else {
        // If current week is odd, the last pay day was on the current odd week
        lastPayDay = new Date(today);
        lastPayDay.setDate(today.getDate() - (today.getDay() - employee.payDay));
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
        // If the pay day is before today, the last pay day was in the previous month
        lastPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), employee.payDay));
        curMonthPayDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, employee.payDay));
      } else {
        // If the pay day is after today, the last pay day was in the previous month
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
          acc.dates[index] = curr.date;
        }
        return acc;
      },
      { working: 0, breaking: 0, paidBreaking: 0, dates: new Array(payDays.length).fill("") }
    );
    const totalData = dataByDate.reduce(
      (acc, curr) => {
        const index = payDays.indexOf(curr.date);
        if (index !== -1) {
          acc.working += curr.working;
          acc.breaking += curr.breaking;
          acc.paidBreaking += curr.paidBreaking;
          acc.dates[index] = curr.date;
        }
        acc.total = acc.working + acc.breaking + acc.paidBreaking;
        return acc;
      },
      { working: 0, breaking: 0, paidBreaking: 0, dates: new Array(payDays.length).fill(""), total: 0 }
    );
    return res.json({
      status: true,
      todayData: todayData
        ? todayData
        : {
            working: 0,
            breaking: 0,
            paidBreaking: 0,
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
