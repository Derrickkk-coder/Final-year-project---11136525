import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} NextLeap · University of Ghana Final Year Project - 11136525</span>

        <div className="footer__links">
          <Link to="/jobs">Browse jobs</Link>
          <Link to="/register">For employers</Link>
          <Link to="/login">Log in</Link>
        </div>

        <div className="footer__socials">
          <a href="mailto:dakwaboah005@st.ug.edu.gh" className="footer__social-icon" aria-label="Email the developer" title="Email">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <polyline points="2,6 12,13 22,6"></polyline>
            </svg>
          </a>

          <a href="https://wa.me/233592081217" target="_blank" rel="noopener noreferrer" className="footer__social-icon" aria-label="Contact the developer on WhatsApp" title="Help / WhatsApp">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 10c0 3 2 5 5 5"></path>
              <circle cx="9" cy="9" r="1"></circle>
              <circle cx="15" cy="9" r="1"></circle>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}