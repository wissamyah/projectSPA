import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-slate-200">404</h1>
        <h2 className="text-2xl font-semibold text-slate-800 mt-4">Page Not Found</h2>
        <p className="text-slate-600 mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center justify-center space-x-2 bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-800"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center space-x-2 border-2 border-slate-700 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound