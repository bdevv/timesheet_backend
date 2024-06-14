const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoute = require("./Routes/AuthRoute");
const path = require("path");
const { MONGO_URL, PORT } = process.env;
mongoose
  .connect(MONGO_URL, {
    // authSource: "admin",
    // auth: { password: "admin", username: "password" },
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB is  connected successfully"))
  .catch((err) => console.error(err));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
// Parse JSON bodies
app.use(bodyParser.json());
// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:3000", "http://qa.timesheet.pastiansbakery.com", "http://web2:3002", "http://timesheet.gacud.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());
app.use("/", authRoute);
app.use(express.static(path.resolve(__dirname, "build"))).get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});
