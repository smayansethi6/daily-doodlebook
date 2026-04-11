import { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "@/lib/adminSession";

export default function AdminGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
