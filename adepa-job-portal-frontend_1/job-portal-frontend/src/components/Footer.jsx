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
      </div>
    </footer>
  )
}
