const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const cors = require("cors");
const dbConnection = require("./database/dbConnection");
const authRouter = require("./routes/authRouter");
const classRouter = require("./routes/classRouter");
const teacherRouter = require("./routes/teacherRouter");
const studentRouter = require("./routes/studentRouter");
const attendanceRouter = require("./routes/attendanceRouter");
const homeworkRouter = require("./routes/homeworkRouter");
const examRouter = require("./routes/examRouter");
const marksRouter = require("./routes/marksRouter");
const noticeRouter = require("./routes/noticeRouter");
const adminExtrasRouter = require("./routes/adminExtrasRouter");
const eventRouter = require("./routes/eventRouter");
const syllabusRouter = require("./routes/syllabusRouter");
const feeRouter = require("./routes/feeRouter");
const salaryRouter = require("./routes/salaryRouter");
const cellRouter = require("./routes/cellRouter");
const managementRouter = require("./routes/managementRouter");

const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors({
  origin: [ "https://schoolmanagement-o7th.onrender.com", "http://localhost:5173" ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
dbConnection();

// Routes
app.use("/api/auth", authRouter);
app.use("/api/class", classRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/student", studentRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/homework", homeworkRouter);
app.use("/api/exam", examRouter);
app.use("/api/marks", marksRouter);
app.use("/api/notice", noticeRouter);
app.use("/api/admin", adminExtrasRouter);
app.use("/api/events", eventRouter);
app.use("/api/syllabus", syllabusRouter);
app.use("/api/fee", feeRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/cells", cellRouter);
app.use("/api/management", managementRouter);

app.get("/", (req, res) => {
  res.send("School Management System API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
