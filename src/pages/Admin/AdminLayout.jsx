import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import QuizHeader from '../../components/QuizHeader.jsx'
import '../../components/AccountUi.css'
import './Admin.css'

// Het zijmenu van het admin-portaal, zoals in de designs 7 t/m 10.
// "Gebruikers" alleen voor beheerders. Dat is alleen voor het overzicht: de API weigert docenten zelf ook.
const MENU = [
  { to: '/admin', label: 'Overzicht', end: true, icon: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></> },
  { to: '/admin/quizzen', label: 'Quizzen', icon: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.5" /></> },
  { to: '/admin/gebruikers', label: 'Gebruikers', adminOnly: true, icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.5c2.5.5 4 2.3 4 5.5" /></> },
  { to: '/admin/uitslagen', label: 'Uitslagen', icon: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></> },
  { to: '/admin/account', label: 'Mijn account', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> },
]

/**
 * Gemeenschappelijke opbouw van elke admin-pagina: navigatiebalk met "BEHEER", zijmenu, en een kop.
 * @param {{ kicker?: string, title: string, action?: React.ReactNode, children: React.ReactNode }} props
 *   kicker: kleine tekst boven de titel; action: knop rechts naast de titel (bijv. "Nieuwe quiz").
 */
export default function AdminLayout({ kicker, title, action, children }) {
  const { user } = useAuth()
  return (
    <div className="page admin-page">
      <QuizHeader admin />
      <main className="page__main admin-page__main">
        <nav aria-label="Beheermenu" className="admin-page__menu">
          <ul>
            {MENU.filter((item) => !item.adminOnly || user.role === 'ADMIN').map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-page__content">
          <div className="admin-page__heading">
            <div className="admin-page__titles">
              {kicker && <span className="ui-kicker">{kicker}</span>}
              <h1 className="ui-title">{title}</h1>
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
