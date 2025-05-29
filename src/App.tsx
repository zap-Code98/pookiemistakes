import React, { useState } from 'react';
import './styles/App.css';

interface Complaint {
  id: number;
  text: string;
  acknowledged: boolean;
}

const dummyComplaints: Complaint[] = [
  { id: 1, text: "You forgot to take out the trash again! 🗑️", acknowledged: true },
  { id: 2, text: "You're always on your phone during dinner 📱", acknowledged: false },
  { id: 3, text: "You didn't make the bed this morning 🛏️", acknowledged: true },
  { id: 4, text: "You ate the last cookie without asking! 🍪", acknowledged: false },
  { id: 5, text: "You left your socks on the floor again 🧦", acknowledged: true }
];

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
  const [activePage, setActivePage] = useState<'home' | 'past'>('home');
  const [complaints] = useState<Complaint[]>(dummyComplaints);
  const [newComplaint, setNewComplaint] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(confirmationMessages[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComplaint.trim()) {
      setNewComplaint('');
      const randomMessage = confirmationMessages[Math.floor(Math.random() * confirmationMessages.length)];
      setCurrentMessage(randomMessage);
      setShowConfirmation(true);
    }
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
            onClick={() => setActivePage('home')}
          >
            Home
          </button>
          <button
            className={`menu-button ${activePage === 'past' ? 'active' : ''}`}
            onClick={() => setActivePage('past')}
          >
            Past Complaints
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
        ) : (
          <div className="complaints-list">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="complaint-item">
                <div className="complaint-text">{complaint.text}</div>
                <div className={`status-badge ${complaint.acknowledged ? 'acknowledged' : ''}`}>
                  {complaint.acknowledged ? 'Acknowledged' : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 