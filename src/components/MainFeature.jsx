import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import ApperIcon from './ApperIcon'
import taskService from '../services/taskService'
function MainFeature() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([
    { id: '1', name: 'Website Redesign', color: '#6366f1', taskCount: 8, completedCount: 3 },
    { id: '2', name: 'Mobile App', color: '#10b981', taskCount: 12, completedCount: 7 },
    { id: '3', name: 'Marketing Campaign', color: '#f59e0b', taskCount: 5, completedCount: 2 }
  ])

  const [activeProject, setActiveProject] = useState('all')
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    projectId: '1',
    tags: ''
  })

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0
  })

  const [view, setView] = useState('list') // list, board, calendar

// Load tasks on component mount
  useEffect(() => {
    loadTasks()
  }, [])

  // Update stats when tasks change
  useEffect(() => {
    updateStats()
  }, [tasks])

  const loadTasks = async () => {
    try {
      setInitialLoading(true)
      const fetchedTasks = await taskService.fetchTasks()
      
      // Transform backend data to match UI format
      const transformedTasks = fetchedTasks.map(task => ({
        id: task.Id?.toString() || '',
        title: task.title || task.Name || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.due_date || '',
        projectId: task.project_id || '1',
        tags: task.Tags ? task.Tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        createdAt: task.CreatedOn || new Date().toISOString(),
        updatedAt: task.ModifiedOn || new Date().toISOString()
      }))
      
      setTasks(transformedTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Failed to load tasks. Please try again.')
      setTasks([])
    } finally {
      setInitialLoading(false)
    }
  }

  const updateStats = () => {
    const total = tasks.length
    const completed = tasks.filter(task => task.status === 'completed').length
    const inProgress = tasks.filter(task => task.status === 'in-progress').length
    const overdue = tasks.filter(task => 
      task.status !== 'completed' && task.dueDate && isPast(new Date(task.dueDate))
    ).length

    setStats({ total, completed, inProgress, overdue })
  }

  const filteredTasks = activeProject === 'all' 
    ? tasks 
    : tasks.filter(task => task.projectId === activeProject)

const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskFormData.title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    try {
      // Transform UI data to backend format
      const taskData = {
        Name: taskFormData.title,
        title: taskFormData.title,
        description: taskFormData.description,
        priority: taskFormData.priority,
        status: 'todo',
        due_date: taskFormData.dueDate || null,
        project_id: taskFormData.projectId,
        Tags: taskFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      const createdTask = await taskService.createTask(taskData)
      
      if (createdTask) {
        // Transform backend response to UI format
        const newTask = {
          id: createdTask.Id?.toString() || '',
          title: createdTask.title || createdTask.Name || '',
          description: createdTask.description || '',
          priority: createdTask.priority || 'medium',
          status: createdTask.status || 'todo',
          dueDate: createdTask.due_date || '',
          projectId: createdTask.project_id || '1',
          tags: createdTask.Tags ? createdTask.Tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          createdAt: createdTask.CreatedOn || new Date().toISOString(),
          updatedAt: createdTask.ModifiedOn || new Date().toISOString()
        }

        setTasks(prev => [newTask, ...prev])
        setTaskFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          projectId: '1',
          tags: ''
        })
        setShowTaskForm(false)
        toast.success('Task created successfully!')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

const handleUpdateTask = async (e) => {
    e.preventDefault()
    if (!taskFormData.title.trim()) {
      toast.error('Task title is required')
      return
    }

    setLoading(true)
    try {
      // Transform UI data to backend format
      const taskData = {
        Name: taskFormData.title,
        title: taskFormData.title,
        description: taskFormData.description,
        priority: taskFormData.priority,
        status: editingTask.status, // Keep existing status
        due_date: taskFormData.dueDate || null,
        project_id: taskFormData.projectId,
        Tags: taskFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      const updatedTask = await taskService.updateTask(editingTask.id, taskData)
      
      if (updatedTask) {
        // Transform backend response to UI format and update local state
        const transformedTask = {
          id: updatedTask.Id?.toString() || editingTask.id,
          title: updatedTask.title || updatedTask.Name || '',
          description: updatedTask.description || '',
          priority: updatedTask.priority || 'medium',
          status: updatedTask.status || editingTask.status,
          dueDate: updatedTask.due_date || '',
          projectId: updatedTask.project_id || '1',
          tags: updatedTask.Tags ? updatedTask.Tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          createdAt: editingTask.createdAt,
          updatedAt: updatedTask.ModifiedOn || new Date().toISOString()
        }

        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? transformedTask : task
        ))
        
        setEditingTask(null)
        setTaskFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          projectId: '1',
          tags: ''
        })
        setShowTaskForm(false)
        toast.success('Task updated successfully!')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    setLoading(true)
    try {
      const success = await taskService.deleteTask(taskId)
      
      if (success) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        toast.success('Task deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

const handleToggleStatus = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    setLoading(true)
    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed'
      const taskData = {
        status: newStatus
      }

      const updatedTask = await taskService.updateTask(taskId, taskData)
      
      if (updatedTask) {
        setTasks(prev => prev.map(t => 
          t.id === taskId 
            ? {
                ...t,
                status: newStatus,
                updatedAt: new Date().toISOString()
              }
            : t
        ))
        toast.success(`Task marked as ${newStatus}`)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setTaskFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      tags: task.tags.join(', ')
    })
    setShowTaskForm(true)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      default: return 'text-surface-600 bg-surface-100 dark:bg-surface-700'
    }
  }

  const getDateColor = (dueDate, status) => {
    if (status === 'completed') return 'text-green-600'
    const date = new Date(dueDate)
    if (isPast(date)) return 'text-red-600'
    if (isToday(date)) return 'text-amber-600'
    return 'text-surface-600'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM dd')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
      {/* Sidebar */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-1 space-y-6"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <motion.div 
            className="project-card p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats.total}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Total Tasks</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <ApperIcon name="List" className="w-5 h-5 text-primary" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="project-card p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Completed</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ApperIcon name="CheckCircle" className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="project-card p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400">In Progress</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                <ApperIcon name="Clock" className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="project-card p-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-surface-600 dark:text-surface-400">Overdue</p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <ApperIcon name="AlertCircle" className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Projects Navigation */}
        <div className="project-card p-6">
          <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">Projects</h3>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveProject('all')}
              className={`w-full sidebar-nav ${activeProject === 'all' ? 'sidebar-nav-active' : ''}`}
            >
              <ApperIcon name="Folder" className="w-5 h-5" />
              <span>All Tasks</span>
              <span className="ml-auto text-sm bg-surface-200 dark:bg-surface-600 px-2 py-1 rounded-full">
                {tasks.length}
              </span>
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setActiveProject(project.id)}
                className={`w-full sidebar-nav ${activeProject === project.id ? 'sidebar-nav-active' : ''}`}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
                <span className="ml-auto text-sm bg-surface-200 dark:bg-surface-600 px-2 py-1 rounded-full">
                  {tasks.filter(task => task.projectId === project.id).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-3 space-y-6"
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-surface-100">
              {activeProject === 'all' ? 'All Tasks' : projects.find(p => p.id === activeProject)?.name}
            </h2>
            <p className="text-surface-600 dark:text-surface-400 mt-1">
              Manage and track your tasks efficiently
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'list' 
                    ? 'bg-white dark:bg-surface-600 shadow-sm' 
                    : 'hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                <ApperIcon name="List" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('board')}
                className={`p-2 rounded-md transition-colors ${
                  view === 'board' 
                    ? 'bg-white dark:bg-surface-600 shadow-sm' 
                    : 'hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                <ApperIcon name="Columns" className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setShowTaskForm(true)
                setEditingTask(null)
                setTaskFormData({
                  title: '',
                  description: '',
                  priority: 'medium',
                  dueDate: '',
                  projectId: activeProject === 'all' ? '1' : activeProject,
                  tags: ''
                })
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <ApperIcon name="Plus" className="w-5 h-5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Task Form Modal */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                      {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowTaskForm(false)
                        setEditingTask(null)
                      }}
                      className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                    >
                      <ApperIcon name="X" className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="form-input"
                        placeholder="Enter task title..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={taskFormData.description}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="form-input min-h-[100px] resize-none"
                        placeholder="Enter task description..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={taskFormData.priority}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                          className="form-input"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={taskFormData.dueDate}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Project
                      </label>
                      <select
                        value={taskFormData.projectId}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, projectId: e.target.value }))}
                        className="form-input"
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={taskFormData.tags}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, tags: e.target.value }))}
                        className="form-input"
                        placeholder="design, urgent, review..."
                      />
                    </div>

<div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            {editingTask ? 'Updating...' : 'Creating...'}
                          </div>
                        ) : (
                          editingTask ? 'Update Task' : 'Create Task'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTaskForm(false)
                          setEditingTask(null)
                        }}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

{/* Tasks List */}
        <div className="space-y-4">
          {initialLoading ? (
            <div className="task-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-surface-600 dark:text-surface-400">Loading tasks...</p>
            </div>
          ) : (
            <AnimatePresence>
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="task-card p-8 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-100 dark:bg-surface-700 rounded-full flex items-center justify-center">
                  <ApperIcon name="CheckSquare" className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                  No tasks found
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  Get started by creating your first task
                </p>
                <button
                  onClick={() => {
                    setShowTaskForm(true)
                    setEditingTask(null)
                    setTaskFormData({
                      title: '',
                      description: '',
                      priority: 'medium',
                      dueDate: '',
                      projectId: activeProject === 'all' ? '1' : activeProject,
                      tags: ''
                    })
                  }}
                  className="btn-primary"
                >
                  Create First Task
                </button>
              </motion.div>
            ) : (
              filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`task-card p-4 sm:p-6 ${
                    task.priority === 'urgent' ? 'task-priority-urgent' :
                    task.priority === 'high' ? 'task-priority-high' :
                    task.priority === 'medium' ? 'task-priority-medium' :
                    task.priority === 'low' ? 'task-priority-low' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => handleToggleStatus(task.id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500'
                          : 'border-surface-300 dark:border-surface-600 hover:border-green-500'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <ApperIcon name="Check" className="w-3 h-3 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h3 className={`font-semibold text-surface-900 dark:text-surface-100 ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>
                          {task.title}
                        </h3>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className={`text-xs ${getDateColor(task.dueDate, task.status)}`}>
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className={`text-surface-600 dark:text-surface-400 mb-3 ${
                          task.status === 'completed' ? 'line-through opacity-60' : ''
                        }`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 text-xs rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                          >
                            <ApperIcon name="Edit" className="w-4 h-4 text-surface-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          >
                            <ApperIcon name="Trash2" className="w-4 h-4 text-red-500" />
                          </button>
</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
</AnimatePresence>
          )}
        </div>
      </motion.main>
    </div>
  )
}

export default MainFeature