'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { 
  CreditCard, 
  Smartphone, 
  MapPin, 
  User, 
  Mail, 
  Phone,
  ArrowLeft,
  Lock,
  Leaf,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ShippingInfo {
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
}

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping')
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'paypal'>('phonepe')
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pincode: profile?.pincode || ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/cart')
      toast.error('Please log in to checkout')
      return
    }

    if (items.length === 0) {
      router.push('/cart')
      toast.error('Your cart is empty')
      return
    }
  }, [user, items, router])

  useEffect(() => {
    if (profile) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: profile.full_name || '',
        email: user?.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || ''
      }))
    }
  }, [profile, user])

  const subtotal = getCartTotal()
  const shipping = subtotal >= 999 ? 0 : 99
  const total = subtotal + shipping

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode']
    const missingFields = requiredFields.filter(field => !shippingInfo[field as keyof ShippingInfo])
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(shippingInfo.phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return
    }

    // Validate pincode
    const pincodeRegex = /^\d{6}$/
    if (!pincodeRegex.test(shippingInfo.pincode)) {
      toast.error('Please enter a valid 6-digit pincode')
      return
    }

    setStep('payment')
  }

  const createOrder = async () => {
    try {
      setLoading(true)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          total_amount: total,
          payment_method: paymentMethod,
          shipping_address: shippingInfo.address,
          shipping_city: shippingInfo.city,
          shipping_state: shippingInfo.state,
          shipping_pincode: shippingInfo.pincode,
          phone: shippingInfo.phone,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single()

      if (orderError) {
        throw new Error('Failed to create order')
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw new Error('Failed to create order items')
      }

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.product.stock_quantity - item.quantity 
          })
          .eq('id', item.product_id)

        if (stockError) {
          console.error('Failed to update stock for product:', item.product_id)
        }
      }

      // Update user profile with shipping info
      await supabase
        .from('profiles')
        .update({
          full_name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          pincode: shippingInfo.pincode
        })
        .eq('id', user!.id)

      // Clear cart
      await clearCart()

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          status: 'confirmed'
        })
        .eq('id', order.id)

      setStep('confirmation')
      toast.success('Order placed successfully!')

    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (paymentMethod === 'phonepe') {
      toast.info('Redirecting to PhonePe...')
      // In a real app, you would integrate with PhonePe API here
      await createOrder()
    } else if (paymentMethod === 'paypal') {
      toast.info('Redirecting to PayPal...')
      // In a real app, you would integrate with PayPal API here
      await createOrder()
    }
  }

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {step !== 'confirmation' && (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-green-600 hover:text-green-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step === 'shipping' || step === 'payment' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' || step === 'payment' || step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Shipping</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step === 'payment' || step === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step === 'payment' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' || step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step === 'confirmation' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={shippingInfo.fullName}
                          onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        value={shippingInfo.address}
                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                        rows={3}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="House/Flat no, Building, Street, Area"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.pincode}
                        onChange={(e) => setShippingInfo({...shippingInfo, pincode: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="6-digit pincode"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>
                
                <div className="space-y-4 mb-6">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'phonepe' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('phonepe')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        value="phonepe"
                        checked={paymentMethod === 'phonepe'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'phonepe')}
                        className="mr-3"
                      />
                      <Smartphone className="w-6 h-6 text-purple-600 mr-3" />
                      <div>
                        <h3 className="font-semibold">PhonePe UPI</h3>
                        <p className="text-sm text-gray-600">Pay securely using UPI</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      paymentMethod === 'paypal' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value as 'paypal')}
                        className="mr-3"
                      />
                      <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-semibold">PayPal</h3>
                        <p className="text-sm text-gray-600">Pay with PayPal or credit card</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                  <Lock className="w-4 h-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setStep('shipping')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Shipping
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for your purchase. Your order has been successfully placed and you will receive a confirmation email shortly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/orders')}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-6 h-6 text-white opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold text-green-600">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}