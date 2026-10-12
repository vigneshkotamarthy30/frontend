import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  hotelName: '',
  city: '',
  state: '',
  address: '',
  contactName: '',
  email: '',
  phone: '',
  roomCount: 1,
  website: '',
  message: ''
};

export default function PartnerRegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const photoInput = useRef(null);
  const { user, registerHotel, logout } = useAuth();

  useEffect(() => {
    const previews = photos.map((photo) => ({ photo, url: URL.createObjectURL(photo) }));
    setPhotoPreviews(previews);
    return () => previews.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [photos]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!photos.length) {
      setError('Please select at least one hotel photo.');
      return;
    }
    setSubmitting(true);
    try {
      const submission = new FormData();
      submission.append('application', new Blob([
        JSON.stringify({ ...form, roomCount: Number(form.roomCount), password: form.password || null })
      ], { type: 'application/json' }));
      photos.forEach((photo) => submission.append('photos', photo));
      const response = await registerHotel(submission);
      setSuccess(user?.role === 'HOTEL_PARTNER'
        ? `Hotel added successfully and is now visible in the hotel list. Reference: HS-${response.id}.`
        : `Hotel registered successfully and is now visible in the hotel list. Your partner account is ready. Reference: HS-${response.id}.`);
      setForm(initialForm);
      setPhotos([]);
      if (photoInput.current) photoInput.current.value = '';
    } catch (submitError) {
      setError(submitError.message || 'We could not submit your property. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      const next = current.filter((_, photoIndex) => photoIndex !== index);
      if (!next.length && photoInput.current) photoInput.current.value = '';
      return next;
    });
  };

  return (
    <div className="partner-page">
      <section className="partner-intro">
        <p className="eyebrow">HarborStay for partners</p>
        <h1>More guests. More possibilities.</h1>
        <p>Register your hotel, upload photos, and create a hotel partner account to manage your listing.</p>
        <div className="partner-points">
          <span>✓ Reach new travellers</span>
          <span>✓ Showcase what makes you special</span>
          <span>✓ Get a real person to help you get started</span>
        </div>
      </section>
      <section className="partner-form-card">
        <h2>Tell us about your hotel</h2>
        <p className="muted">Your hotel is listed as soon as registration is complete. Create a separate password for your hotel partner account.</p>
        {success && <p className="success" role="status">{success}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {user && user.role !== 'HOTEL_PARTNER' && (
          <div className="partner-account-prompt">
            <p className="muted">You’re signed in with a {user.role === 'CUSTOMER' ? 'guest' : 'admin'} account. Hotel registration uses a separate hotel-partner account and email address.</p>
            <button className="button primary" type="button" onClick={logout}>Log out and continue hotel registration</button>
          </div>
        )}
        {user?.role === 'HOTEL_PARTNER' && <p className="muted">Signed in as hotel partner {user.email}.</p>}
        {!user && <p className="muted">Already registered your hotel? <Link to="/login" className="text-link">Log in</Link></p>}
        {(!user || user.role === 'HOTEL_PARTNER') && <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>Hotel or property name<input name="hotelName" value={form.hotelName} onChange={handleChange} maxLength="150" required /></label>
            <label>Number of rooms<input name="roomCount" type="number" min="1" value={form.roomCount} onChange={handleChange} required /></label>
            <label>City<input name="city" value={form.city} onChange={handleChange} maxLength="100" required /></label>
            <label>State<input name="state" value={form.state} onChange={handleChange} maxLength="100" required /></label>
            <label className="form-full">Property address<input name="address" value={form.address} onChange={handleChange} maxLength="255" required /></label>
            <label>Contact person<input name="contactName" value={form.contactName} onChange={handleChange} maxLength="150" required /></label>
            <label>Business phone<input name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength="30" required /></label>
            <label>Business email<input name="email" type="email" value={form.email} onChange={handleChange} maxLength="150" required /></label>
            {!user && <label>Hotel account password<input name="password" type="password" value={form.password || ''} onChange={handleChange} minLength="6" maxLength="100" autoComplete="new-password" required /></label>}
            <label>Website (optional)<input name="website" type="url" value={form.website} onChange={handleChange} maxLength="255" placeholder="https://" /></label>
            <label className="form-full">Anything else we should know? (optional)<textarea name="message" value={form.message} onChange={handleChange} rows="4" maxLength="2000" /></label>
            <label className="form-full">Hotel photos (JPEG, PNG, WebP, or GIF; up to 10 MB each)
              <input
                ref={photoInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                required
                onChange={(event) => {
                  setError('');
                  setPhotos(Array.from(event.target.files || []));
                }}
              />
            </label>
            {photoPreviews.length > 0 && <div className="photo-preview-grid form-full" aria-label="Selected hotel photos">
              {photoPreviews.map(({ photo, url }, index) => (
                <div className="photo-preview" key={`${photo.name}-${index}`}>
                  <img src={url} alt={`Selected hotel photo: ${photo.name}`} />
                  <span>{photo.name}</span>
                  <button className="button secondary" type="button" onClick={() => removePhoto(index)}>Remove photo</button>
                </div>
              ))}
            </div>}
          </div>
          <button className="button primary" type="submit" disabled={submitting}>{submitting ? 'Registering hotel…' : user ? 'Add another hotel' : 'Register hotel'}</button>
        </form>}
      </section>
    </div>
  );
}
