import { Copy } from 'lucide-react'
import { Staff } from '../../../types/schedule'

interface StaffLinksProps {
  staffMembers: Staff[]
  copiedLink: string | null
  copyStaffLink: (staffId: string, staffName: string) => void
}

const StaffLinks = ({ staffMembers, copiedLink, copyStaffLink }: StaffLinksProps) => {
  return (
    <div className="bg-gradient-to-r from-spa-50 to-sage-50 border border-spa-200 rounded-2xl p-4 mb-6 print:hidden">
      <h3 className="font-light text-spa-900 mb-3">Share Individual Schedules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {staffMembers.map(staff => (
          <div
            key={staff.id}
            className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-3 hover:bg-white hover:shadow-md transition-all"
          >
            <span className="font-light text-stone-700">{staff.name}</span>
            <button
              onClick={() => copyStaffLink(staff.id, staff.name)}
              className="flex items-center gap-2 text-spa-600 hover:text-spa-700 transition-colors"
            >
              {copiedLink === staff.id ? (
                <>✓ Copied!</>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StaffLinks