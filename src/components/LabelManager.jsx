import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { X, Plus, Tag } from 'lucide-react'

const PRESET_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
]

export default function LabelManager({ session, onClose }) {
    const [labels, setLabels] = useState([])
    const [name, setName] = useState('')
    const [color, setColor] = useState('#3b82f6')
    const [loading, setLoading] = useState(false)

    const fetchLabels = async () => {
        const { data } = await supabase
            .from('labels')
            .select('*')
            .order('created_at', { ascending: true })
        if (data) setLabels(data)
    }

    useEffect(() => {
        fetchLabels()
    }, [])

    const handleCreate = async () => {
        if (!name.trim()) return
        setLoading(true)

        const { data, error } = await supabase
            .from('labels')
            .insert({
                name: name.trim(),
                color,
                user_id: session.user.id,
            })
            .select()
            .single()

        if (!error) {
            setLabels(prev => [...prev, data])
            setName('')
        }
        setLoading(false)
    }

    const handleDelete = async (labelId) => {
        await supabase.from('labels').delete().eq('id', labelId)
        setLabels(prev => prev.filter(l => l.id !== labelId))
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Tag size={18} className="text-primary" />
                        <h2 className="text-lg font-bold text-gray-900">Manage Labels</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* Create new label */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Create New Label
                        </label>

                        {/* Color picker */}
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

                        {/* Name input + add button */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                placeholder="Label name e.g. Bug, Feature..."
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

                    {/* Existing labels */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            Your Labels
                        </label>
                        {labels.length === 0 ? (
                            <p className="text-sm text-gray-300 text-center py-4">No labels yet</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {labels.map(label => (
                                    <div key={label.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                                        <span className="text-sm font-medium text-gray-700 flex-1">{label.name}</span>
                                        <button
                                            onClick={() => handleDelete(label.id)}
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