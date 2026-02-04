'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, Flag, Clock, CheckCircle2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export default function ComingUpNextCard({ leadId }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [users, setUsers] = useState([])
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        due_date: new Date(),
        due_time: '09:00',
        priority: 'medium',
        assigned_to: ''
    })

    useEffect(() => {
        if (leadId) {
            fetchTasks()
            fetchUsers()
        }
    }, [leadId])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/leads/${leadId}/tasks`)
            if (!res.ok) throw new Error('Failed to fetch tasks')
            const data = await res.json()
            setTasks(data.tasks || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            toast.error('Please enter a task title')
            return
        }

        try {
            setSaving(true)
            const res = await fetch(`/api/leads/${leadId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTask.title,
                    description: newTask.description,
                    due_date: newTask.due_date,
                    due_time: newTask.due_time,
                    priority: newTask.priority,
                    assigned_to: newTask.assigned_to || null,
                    status: 'pending'
                })
            })

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to create task')
            }

            toast.success('Task created successfully')
            setIsDialogOpen(false)
            setNewTask({
                title: '',
                description: '',
                due_date: new Date(),
                due_time: '09:00',
                priority: 'medium',
                assigned_to: ''
            })
            fetchTasks()
        } catch (error) {
            console.error('Error creating task:', error)
            toast.error(error.message || 'Failed to create task')
        } finally {
            setSaving(false)
        }
    }

    const toggleTaskStatus = async (taskId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
            const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!res.ok) throw new Error('Failed to update task')

            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, status: newStatus } : t
            ))
            toast.success(`Task marked as ${newStatus}`)
        } catch (error) {
            console.error('Error updating task:', error)
            toast.error('Failed to update task')
        }
    }

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return

        try {
            const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete task')

            setTasks(tasks.filter(t => t.id !== taskId))
            toast.success('Task deleted')
        } catch (error) {
            console.error('Error deleting task:', error)
            toast.error('Failed to delete task')
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-500 fill-red-500/10'
            case 'medium': return 'text-orange-500 fill-orange-500/10'
            case 'low': return 'text-blue-500 fill-blue-500/10'
            default: return 'text-gray-400'
        }
    }

    const getUserName = (userId) => {
        if (!userId) return 'Unassigned'
        const user = users.find(u => u.id === userId)
        return user?.full_name || user?.email || 'Unknown'
    }

    if (loading) {
        return (
            <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded-md">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <CardTitle className="text-sm font-semibold text-gray-900">Tasks</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" /> // Increased height placeholder
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200 flex flex-col">
            <CardHeader className="pb-4 shrink-0 border-b border-gray-100 mb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold text-gray-900">Tasks</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {tasks.filter(t => t.status !== 'completed').length} pending
                            </p>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add Task</DialogTitle>
                                <DialogDescription>Create a new task for this lead</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Follow up call"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="h-9"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Add details about this task..."
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="min-h-[80px] resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Due Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {newTask.due_date ? format(newTask.due_date, 'MMM d, yyyy') : <span>Pick date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={newTask.due_date}
                                                    onSelect={(date) => setNewTask({ ...newTask, due_date: date })}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Time</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="time"
                                                type="time"
                                                value={newTask.due_time}
                                                onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                                                className="h-9 pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={newTask.priority} onValueChange={(val) => setNewTask({ ...newTask, priority: val })}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">🔴 High</SelectItem>
                                                <SelectItem value="medium">🟠 Medium</SelectItem>
                                                <SelectItem value="low">🔵 Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assign To</Label>
                                        <Select
                                            value={newTask.assigned_to || undefined}
                                            onValueChange={(val) => setNewTask({ ...newTask, assigned_to: val })}
                                            disabled={users.length === 0}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder={users.length === 0 ? "No users available" : "Unassigned"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.length === 0 ? (
                                                    <div className="px-2 py-1.5 text-xs text-gray-500">
                                                        No users in organization
                                                    </div>
                                                ) : (
                                                    users.map(user => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.full_name || user.email}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddTask} disabled={saving}>
                                    {saving ? 'Creating...' : 'Create Task'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto px-4 pb-4">
                {tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 className="w-6 h-6 text-indigo-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No tasks yet</p>
                        <p className="text-xs text-gray-500 mt-1 mb-3">Stay organized by adding tasks</p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDialogOpen(true)}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Add First Task
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "group relative flex items-start gap-3 p-4 rounded-xl border transition-all",
                                    task.status === 'completed'
                                        ? "bg-gray-50/80 border-gray-100"
                                        : "bg-white border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md"
                                )}
                            >
                                <button
                                    onClick={() => toggleTaskStatus(task.id, task.status)}
                                    className={cn(
                                        "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/20",
                                        task.status === 'completed'
                                            ? "bg-indigo-600 border-indigo-600"
                                            : "border-gray-200 hover:border-indigo-500 text-transparent hover:text-indigo-500"
                                    )}
                                >
                                    <CheckCircle2 className={cn("w-3.5 h-3.5", task.status === 'completed' ? "text-white" : "opacity-0 hover:opacity-100")} />
                                </button>

                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className={cn(
                                            "text-sm font-semibold leading-tight",
                                            task.status === 'completed'
                                                ? "line-through text-gray-400"
                                                : "text-gray-900"
                                        )}>
                                            {task.title}
                                        </p>

                                        {/* Actions: Priority (if not completed) & Delete */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {task.status !== 'completed' && (
                                                <Flag className={cn("w-4 h-4", getPriorityColor(task.priority))} />
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteTask(task.id)
                                                }}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-0.5"
                                                title="Delete task"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {task.description && (
                                        <p className={cn("text-xs line-clamp-2", task.status === 'completed' ? "text-gray-300" : "text-gray-500")}>
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-1 pt-2 border-t border-dashed border-gray-100">
                                        <div className="flex items-center gap-4">
                                            {task.due_date && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-xs font-medium",
                                                    task.status === 'completed'
                                                        ? "text-gray-400"
                                                        : new Date(task.due_date) < new Date()
                                                            ? "text-red-600"
                                                            : "text-gray-600"
                                                )}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                                    {task.due_time && <span className="opacity-70 font-normal">at {task.due_time}</span>}
                                                </div>
                                            )}
                                        </div>

                                        {task.assigned_to && (
                                            <div className="flex items-center gap-1.5">
                                                <Avatar className="h-6 w-6 border border-white ring-1 ring-gray-100">
                                                    <AvatarFallback className={cn(
                                                        "text-[10px] font-bold",
                                                        task.status === 'completed' ? "bg-gray-100 text-gray-400" : "bg-indigo-50 text-indigo-600"
                                                    )}>
                                                        {getUserName(task.assigned_to).substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className={cn("text-xs font-medium", task.status === 'completed' ? "text-gray-300" : "text-gray-600")}>
                                                    {getUserName(task.assigned_to).split(' ')[0]}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
