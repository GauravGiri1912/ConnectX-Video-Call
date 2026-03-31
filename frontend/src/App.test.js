import { render, screen } from '@testing-library/react';
import App from './App';

test('renders get started call to action', () => {
  render(<App />);
  const linkElement = screen.getByText(/get started/i);
  expect(linkElement).toBeInTheDocument();
});
