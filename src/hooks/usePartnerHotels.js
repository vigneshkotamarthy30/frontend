import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

export default function usePartnerHotels(user) {
  const [partnerHotels, setPartnerHotels] = useState([]);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (user?.role !== 'HOTEL_PARTNER') {
      setPartnerHotels([]);
      setError('');
      return;
    }

    let active = true;
    api.get('/partner/hotel-applications/mine')
      .then((response) => {
        if (active) setPartnerHotels(response.data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load your hotel registrations.');
      });

    return () => {
      active = false;
    };
  }, [user]);

  const hotelIds = useMemo(() => new Set(partnerHotels.map((hotel) => hotel.id)), [partnerHotels]);

  const removeHotel = async (hotel) => {
    if (!window.confirm(`Remove ${hotel.hotelName} from the hotel portal? This also deletes its uploaded photos and cannot be undone.`)) {
      return false;
    }

    setError('');
    setRemovingId(hotel.id);
    try {
      await api.delete(`/partner/hotels/${hotel.id}`);
      setPartnerHotels((current) => current.filter((item) => item.id !== hotel.id));
      return true;
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove this hotel.');
      return false;
    } finally {
      setRemovingId(null);
    }
  };

  return { hotelIds, removingId, error, removeHotel };
}
