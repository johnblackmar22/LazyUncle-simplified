import React, { useEffect, useState } from 'react';
import { Gift, Recipient } from '../types';
import { useGiftStore } from '../store/giftStore';
import { useRecipientStore } from '../store/recipientStore';
import { AutoSendService } from '../services/autoSendService';

const PendingAutoSendApprovals: React.FC = () => {
  const { gifts, fetchGifts } = useGiftStore();
  const { recipients, fetchRecipients } = useRecipientStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<Record<string, string>>({});
  const [showDeclineForm, setShowDeclineForm] = useState<Record<string, boolean>>({});

  // Get pending approval gifts
  const pendingGifts = gifts.filter(gift => gift.status === 'pending_approval' && gift.autoSend);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchGifts();
        await fetchRecipients();
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchGifts, fetchRecipients]);

  // Find recipient for a gift
  const getRecipient = (recipientId: string): Recipient | undefined => {
    return recipients.find(r => r.id === recipientId);
  };

  // Format date for display
  const formatDate = (date: Date | number): string => {
    if (!date) return 'Unknown date';
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle approve gift
  const handleApprove = async (gift: Gift) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AutoSendService.approveAutoSendGift(gift.id);
      
      if (result.success) {
        // Refresh the gifts list
        await fetchGifts();
      } else {
        setError(`Failed to approve gift: ${result.message}`);
      }
    } catch (err) {
      setError('An error occurred while approving the gift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle decline gift
  const handleDecline = async (gift: Gift) => {
    setLoading(true);
    setError(null);
    
    try {
      const reason = declineReason[gift.id] || 'Declined by user';
      const result = await AutoSendService.declineAutoSendGift(gift.id, reason);
      
      if (result.success) {
        // Refresh the gifts list
        await fetchGifts();
        
        // Reset the decline form state
        setDeclineReason(prev => {
          const updated = {...prev};
          delete updated[gift.id];
          return updated;
        });
        
        setShowDeclineForm(prev => {
          const updated = {...prev};
          delete updated[gift.id];
          return updated;
        });
      } else {
        setError(`Failed to decline gift: ${result.message}`);
      }
    } catch (err) {
      setError('An error occurred while declining the gift');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle decline form
  const toggleDeclineForm = (giftId: string) => {
    setShowDeclineForm(prev => ({
      ...prev,
      [giftId]: !prev[giftId]
    }));
    
    // Reset decline reason if form is being hidden
    if (showDeclineForm[giftId]) {
      setDeclineReason(prev => {
        const updated = {...prev};
        delete updated[giftId];
        return updated;
      });
    }
  };

  if (loading) {
    return <div className="loading">Loading pending approvals...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (pendingGifts.length === 0) {
    return <div className="empty-state">No pending auto-send approvals</div>;
  }

  return (
    <div className="pending-approvals">
      <h2>Pending Auto-Send Approvals</h2>
      
      <div className="approval-cards">
        {pendingGifts.map(gift => {
          const recipient = getRecipient(gift.recipientId);
          
          return (
            <div key={gift.id} className="approval-card">
              <div className="card-header">
                <h3>{gift.name}</h3>
                <div className="gift-price">${gift.price.toFixed(2)}</div>
              </div>
              
              <div className="card-content">
                {gift.imageUrl && (
                  <div className="gift-image">
                    <img src={gift.imageUrl} alt={gift.name} />
                  </div>
                )}
                
                <div className="gift-details">
                  <p className="gift-description">{gift.description}</p>
                  
                  <div className="gift-meta">
                    <div className="meta-item">
                      <span className="label">For:</span>
                      <span className="value">{recipient?.name || 'Unknown recipient'}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="label">Occasion:</span>
                      <span className="value">{gift.occasion}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(gift.date)}</span>
                    </div>
                    
                    <div className="meta-item">
                      <span className="label">Category:</span>
                      <span className="value">{gift.category}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleApprove(gift)}
                  disabled={loading}
                >
                  Approve & Send
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => toggleDeclineForm(gift.id)}
                  disabled={loading}
                >
                  {showDeclineForm[gift.id] ? 'Cancel' : 'Decline'}
                </button>
              </div>
              
              {showDeclineForm[gift.id] && (
                <div className="decline-form">
                  <div className="form-group">
                    <label htmlFor={`decline-reason-${gift.id}`}>Reason (optional):</label>
                    <textarea
                      id={`decline-reason-${gift.id}`}
                      value={declineReason[gift.id] || ''}
                      onChange={(e) => setDeclineReason(prev => ({
                        ...prev,
                        [gift.id]: e.target.value
                      }))}
                      placeholder="Why are you declining this gift?"
                    />
                  </div>
                  
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDecline(gift)}
                    disabled={loading}
                  >
                    Confirm Decline
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PendingAutoSendApprovals; 