import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WallOfFame from './pages/WallOfFame';
import Achievements from './pages/Achievements';
import Gallery from './pages/Gallery';
import Calendar from './pages/Calendar';
import PublicNotices from './pages/PublicNotices';

import Profile from './pages/Profile';

// Admin Pages
import AdminLayout from './pages/Admin/AdminLayout';
import AdminHome from './pages/Admin/AdminHome';
import Classes from './pages/Admin/Classes';
import ClassDetails from './pages/Admin/ClassDetails';
import Teachers from './pages/Admin/Teachers';
import Students from './pages/Admin/Students';
import Notices from './pages/Admin/Notices';
import AdminInbox from './pages/Admin/AdminInbox';
import ManageSalaries from './pages/Admin/ManageSalaries';
import SyllabusOverview from './pages/Admin/SyllabusOverview';

// Admission Cell Pages
import AdmissionCellLayout from './pages/AdmissionCell/AdmissionCellLayout';
import AdmissionDashboard from './pages/AdmissionCell/AdmissionDashboard';
import ManageFees from './pages/AdmissionCell/ManageFees';
import CellManagement from './pages/Admin/CellManagement';

// Cell Pages
import CellLayout from './pages/Cell/CellLayout';
import ExamCellDashboard from './pages/Cell/ExamCellDashboard';
import DisciplineCellDashboard from './pages/Cell/DisciplineCellDashboard';
import SportsCellDashboard from './pages/Cell/SportsCellDashboard';
import ManagementCellDashboard from './pages/Cell/ManagementCellDashboard';

// Teacher Pages
import TeacherLayout from './pages/Teacher/TeacherLayout';
import TeacherHome from './pages/Teacher/TeacherHome';
import Attendance from './pages/Teacher/Attendance';
import Homework from './pages/Teacher/Homework';
import Marks from './pages/Teacher/Marks';
import SyllabusTracking from './pages/Teacher/SyllabusTracking';
import TeacherStudents from './pages/Teacher/TeacherStudents';

import TeacherInbox from './pages/Teacher/TeacherInbox';

// Student Pages
import StudentLayout from './pages/Student/StudentLayout';
import StudentHome from './pages/Student/StudentHome';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentHomework from './pages/Student/StudentHomework';
import StudentExams from './pages/Student/StudentExams';
import StudentComms from './pages/Student/StudentComms';
import StudentFees from './pages/Student/StudentFees';

// Components
import Navbar from './components/Navbar';

// Private Route
const PrivateRoute = ({ children, role }) => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  if (!user) return <Navigate to="/login" />;
  
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wall-of-fame" element={<WallOfFame />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/notices" element={<PublicNotices />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute role="Admin">
            <AdminLayout />
          </PrivateRoute>
        }>
            <Route path="dashboard" element={<AdminHome />} />
            <Route path="classes" element={<Classes />} />
            <Route path="class/:id" element={<ClassDetails />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="notices" element={<Notices />} />
            <Route path="salaries" element={<ManageSalaries />} />
            <Route path="syllabus-overview" element={<SyllabusOverview />} />
            <Route path="cells" element={<CellManagement />} />
            <Route path="inbox" element={<AdminInbox />} />
            <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admission Cell Routes */}
        <Route path="/admission" element={
          <PrivateRoute role={["Admin", "Teacher", "AdmissionCell"]}>
            <AdmissionCellLayout />
          </PrivateRoute>
        }>
            <Route path="dashboard" element={<AdmissionDashboard />} />
            <Route path="register" element={<Students />} /> 
            <Route path="fees" element={<ManageFees />} />
            <Route path="profile" element={<Profile />} />
        </Route>

        {/* Unified Cell Routes (Exam, Discipline, Sports) */}
        <Route path="/cell" element={
          <PrivateRoute role={["Admin", "Teacher", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell"]}>
            <CellLayout />
          </PrivateRoute>
        }>
            <Route path="exam/dashboard" element={<ExamCellDashboard />} />
            <Route path="discipline/dashboard" element={<DisciplineCellDashboard />} />
            <Route path="sports/dashboard" element={<SportsCellDashboard />} />
            <Route path="management/dashboard" element={<ManagementCellDashboard />} />
            <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <PrivateRoute role={["Admin", "Teacher", "AdmissionCell", "ExamCell", "DisciplineCell", "SportsCell", "ManagementCell"]}>
            <TeacherLayout />
          </PrivateRoute>
        }>
            <Route path="dashboard" element={<TeacherHome />} />
            <Route path="class/:id" element={<ClassDetails />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="homework" element={<Homework />} />
            <Route path="syllabus" element={<SyllabusTracking />} />
            <Route path="marks" element={<Marks />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="inbox" element={<TeacherInbox />} />
            <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Student Routes */}
        <Route path="/student" element={
          <PrivateRoute role="Student">
            <StudentLayout />
          </PrivateRoute>
        }>
            <Route path="dashboard" element={<StudentHome />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="homework" element={<StudentHomework />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="syllabus" element={<SyllabusTracking />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="comms" element={<StudentComms />} />
            <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
