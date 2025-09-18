import { Flower2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Heart, Leaf, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-sage-400 via-gold-400 to-rose-400"></div>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sage-600 rounded-full mix-blend-overlay filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-600 rounded-full mix-blend-overlay filter blur-3xl opacity-5"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-spa-400 rounded-full blur-md opacity-50"></div>
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 p-2.5 rounded-full backdrop-blur-sm">
                  <Flower2 className="h-10 w-10 text-gold-400" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-light">Serenity</span>
                <span className="text-xs block text-stone-400">SPA & WELLNESS</span>
              </div>
            </div>
            <p className="text-stone-400 leading-relaxed mb-6">
              Your sanctuary for holistic wellness and rejuvenation. Experience luxury spa treatments in a tranquil environment.
            </p>
            {/* Social Icons */}
            <div className="flex space-x-3">
              <a href="#" className="bg-white/10 hover:bg-sage-600/30 p-2.5 rounded-full transition-all duration-300 hover:scale-110">
                <Facebook className="h-4 w-4 text-gold-400" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-sage-600/30 p-2.5 rounded-full transition-all duration-300 hover:scale-110">
                <Instagram className="h-4 w-4 text-gold-400" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-sage-600/30 p-2.5 rounded-full transition-all duration-300 hover:scale-110">
                <Twitter className="h-4 w-4 text-gold-400" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold-400 font-light text-lg mb-6 flex items-center">
              <Leaf className="h-4 w-4 mr-2" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/services" className="text-stone-400 hover:text-gold-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-sage-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-stone-400 hover:text-gold-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-sage-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Book Appointment
                </Link>
              </li>
              <li>
                <a href="#" className="text-stone-400 hover:text-gold-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-sage-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Gift Cards
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-400 hover:text-gold-400 transition-colors duration-200 flex items-center group">
                  <span className="w-1 h-1 bg-sage-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  About Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gold-400 font-light text-lg mb-6 flex items-center">
              <Heart className="h-4 w-4 mr-2" />
              Get in Touch
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-sage-600/20 transition-colors duration-200">
                  <Phone className="h-4 w-4 text-sage-400" />
                </div>
                <div>
                  <p className="text-stone-300 font-light">(555) 123-4567</p>
                  <p className="text-stone-500 text-sm">Mon-Fri 9AM-8PM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-sage-600/20 transition-colors duration-200">
                  <Mail className="h-4 w-4 text-sage-400" />
                </div>
                <div>
                  <p className="text-stone-300 font-light">hello@serenity.spa</p>
                  <p className="text-stone-500 text-sm">24/7 Online Support</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 group">
                <div className="bg-white/5 p-2 rounded-lg group-hover:bg-sage-600/20 transition-colors duration-200">
                  <MapPin className="h-4 w-4 text-sage-400" />
                </div>
                <div>
                  <p className="text-stone-300 font-light">123 Wellness Street</p>
                  <p className="text-stone-500 text-sm">Spa City, SC 12345</p>
                </div>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-gold-400 font-light text-lg mb-6 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Spa Hours
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-stone-700/50">
                <span className="text-stone-400">Monday - Friday</span>
                <span className="text-stone-300 font-light">9AM - 8PM</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-700/50">
                <span className="text-stone-400">Saturday</span>
                <span className="text-stone-300 font-light">9AM - 6PM</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-stone-700/50">
                <span className="text-stone-400">Sunday</span>
                <span className="text-stone-300 font-light">10AM - 5PM</span>
              </div>
            </div>
            <div className="mt-6 p-3 bg-gradient-to-r from-sage-600/20 to-spa-600/20 rounded-lg border border-sage-600/30">
              <p className="text-sm text-gold-400">Holiday hours may vary</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-stone-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-stone-500 text-sm">
              &copy; 2025 Serenity Spa & Wellness. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-stone-500 hover:text-gold-400 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-stone-500 hover:text-gold-400 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#" className="text-stone-500 hover:text-gold-400 transition-colors duration-200">
                Cancellation Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer