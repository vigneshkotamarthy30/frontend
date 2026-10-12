import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatCurrency } from '../utils/currency';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [guestFilter, setGuestFilter] = useState('any');
  const [sort, setSort] = useState('recommended');

  useEffect(() => {
    api.get('/rooms')
      .then((res) => setRooms(res.data))
      .catch((err) => setError(err.message || 'Unable to load rooms.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = rooms
    .filter((room) => `${room.title} ${room.description || ''} ${room.roomType?.name || ''}`.toLowerCase().includes(search.toLowerCase()))
    .filter((room) => guestFilter === 'any' || room.maxGuests >= Number(guestFilter))
    .sort((a, b) => sort === 'price-low' ? Number(a.nightlyRate) - Number(b.nightlyRate)
      : sort === 'price-high' ? Number(b.nightlyRate) - Number(a.nightlyRate) : a.id - b.id);

  if (loading) return <div className="loading">Loading rooms...</div>;

  return (
    <div>
      <section className="listing-heading">
        <div><p className="eyebrow">Find your next stay</p><h1>Rooms to come home to</h1><p>Compare considered stays and reserve securely in a few simple steps.</p></div>
      </section>
      <section className="filters-panel" aria-label="Filter rooms">
        <label>Search stays<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Room name or type" /></label>
        <label>Guests<select value={guestFilter} onChange={(event) => setGuestFilter(event.target.value)}><option value="any">Any number</option><option value="1">1+ guests</option><option value="2">2+ guests</option><option value="3">3+ guests</option><option value="4">4+ guests</option></select></label>
        <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
        <span className="result-count">{filteredRooms.length} {filteredRooms.length === 1 ? 'stay' : 'stays'}</span>
      </section>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="card-grid">
        {filteredRooms.map((room) => (
          <article key={room.id} className="card room-card">
            <img src={room.imageUrl || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'} alt={room.title} />
            <div className="card-body">
              <span className="room-category">{room.roomType?.name || 'Guest room'}</span>
              <h3>{room.title}</h3>
              <p>{room.maxGuests} guests · {room.beds} {room.beds === 1 ? 'bed' : 'beds'}</p>
              <p className="price-line">{formatCurrency(room.nightlyRate)} <span> / night</span></p>
              <Link to={`/rooms/${room.id}`} className="button primary">View & reserve</Link>
            </div>
          </article>
        ))}
      </div>
      {!filteredRooms.length && <div className="empty-state"><h3>No stays match those filters</h3><p>Try a different search or reduce the guest count.</p></div>}
    </div>
  );
}
