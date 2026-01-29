import React from 'react';

const HostNavbar: React.FC = () => {
    return (
        <nav style={{ padding: '1rem', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
            <div>
                <a href="/" style={{ fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none', color: '#333' }}>
                    SmartStay Host
                </a>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', gap: '1.5rem', margin: 0, padding: 0 }}>
                <li>
                    <a href="/host/dashboard" style={{ textDecoration: 'none', color: '#333' }}>Dashboard</a>
                </li>
                <li>
                    <a href="/host/listings" style={{ textDecoration: 'none', color: '#333' }}>My Listings</a>
                </li>
                <li>
                    <a href="/host/bookings" style={{ textDecoration: 'none', color: '#333' }}>Bookings</a>
                </li>
                <li>
                    <a href="/host/profile" style={{ textDecoration: 'none', color: '#333' }}>Profile</a>
                </li>
            </ul>
        </nav>
    );
};

export default HostNavbar;