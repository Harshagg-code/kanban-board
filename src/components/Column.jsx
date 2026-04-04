import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'
const COLUMN_STYLES = {
    todo: {
        dot: 'bg-red-400',
        badge: 'bg-red-100 text-red-500',
        columnBg: 'bg-[#C1502E]/20',
        columnBgOver: 'bg-[#C1502E]/30',
    },
    in_progress: {
        dot: 'bg-yellow-400',
        badge: 'bg-yellow-100 text-yellow-600',
        columnBg: 'bg-[#C1502E]/20',
        columnBgOver: 'bg-[#C1502E]/30',
    },
    in_review: {
        dot: 'bg-blue-400',
        badge: 'bg-blue-100 text-blue-500',
        columnBg: 'bg-[#C1502E]/20',
        columnBgOver: 'bg-[#C1502E]/30',
    },
    done: {
        dot: 'bg-green-400',
        badge: 'bg-green-100 text-green-600',
        columnBg: 'bg-[#C1502E]/20',
        columnBgOver: 'bg-[#C1502E]/30',
    },
}
export default function Column({ column, tasks, onAddTask, onTaskDeleted, onTaskClick, taskLabels, allLabels, taskAssignees }) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id })
    const styles = COLUMN_STYLES[column.id]

    return (
        <div className="flex flex-col flex-shrink-0 w-72 lg:w-80 xl:flex-1 min-h-0 min-w-[260px]">
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
                <h3 className="font-semibold text-sm text-gray-700">{column.label}</h3>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
                    {tasks.length}
                </span>
            </div>

            {/* Droppable area */}
            <div
                ref={setNodeRef}
                className={`flex flex-col gap-3 flex-1 rounded-xl p-3 transition-colors min-h-[200px]
    ${isOver ? styles.columnBgOver : styles.columnBg}`}
            >
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                <Plus size={16} className="text-black-300" />
                            </div>
                            <p className="text-black-300 text-xs font-medium">No tasks yet</p>
                            <p className="text-black-200 text-xs mt-0.5">Drop tasks here</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onTaskDeleted={onTaskDeleted}
                                onTaskClick={onTaskClick}
                                labels={taskLabels[task.id] || []}
                                assignees={taskAssignees[task.id] || []}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    )
}