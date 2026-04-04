import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function EditTaskModal({ task, onClose, onTaskUpdated, members = [] }) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description || '')
    const [priority, setPriority] = useState(task.priority || 'normal')
    const [dueDate, setDueDate] = useState(task.due_date || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [labels, setLabels] = useState([])
    const [selectedLabels, setSelectedLabels] = useState([])
    const [selectedAssignees, setSelectedAssignees] = useState([])

    useEffect(() => {
        const fetchLabels = async () => {
            const { data } = await supabase.from('labels').select('*')
            if (data) setLabels(data)
        }
        fetchLabels()
    }, [])

    useEffect(() => {
        const fetchTaskLabels = async () => {
            const { data } = await supabase
                .from('task_labels')
                .select('label_id')
                .eq('task_id', task.id)
            if (data) setSelectedLabels(data.map(tl => tl.label_id))
        }
        fetchTaskLabels()
    }, [task.id])

    useEffect(() => {
        const fetchTaskAssignees = async () => {
            const { data } = await supabase
                .from('task_assignees')
                .select('member_id')
                .eq('task_id', task.id)
            if (data) setSelectedAssignees(data.map(ta => ta.member_id))
        }
        fetchTaskAssignees()
    }, [task.id])

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required')
            return
        }

        setLoading(true)
        setError('')

        const { data, error } = await supabase
            .from('tasks')
            .update({
                title: title.trim(),
                description: description.trim() || null,
                priority,
                due_date: dueDate || null,
            })
            .eq('id', task.id)
            .select()
            .single()

        if (error) {
            setError('Failed to update task. Try again.')
            setLoading(false)
            return
        }


        const changes = []
        if (title.trim() !== task.title) changes.push('Title updated')
        if (description.trim() !== (task.description || '')) changes.push('Description updated')
        if (priority !== task.priority) changes.push(`Priority changed to ${priority}`)
        if (dueDate !== (task.due_date || '')) changes.push('Due date updated')
        if (selectedAssignees.length !== (task.assignee_ids?.length || 0)) changes.push('Assignees updated')

        await supabase.from('task_labels').delete().eq('task_id', task.id)
        if (selectedLabels.length > 0) {
            await supabase.from('task_labels').insert(
                selectedLabels.map(labelId => ({
                    task_id: task.id,
                    label_id: labelId,
                }))
            )
        }


        await supabase.from('task_assignees').delete().eq('task_id', task.id)
        if (selectedAssignees.length > 0) {
            await supabase.from('task_assignees').insert(
                selectedAssignees.map(memberId => ({
                    task_id: task.id,
                    member_id: memberId,
                }))
            )
        }

        onTaskUpdated({ ...data, label_ids: selectedLabels }, changes)
        setLoading(false)
    }
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Edit Task</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
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
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                        />
                    </div>

                    {/* Priority + Due date */}
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

                    {error && <p className="text-red-500 text-sm">{error}</p>}
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
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
                                            style={{
                                                borderColor: member.color,
                                                backgroundColor: isSelected ? member.color : 'white',
                                                color: isSelected ? 'white' : member.color,
                                            }}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full flex items-center justify-center"
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

                </div>


                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}