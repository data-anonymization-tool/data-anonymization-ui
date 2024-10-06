import React from 'react';
import './NavBar.css';

const Navbar = () => {
    return (
        <div className="navbar">
            <div className="nav-icon">
                <span class="material-symbols-outlined">
                    build
                </span>
            </div>
            <div className="nav-icon">
                <span class="material-symbols-outlined">
                    stacks
                </span>
            </div>
            <div className="nav-icon">
                <span class="material-symbols-outlined">
                    code
                </span>
            </div>
        </div>
    );
};

export default Navbar;
