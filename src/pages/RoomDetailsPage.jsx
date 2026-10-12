import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import api from '../api/client';

function getLocalDateString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function readPendingBooking() {
  try {
    const saved = sessionStorage.getItem('pendingBooking');
    return saved ? JSON.parse(saved) : { checkIn: '', checkOut: '', guestCount: 1 };
  } catch {
    sessionStorage.removeItem('pendingBooking');
    return { checkIn: '', checkOut: '', guestCount: 1 };
  }
}

export default function RoomDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState(readPendingBooking);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const today = getLocalDateString();
  const nights = booking.checkIn && booking.checkOut
    ? Math.max(0, (Date.parse(`${booking.checkOut}T00:00:00Z`) - Date.parse(`${booking.checkIn}T00:00:00Z`)) / 86400000)
    : 0;

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then((res) => setRoom(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (location.state?.reserve) setBookingOpen(true);
  }, [location.state]);

  if (loading) return <div className="loading">Loading room details...</div>;
  if (!room) return <div className="error">Room not found.</div>;

  const handleBooking = async (event) => {
    event.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    if (!booking.checkIn || !booking.checkOut || booking.checkIn >= booking.checkOut) {
      setBookingError('Choose a check-out date after your check-in date.');
      return;
    }
    if (!user) {
      sessionStorage.setItem('pendingBooking', JSON.stringify({ ...booking, roomId: room.id }));
      navigate('/login', { state: { from: { pathname: location.pathname, state: { reserve: true } } } });
      return;
    }
    setBookingLoading(true);
    try {
      const response = await api.post('/bookings', { ...booking, roomId: room.id, guestCount: Number(booking.guestCount) });
      sessionStorage.removeItem('pendingBooking');
      setBookingSuccess(`Reservation created: ${response.data.bookingReference}`);
      setBookingOpen(false);
      navigate('/bookings', { state: { newBooking: response.data.bookingReference } });
    } catch (error) {
      setBookingError(error.message || 'We could not complete your reservation. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="detail-layout">
      <div className="image-panel">
        <img src={room.imageUrl || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'} alt={room.title} />
      </div>
      <div className="detail-panel">
        <p className="eyebrow">{room.roomType?.name} · HarborStay collection</p>
        <h2>{room.title}</h2>
        <p>{room.description}</p>
        <ul className="room-facts">
          <li>Guests: {room.maxGuests}</li>
          <li>Beds: {room.beds}</li>
          <li>Nightly rate: {formatCurrency(room.nightlyRate)}</li>
          <li>Room status: {room.status?.toLowerCase().replace('_', ' ') || 'Available'}</li>
        </ul>
        <p className="price-line">{formatCurrency(room.nightlyRate)} <span>per night</span></p>
        {bookingSuccess && <p className="success" role="status">{bookingSuccess}</p>}
        {!bookingOpen && <button className="button primary" onClick={() => setBookingOpen(true)}>Reserve this room</button>}
        {bookingOpen && (
          <form className="booking-form" onSubmit={handleBooking}>
            <h3>Your stay</h3>
            <label htmlFor="checkIn">Check-in</label>
            <input id="checkIn" type="date" min={today} required value={booking.checkIn} onChange={(event) => setBooking({ ...booking, checkIn: event.target.value })} />
            <label htmlFor="checkOut">Check-out</label>
            <input id="checkOut" type="date" min={booking.checkIn || today} required value={booking.checkOut} onChange={(event) => setBooking({ ...booking, checkOut: event.target.value })} />
            <label htmlFor="guestCount">Guests (maximum {room.maxGuests})</label>
            <input id="guestCount" type="number" min="1" max={room.maxGuests} required value={booking.guestCount} onChange={(event) => setBooking({ ...booking, guestCount: event.target.value })} />
            {nights > 0 && <p className="booking-estimate">{nights} {nights === 1 ? 'night' : 'nights'} · estimated total <strong>{formatCurrency(Number(room.nightlyRate) * nights)}</strong></p>}
            {bookingError && <p className="error" role="alert">{bookingError}</p>}
            {!user && <p className="muted">Sign in or create an account to confirm your reservation. Your dates will be saved.</p>}
            <button className="button primary" type="submit" disabled={bookingLoading}>{bookingLoading ? 'Reserving…' : user ? 'Confirm reservation' : 'Continue to sign in'}</button>
            <button className="button secondary" type="button" onClick={() => setBookingOpen(false)}>Cancel</button>
            {user && <Link to="/bookings" className="text-link">View my bookings</Link>}
          </form>
        )}
      </div>
    </div>
  );
}
