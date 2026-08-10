import React from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import SupportWidget from './SupportWidget.jsx'

export default function Layout({ children, hideFooter }) {
  return (
    <>
      <Navbar />
      <main className="page">{children}</main>
      {!hideFooter && <Footer />}
      {/* Every page, since needing help isn't confined to one of them. Admins
          answer from their dashboard rather than through this widget. */}
      <SupportWidget />
    </>
  )
}
