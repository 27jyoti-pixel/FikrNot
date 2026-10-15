import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import {
  Analytics,
  Browse,
  Claims,
  Home,
  ItemDetail,
  Login,
  NotFound,
  Notifications,
  Profile,
  RectorClaims,
  RectorDashboard,
  RectorStudents,
  RectorStudentDetail,
  Register,
  ReportForm,
  StudentDashboard,
} from "./pages/Pages";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="rector-login" element={<Login rectorEntry />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="browse" element={<Browse />} />
          <Route path="items/:id" element={<ItemDetail />} />
          <Route path="report/lost" element={<ReportForm type="lost" />} />
          <Route path="report/found" element={<ReportForm type="found" />} />
          <Route
            path="report/lost/:id/edit"
            element={<ReportForm type="lost" edit />}
          />
          <Route
            path="report/found/:id/edit"
            element={<ReportForm type="found" edit />}
          />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="claims" element={<Claims />} />
        </Route>

        <Route element={<ProtectedRoute role="student" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>

        <Route element={<ProtectedRoute role="rector" />}>
          <Route path="rector-dashboard" element={<RectorDashboard />} />
          <Route path="rector-claims" element={<RectorClaims />} />
          <Route path="rector-students" element={<RectorStudents />} />
          <Route path="rector-students/:id" element={<RectorStudentDetail />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
