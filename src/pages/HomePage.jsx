import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../context/AuthContext';
import HotelCard from '../components/HotelCard';
import usePartnerHotels from '../hooks/usePartnerHotels';

export default function HomePage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState('');
  const [hotelError, setHotelError] = useState('');
  const [loadingHotels, setLoadingHotels] = useState(true);
  const { hotelIds, removingId, error: partnerError, removeHotel } = usePartnerHotels(user);
  const featuredHotels = [
    ...hotels.slice(0, 3),
    ...hotels.filter((hotel) => hotelIds.has(hotel.id) && !hotels.slice(0, 3).some((featured) => featured.id === hotel.id))
  ];

  useEffect(() => {
    api.get('/rooms')
      .then((res) => setRooms(res.data.slice(0, 3)))
      .catch(() => setError('Unable to load featured rooms.'));
    api.get('/hotels')
      .then((res) => setHotels(res.data))
      .catch((requestError) => setHotelError(requestError.message || 'Unable to load registered hotels.'))
      .finally(() => setLoadingHotels(false));
  }, []);

  return (
    <>
      <section className="hero hero-premium">
        <div className="hero-copy">
          <p className="eyebrow">Stay a little closer to extraordinary</p>
          <h1>Find your kind of <em>getaway.</em></h1>
          <p>Thoughtfully chosen stays, effortless reservations, and the little details that make a trip feel like yours.</p>
          <div className="hero-actions">
            <Link to="/rooms" className="button primary">Explore stays <span aria-hidden="true">→</span></Link>
            <Link to="/hotels" className="button hero-link">Browse hotels</Link>
            <Link to="/partner/register" className="button hero-link">Partner with us</Link>
          </div>
        </div>
        <div className="hero-image" role="img" aria-label="Sunlit luxury hotel bedroom" />
        <div className="hero-search">
          <div><span className="search-label">Planning a stay?</span><strong>Discover a room that feels right.</strong></div>
          <Link to="/rooms" className="button primary">Find a room</Link>
        </div>
      </section>

      <section className="promise-strip" aria-label="HarborStay benefits">
        <div><span className="promise-icon">✦</span><span><strong>Handpicked comfort</strong><small>Spaces selected for a better stay</small></span></div>
        <div><span className="promise-icon">⌁</span><span><strong>Easy reservations</strong><small>Clear prices and simple booking</small></span></div>
        <div><span className="promise-icon">♡</span><span><strong>Local hospitality</strong><small>Independent stays, personal service</small></span></div>
      </section>

      <section className="section-header featured-heading">
        <div><p className="eyebrow">Discover a place to stay</p><h2>Hotels on HarborStay</h2></div>
        <Link to="/hotels" className="text-link">View all hotels <span aria-hidden="true">→</span></Link>
      </section>
      {hotelError && <p className="error" role="alert">{hotelError}</p>}
      {loadingHotels && <div className="loading">Loading hotels...</div>}
      {!loadingHotels && !hotelError && hotels.length === 0 ? (
        <div className="empty-state">
          <h3>No hotels registered yet</h3>
          <p>Registered hotels will appear here.</p>
          <Link to="/partner/register" className="button primary">Register your hotel</Link>
        </div>
      ) : !loadingHotels && !hotelError ? (
        <div className="card-grid hotel-card-grid">
          {featuredHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              canRemove={hotelIds.has(hotel.id)}
              removing={removingId === hotel.id}
              onRemove={async (selectedHotel) => {
                if (await removeHotel(selectedHotel)) {
                  setHotels((current) => current.filter((item) => item.id !== selectedHotel.id));
                }
              }}
            />
          ))}
        </div>
      ) : null}
      {partnerError && <p className="error" role="alert">{partnerError}</p>}

      <section className="section-header featured-heading">
        <div><p className="eyebrow">A good place to begin</p><h2>Stays made for slowing down</h2></div>
        <Link to="/rooms" className="text-link">Explore all rooms <span aria-hidden="true">→</span></Link>
      </section>
      {error && <p className="error">{error}</p>}
      <div className="card-grid">
        {rooms.map((room) => (
          <article key={room.id} className="card room-card">
            <img src={room.imageUrl || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'} alt={room.title} />
            <div className="card-body">
              <span className="room-category">{room.roomType?.name || 'Guest room'}</span>
              <h3>{room.title}</h3>
              <p className="room-description">{room.description}</p>
              <div className="room-card-footer"><p><strong>{formatCurrency(room.nightlyRate)}</strong><span> / night</span></p>
                <Link to={`/rooms/${room.id}`} className="button primary">View stay</Link></div>
            </div>
          </article>
        ))}
      </div>

      <section className="host-banner">
        <div><p className="eyebrow">For independent hoteliers</p><h2>Your property deserves to be discovered.</h2><p>Bring your hotel to guests looking for thoughtful stays across India.</p></div>
        <Link to="/partner/register" className="button light-button">List your hotel <span aria-hidden="true">→</span></Link>
      </section>
    </>
  );
}
