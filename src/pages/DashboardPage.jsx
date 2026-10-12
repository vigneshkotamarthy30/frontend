import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

function ApplicationPhotos({ application }) {
  const [photos, setPhotos] = useState(null);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    let active = true;
    const urls = [];
    const loadPhotos = async () => {
      try {
        const details = await api.get(`/admin/hotel-applications/${application.id}/photos`);
        const loaded = await Promise.all(details.data.map(async (photo) => {
          const response = await api.get(
            `/admin/hotel-applications/${application.id}/photos/${photo.id}`,
            { responseType: 'blob' }
          );
          const url = URL.createObjectURL(response.data);
          urls.push(url);
          return { ...photo, url };
        }));
        if (active) setPhotos(loaded);
      } catch (error) {
        if (active) setPhotoError(error.message || 'Unable to load hotel photos.');
      }
    };

    loadPhotos();
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [application.id, application.photos]);

  if (photoError) return <span className="error">{photoError}</span>;
  if (photos === null) return <span>Loading photos…</span>;
  if (!photos.length) return <span>No photos</span>;
  return <div className="application-photo-list">
    {photos.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
      <img src={photo.url} alt={photo.originalName} />
    </a>)}
  </div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [applications, setApplications] = useState([]);
  const [partnerHotels, setPartnerHotels] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [applicationError, setApplicationError] = useState('');
  const [partnerError, setPartnerError] = useState('');
  const [hotelBookingError, setHotelBookingError] = useState('');
  const [decidingBookingId, setDecidingBookingId] = useState(null);
  const [removingPartnerHotelId, setRemovingPartnerHotelId] = useState(null);
  const [removingApplicationId, setRemovingApplicationId] = useState(null);

  const loadPartnerHotels = () => api.get('/partner/hotel-applications/mine')
    .then((res) => setPartnerHotels(res.data))
    .catch((error) => setPartnerError(error.message || 'Unable to load your hotel registrations.'));

  const loadApplications = () => api.get('/admin/hotel-applications')
    .then((res) => setApplications(res.data))
    .catch((error) => setApplicationError(error.message || 'Unable to load hotel applications.'));

  useEffect(() => {
    if (!user) return;
    if (user.role === 'HOTEL_PARTNER') {
      loadPartnerHotels();
      api.get('/partner/hotels/bookings')
        .then((res) => setHotelBookings(res.data))
        .catch((error) => setHotelBookingError(error.message || 'Unable to load hotel booking requests.'));
    } else if (user.role === 'ADMIN') {
      api.get('/admin/dashboard')
        .then((res) => setStats(res.data))
        .catch(() => setStats({}));
      loadApplications();
    }
  }, [user]);

  const removePartnerHotel = async (hotel) => {
    if (!window.confirm(`Remove ${hotel.hotelName} from the hotel portal? This also deletes its uploaded photos and cannot be undone.`)) return;

    setPartnerError('');
    setRemovingPartnerHotelId(hotel.id);
    try {
      await api.delete(`/partner/hotels/${hotel.id}`);
      setPartnerHotels((current) => current.filter((item) => item.id !== hotel.id));
    } catch (error) {
      setPartnerError(error.message || 'Unable to remove this hotel.');
    } finally {
      setRemovingPartnerHotelId(null);
    }
  };

  const decideHotelBooking = async (booking, decision) => {
    setHotelBookingError('');
    setDecidingBookingId(booking.id);
    try {
      const response = await api.patch(`/partner/hotels/bookings/${booking.id}`, { decision });
      setHotelBookings((current) => current.map((item) => item.id === booking.id ? response.data : item));
    } catch (error) {
      setHotelBookingError(error.message || 'Unable to update this booking request.');
    } finally {
      setDecidingBookingId(null);
    }
  };

  const reviewApplication = async (applicationId, status) => {
    setApplicationError('');
    try {
      await api.patch(`/admin/hotel-applications/${applicationId}/status`, { status });
      await loadApplications();
    } catch (error) {
      setApplicationError(error.message || 'Unable to update this application.');
    }
  };

  const removeApplication = async (application) => {
    if (!window.confirm(`Remove ${application.hotelName} from hotel applications? This cannot be undone.`)) return;

    setApplicationError('');
    setRemovingApplicationId(application.id);
    try {
      await api.delete(`/admin/hotel-applications/${application.id}`);
      setApplications((current) => current.filter((item) => item.id !== application.id));
    } catch (error) {
      setApplicationError(error.message || 'Unable to remove this hotel application.');
    } finally {
      setRemovingApplicationId(null);
    }
  };

  if (!user) return <div className="loading">Please sign in.</div>;

  return (
    <div>
      <h2>Welcome, {user.firstName} {user.lastName}</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Role</h3>
          <p>{user.role}</p>
        </div>
        {user.role === 'HOTEL_PARTNER' && (
          <section className="admin-applications">
            <div className="section-header"><p className="eyebrow">Hotel partner</p><h2>Your hotel registrations</h2></div>
            {partnerError && <p className="error" role="alert">{partnerError}</p>}
            {!partnerError && !partnerHotels.length ? <p className="empty-state">You have not registered a hotel yet.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Hotel</th><th>Location</th><th>Rooms</th><th>Listing status</th><th>Action</th></tr></thead>
                  <tbody>{partnerHotels.map((hotel) => (
                    <tr key={hotel.id}>
                      <td>{hotel.hotelName}</td>
                      <td>{hotel.city}, {hotel.state}</td>
                      <td>{hotel.roomCount}</td>
                      <td>{hotel.status === 'APPROVED' ? 'Approved' : hotel.status === 'REJECTED' ? 'Rejected' : 'Pending review'}</td>
                      <td><button
                        className="button secondary"
                        onClick={() => removePartnerHotel(hotel)}
                        disabled={removingPartnerHotelId === hotel.id}
                      >{removingPartnerHotelId === hotel.id ? 'Removing…' : 'Remove hotel'}</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {user.role === 'HOTEL_PARTNER' && (
          <section className="admin-applications">
            <div className="section-header"><p className="eyebrow">Guest reservations</p><h2>Hotel booking requests</h2></div>
            {hotelBookingError && <p className="error" role="alert">{hotelBookingError}</p>}
            {!hotelBookingError && hotelBookings.length === 0 ? <p className="empty-state">There are no booking requests for your hotels yet.</p> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Reference</th><th>Hotel</th><th>Guest</th><th>Stay dates</th><th>Guests</th><th>Status</th><th>Decision</th></tr></thead>
                  <tbody>{hotelBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.bookingReference}</td>
                      <td>{booking.hotelName}</td>
                      <td>{booking.guestName}<br /><a href={`mailto:${booking.guestEmail}`}>{booking.guestEmail}</a>{booking.guestPhone && <><br />{booking.guestPhone}</>}</td>
                      <td>{booking.checkIn} – {booking.checkOut}</td>
                      <td>{booking.guestCount}</td>
                      <td>{booking.status}</td>
                      <td>{booking.status === 'PENDING' ? <div className="review-actions">
                        <button className="button primary" onClick={() => decideHotelBooking(booking, 'ACCEPT')} disabled={decidingBookingId === booking.id}>
                          {decidingBookingId === booking.id ? 'Saving…' : 'Accept'}
                        </button>
                        <button className="button secondary" onClick={() => decideHotelBooking(booking, 'REJECT')} disabled={decidingBookingId === booking.id}>
                          {decidingBookingId === booking.id ? 'Saving…' : 'Reject'}
                        </button>
                      </div> : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="stat-card">
            <h3>{key}</h3>
            <p>{String(value)}</p>
          </div>
        ))}
      </div>
      {user.role === 'ADMIN' && (
        <section className="admin-applications">
          <div className="section-header"><p className="eyebrow">Partner onboarding</p><h2>Hotel applications</h2></div>
          {applicationError && <p className="error" role="alert">{applicationError}</p>}
          {!applications.length ? <p className="empty-state">No hotel applications have been submitted yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Property</th><th>Contact</th><th>Rooms</th><th>Photos</th><th>Status</th><th>Review</th><th>Remove</th></tr></thead>
                <tbody>{applications.map((application) => (
                  <tr key={application.id}>
                    <td><strong>{application.hotelName}</strong><br />{application.city}, {application.state}</td>
                    <td>{application.contactName}<br /><a href={`mailto:${application.email}`}>{application.email}</a><br />{application.phone}</td>
                    <td>{application.roomCount}</td>
                    <td><ApplicationPhotos application={application} /></td>
                    <td>{application.status}</td>
                    <td>{application.status === 'PENDING' ? <div className="review-actions">
                      <button className="button primary" onClick={() => reviewApplication(application.id, 'APPROVED')}>Approve</button>
                      <button className="button secondary" onClick={() => reviewApplication(application.id, 'REJECTED')}>Decline</button>
                    </div> : 'Reviewed'}</td>
                    <td><button
                      className="button secondary"
                      onClick={() => removeApplication(application)}
                      disabled={removingApplicationId === application.id}
                    >{removingApplicationId === application.id ? 'Removing…' : 'Remove'}</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
