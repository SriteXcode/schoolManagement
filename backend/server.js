const express = require("express");
const app = express();
const dotenv = require("dotenv");
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

dotenv.config();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
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

app.get("/", (req, res) => {
  res.send("School Management System API is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
