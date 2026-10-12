import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { formatCurrency } from '../utils/currency';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotelBookingError, setHotelBookingError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    Promise.all([
      api.get('/bookings/my').then((res) => setBookings(res.data)),
      api.get('/bookings/my/hotels')
        .then((res) => setHotelBookings(res.data))
        .catch((err) => setHotelBookingError(err.message || 'Unable to load your hotel requests.'))
    ])
      .catch((err) => setError(err.message || 'Unable to load your bookings.'))
      .finally(() => setLoading(false));
  }, []);

  const cancelBooking = async (booking) => {
    if (!window.confirm(`Cancel reservation ${booking.bookingReference}?`)) return;
    setError('');
    setCancelingId(booking.id);
    try {
      const response = await api.post(`/bookings/${booking.id}/cancel`);
      setBookings((current) => current.map((item) => item.id === booking.id ? response.data : item));
    } catch (err) {
      setError(err.message || 'Unable to cancel this reservation.');
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div>
      <section className="listing-heading"><p className="eyebrow">Your HarborStay account</p><h1>My reservations</h1><p>Keep your upcoming stays and booking details together.</p></section>
      {location.state?.newBooking && <p className="success" role="status">Your reservation {location.state.newBooking} has been created.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {hotelBookingError && <p className="error" role="alert">{hotelBookingError}</p>}
      <section className="booking-list-section">
        <h2>Hotel booking requests</h2>
        {hotelBookings.length === 0 ? <p className="muted">You have no hotel booking requests.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Reference</th><th>Hotel</th><th>Stay dates</th><th>Guests</th><th>Status</th></tr></thead>
              <tbody>{hotelBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.bookingReference}</td>
                  <td>{booking.hotelName}<br /><span className="muted">{booking.city}</span></td>
                  <td>{booking.checkIn} – {booking.checkOut}</td>
                  <td>{booking.guestCount}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
      <section className="booking-list-section">
        <h2>Room reservations</h2>
      {bookings.length === 0 ? <div className="empty-state"><h3>No reservations yet</h3><p>Find a room for your next trip.</p></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Room</th>
                <th>Stay dates</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.bookingReference}</td>
                  <td>{booking.roomTitle}</td>
                  <td>{booking.checkIn} – {booking.checkOut}<br /><span className="muted">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span></td>
                  <td>{booking.guestCount}</td>
                  <td>{booking.status}</td>
                  <td>{formatCurrency(booking.totalAmount)}</td>
                  <td>{!['CANCELLED', 'CHECKED_OUT'].includes(booking.status) && <button className="button secondary" disabled={cancelingId === booking.id} onClick={() => cancelBooking(booking)}>{cancelingId === booking.id ? 'Cancelling…' : 'Cancel stay'}</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </section>
    </div>
  );
}
