'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Calendar, AlertCircle, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

export default function LeadTasksManager({ leadId }) {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium'
    })

    useEffect(() => {
        fetchTasks()
    }, [leadId])

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/leads/${leadId}/tasks`)
            if (!res.ok) throw new Error('Failed to fetch tasks')
            const data = await res.json()
            setTasks(data.tasks || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
            toast.error('Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const res = await fetch(`/api/leads/${leadId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to create task')

            toast.success('Task created successfully')
            setDialogOpen(false)
            setFormData({
                title: '',
                description: '',
                due_date: '',
                priority: 'medium'
            })
            fetchTasks()
        } catch (error) {
            console.error('Error creating task:', error)
            toast.error('Failed to create task')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleComplete = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed'
            const res = await fetch(`/api/leads/${leadId}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...task, status: newStatus })
            })

            if (!res.ok) throw new Error('Failed to update task')

            toast.success(`Task marked as ${newStatus}`)
            fetchTasks()
        } catch (error) {
            console.error('Error updating task:', error)
            toast.error('Failed to update task')
        }
    }

    const handleDelete = async (taskId) => {
        if (!confirm('Are you sure you want to delete this task?')) return

        try {
            const res = await fetch(`/api/leads/${leadId}/tasks/${taskId}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Failed to delete task')

            toast.success('Task deleted')
            fetchTasks()
        } catch (error) {
            console.error('Error deleting task:', error)
            toast.error('Failed to delete task')
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200'
            case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'low': return 'bg-green-100 text-green-700 border-green-200'
            default: return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high': return <AlertCircle className="w-4 h-4" />
            case 'medium': return <Clock className="w-4 h-4" />
            case 'low': return <CheckCircle2 className="w-4 h-4" />
            default: return <Clock className="w-4 h-4" />
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-muted-foreground text-sm">Loading tasks...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const pendingTasks = tasks.filter(t => t.status === 'pending')
    const completedTasks = tasks.filter(t => t.status === 'completed')

    return (
        <div className="space-y-6">
            {/* Pending Tasks */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Pending Tasks</CardTitle>
                        <CardDescription>Follow-ups and action items</CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                                <DialogDescription>Add a follow-up or action item for this lead</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Task title"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Task details"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Due Date</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" disabled={submitting} className="flex-1">
                                        {submitting ? 'Creating...' : 'Create Task'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No pending tasks</p>
                            <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                        checked={false}
                                        onCheckedChange={() => handleToggleComplete(task)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-1">
                                            <h4 className="font-medium">{task.title}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Badge className={getPriorityColor(task.priority)}>
                                                {getPriorityIcon(task.priority)}
                                                <span className="ml-1 capitalize">{task.priority}</span>
                                            </Badge>
                                            {task.due_date && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(task.due_date), 'MMM d, yyyy')}
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

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Completed Tasks</CardTitle>
                        <CardDescription>{completedTasks.length} completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {completedTasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                                    <Checkbox
                                        checked={true}
                                        onCheckedChange={() => handleToggleComplete(task)}
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-medium line-through text-muted-foreground">{task.title}</h4>
                                        {task.completed_at && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Completed {format(new Date(task.completed_at), 'MMM d, yyyy')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
