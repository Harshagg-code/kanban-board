import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function AddTaskModal({ session, onClose, onTaskCreated, members = [] }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState('normal')
    const [dueDate, setDueDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [labels, setLabels] = useState([])
    const [selectedLabels, setSelectedLabels] = useState([])
    const [status, setStatus] = useState('todo')
    const [selectedAssignees, setSelectedAssignees] = useState([])

    useEffect(() => {
        const fetchLabels = async () => {
            const { data } = await supabase.from('labels').select('*')
            if (data) setLabels(data)
        }
        fetchLabels()
    }, [])

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Title is required')
            return
        }

        setLoading(true)
        setError('')

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: title.trim(),
                description: description.trim() || null,
                priority,
                due_date: dueDate || null,
                status: status,
                user_id: session.user.id,
            })
            .select()
            .single()

        if (error) {
            setError('Failed to create task. Try again.')
            setLoading(false)
            return
        }

        // Save labels
        if (selectedLabels.length > 0) {
            await supabase.from('task_labels').insert(
                selectedLabels.map(labelId => ({
                    task_id: data.id,
                    label_id: labelId,
                }))
            )
        }
        // Save assignees
        if (selectedAssignees.length > 0) {
            await supabase.from('task_assignees').insert(
                selectedAssignees.map(memberId => ({
                    task_id: data.id,
                    member_id: memberId,
                }))
            )
        }

        onTaskCreated({ ...data, label_ids: selectedLabels })
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                {/* Modal header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Add New Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal body */}
                <div className="p-6 flex flex-col gap-4">

                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Design the landing page"
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>
                    {/* Column selector */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                            Add to Column
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'todo', label: 'To Do', color: '#ef4444' },
                                { id: 'in_progress', label: 'In Progress', color: '#eab308' },
                                { id: 'in_review', label: 'In Review', color: '#3b82f6' },
                                { id: 'done', label: 'Done', color: '#22c55e' },
                            ].map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => setStatus(col.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all`}
                                    style={{
                                        borderColor: status === col.id ? col.color : '#e5e7eb',
                                        backgroundColor: status === col.id ? col.color + '15' : 'white',
                                        color: status === col.id ? col.color : '#6b7280',
                                    }}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details about this task..."
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>

                    {/* Priority + Due date side by side */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>
                    </div>
                    {/* Labels */}
                    {labels.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                Labels
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {labels.map(label => {
                                    const isSelected = selectedLabels.includes(label.id)
                                    return (
                                        <button
                                            key={label.id}
                                            onClick={() => setSelectedLabels(prev =>
                                                isSelected ? prev.filter(id => id !== label.id) : [...prev, label.id]
                                            )}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border-2 transition-all
              ${isSelected ? 'text-white' : 'bg-white text-gray-600'}`}
                                            style={{
                                                borderColor: label.color,
                                                backgroundColor: isSelected ? label.color : 'white',
                                            }}
                                        >
                                            {label.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Assignees */}
                    {members.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                Assignees
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {members.map(member => {
                                    const isSelected = selectedAssignees.includes(member.id)
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => setSelectedAssignees(prev =>
                                                isSelected ? prev.filter(id => id !== member.id) : [...prev, member.id]
                                            )}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all`}
                                            style={{
                                                borderColor: member.color,
                                                backgroundColor: isSelected ? member.color : 'white',
                                                color: isSelected ? 'white' : member.color,
                                            }}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : member.color }}
                                            >
                                                <span style={{ color: 'white', fontSize: '9px' }}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            {member.name}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    )
}