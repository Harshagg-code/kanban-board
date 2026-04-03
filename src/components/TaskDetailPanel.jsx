import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { X, Send, Calendar, Tag, Pencil } from 'lucide-react'

const PRIORITY_STYLES = {
    high: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', label: 'High' },
    normal: { bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300', label: 'Normal' },
    low: { bg: 'bg-green-50', text: 'text-green-500', dot: 'bg-green-400', label: 'Low' },
}

const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}



export default function TaskDetailPanel({ task, session, labels = [], assignees = [], onClose, onEdit }) {
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const bottomRef = useRef(null)
    const [activity, setActivity] = useState([])

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: true })

        if (!error) setComments(data)
        setLoading(false)
    }
    const fetchActivity = async () => {
        const { data } = await supabase
            .from('activity')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })

        if (data) setActivity(data)
    }

    useEffect(() => {
        fetchComments()
        fetchActivity()
    }, [task.id, task.status])



    const timeAgo = (dateStr) => {
        const now = new Date()
        const then = new Date(dateStr)
        const diff = Math.floor((now - then) / 1000)

        if (diff < 60) return 'just now'
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
        return `${Math.floor(diff / 86400)}d ago`
    }

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

    const handleSubmit = async () => {
        if (!newComment.trim()) return
        setSubmitting(true)

        const { data, error } = await supabase
            .from('comments')
            .insert({
                task_id: task.id,
                user_id: session.user.id,
                content: newComment.trim(),
            })
            .select()
            .single()

        if (!error) {
            setComments(prev => [...prev, data])
            setNewComment('')
        }
        setSubmitting(false)
    }

    const handleDeleteComment = async (commentId) => {
        await supabase.from('comments').delete().eq('id', commentId)
        setComments(prev => prev.filter(c => c.id !== commentId))
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
    const p = PRIORITY_STYLES[task.priority || 'normal']

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-base">Task Details</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors"
                        >
                            <Pencil size={12} />
                            Edit
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Task info */}
                <div className="px-6 py-5 border-b border-gray-100">

                    {/* Priority + Labels */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                            {p.label}
                        </span>
                        {labels.map(label => (
                            <span
                                key={label.id}
                                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                                style={{ backgroundColor: label.color }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>

                    {/* Assignees */}
                    {assignees.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-gray-400 font-medium">Assigned to:</span>
                            <div className="flex items-center gap-1.5">
                                {assignees.map(member => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: member.color }}
                                    >
                                        <div className="w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
                                            <span style={{ fontSize: '8px', color: 'white' }}>
                                                {member.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {member.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                        {task.title}
                    </h3>

                    {/* Description */}
                    {task.description && (
                        <p className="text-sm text-gray-500 leading-relaxed mb-3">
                            {task.description}
                        </p>
                    )}

                    {/* Due date */}
                    {task.due_date && (
                        <div className={`flex items-center gap-1.5 text-xs font-medium
              ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}
                        >
                            <Calendar size={12} />
                            <span>{isOverdue ? 'Overdue · ' : 'Due · '}{formatDate(task.due_date)}</span>
                        </div>
                    )}
                </div>
                {/* Activity section */}
                {activity.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Activity
                        </h4>
                        <div className="flex flex-col gap-3 max-h-40 overflow-y-auto scrollbar-none">
                            {activity.map(entry => (
                                <div key={entry.id} className="flex items-start gap-2.5">
                                    {/* Timeline dot */}
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-600 font-medium">{entry.description}</p>
                                        <p className="text-xs text-gray-300 mt-0.5">{timeAgo(entry.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments section */}
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-3 border-b border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Comments {comments.length > 0 && `· ${comments.length}`}
                        </h4>
                    </div>

                    {/* Comments list */}
                    <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <Tag size={16} className="text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-300 font-medium">No comments yet</p>
                                <p className="text-xs text-gray-200 mt-1">Be the first to comment</p>
                            </div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex flex-col gap-1 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-primary">G</span>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600">Guest User</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-300">{formatTime(comment.created_at)}</span>
                                            <button
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ml-8 bg-gray-50 rounded-xl px-3 py-2.5">
                                        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Comment input */}
                    <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-end gap-2">
                            <div className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSubmit()
                                        }
                                    }}
                                    placeholder="Write a comment... (Enter to send)"
                                    rows={2}
                                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-300 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !newComment.trim()}
                                className="w-9 h-9 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}