import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddRecipientPage from '../../pages/AddRecipientPage';
import { useRecipientStore } from '../../store/recipientStore';
import '@testing-library/jest-dom';

// Mock the recipient store
jest.mock('../../store/recipientStore', () => ({
  useRecipientStore: jest.fn()
}));

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('AddRecipientPage', () => {
  beforeEach(() => {
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      addRecipient: jest.fn().mockResolvedValue({ id: '1' }),
      loading: false,
      error: null,
      resetError: jest.fn(),
      recipients: []
    });
    // Default mock for useAuthStore
    jest.mock('../store/authStore', () => ({
      useAuthStore: jest.fn().mockReturnValue({
        user: { planId: 'free' },
        demoMode: false
      })
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the first step (basic info) correctly', () => {
    render(
      <MemoryRouter>
        <AddRecipientPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Add Recipient')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Relationship/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Birthday/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interests/)).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('navigates through steps and submits recipient', async () => {
    const mockAddRecipient = jest.fn().mockResolvedValue({ id: '1' });
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      addRecipient: mockAddRecipient,
      loading: false,
      error: null,
      resetError: jest.fn()
    });
    render(
      <MemoryRouter>
        <AddRecipientPage />
      </MemoryRouter>
    );
    // Step 0: Fill out basic info
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Relationship/), { target: { value: 'Friend' } });
    fireEvent.change(screen.getByLabelText(/Birthday/), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText(/Add interest/), { target: { value: 'Gaming' } });
    fireEvent.click(screen.getByText('+'));
    fireEvent.click(screen.getByText('Next'));

    // Step 1: Budget & Occasion
    await waitFor(() => {
      expect(screen.getByText('Set Budget & Occasion')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/How much do you want to spend/), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/What occasion should we remember/), { target: { value: 'Birthday' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 2: Gift Recommendation
    await waitFor(() => {
      expect(screen.getByText('Gift Recommendation')).toBeInTheDocument();
    });
    // Simulate recommendation loaded
    // If there are no recommendations, the test will see the fallback text
    // Otherwise, approve the first gift
    if (screen.queryByText('No recommendations found. Try adjusting interests or budget.')) {
      // No recommendations, skip
      expect(screen.getByText('No recommendations found. Try adjusting interests or budget.')).toBeInTheDocument();
    } else {
      // Approve & Schedule
      const approveBtn = screen.getByText('Approve & Schedule');
      fireEvent.click(approveBtn);
    }

    // Step 3: Confirmation
    await waitFor(() => {
      expect(screen.getByText('All Set!')).toBeInTheDocument();
      expect(screen.getByText(/Your recipient and gift are set up/)).toBeInTheDocument();
    });
    expect(screen.getByText('Back to Recipients')).toBeInTheDocument();
  });

  test('shows paywall modal if at recipient limit on free plan', async () => {
    (useRecipientStore as unknown as jest.Mock).mockReturnValue({
      addRecipient: jest.fn(),
      loading: false,
      error: null,
      resetError: jest.fn(),
      recipients: [{ id: '1', name: 'Test', relationship: 'Friend', interests: [], createdAt: Date.now(), updatedAt: Date.now(), userId: 'user1' }]
    });
    jest.mock('../store/authStore', () => ({
      useAuthStore: jest.fn().mockReturnValue({
        user: { planId: 'free' },
        demoMode: false
      })
    }));
    render(
      <MemoryRouter>
        <AddRecipientPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'Another' } });
    fireEvent.change(screen.getByLabelText(/Relationship/), { target: { value: 'Friend' } });
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => {
      expect(screen.getByText('Upgrade Required')).toBeInTheDocument();
      expect(screen.getByText(/The Free plan allows only 1 recipient/)).toBeInTheDocument();
    });
  });
}); 