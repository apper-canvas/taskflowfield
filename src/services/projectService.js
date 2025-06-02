const { ApperClient } = window.ApperSDK

class ProjectService {
  constructor() {
    this.client = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'project'
    
    // Define field mappings from the provided schema
    this.fields = [
      'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
      'ModifiedOn', 'ModifiedBy', 'color'
    ]
    
    // Only updateable fields for create/update operations
    this.updateableFields = ['Name', 'Tags', 'Owner', 'color']
  }

  async fetchProjects(params = {}) {
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
          limit: 50,
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
      console.error('Error fetching projects:', error)
      throw error
    }
  }

  async getProjectById(projectId, params = {}) {
    try {
      const defaultParams = {
        fields: this.fields
      }

      const mergedParams = { ...defaultParams, ...params }
      const response = await this.client.getRecordById(this.tableName, projectId, mergedParams)
      
      if (!response || !response.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching project with ID ${projectId}:`, error)
      throw error
    }
  }

  async createProject(projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = {}
      this.updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          // Handle data type formatting
          if (field === 'Tags' && Array.isArray(projectData[field])) {
            filteredData[field] = projectData[field].join(',')
          } else {
            filteredData[field] = projectData[field]
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
          console.warn('Failed to create some projects:', failedRecords)
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
        throw new Error('Project creation failed')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async updateProject(projectId, projectData) {
    try {
      // Filter to only include updateable fields
      const filteredData = { Id: projectId }
      this.updateableFields.forEach(field => {
        if (projectData[field] !== undefined) {
          // Handle data type formatting
          if (field === 'Tags' && Array.isArray(projectData[field])) {
            filteredData[field] = projectData[field].join(',')
          } else {
            filteredData[field] = projectData[field]
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
          console.warn('Failed to update some projects:', failedUpdates)
          failedUpdates.forEach(record => {
            console.error(`Error: ${record.message || 'Project update failed'}`)
          })
        }

        return successfulUpdates.length > 0 ? successfulUpdates[0].data : null
      } else {
        throw new Error('Project update failed')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(projectId) {
    try {
      const params = {
        RecordIds: [projectId]
      }

      const response = await this.client.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn('Failed to delete some projects:', failedDeletions)
          failedDeletions.forEach(record => {
            console.error(`Error: ${record.message || 'Project deletion failed'}`)
          })
        }

        return successfulDeletions.length > 0
      } else {
        throw new Error('Project deletion failed')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  async deleteProjects(projectIds) {
    try {
      const params = {
        RecordIds: projectIds
      }

      const response = await this.client.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn(`Failed to delete ${failedDeletions.length} projects`)
        }

        return successfulDeletions.length
      } else {
        throw new Error('Bulk project deletion failed')
      }
    } catch (error) {
      console.error('Error deleting projects:', error)
      throw error
    }
  }
}

export default new ProjectService()