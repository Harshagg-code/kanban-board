import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import Column from './Column'
import AddTaskModal from './AddTaskModal'
import LabelManager from './LabelManager'
import { ClipboardList, CheckCircle2, TrendingUp, AlertTriangle, Tag, Plus } from 'lucide-react'
import TaskDetailPanel from './TaskDetailPanel'
import { logActivity } from '../utils/logActivity'
import TeamManager from './TeamManager'
import { Users } from 'lucide-react'
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import EditTaskModal from './EditTaskModal'

const COLUMNS = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'in_review', label: 'In Review' },
    { id: 'done', label: 'Done' },
]

export default function Board({ session, searchQuery }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [activeTask, setActiveTask] = useState(null)
    const [editingTask, setEditingTask] = useState(null)
    const [allLabels, setAllLabels] = useState([])
    const [taskLabels, setTaskLabels] = useState({})
    const [showLabelManager, setShowLabelManager] = useState(false)
    const [filterLabel, setFilterLabel] = useState(null)
    const [selectedTask, setSelectedTask] = useState(null)
    const [members, setMembers] = useState([])
    const [taskAssignees, setTaskAssignees] = useState({})
    const [showTeamManager, setShowTeamManager] = useState(false)
    const [filterAssignee, setFilterAssignee] = useState(null)

    const fetchTasks = async (showLoader = false) => {
        if (showLoader) setLoading(true)
        const { data: tasksData, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: true })

        const { data: labelsData } = await supabase
            .from('labels')
            .select('*')

        const { data: taskLabelsData } = await supabase
            .from('task_labels')
            .select('*')
        const { data: membersData } = await supabase
            .from('members')
            .select('*')

        const { data: taskAssigneesData } = await supabase
            .from('task_assignees')
            .select('*')

        if (membersData) setMembers(membersData)

        if (taskAssigneesData && membersData) {
            const map = {}
            taskAssigneesData.forEach(ta => {
                const member = membersData.find(m => m.id === ta.member_id)
                if (member) {
                    if (!map[ta.task_id]) map[ta.task_id] = []
                    map[ta.task_id].push(member)
                }
            })
            setTaskAssignees(map)
        }

        if (!error) setTasks(tasksData)
        if (labelsData) setAllLabels(labelsData)

        if (taskLabelsData && labelsData) {
            const map = {}
            taskLabelsData.forEach(tl => {
                const label = labelsData.find(l => l.id === tl.label_id)
                if (label) {
                    if (!map[tl.task_id]) map[tl.task_id] = []
                    map[tl.task_id].push(label)
                }
            })
            setTaskLabels(map)
        }

        setLoading(false)


    }

    useEffect(() => {
        if (session) fetchTasks(true)
    }, [session])

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes((searchQuery || '').toLowerCase())
        const matchesLabel = !filterLabel || (taskLabels[task.id] || []).some(l => l.id === filterLabel)
        const matchesAssignee = !filterAssignee || (taskAssignees[task.id] || []).some(m => m.id === filterAssignee)
        return matchesSearch && matchesLabel && matchesAssignee
    })

    const getColumnTasks = (columnId) =>
        filteredTasks.filter(task => task.status === columnId)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    )

    const handleDragStart = (event) => {
        const task = tasks.find(t => t.id === event.active.id)
        setActiveTask(task)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const activeId = active.id
        const overId = over.id

        const activeTask = tasks.find(t => t.id === activeId)
        if (!activeTask) return

        const overIsColumn = COLUMNS.some(col => col.id === overId)
        const targetColumnId = overIsColumn
            ? overId
            : tasks.find(t => t.id === overId)?.status

        if (!targetColumnId) return

        if (activeTask.status === targetColumnId) {
            const columnTasks = tasks.filter(t => t.status === targetColumnId)
            const oldIndex = columnTasks.findIndex(t => t.id === activeId)
            const newIndex = columnTasks.findIndex(t => t.id === overId)

            if (oldIndex !== newIndex && newIndex !== -1) {
                const reordered = arrayMove(columnTasks, oldIndex, newIndex)
                setTasks(prev => {
                    const otherTasks = prev.filter(t => t.status !== targetColumnId)
                    return [...otherTasks, ...reordered]
                })
            }
            return
        }


        setTasks(prev =>
            prev.map(t => t.id === activeId ? { ...t, status: targetColumnId } : t)
        )

        const { error } = await supabase
            .from('tasks')
            .update({ status: targetColumnId })
            .eq('id', activeId)

        if (error) {
            console.error('Update error:', error)
            fetchTasks()
            return
        }


        const fromLabel = COLUMNS.find(c => c.id === activeTask.status)?.label
        const toLabel = COLUMNS.find(c => c.id === targetColumnId)?.label
        await logActivity(activeId, session.user.id, `Moved from ${fromLabel} → ${toLabel}`)
    }

    const handleTaskCreated = async () => {
        setShowModal(false)
        await fetchTasks()

    }
    const handleTaskUpdated = async (updatedTask, changes = []) => {
        await fetchTasks()


        for (const change of changes) {
            await logActivity(updatedTask.id, session.user.id, change)
        }

        setEditingTask(null)
    }

    const handleTaskClick = (task) => {
        setSelectedTask(task)
    }
    const handleTaskDeleted = async (taskId) => {

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

        if (!error) {

            setTasks(prev => prev.filter(t => t.id !== taskId))
        } else {
            console.error('Delete error:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }
    const getStats = () => {
        const total = tasks.length
        const todo = tasks.filter(t => t.status === 'todo').length
        const inProgress = tasks.filter(t => t.status === 'in_progress').length
        const inReview = tasks.filter(t => t.status === 'in_review').length
        const done = tasks.filter(t => t.status === 'done').length
        const overdue = tasks.filter(t =>
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
        ).length

        return { total, todo, inProgress, inReview, done, overdue }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Page header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Plan and organise your tasks in one place</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowLabelManager(true)}
                        className="flex items-center gap-2 border-2 border-primary text-primary px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                        <Tag size={15} />
                        Labels
                    </button>
                    <button
                        onClick={() => setShowTeamManager(true)}
                        className="flex items-center gap-2 border-2 border-primary text-primary px-4 py-2.5 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors"
                    >
                        <Users size={15} />
                        Team
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
                    >
                        <Plus size={15} />
                        Add Task
                    </button>
                    <button className="flex items-center gap-2 border-2 border-primary text-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-red-50 transition-colors">
                        Import Data
                    </button>
                </div>
            </div>
            {/* Stats bar */}
            {tasks.length > 0 && (() => {
                const { total, done, overdue } = getStats()
                const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                    <div className="flex items-center gap-3 mb-5 flex-wrap bg-white/60 px-4 py-2.5 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-2">
                            <ClipboardList size={14} className="text-gray-400" />
                            <span className="text-xs font-semibold text-gray-600">{total} Total Tasks</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-xs font-semibold text-gray-600">{done} Completed</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-blue-400" />
                            <span className="text-xs font-semibold text-gray-600">{completionRate}% Complete</span>
                        </div>
                        {overdue > 0 && (
                            <>
                                <div className="w-px h-4 bg-gray-200" />
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-red-400" />
                                    <span className="text-xs font-semibold text-red-500">{overdue} Overdue</span>
                                </div>
                            </>
                        )}
                    </div>
                )
            })()}
            {allLabels.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">Filter:</span>
                    <button
                        onClick={() => setFilterLabel(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all
        ${!filterLabel ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        All
                    </button>
                    {allLabels.map(label => (
                        <button
                            key={label.id}
                            onClick={() => setFilterLabel(filterLabel === label.id ? null : label.id)}
                            className="px-3 py-1 rounded-full text-xs font-medium text-white transition-all hover:opacity-80"
                            style={{
                                backgroundColor: filterLabel === label.id ? label.color : 'transparent',
                                border: `2px solid ${label.color}`,
                                color: filterLabel === label.id ? 'white' : label.color,
                            }}
                        >
                            {label.name}
                        </button>
                    ))}
                </div>
            )}
            {members.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">Assignee:</span>
                    <button
                        onClick={() => setFilterAssignee(null)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-all
        ${!filterAssignee ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        All
                    </button>
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => setFilterAssignee(filterAssignee === member.id ? null : member.id)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border-2 transition-all"
                            style={{
                                borderColor: member.color,
                                backgroundColor: filterAssignee === member.id ? member.color : 'white',
                                color: filterAssignee === member.id ? 'white' : member.color,
                            }}
                        >
                            <div
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: filterAssignee === member.id ? 'rgba(255,255,255,0.3)' : member.color }}
                            >
                                <span style={{ color: 'white', fontSize: '9px' }}>
                                    {member.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            {member.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Kanban board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 pb-4 items-start overflow-x-auto scrollbar-none w-full">
                    {COLUMNS.map(col => (
                        <Column
                            key={col.id}
                            column={col}
                            tasks={getColumnTasks(col.id)}
                            onAddTask={() => setShowModal(true)}
                            onTaskDeleted={handleTaskDeleted}
                            onTaskClick={handleTaskClick}
                            taskLabels={taskLabels}
                            allLabels={allLabels}
                            taskAssignees={taskAssignees}
                            members={members}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask && <TaskCard task={activeTask} isDragging />}
                </DragOverlay>
            </DndContext>

            {showModal && (
                <AddTaskModal
                    session={session}
                    onClose={() => setShowModal(false)}
                    onTaskCreated={handleTaskCreated}
                    members={members}

                />
            )}
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onTaskUpdated={handleTaskUpdated}
                    members={members}
                />
            )}
            {showLabelManager && (
                <LabelManager
                    session={session}
                    onClose={() => {
                        setShowLabelManager(false)
                        fetchTasks() // refresh to get new labels
                    }}
                />
            )}
            {selectedTask && (
                <TaskDetailPanel
                    task={selectedTask}
                    session={session}
                    labels={taskLabels[selectedTask.id] || []}
                    assignees={taskAssignees[selectedTask.id] || []}
                    onClose={() => setSelectedTask(null)}
                    onEdit={() => {
                        setEditingTask(selectedTask)
                        setSelectedTask(null)
                    }}
                />
            )}
            {showTeamManager && (
                <TeamManager
                    session={session}
                    onClose={() => {
                        setShowTeamManager(false)
                        fetchTasks()
                    }}
                />
            )}
        </div>
    )
}