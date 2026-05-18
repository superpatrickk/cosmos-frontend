import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import FacultyPage from "../pages/faculty/FacultyPage";
import CoursesPage from "../pages/courses/CoursesPage";
import RoomsPage from "../pages/rooms/RoomsPage";
import ScheduleAssignmentPage from "../pages/schedules/ScheduleAssignmentPage";
import FacultySchedulePage from "../pages/facultySchedule/FacultySchedulePage";
import PrintableSchedulePage from "../pages/printable/PrintableSchedulePage";
import CurriculumPage from "../pages/curriculum/CurriculumPage";







const Placeholder = ({ name }) => (
  <div className="p-6 text-gray-400 text-sm">{name} — Coming Soon</div>
);

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout><DashboardPage /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/faculty" element={
          <ProtectedRoute>
            <MainLayout><FacultyPage /></MainLayout>
          </ProtectedRoute>
        } />
       <Route path="/courses" element={
  <ProtectedRoute>
    <MainLayout><CoursesPage /></MainLayout>
  </ProtectedRoute>
} />
       <Route path="/curriculum" element={
  <ProtectedRoute>
    <MainLayout><CurriculumPage/></MainLayout>
  </ProtectedRoute>
} />
        <Route path="/rooms" element={
  <ProtectedRoute>
    <MainLayout><RoomsPage /></MainLayout>
  </ProtectedRoute>
} />
        <Route path="/schedules" element={
  <ProtectedRoute>
    <MainLayout><ScheduleAssignmentPage /></MainLayout>
  </ProtectedRoute>
} />
       <Route path="/faculty-schedule" element={
  <ProtectedRoute>
    <MainLayout><FacultySchedulePage /></MainLayout>
  </ProtectedRoute>
} />
        <Route path="/printable" element={
  <ProtectedRoute>
    <MainLayout><PrintableSchedulePage /></MainLayout>
  </ProtectedRoute>
} />
        <Route path="/faculty" element={
  <ProtectedRoute>
    <MainLayout><FacultyPage /></MainLayout>
  </ProtectedRoute>
} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;