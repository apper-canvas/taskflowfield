const { ApperClient } = window.ApperSDK

class TaskService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'task'
    
    // Define field mappings from the provided schema
    this.fields = [
      'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
      'ModifiedOn', 'ModifiedBy', 'title', 'description', 
      'priority', 'status', 'due_date', 'project_id'
    ]
    
    // Only updateable fields for create/update operations
    this.updateableFields = [
      'Name', 'Tags', 'Owner', 'title', 'description', 
      'priority', 'status', 'due_date', 'project_id'
    ]
  }

  async fetchTasks(params = {}) {
    try {
      const defaultParams = {
        fields: this.fields,
        orderBy: [
          {
            fieldName: 'CreatedOn',
            SortType: 'DESC'
          }
        ],
        pagingInfo: {
          limit: 100,
          offset: 0
        }
      }

      const mergedParams = { ...defaultParams, ...params }
      const response = await this.client.fetchRecords(this.tableName, mergedParams)
      
      if (!response || !response.data) {
        return []
      }

      return response.data
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  }

  async getTaskById(taskId, params = {}) {
    try {
      const defaultParams = {
        fields: this.fields
      }

      const mergedParams = { ...defaultParams, ...params }
      const response = await this.client.getRecordById(this.tableName, taskId, mergedParams)
      
      if (!response || !response.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching task with ID ${taskId}:`, error)
      throw error
    }
  }

async createTask(taskData) {
    try {
      // Filter to only include updateable fields and format data
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (taskData[field] !== undefined && taskData[field] !== null && taskData[field] !== '') {
          // Handle data type formatting based on field types
          if (field === 'Tags' && Array.isArray(taskData[field])) {
            filteredData[field] = taskData[field].join(',')
          } else if (field === 'due_date' && taskData[field]) {
            // Ensure date is in proper format (YYYY-MM-DD)
            filteredData[field] = taskData[field]
          } else if (field === 'priority' || field === 'status') {
            // Picklist fields - ensure valid values
            filteredData[field] = taskData[field]
          } else if (field === 'project_id' || field === 'Owner') {
            // Lookup fields - must be integers
            const numValue = parseInt(taskData[field], 10)
            if (!isNaN(numValue)) {
              filteredData[field] = numValue
            }
          } else {
            filteredData[field] = taskData[field]
          }
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.createRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)

        if (failedRecords.length > 0) {
          console.warn('Failed to create some tasks:', failedRecords)
          failedRecords.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => {
                console.error(`Field: ${error.fieldLabel}, Error: ${error.message}`)
              })
            }
          })
        }

        return successfulRecords.length > 0 ? successfulRecords[0].data : null
      } else {
        throw new Error('Task creation failed')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

async updateTask(taskId, taskData) {
    try {
      // Filter to only include updateable fields and format data
      const filteredData = { Id: taskId }
      this.updateableFields.forEach(field => {
        if (taskData[field] !== undefined && taskData[field] !== null && taskData[field] !== '') {
          // Handle data type formatting based on field types
          if (field === 'Tags' && Array.isArray(taskData[field])) {
            filteredData[field] = taskData[field].join(',')
          } else if (field === 'due_date' && taskData[field]) {
            // Ensure date is in proper format (YYYY-MM-DD)
            filteredData[field] = taskData[field]
          } else if (field === 'priority' || field === 'status') {
            // Picklist fields - ensure valid values
            filteredData[field] = taskData[field]
          } else if (field === 'project_id' || field === 'Owner') {
            // Lookup fields - must be integers
            const numValue = parseInt(taskData[field], 10)
            if (!isNaN(numValue)) {
              filteredData[field] = numValue
            }
          } else {
            filteredData[field] = taskData[field]
          }
        }
      })

      const params = {
        records: [filteredData]
      }

      const response = await this.client.updateRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success)
        const failedUpdates = response.results.filter(result => !result.success)

        if (failedUpdates.length > 0) {
          console.warn('Failed to update some tasks:', failedUpdates)
          failedUpdates.forEach(record => {
            console.error(`Error: ${record.message || 'Task update failed'}`)
          })
        }

        return successfulUpdates.length > 0 ? successfulUpdates[0].data : null
      } else {
        throw new Error('Task update failed')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  async deleteTask(taskId) {
    try {
      const params = {
        RecordIds: [taskId]
      }

      const response = await this.client.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn('Failed to delete some tasks:', failedDeletions)
          failedDeletions.forEach(record => {
            console.error(`Error: ${record.message || 'Task deletion failed'}`)
          })
        }

        return successfulDeletions.length > 0
      } else {
        throw new Error('Task deletion failed')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  async deleteTasks(taskIds) {
    try {
      const params = {
        RecordIds: taskIds
      }

      const response = await this.client.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn(`Failed to delete ${failedDeletions.length} tasks`)
        }

        return successfulDeletions.length
      } else {
        throw new Error('Bulk task deletion failed')
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      throw error
    }
  }

  async getTasksByProject(projectId) {
    try {
      const params = {
        fields: this.fields,
        where: [
          {
            fieldName: 'project_id',
            operator: 'ExactMatch',
            values: [projectId]
          }
        ],
        orderBy: [
          {
            fieldName: 'CreatedOn',
            SortType: 'DESC'
          }
        ]
      }

      return await this.fetchTasks(params)
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error)
      throw error
    }
  }
}

export default new TaskService()