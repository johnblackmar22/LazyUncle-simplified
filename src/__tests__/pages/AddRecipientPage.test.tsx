import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AddRecipientPage from '../../pages/AddRecipientPage';
import { useRecipientStore } from '../../store/recipientStore';

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
    // Setup default mock implementation
    (useRecipientStore as jest.Mock).mockReturnValue({
      addRecipient: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
      resetError: jest.fn()
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the first step of the form correctly', () => {
    render(
      <MemoryRouter>
        <AddRecipientPage />
      </MemoryRouter>
    );
    
    // Check heading
    expect(screen.getByText('Add Someone New')).toBeInTheDocument();
    
    // Check first step elements
    expect(screen.getByText("Who are we remembering?")).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/How do you know them?/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
    
    // Check navigation buttons
    expect(screen.getByText('Continue')).toBeInTheDocument();
    const backButton = screen.getByText('Back');
    expect(backButton).toBeInTheDocument();
    expect(backButton).toBeDisabled();
  });
  
  test('navigates through form steps', async () => {
    render(
      <MemoryRouter>
        <AddRecipientPage />
      </MemoryRouter>
    );
    
    // Fill first step
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/How do you know them?/), { target: { value: 'Friend' } });
    
    // Go to second step
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText("When's their birthday?")).toBeInTheDocument();
    });
    
    // Go to third step
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText("What are they into?")).toBeInTheDocument();
    });
    
    // Go to fourth step
    fireEvent.click(screen.getByText('Continue'));
    await waitFor(() => {
      expect(screen.getByText("Gift Preferences")).toBeInTheDocument();
    });
    
    // Go back to third step
    fireEvent.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(screen.getByText("What are they into?")).toBeInTheDocument();
    });
  });
  
  test('submits the form with all data', async () => {
    const mockAddRecipient = jest.fn().mockResolvedValue(undefined);
    (useRecipientStore as jest.Mock).mockReturnValue({
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
    
    // Fill first step
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/How do you know them?/), { target: { value: 'Friend' } });
    fireEvent.click(screen.getByText('Continue'));
    
    // Fill second step
    await waitFor(() => {
      expect(screen.getByLabelText(/Birthday/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Birthday/), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByText('Continue'));
    
    // Fill third step
    await waitFor(() => {
      expect(screen.getByText(/What are they into?/)).toBeInTheDocument();
    });
    // Add an interest
    fireEvent.change(screen.getByPlaceholderText(/Type an interest and press enter/), { target: { value: 'Gaming' } });
    fireEvent.click(screen.getByLabelText(/Add interest/));
    fireEvent.click(screen.getByText('Continue'));
    
    // Fill fourth step and submit
    await waitFor(() => {
      expect(screen.getByText(/Gift Preferences/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/\$25-\$50 - A nice gift/));
    fireEvent.click(screen.getByText('Electronics'));
    fireEvent.click(screen.getByText('Save & Finish'));
    
    // Check if addRecipient was called with the expected data
    await waitFor(() => {
      expect(mockAddRecipient).toHaveBeenCalledTimes(1);
      expect(mockAddRecipient).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        relationship: 'Friend',
        interests: ['Gaming'],
        giftPreferences: expect.objectContaining({
          priceRange: {
            min: 0,
            max: 50
          },
          categories: ['Electronics']
        })
      }));
    });
    
    // Check if navigation occurred after successful submission
    expect(mockNavigate).toHaveBeenCalledWith('/recipients');
  });
}); 