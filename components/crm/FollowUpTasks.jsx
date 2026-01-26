'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Phone, CheckCircle2, Clock, AlertCircle,
    Calendar, User, Building2, Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function FollowUpTasks() {
    const [tasks, setTasks] = useState([])
    const [filter, setFilter] = useState('pending') // pending, all, completed
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchTasks()

        // Subscribe to real-time updates
        const channel = supabase
            .channel('tasks_channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'follow_up_tasks'
            }, fetchTasks)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter])

    const fetchTasks = async () => {
        setLoading(true)

        let query = supabase
            .from('follow_up_tasks')
            .select(`
                *,
                lead:leads(name, phone, email),
                campaign:campaigns(name),
                assigned_user:profiles!assigned_to(full_name)
            `)
            .order('due_date', { ascending: true })

        if (filter === 'pending') {
            query = query.in('status', ['pending', 'in_progress'])
        } else if (filter === 'completed') {
            query = query.eq('status', 'completed')
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tasks:', error)
            toast.error('Failed to load tasks')
        } else {
            setTasks(data || [])
        }

        setLoading(false)
    }

    const completeTask = async (taskId) => {
        const { error } = await supabase
            .from('follow_up_tasks')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', taskId)

        if (error) {
            toast.error('Failed to complete task')
        } else {
            toast.success('Task completed!')
            fetchTasks()
        }
    }

    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-gray-100 text-gray-800 border-gray-200'
        }
        return <Badge className={styles[priority] || styles.medium}>{priority}</Badge>
    }

    const getTaskIcon = (type) => {
        const icons = {
            call: <Phone className="w-4 h-4" />,
            sms: <Phone className="w-4 h-4" />,
            meeting: <Calendar className="w-4 h-4" />,
            site_visit: <Building2 className="w-4 h-4" />
        }
        return icons[type] || <AlertCircle className="w-4 h-4" />
    }

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Follow-up Tasks</h2>
                    <p className="text-muted-foreground">Manage your lead follow-ups</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setFilter('pending')}
                        size="sm"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        size="sm"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === 'completed' ? 'default' : 'outline'}
                        onClick={() => setFilter('completed')}
                        size="sm"
                    >
                        Completed
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
            ) : tasks.length === 0 ? (
                <Card className="py-12">
                    <CardContent className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Tasks</h3>
                        <p className="text-muted-foreground">
                            {filter === 'pending' ? 'All caught up!' : 'No tasks found'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tasks.map(task => (
                        <Card
                            key={task.id}
                            className={`hover:shadow-md transition-all ${isOverdue(task.due_date) && task.status === 'pending'
                                    ? 'border-l-4 border-l-red-500'
                                    : ''
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <Checkbox
                                        checked={task.status === 'completed'}
                                        onCheckedChange={() => completeTask(task.id)}
                                        className="mt-1"
                                    />

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {getTaskIcon(task.task_type)}
                                                    <h3 className="font-semibold">{task.title}</h3>
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                )}
                                            </div>
                                            {getPriorityBadge(task.priority)}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="font-medium">{task.lead.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">{task.lead.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className={isOverdue(task.due_date) ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                                                    {new Date(task.due_date).toLocaleString('en-IN', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short'
                                                    })}
                                                </span>
                                            </div>
                                            {task.campaign && (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-muted-foreground truncate">{task.campaign.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {task.ai_suggestion && (
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                                                <div className="text-xs font-medium text-primary mb-1">💡 AI Suggestion</div>
                                                <p className="text-sm">{task.ai_suggestion}</p>
                                            </div>
                                        )}

                                        {task.context && (
                                            <div className="text-xs text-muted-foreground">
                                                Context: {task.context}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
