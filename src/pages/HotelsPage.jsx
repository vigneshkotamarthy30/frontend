import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import HotelCard from '../components/HotelCard';
import usePartnerHotels from '../hooks/usePartnerHotels';

export default function HotelsPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { hotelIds, removingId, error: partnerError, removeHotel } = usePartnerHotels(user);

  useEffect(() => {
    api.get('/hotels')
      .then((response) => setHotels(response.data))
      .catch((requestError) => setError(requestError.message || 'Unable to load hotels.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="listing-heading">
        <p className="eyebrow">Stay somewhere special</p>
        <h1>Our hotels</h1>
        <p>Explore properties registered with HarborStay and find a stay that feels right.</p>
      </section>
      {loading && <div className="loading">Loading hotels...</div>}
      {error && <p className="error" role="alert">{error}</p>}
      {partnerError && <p className="error" role="alert">{partnerError}</p>}
      {!loading && !error && hotels.length === 0 && (
        <div className="empty-state">
          <h3>No hotels listed yet</h3>
          <p>New hotel registrations will appear here once submitted.</p>
          <Link to="/partner/register" className="button primary">Register your hotel</Link>
        </div>
      )}
      <div className="card-grid hotel-card-grid">
        {hotels.map((hotel) => (
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
    </div>
  );
}
