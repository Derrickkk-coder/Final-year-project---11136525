import React, { createContext, useContext, useMemo, useState } from 'react'

// Lets the header's hamburger open the dashboard sidebar.
//
// The two live in different subtrees — Navbar and the routed page are siblings
// inside Layout — so the drawer's open state has to sit above both. The
// alternative was a second menu button inside the dashboard, which put two
// menus a few pixels apart on a phone and left the reader to work out which
// one held what.
//
// `present` is how the header knows a dashboard sidebar exists on this page. When
// it doesn't, the hamburger keeps opening the ordinary site drawer.
const SidebarContext = createContext(null)

// Used when a component renders outside the provider, so nothing has to
// defensively check for the context first.
const ABSENT = { open: false, setOpen: () => {}, present: false, setPresent: () => {} }

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false)
  // A boolean, not a count: exactly one DashboardShell is ever mounted at a time,
  // since it's the frame for a whole page rather than a component pages compose.
  const [present, setPresent] = useState(false)

  const value = useMemo(() => ({ open, setOpen, present, setPresent }), [open, present])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  return useContext(SidebarContext) || ABSENT
}
