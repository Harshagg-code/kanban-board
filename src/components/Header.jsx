import { Search, Mail, Bell, User, X } from 'lucide-react'
import { useState } from 'react'

export default function Header({ onSearch }) {
    const [query, setQuery] = useState('')

    const handleChange = (e) => {
        setQuery(e.target.value)
        onSearch?.(e.target.value)
    }

    const handleClear = () => {
        setQuery('')
        onSearch?.('')
    }

    return (
        <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm flex-shrink-0">

            {/* Search bar */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-40 md:w-64 lg:w-80">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                    type="text"
                    placeholder="Search task"
                    value={query}
                    onChange={handleChange}
                    className="bg-transparent outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
                />
                {query && (
                    <button onClick={handleClear}>
                        <X size={13} className="text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-5 ml-auto">
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Mail size={19} />
                </button>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={19} />
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* User info */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <User size={15} className="text-gray-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800 leading-tight">Guest User</p>
                        <p className="text-xs text-gray-400 leading-tight">Anonymous</p>
                    </div>
                </div>
            </div>
        </div>
    )
}