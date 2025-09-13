import { Calendar, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-6 w-6" />
              <span className="text-lg font-bold">Spa Booking</span>
            </div>
            <p className="text-slate-300">Your relaxation journey starts here</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span className="text-slate-300">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="text-slate-300">info@spabooking.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-slate-300">123 Wellness St, Spa City</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Hours</h3>
            <div className="text-slate-300 space-y-1">
              <p>Monday - Friday: 9AM - 8PM</p>
              <p>Saturday: 9AM - 6PM</p>
              <p>Sunday: 10AM - 5PM</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
          <p>&copy; 2025 Spa Booking. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer