import React from 'react';
import './NavBar.css';

const Navbar = ({ setSelectedView }) => {
    return (
        <div className="navbar">
            <div className="nav-icon" onClick={() => setSelectedView('build')}>
                <span className="material-symbols-outlined">
                    build
                </span>
                <div className="tooltip">Anonymize Data</div>
            </div>
            <div className="nav-icon" onClick={() => setSelectedView('code')}>
                <span className="material-symbols-outlined">
                    code
                </span>
                <div className="tooltip">Code Editor</div> 
            </div>
        </div>
    );
};

export default Navbar;