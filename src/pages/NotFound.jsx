import { Link } from 'react-router-dom'
import ApperIcon from '../components/ApperIcon'
import { motion } from 'framer-motion'

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto"
      >
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
          <ApperIcon name="AlertTriangle" className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-4">404</h1>
        <p className="text-lg text-surface-600 dark:text-surface-400 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 btn-primary"
        >
          <ApperIcon name="Home" className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound