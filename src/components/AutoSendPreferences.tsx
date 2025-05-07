import React, { useState, useEffect } from 'react';
import { Recipient, OccasionPreference, Address } from '../types';
import { useRecipientStore } from '../store/recipientStore';

interface AutoSendPreferencesProps {
  recipient: Recipient;
}

export const AutoSendPreferences: React.FC<AutoSendPreferencesProps> = ({ recipient }) => {
  const { updateAutoSendPreferences, toggleAutoSend, toggleOccasionAutoSend, setDefaultBudget, updateOccasionPreference, updateShippingAddress, toggleApprovalRequirement } = useRecipientStore();
  
  const [isEnabled, setIsEnabled] = useState(recipient.autoSendPreferences?.enabled || false);
  const [defaultBudget, setDefaultBudgetState] = useState(recipient.autoSendPreferences?.defaultBudget || 50);
  const [requireApproval, setRequireApproval] = useState(recipient.autoSendPreferences?.requireApproval !== false);
  
  // Occasion states
  const [birthdayEnabled, setBirthdayEnabled] = useState(recipient.autoSendPreferences?.occasions.birthday?.enabled || false);
  const [birthdayBudget, setBirthdayBudget] = useState(recipient.autoSendPreferences?.occasions.birthday?.budget || defaultBudget);
  const [birthdayLeadTime, setBirthdayLeadTime] = useState(recipient.autoSendPreferences?.occasions.birthday?.leadTime || 7);
  
  const [christmasEnabled, setChristmasEnabled] = useState(recipient.autoSendPreferences?.occasions.christmas?.enabled || false);
  const [christmasBudget, setChristmasBudget] = useState(recipient.autoSendPreferences?.occasions.christmas?.budget || defaultBudget);
  const [christmasLeadTime, setChristmasLeadTime] = useState(recipient.autoSendPreferences?.occasions.christmas?.leadTime || 14);
  
  const [anniversaryEnabled, setAnniversaryEnabled] = useState(recipient.autoSendPreferences?.occasions.anniversary?.enabled || false);
  const [anniversaryBudget, setAnniversaryBudget] = useState(recipient.autoSendPreferences?.occasions.anniversary?.budget || defaultBudget);
  const [anniversaryLeadTime, setAnniversaryLeadTime] = useState(recipient.autoSendPreferences?.occasions.anniversary?.leadTime || 7);
  
  // Shipping address state
  const [address, setAddress] = useState<Address>(recipient.autoSendPreferences?.shippingAddress || {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  
  // Payment method state (simplified for demo)
  const [paymentType, setPaymentType] = useState<'creditCard' | 'paypal' | 'other'>(
    recipient.autoSendPreferences?.paymentMethod?.type || 'creditCard'
  );
  
  // Handle toggle of main auto-send switch
  const handleToggleAutoSend = async () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    await toggleAutoSend(recipient.id, newValue);
  };
  
  // Handle toggle of approval requirement
  const handleToggleApproval = async () => {
    const newValue = !requireApproval;
    setRequireApproval(newValue);
    await toggleApprovalRequirement(recipient.id, newValue);
  };
  
  // Handle change of default budget
  const handleDefaultBudgetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDefaultBudgetState(value);
      await setDefaultBudget(recipient.id, value);
    }
  };
  
  // Handle toggle of an occasion
  const handleToggleOccasion = async (occasion: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    switch (occasion) {
      case 'birthday':
        setBirthdayEnabled(newValue);
        break;
      case 'christmas':
        setChristmasEnabled(newValue);
        break;
      case 'anniversary':
        setAnniversaryEnabled(newValue);
        break;
    }
    
    await toggleOccasionAutoSend(recipient.id, occasion, newValue);
  };
  
  // Handle change of occasion preferences
  const handleOccasionPreferenceChange = async (
    occasion: string,
    preference: Partial<OccasionPreference>
  ) => {
    await updateOccasionPreference(recipient.id, occasion, preference);
  };
  
  // Handle address field changes
  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save shipping address
  const handleSaveAddress = async () => {
    await updateShippingAddress(recipient.id, address);
  };

  return (
    <div className="auto-send-preferences">
      <h2>Auto-Send Preferences</h2>
      
      <div className="form-group">
        <label className="switch-label">
          <span>Enable Auto-Send for {recipient.name}</span>
          <div className="switch">
            <input 
              type="checkbox" 
              checked={isEnabled}
              onChange={handleToggleAutoSend}
            />
            <span className="slider round"></span>
          </div>
        </label>
      </div>
      
      {isEnabled && (
        <>
          <div className="form-group">
            <label>
              Default Budget: $
              <input 
                type="number" 
                min="1"
                value={defaultBudget}
                onChange={handleDefaultBudgetChange}
              />
            </label>
          </div>
          
          <div className="form-group">
            <label className="switch-label">
              <span>Require Approval Before Sending</span>
              <div className="switch">
                <input 
                  type="checkbox" 
                  checked={requireApproval}
                  onChange={handleToggleApproval}
                />
                <span className="slider round"></span>
              </div>
            </label>
            <p className="help-text">
              {requireApproval 
                ? "You'll be notified to review and approve all auto-send gifts before they're ordered." 
                : "Gifts will be automatically ordered without approval."}
            </p>
          </div>
          
          <h3>Occasions</h3>
          
          {recipient.birthdate && (
            <div className="occasion-section">
              <h4>Birthday</h4>
              <div className="form-group">
                <label className="switch-label">
                  <span>Enable Birthday Auto-Send</span>
                  <div className="switch">
                    <input 
                      type="checkbox" 
                      checked={birthdayEnabled}
                      onChange={() => handleToggleOccasion('birthday', birthdayEnabled)}
                    />
                    <span className="slider round"></span>
                  </div>
                </label>
              </div>
              
              {birthdayEnabled && (
                <>
                  <div className="form-group">
                    <label>
                      Budget: $
                      <input 
                        type="number" 
                        min="1"
                        value={birthdayBudget}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setBirthdayBudget(value);
                            handleOccasionPreferenceChange('birthday', { budget: value });
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      Lead Time (days before):
                      <input 
                        type="number" 
                        min="1"
                        max="90"
                        value={birthdayLeadTime}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setBirthdayLeadTime(value);
                            handleOccasionPreferenceChange('birthday', { leadTime: value });
                          }
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="occasion-section">
            <h4>Christmas</h4>
            <div className="form-group">
              <label className="switch-label">
                <span>Enable Christmas Auto-Send</span>
                <div className="switch">
                  <input 
                    type="checkbox" 
                    checked={christmasEnabled}
                    onChange={() => handleToggleOccasion('christmas', christmasEnabled)}
                  />
                  <span className="slider round"></span>
                </div>
              </label>
            </div>
            
            {christmasEnabled && (
              <>
                <div className="form-group">
                  <label>
                    Budget: $
                    <input 
                      type="number" 
                      min="1"
                      value={christmasBudget}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setChristmasBudget(value);
                          handleOccasionPreferenceChange('christmas', { budget: value });
                        }
                      }}
                    />
                  </label>
                </div>
                
                <div className="form-group">
                  <label>
                    Lead Time (days before):
                    <input 
                      type="number" 
                      min="1"
                      max="90"
                      value={christmasLeadTime}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          setChristmasLeadTime(value);
                          handleOccasionPreferenceChange('christmas', { leadTime: value });
                        }
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
          
          {recipient.anniversary && (
            <div className="occasion-section">
              <h4>Anniversary</h4>
              <div className="form-group">
                <label className="switch-label">
                  <span>Enable Anniversary Auto-Send</span>
                  <div className="switch">
                    <input 
                      type="checkbox" 
                      checked={anniversaryEnabled}
                      onChange={() => handleToggleOccasion('anniversary', anniversaryEnabled)}
                    />
                    <span className="slider round"></span>
                  </div>
                </label>
              </div>
              
              {anniversaryEnabled && (
                <>
                  <div className="form-group">
                    <label>
                      Budget: $
                      <input 
                        type="number" 
                        min="1"
                        value={anniversaryBudget}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setAnniversaryBudget(value);
                            handleOccasionPreferenceChange('anniversary', { budget: value });
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      Lead Time (days before):
                      <input 
                        type="number" 
                        min="1"
                        max="90"
                        value={anniversaryLeadTime}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setAnniversaryLeadTime(value);
                            handleOccasionPreferenceChange('anniversary', { leadTime: value });
                          }
                        }}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
          
          <h3>Shipping Address</h3>
          <div className="form-group">
            <label>
              Street Address:
              <input 
                type="text" 
                value={address.line1}
                onChange={(e) => handleAddressChange('line1', e.target.value)}
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              Apartment/Suite (optional):
              <input 
                type="text" 
                value={address.line2 || ''}
                onChange={(e) => handleAddressChange('line2', e.target.value)}
              />
            </label>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                City:
                <input 
                  type="text" 
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                State:
                <input 
                  type="text" 
                  value={address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                />
              </label>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                Postal Code:
                <input 
                  type="text" 
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                />
              </label>
            </div>
            
            <div className="form-group">
              <label>
                Country:
                <input 
                  type="text" 
                  value={address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                />
              </label>
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAddress}
            disabled={!address.line1 || !address.city || !address.state || !address.postalCode || !address.country}
          >
            Save Address
          </button>
          
          <h3>Payment Method</h3>
          <div className="form-group">
            <label>
              Payment Method:
              <select 
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'creditCard' | 'paypal' | 'other')}
              >
                <option value="creditCard">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          
          <p className="note">
            For security, payment details are managed in the payment settings page.
          </p>
        </>
      )}
    </div>
  );
};

export default AutoSendPreferences; 