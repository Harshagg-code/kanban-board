import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Trash2, GripVertical } from 'lucide-react'

const PRIORITY_STYLES = {
    high: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400', label: 'High' },
    normal: { bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300', label: 'Normal' },
    low: { bg: 'bg-green-50', text: 'text-green-500', dot: 'bg-green-400', label: 'Low' },
}

const PRIORITY_BORDER = {
    high: 'border-l-red-400',
    normal: 'border-l-yellow-400',
    low: 'border-l-green-400',
}

export default function TaskCard({ task, isDragging, onTaskDeleted, onTaskClick, labels = [], assignees = [] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: task.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.3 : 1,
    }

    const isOverdue = task.due_date && new Date(task.due_date) < new Date()
    const isDueSoon = task.due_date && !isOverdue &&
        (new Date(task.due_date) - new Date()) < 1000 * 60 * 60 * 24 * 2

    const formatDate = (dateStr) => {
        if (!dateStr) return null
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const p = PRIORITY_STYLES[task.priority || 'normal']

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 border-l-4 group
            ${PRIORITY_BORDER[task.priority || 'normal']}
            ${isDragging ? 'shadow-xl rotate-2 scale-105' : 'hover:shadow-md'}
            transition-all cursor-default`}
        >
            {/* Top row: priority + drag handle + delete */}
            <div className="flex items-center justify-between mb-3">
                {/* Priority badge */}
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${p.bg} ${p.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.label}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        {...attributes}
                        {...listeners}
                        className="text-black-200 hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors p-0.5"
                    >
                        <GripVertical size={14} />
                    </button>
                    <button
                        onClick={() => onTaskDeleted?.(task.id)}
                        className="opacity-60 group-hover:opacity-100 text-black-200 hover:text-red-400 transition-all p-0.5"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Labels */}
            {labels && labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
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
            )}

            {/* Task title */}
            <p
                onClick={() => onTaskClick?.(task)}
                className="text-sm font-bold text-gray-800 leading-snug hover:text-primary cursor-pointer transition-colors mb-1"
            >
                {task.title}
            </p>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">
                    {task.description}
                </p>
            )}

            {/* Due date */}
            {task.due_date && (
                <div className={`flex items-center gap-1.5 text-xs font-medium pt-2 border-t border-gray-50
          ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-orange-400' : 'text-gray-300'}`}
                >
                    <Calendar size={11} />
                    <span>{isOverdue ? 'Overdue · ' : ''}{formatDate(task.due_date)}</span>
                </div>
            )}
            {/* Assignee avatars */}
            {assignees.length > 0 && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
                    {assignees.map(member => (
                        <div
                            key={member.id}
                            className="relative group/avatar"
                        >
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white cursor-default"
                                style={{ backgroundColor: member.color }}
                            >
                                <span style={{ fontSize: '9px' }}>
                                    {member.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {member.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}