import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../pages/HomePage';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../../theme';

function renderWithProviders(ui: React.ReactElement) {
  return render(<ChakraProvider theme={theme}>{ui}</ChakraProvider>);
}

describe('HomePage', () => {
  it('renders the logo in the nav and hero', () => {
    renderWithProviders(<HomePage />);
    // There should be two SVG logos (nav and hero)
    const logos = screen.getAllByRole('img', { hidden: true });
    expect(logos.length).toBeGreaterThanOrEqual(2);
  });

  it('shows the main value proposition', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText(/Gifting, on Autopilot/i)).toBeInTheDocument();
    expect(screen.getByText(/Never forget a birthday, anniversary, or special moment again/i)).toBeInTheDocument();
  });

  it('uses brand colors for nav and buttons', () => {
    renderWithProviders(<HomePage />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    // Button should have orange background
    const button = screen.getByRole('button', { name: /sign in/i });
    expect(button).toHaveStyle('background-color: var(--chakra-colors-orange-400)');
  });

  it('is accessible: logo SVGs have role img', () => {
    renderWithProviders(<HomePage />);
    const logos = screen.getAllByRole('img', { hidden: true });
    expect(logos.length).toBeGreaterThanOrEqual(2);
  });
}); 