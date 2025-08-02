'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  Leaf, 
  Award, 
  ArrowRight,
  Users,
  Heart,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .eq('is_active', true)
          .limit(6),
        supabase
          .from('categories')
          .select('*')
          .limit(6)
      ])

      if (productsResponse.data) {
        setFeaturedProducts(productsResponse.data)
      }

      if (categoriesResponse.data) {
        setCategories(categoriesResponse.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId)
  }

  const benefits = [
    {
      icon: Leaf,
      title: '100% Organic Certified',
      description: 'All our products are certified organic and free from harmful chemicals.'
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'Free shipping on orders above ₹999 across India.'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: '30-day money-back guarantee if you are not satisfied.'
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Handpicked products from the finest organic farms.'
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      rating: 5,
      comment: 'Amazing quality organic products! My family loves the fresh fruits and vegetables.',
      location: 'Mumbai'
    },
    {
      name: 'Rajesh Kumar',
      rating: 5,
      comment: 'Great service and the skincare products are fantastic. Highly recommended!',
      location: 'Delhi'
    },
    {
      name: 'Anita Patel',
      rating: 5,
      comment: 'Love the quinoa and organic grains. Perfect for my healthy lifestyle.',
      location: 'Bangalore'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Pure <span className="text-green-600">Organic</span> Products for a Healthier Life
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Discover the finest collection of certified organic products - from farm-fresh produce 
                to natural skincare. Nourish your body and protect the planet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                >
                  Shop Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center px-8 py-4 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Leaf className="w-24 h-24 mx-auto mb-4 opacity-80" />
                    <p className="text-xl font-semibold">Premium Organic Products</p>
                  </div>
                </div>
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="font-semibold">Certified Organic</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-green-500" />
                  <span className="font-semibold">10k+ Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600">
              Explore our wide range of organic product categories
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <Leaf className="w-16 h-16 text-white opacity-80" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600">
              Handpicked organic favorites loved by our customers
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="relative">
                    <div className="h-64 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                      <Leaf className="w-16 h-16 text-white opacity-80" />
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-green-50 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-gray-600 hover:text-green-600" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        ({product.rating_count})
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          ₹{product.price}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          / {product.weight}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied customers who trust Organic Oasis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-md">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < testimonial.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.comment}"
                </p>
                
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Your Organic Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join our community and discover the power of organic living
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start Shopping
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
