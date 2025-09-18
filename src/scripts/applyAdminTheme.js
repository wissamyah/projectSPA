// Script to apply spa theme to admin pages
const adminPages = [
  {
    file: 'AdminCategories',
    icon: 'Tag',
    badge: 'Category Management',
    title: 'Service',
    subtitle: 'Categories',
    description: 'Organize your treatments into elegant collections'
  },
  {
    file: 'AdminArchive',
    icon: 'Archive',
    badge: 'Booking Archive',
    title: 'Historical',
    subtitle: 'Records',
    description: 'Access past bookings and maintain your spa history'
  },
  {
    file: 'StaffSchedule',
    icon: 'CalendarDays',
    badge: 'Public Schedule',
    title: 'Team',
    subtitle: 'Calendar',
    description: 'View your professional availability and appointments'
  }
];

// Template for hero section
const heroTemplate = (config) => `
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 bg-gradient-to-r from-sage-50 via-spa-50 to-rose-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-sage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gold-300 mb-6">
            <${config.icon} className="h-4 w-4 text-gold-500 mr-2" />
            <span className="text-sm font-medium text-stone-700">${config.badge}</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-light text-stone-800 mb-6">
            ${config.title}
            <span className="block text-4xl md:text-5xl font-normal text-transparent bg-clip-text bg-gradient-to-r from-sage-600 to-spa-600 mt-2">
              ${config.subtitle}
            </span>
          </h1>

          <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed">
            ${config.description}
          </p>
        </div>
      </section>
`;

// Color replacements
const colorReplacements = {
  'bg-slate-': 'bg-stone-',
  'text-slate-': 'text-stone-',
  'border-slate-': 'border-stone-',
  'hover:bg-slate-': 'hover:bg-stone-',
  'hover:text-slate-': 'hover:text-stone-',
  'from-slate-': 'from-stone-',
  'to-slate-': 'to-stone-',
  'bg-gray-': 'bg-stone-',
  'text-gray-': 'text-stone-',
  'border-gray-': 'border-stone-',
  'bg-blue-500': 'bg-gradient-to-r from-spa-600 to-spa-700',
  'bg-green-500': 'bg-gradient-to-r from-sage-600 to-sage-700',
  'bg-red-500': 'bg-gradient-to-r from-rose-500 to-rose-600',
  'bg-yellow-500': 'bg-gradient-to-r from-gold-500 to-amber-500',
  'bg-purple-500': 'bg-gradient-to-r from-spa-600 to-sage-600',
  'rounded-lg': 'rounded-2xl',
  'rounded-md': 'rounded-xl',
  'shadow-md': 'shadow-xl',
  'font-semibold': 'font-light',
  'font-bold': 'font-normal'
};

console.log('Spa theme configuration ready for admin pages');
console.log('Apply these updates to each admin page:', adminPages);