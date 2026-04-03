import { useState } from 'react'

const menuItems = [
    { label: 'Dashboard', id: 'dashboard' },
    { label: 'Tasks', id: 'tasks', badge: 12 },
    { label: 'Calendar', id: 'calendar' },
    { label: 'Analytics', id: 'analytics' },
    { label: 'Teams', id: 'teams' },
]

const generalItems = [
    { label: 'Settings', id: 'settings' },
    { label: 'Help', id: 'help' },
    { label: 'Logout', id: 'logout' },
]

export default function Sidebar({ activePage, onNavigate }) {
    return (
        <div className="w-56 bg-[#E8E8E8] h-full flex flex-col py-8 px-6 shadow-sm flex-shrink-0">

            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <span className="font-bold text-lg tracking-widest">TASKER</span>
            </div>

            {/* Menu section */}
            <p className="text-xs text-gray-400 font-semibold mb-4 tracking-wider">MENU</p>
            <nav className="flex flex-col gap-1 mb-10">
                {menuItems.map(({ label, id, badge }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className={`relative flex items-center justify-between px-2 py-2.5 text-sm transition-all text-left rounded-lg
              ${activePage === id
                                ? 'font-bold text-gray-900'
                                : 'font-normal text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {/* Active left bar */}
                        {activePage === id && (
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-primary rounded-r-full" />
                        )}
                        <span>{label}</span>
                        {badge && (
                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                +{badge}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* General section */}
            <p className="text-xs text-gray-400 font-semibold mb-4 tracking-wider">GENERAL</p>
            <nav className="flex flex-col gap-1">
                {generalItems.map(({ label, id }) => (
                    <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className={`relative flex items-center px-2 py-2.5 text-sm transition-all text-left rounded-lg
              ${activePage === id
                                ? 'font-bold text-gray-900'
                                : 'font-normal text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {activePage === id && (
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-primary rounded-r-full" />
                        )}
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </div>
    )
}