import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Plus, Users } from 'lucide-react'

const PRESET_COLORS = [
    '#C1502E', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

export default function TeamManager({ session, onClose }) {
    const [members, setMembers] = useState([])
    const [name, setName] = useState('')
    const [color, setColor] = useState('#3b82f6')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase.from('members').select('*').order('created_at')
            if (data) setMembers(data)
        }
        fetchMembers()
    }, [])

    const handleCreate = async () => {
        if (!name.trim()) return
        setLoading(true)
        const { data, error } = await supabase
            .from('members')
            .insert({ name: name.trim(), color, user_id: session.user.id })
            .select().single()
        if (!error) {
            setMembers(prev => [...prev, data])
            setName('')
        }
        setLoading(false)
    }

    const handleDelete = async (id) => {
        await supabase.from('members').delete().eq('id', id)
        setMembers(prev => prev.filter(m => m.id !== id))
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Users size={18} className="text-primary" />
                        <h2 className="text-lg font-bold text-gray-900">Manage Team</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Add Member
                        </label>
                        <div className="flex gap-2 mb-3">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder="Member name"
                                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                            <button
                                onClick={handleCreate}
                                disabled={loading || !name.trim()}
                                className="flex items-center gap-1 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Team Members
                        </label>
                        {members.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-4">No members yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                            style={{ backgroundColor: member.color }}
                                        >
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 flex-1">{member.name}</span>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            className="text-gray-300 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}