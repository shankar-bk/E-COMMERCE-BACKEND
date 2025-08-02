'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ShoppingCart, 
  Star, 
  Heart, 
  Leaf,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Shield,
  Truck,
  RotateCcw,
  ArrowLeft,
  Info,
  Award
} from 'lucide-react'
import { toast } from 'react-hot-toast'

type Product = Database['public']['Tables']['products']['Row'] & {
  category: Database['public']['Tables']['categories']['Row']
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'description' | 'nutrition' | 'reviews'>('description')
  
  const { addToCart } = useCart()
  const { user } = useAuth()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        return
      }

      setProduct(data as Product)
      
      // Fetch related products from same category
      if (data?.category_id) {
        const { data: related } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .neq('id', id)
          .limit(4)

        if (related) {
          setRelatedProducts(related as Product[])
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    await addToCart(product.id, quantity)
  }

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please log in to add items to wishlist')
      return
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: product!.id
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Product already in wishlist')
        } else {
          toast.error('Failed to add to wishlist')
        }
        return
      }

      toast.success('Added to wishlist!')
    } catch (error) {
      toast.error('Failed to add to wishlist')
    }
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-200 rounded-lg h-96 animate-pulse"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-8 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-6 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-24 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
            <Link href="/products" className="text-green-600 hover:text-green-700">
              Back to Products
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const features = [
    { icon: Shield, title: 'Quality Guaranteed', desc: '100% Organic Certified' },
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: RotateCcw, title: '30-Day Returns', desc: 'Money back guarantee' },
    { icon: Award, title: 'Premium Quality', desc: 'Farm fresh products' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-green-600">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-green-600">Products</Link>
          <span>/</span>
          <Link href={`/categories/${product.category.name.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-green-600">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>

        {/* Back Button */}
        <Link 
          href="/products"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg mb-4 h-96 flex items-center justify-center">
              <Leaf className="w-24 h-24 text-white opacity-80" />
            </div>
            
            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden ${
                      index === activeImageIndex ? 'ring-2 ring-green-600' : ''
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-white opacity-80" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-green-600 font-medium">{product.category.name}</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  ({product.rating_count} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
              <span className="text-lg text-gray-500 ml-2">/ {product.weight}</span>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-medium">
                  ✓ In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ✗ Out of Stock
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stock_quantity}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
              <button
                onClick={handleAddToWishlist}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-5 h-5 mr-2" />
                Add to Wishlist
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                  <feature.icon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{feature.title}</p>
                    <p className="text-xs text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'description', label: 'Description' },
                { id: 'nutrition', label: 'Nutrition & Ingredients' },
                { id: 'reviews', label: 'Reviews' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {product.nutrition_info && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutritional Information</h3>
                    <p className="text-gray-700">{product.nutrition_info}</p>
                  </div>
                )}
                {product.ingredients && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                    <p className="text-gray-700">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="text-center py-8">
                  <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600">Be the first to review this product!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} href={`/products/${relatedProduct.id}`}>
                  <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-600 rounded-t-lg flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-white opacity-80" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{relatedProduct.name}</h3>
                      <p className="text-green-600 font-bold">₹{relatedProduct.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}