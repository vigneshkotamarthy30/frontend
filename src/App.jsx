import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';
import HotelsPage from './pages/HotelsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import NotFoundPage from './pages/NotFoundPage';
import PartnerRegistrationPage from './pages/PartnerRegistrationPage';

function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="brand">HarborStay</div>
        <nav className="nav">
          <Link to="/">Home</Link>
          {(!user || user.role === 'CUSTOMER' || user.role === 'ADMIN') && <Link to="/rooms">Rooms</Link>}
          {(!user || user.role === 'CUSTOMER' || user.role === 'ADMIN') && <Link to="/hotels">Hotels</Link>}
          <Link to="/partner/register">Hotel registration</Link>
          {user?.role === 'CUSTOMER' && <Link to="/bookings">My bookings</Link>}
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user && user.role === 'ADMIN' && <Link to="/dashboard">Admin</Link>}
          {!user ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Guest registration</Link>
            </>
          ) : (
            <button onClick={logout} className="button secondary">Logout</button>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/partner/register" element={<PartnerRegistrationPage />} />
          <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute adminOnly={false}><DashboardPage /></ProtectedRoute>} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}
