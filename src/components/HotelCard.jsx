import api from '../api/client';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HotelCard({ hotel, canRemove = false, removing = false, onRemove }) {
  const { user } = useAuth();
  const location = useLocation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState({ checkIn: '', checkOut: '', guestCount: 1 });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const requestBooking = async (event) => {
    event.preventDefault();
    setBookingError('');
    setBookingSuccess('');
    setBookingLoading(true);
    try {
      const response = await api.post(`/hotels/${hotel.id}/bookings`, {
        ...booking,
        guestCount: Number(booking.guestCount)
      });
      setBookingSuccess(`Request ${response.data.bookingReference} sent. The hotel will review it.`);
      setBookingOpen(false);
    } catch (error) {
      setBookingError(error.message || 'Unable to send your hotel booking request.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <article className="card hotel-card">
      {hotel.photos?.length ? (
        <div className="hotel-photo-gallery">
          {hotel.photos.slice(0, 4).map((photo) => (
            <img
              key={photo.id}
              src={`${api.defaults.baseURL}/hotels/${hotel.id}/photos/${photo.id}`}
              alt={`${hotel.hotelName} - ${photo.originalName}`}
              loading="lazy"
            />
          ))}
        </div>
      ) : (
        <div className="hotel-photo-placeholder" aria-label="No hotel photos available">Hotel photo</div>
      )}
      <div className="card-body">
        <span className="room-category">{hotel.city}, {hotel.state}</span>
        <h2>{hotel.hotelName}</h2>
        <p>{hotel.address}</p>
        <p>{hotel.roomCount} {hotel.roomCount === 1 ? 'room' : 'rooms'}</p>
        {hotel.website && <a className="text-link" href={hotel.website} target="_blank" rel="noreferrer">Visit hotel website</a>}
        {user?.role === 'CUSTOMER' && !bookingOpen && (
          <button className="button primary" type="button" onClick={() => setBookingOpen(true)}>Request to book</button>
        )}
        {!user && <Link className="button primary" to="/login" state={{ from: location }}>Sign in to request</Link>}
        {bookingSuccess && <p className="success" role="status">{bookingSuccess}</p>}
        {bookingOpen && (
          <form className="booking-form hotel-booking-form" onSubmit={requestBooking}>
            <h3>Request a stay</h3>
            <p className="muted">Your request goes to the hotel for acceptance. No payment is taken now.</p>
            <label htmlFor={`hotel-checkin-${hotel.id}`}>Check-in</label>
            <input
              id={`hotel-checkin-${hotel.id}`}
              type="date"
              min={minDate}
              required
              value={booking.checkIn}
              onChange={(event) => setBooking({ ...booking, checkIn: event.target.value })}
            />
            <label htmlFor={`hotel-checkout-${hotel.id}`}>Check-out</label>
            <input
              id={`hotel-checkout-${hotel.id}`}
              type="date"
              min={booking.checkIn || minDate}
              required
              value={booking.checkOut}
              onChange={(event) => setBooking({ ...booking, checkOut: event.target.value })}
            />
            <label htmlFor={`hotel-guests-${hotel.id}`}>Guests</label>
            <input
              id={`hotel-guests-${hotel.id}`}
              type="number"
              min="1"
              required
              value={booking.guestCount}
              onChange={(event) => setBooking({ ...booking, guestCount: event.target.value })}
            />
            {bookingError && <p className="error" role="alert">{bookingError}</p>}
            <button className="button primary" type="submit" disabled={bookingLoading}>
              {bookingLoading ? 'Sending request…' : 'Send booking request'}
            </button>
            <button className="button secondary" type="button" onClick={() => setBookingOpen(false)}>Cancel</button>
          </form>
        )}
        {canRemove && <button
          className="button secondary hotel-remove-button"
          type="button"
          onClick={() => onRemove(hotel)}
          disabled={removing}
        >{removing ? 'Removing…' : 'Remove my hotel'}</button>}
      </div>
    </article>
  );
}
