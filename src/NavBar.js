import React from 'react';
import './NavBar.css';

const Navbar = ({ setSelectedView }) => {
    return (
        <div className="navbar">
            <div className="nav-icon" onClick={() => setSelectedView('build')}>
                <span className="material-symbols-outlined">
                    build
                </span>
            </div>
            <div className="nav-icon" onClick={() => setSelectedView('code')}>
                <span className="material-symbols-outlined">
                    code
                </span>
            </div>
        </div>
    );
};

export default Navbar;