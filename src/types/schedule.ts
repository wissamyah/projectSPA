export interface Booking {
  id: string
  booking_date: string
  booking_time: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  status: string
  service: any
  staff: any
  staff_id?: string
}

export interface Staff {
  id: string
  name: string
  email: string
}

export interface Service {
  name: string
  duration: number
  price: number
}