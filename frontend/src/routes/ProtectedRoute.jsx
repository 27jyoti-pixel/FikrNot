import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Loading } from "../components/common/States";
import { homePathForUser, normalizedRole } from "../utils/roleRouting";
export default function ProtectedRoute({ role }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading label="Restoring your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && normalizedRole(user) !== role.toLowerCase())
    return (
      <Navigate
        to={homePathForUser(user)}
        replace
      />
    );
  return <Outlet />;
}
