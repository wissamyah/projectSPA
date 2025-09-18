import { useState, useEffect } from 'react'
import { Mail, Trash2, RefreshCw } from 'lucide-react'
import { getTestEmails, clearTestEmails } from '../services/emailService'

const EmailViewer = () => {
  const [emails, setEmails] = useState<any[]>([])
  const [selectedEmail, setSelectedEmail] = useState<any>(null)

  useEffect(() => {
    loadEmails()
  }, [])

  const loadEmails = () => {
    setEmails(getTestEmails().reverse())
  }

  const handleClear = () => {
    clearTestEmails()
    setEmails([])
    setSelectedEmail(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Email Test Viewer</h1>
          <p className="text-slate-600 mt-2">Development mode - Emails are logged here instead of being sent</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadEmails}
            className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {emails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Mail className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No test emails yet. Try booking, cancelling, or rescheduling an appointment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-slate-800">Inbox ({emails.length})</h2>
              </div>
              <div className="divide-y">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 ${
                      selectedEmail === email ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="font-medium text-slate-900 text-sm truncate">{email.subject}</div>
                    <div className="text-xs text-slate-600 mt-1">To: {email.to}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(email.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedEmail ? (
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-slate-900">{selectedEmail.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">To: {selectedEmail.to}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedEmail.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-4">
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Select an email to view its content</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> In production, emails will be sent via your configured Gmail SMTP.
          This viewer is for development testing only.
        </p>
      </div>
    </div>
  )
}

export default EmailViewer