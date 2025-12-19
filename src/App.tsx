import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles/App.css';

interface Complaint {
  _id: string;
  text: string;
  acknowledged: boolean;
  timestamp: string;
}

const LogoIcon = () => (
  <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>
  </svg>
);

const confirmationMessages = [
  { title: "You're absolutely right! 💖", message: "Your complaint has been logged with all the love and care it deserves." },
  { title: "My mistake, my love! 💝", message: "Your complaint is now in my heart and will be addressed with extra love." },
  { title: "You're so right, sweetie! 💕", message: "Your complaint has been noted with a million kisses and hugs." },
  { title: "I'm sorry, my darling! 💗", message: "Your complaint has been logged with all the love in my heart." },
  { title: "You're absolutely perfect! 💓", message: "Your complaint has been saved with a sprinkle of love and care." },
  { title: "My bad, my love! 💘", message: "Your complaint has been noted with extra special attention and love." },
  { title: "You're right as always! 💞", message: "Your complaint has been logged with all the love in the world." },
  { title: "I apologize, my sweet! 💖", message: "Your complaint has been saved with a heart full of love." }
];

function App() {
  const [activePage, setActivePage] = useState<'home' | 'past' | 'inbox'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newComplaint, setNewComplaint] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(confirmationMessages[0]);
  const [inboxManagerPasskey, setInboxManagerPasskey] = useState('');
  const [isInboxManagerAuthenticated, setIsInboxManagerAuthenticated] = useState(false);
  const [showPasskeyError, setShowPasskeyError] = useState(false);
  const [showRetractConfirmation, setShowRetractConfirmation] = useState<string | null>(null);
  const [isSubmiting, setIsSubmitting] = useState(false);

  // Fetch complaints from API
  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axios.get('/api/complaints');
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    };
    fetchComplaints();
  }, []);


  // Submits the new complaint to the API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplaint.trim()) setIsSubmitting(true); {
      try {
        const response = await axios.post('/api/complaints', {
          text: newComplaint.trim()
        });
        setComplaints(prev => [response.data, ...prev]);
        setNewComplaint('');
        const randomMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
        setCurrentMessage(randomMessage);
        setShowConfirmation(true);
      } catch (error) {
        console.error('Error submitting complaint:', error);
      }
    }
  };

  const formatDate = (timestamp: string) => 
    new Date(timestamp).toLocaleDateString('en-US', 
      {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
      );
  

  const handleInboxManagerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inboxManagerPasskey === 'ILY') {
      setIsInboxManagerAuthenticated(true);
      setShowPasskeyError(false);
      // Refetch complaints from database when inbox manager logs in
      try {
        const response = await axios.get('/api/complaints');
        setComplaints(response.data);
      } catch (error) {
        console.error('Error fetching complaints:', error);
      }
    } else {
      setShowPasskeyError(true);
    }
  };

  const handleAcknowledgeComplaint = async (complaintId: string) => {
    try {
      await axios.put(`/api/complaints?id=${complaintId}`, {
        acknowledged: true,
        inboxManagerPasskey: 'ILY'
      });
      setComplaints(prevComplaints => 
        prevComplaints.map(complaint => 
          complaint._id === complaintId 
            ? { ...complaint, acknowledged: true }
            : complaint
        )
      );
    } catch (error) {
      console.error('Error acknowledging complaint:', error);
    }
  };

  const handleRetractComplaint = (complaintId: string) => {
    setShowRetractConfirmation(complaintId);
  };

  const confirmRetractComplaint = async (complaintId: string) => {
    try {
      await axios.delete(`/api/complaints?id=${complaintId}`);
      setComplaints(prevComplaints => prevComplaints.filter(complaint => complaint._id !== complaintId));
      setShowRetractConfirmation(null);
    } catch (error) {
      console.error('Error retracting complaint:', error);
    }
  };

  const handlePageChange = (page: 'home' | 'past' | 'inbox') => {
    setActivePage(page);
    if (page !== 'inbox') {
      setIsInboxManagerAuthenticated(false);
      setInboxManagerPasskey('');
      setShowPasskeyError(false);
    }
    // Reset confirmation state when switching pages
    setShowConfirmation(false);
  };

  return (
    <div className="app-container">
      <div className="menu-bar">
        <a href="/" className="logo">
          <LogoIcon />
          Pookie Mistakes
        </a>
        <div className="menu-buttons">
          <button
            className={`menu-button ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handlePageChange('home')}
          >
            Home
          </button>
          <button
            className={`menu-button ${activePage === 'past' ? 'active' : ''}`}
            onClick={() => handlePageChange('past')}
          >
            Past Complaints
          </button>
          <button
            className={`menu-button inbox-button ${activePage === 'inbox' ? 'active' : ''}`}
            onClick={() => handlePageChange('inbox')}
          >
            Inbox Manager ⚙️
          </button>
        </div>
      </div>

      <div className="content-area">
        <div className="background-pattern" />
        
        {activePage === 'home' ? (
          <div className="envelope-container">
            {!showConfirmation ? (
              <form onSubmit={handleSubmit} className="envelope-box">
                <textarea
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  placeholder="Write your complaint here..."
                  required
                />
                <button type="submit" className="submit-button">
                  Submit Complaint
                </button>
              </form>
            ) : (
              <div className="confirmation-animation">
                <h2>{currentMessage.title}</h2>
                <p>{currentMessage.message}</p>
                <button onClick={() => setShowConfirmation(false)} className="tertiary-button">
                  Submit Another Complaint
                </button>
              </div>
            )}
          </div>
        ) : activePage === 'past' ? (
          <div className="complaints-container">
            {complaints.length === 0 ? (
              <div className="no-complaints-message">
                <h2>You're such a good boyfie! 💖</h2>
                <p>No complaints yet - you're doing everything perfectly! Keep being amazing! 🌟</p>
                <div className="cute-emoji">✨💝✨</div>
              </div>
            ) : (
              <>
                <div className="past-complaints-header">
                  <h2>Always Listening, Always Growing 💝</h2>
                  <p>Every complaint helps me become a better version of myself for you ✨</p>
                </div>
                <div className="complaints-list">
                  {complaints.map((complaint) => (
                    <div key={complaint._id} className="complaint-item">
                      <div className="complaint-content">
                        <div className="complaint-text">{complaint.text}</div>
                        <div className="complaint-date">{formatDate(complaint.timestamp)}</div>
                      </div>
                      <div className="complaint-actions">
                        <div className={`status-badge ${complaint.acknowledged ? 'acknowledged' : ''}`}>
                          {complaint.acknowledged ? 'Acknowledged' : 'Pending'}
                        </div>
                        <button 
                          className="retract-button"
                          onClick={() => handleRetractComplaint(complaint._id)}
                          title="Retract Complaint"
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                          </svg>
                        </button>
                      </div>
                      {showRetractConfirmation === complaint._id && (
                        <div className="retract-confirmation">
                          <div className="retract-confirmation-content">
                            <h3>Wait, my love! 💝</h3>
                            <p>Are you sure you want to take back this complaint? I promise I'll do better next time! 🥺</p>
                            <div className="retract-confirmation-buttons">
                              <button 
                                className="tertiary-button"
                                onClick={() => setShowRetractConfirmation(null)}
                              >
                                Keep It
                              </button>
                              <button 
                                className="submit-button"
                                onClick={() => confirmRetractComplaint(complaint._id)}
                              >
                                Yes, Remove It
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="inbox-container">
            {!isInboxManagerAuthenticated ? (
              <div className="inbox-login">
                {showPasskeyError ? (
                  <div className="passkey-error">
                    <h2>Oops! 🤔</h2>
                    <p>Are you sure you belong here? This is a special place for special people!</p>
                    <button 
                      className="tertiary-button"
                      onClick={() => {
                        setShowPasskeyError(false);
                        setInboxManagerPasskey('');
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInboxManagerLogin} className="passkey-form">
                    <h2>Enter Passkey</h2>
                    <input
                      type="password"
                      value={inboxManagerPasskey}
                      onChange={(e) => setInboxManagerPasskey(e.target.value)}
                      placeholder="Enter your secret passkey..."
                      required
                    />
                    <button type="submit" className="submit-button">
                      Enter
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="inbox-dashboard">
                <h2>Inbox Manager Dashboard</h2>
                <div className="inbox-complaints-list">
                  {complaints.map((complaint) => (
                    <div key={complaint._id} className="inbox-complaint-item">
                      <div className="complaint-content">
                        <div className="complaint-text">{complaint.text}</div>
                        <div className="complaint-date">{formatDate(complaint.timestamp)}</div>
                      </div>
                      <button
                        className={`acknowledge-button ${complaint.acknowledged ? 'acknowledged' : ''}`}
                        onClick={() => handleAcknowledgeComplaint(complaint._id)}
                        disabled={complaint.acknowledged}
                      >
                        {complaint.acknowledged ? 'Acknowledged ✓' : 'Acknowledge'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 