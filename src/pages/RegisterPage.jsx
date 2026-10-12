import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register(form);
      const from = location.state?.from;
      navigate(from ? { pathname: from.pathname, search: from.search, hash: from.hash } : '/dashboard', {
        replace: true,
        state: from?.state
      });
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-card">
      <h2>Guest registration</h2>
      <form onSubmit={handleSubmit}>
        <label>First name</label>
        <input name="firstName" value={form.firstName} onChange={handleChange} required />
        <label>Last name</label>
        <input name="lastName" value={form.lastName} onChange={handleChange} required />
        <label>Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} minLength="6" required />
        <label>Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button className="button primary" type="submit">Create account</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login" state={location.state}>Log in</Link></p>
      <p className="auth-switch">Registering a hotel? <Link to="/partner/register">Hotel registration</Link></p>
    </div>
  );
}
