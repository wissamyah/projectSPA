export interface BusinessHours {
  openTime: string // e.g., "09:00"
  closeTime: string // e.g., "18:00"
  slotDuration: number // in minutes (30)
}

// Default business hours
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  openTime: '09:00',
  closeTime: '18:00',
  slotDuration: 30
}

// Get business hours from localStorage or use defaults
export const getBusinessHours = (): BusinessHours => {
  const stored = localStorage.getItem('businessHours')
  return stored ? JSON.parse(stored) : DEFAULT_BUSINESS_HOURS
}

// Save business hours to localStorage
export const saveBusinessHours = (hours: BusinessHours) => {
  localStorage.setItem('businessHours', JSON.stringify(hours))
}

// Generate time slots based on business hours
export const generateTimeSlots = (businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS): string[] => {
  const slots: string[] = []
  const [openHour, openMinute] = businessHours.openTime.split(':').map(Number)
  const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number)
  
  const openTotalMinutes = openHour * 60 + openMinute
  const closeTotalMinutes = closeHour * 60 + closeMinute
  
  for (let minutes = openTotalMinutes; minutes < closeTotalMinutes; minutes += businessHours.slotDuration) {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    slots.push(timeString)
  }
  
  return slots
}

// Check if a slot would extend past closing time
export const isSlotAfterHours = (
  slotTime: string, 
  serviceDuration: number, 
  businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS
): boolean => {
  const [slotHour, slotMinute] = slotTime.split(':').map(Number)
  const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number)
  
  const slotEndMinutes = (slotHour * 60 + slotMinute) + serviceDuration
  const closeMinutes = closeHour * 60 + closeMinute
  
  return slotEndMinutes > closeMinutes
}

// Get the reason why a slot is unavailable
export type SlotUnavailableReason = 'booked' | 'after-hours' | 'insufficient-time' | null

export const getSlotUnavailableReason = (
  slotTime: string,
  serviceDuration: number,
  bookedSlots: string[],
  businessHours: BusinessHours = DEFAULT_BUSINESS_HOURS
): SlotUnavailableReason => {
  // Check if already booked
  if (bookedSlots.includes(slotTime)) {
    return 'booked'
  }
  
  // Check if extends past closing time
  if (isSlotAfterHours(slotTime, serviceDuration, businessHours)) {
    return 'after-hours'
  }
  
  // Check if service duration would overlap with booked slots
  const timeSlots = generateTimeSlots(businessHours)
  const slotIndex = timeSlots.indexOf(slotTime)
  const slotsNeeded = Math.ceil(serviceDuration / businessHours.slotDuration)
  
  for (let i = 1; i < slotsNeeded; i++) {
    if (slotIndex + i >= timeSlots.length) {
      return 'insufficient-time'
    }
    if (bookedSlots.includes(timeSlots[slotIndex + i])) {
      return 'insufficient-time'
    }
  }
  
  return null // Available
}