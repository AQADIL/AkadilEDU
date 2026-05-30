import { Navigate } from 'react-router-dom';

export default function Admin() {
  // Redirect to admin dashboard
  return <Navigate to="/admin" replace />;
}
