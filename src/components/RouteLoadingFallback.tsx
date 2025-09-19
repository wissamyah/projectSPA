import { Loader2 } from 'lucide-react'

export default function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-stone-600 text-lg font-medium">Loading...</p>
      </div>
    </div>
  )
}