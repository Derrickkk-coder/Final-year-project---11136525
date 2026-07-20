import React from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      <main className="page">{children}</main>
      {!hideFooter && <Footer />}
    </>
  )
}
