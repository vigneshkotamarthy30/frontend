import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      const from = location.state?.from;
      navigate(from ? { pathname: from.pathname, search: from.search, hash: from.hash } : '/dashboard', {
        replace: true,
        state: from?.state
      });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="auth-card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} type="email" required />
        <label>Password</label>
        <input name="password" value={form.password} onChange={handleChange} type="password" required />
        {error && <p className="error">{error}</p>}
        <button className="button primary" type="submit">Login</button>
      </form>
      <p className="auth-switch">New to HarborStay? <Link to="/register" state={location.state}>Create an account</Link></p>
    </div>
  );
}
