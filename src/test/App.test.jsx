import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

it('renders home page and heading', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText(/Find your kind of/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Hotels' })).toHaveAttribute('href', '/hotels');
  expect(screen.getByRole('link', { name: 'Guest registration' })).toHaveAttribute('href', '/register');
  expect(screen.getByRole('link', { name: 'Hotel registration' })).toHaveAttribute('href', '/partner/register');
});
