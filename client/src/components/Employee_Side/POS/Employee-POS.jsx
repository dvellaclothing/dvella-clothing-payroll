
import { useState } from "react"
import Header from "../../Main/Header"

const posIcon = "/images/payroll.png"
const searchIcon = "/images/search.png"

export default function EmployeePOS({ pageLayout, currentUser }) {
    const [cart, setCart] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    
    // Sample products - replace with actual data from API
    const products = [
        { id: 1, name: 'Product A', price: 150, stock: 10 },
        { id: 2, name: 'Product B', price: 250, stock: 5 },
        { id: 3, name: 'Product C', price: 350, stock: 8 },
        { id: 4, name: 'Product D', price: 450, stock: 15 },
        { id: 5, name: 'Product E', price: 200, stock: 12 },
        { id: 6, name: 'Product F', price: 300, stock: 7 },
    ]

    const addToCart = (product) => {
        if (product.stock === 0) {
            alert('Product is out of stock')
            return
        }
        
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
            if (existing.quantity >= product.stock) {
                alert('Cannot add more than available stock')
                return
            }
            setCart(cart.map(item => 
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { ...product, quantity: 1 }])
        }
    }

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId))
    }

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId)
        } else {
            const product = products.find(p => p.id === productId)
            if (quantity > product.stock) {
                alert('Cannot exceed available stock')
                return
            }
            setCart(cart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            ))
        }
    }

    const getTotalAmount = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    }

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Cart is empty')
            return
        }
        
        // Calculate totals
        const subtotal = getTotalAmount()
        const tax = subtotal * 0.12 // 12% tax
        const total = subtotal + tax
        
        const confirmMessage = `
            Subtotal: ₱${subtotal.toLocaleString()}
            Tax (12%): ₱${tax.toLocaleString()}
            Total: ₱${total.toLocaleString()}
            
            Proceed with checkout?
        `
        
        if (confirm(confirmMessage)) {
            // TODO: Implement actual checkout logic with API
            alert('Transaction successful!')
            setCart([])
        }
    }

    const clearCart = () => {
        if (cart.length > 0 && confirm('Clear all items from cart?')) {
            setCart([])
        }
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Sales / POS" pageDescription="Process sales transactions" currentUser={currentUser} />
            
            <div className="flex flex-col lg:flex-row items-start justify-start h-9/10 w-full p-5 gap-5 overflow-hidden">
                {/* Products Section */}
                <div className="flex flex-col w-full lg:w-2/3 h-full gap-4 overflow-y-scroll">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-[rgba(0,0,0,0.2)] rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-black"
                        />
                        <img src={searchIcon} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-auto" alt="Search" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                            <div 
                                key={product.id} 
                                className={`flex flex-col bg-white rounded-lg border border-[rgba(0,0,0,0.2)] p-4 gap-3 hover:shadow-md transition ${product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                onClick={() => addToCart(product)}
                            >
                                <div className="h-32 bg-gray-200 rounded-lg flex items-center justify-center relative">
                                    <p className="text-gray-400">Image</p>
                                    {product.stock === 0 && (
                                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">OUT OF STOCK</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-xl font-bold text-green-600">₱{product.price.toLocaleString()}</p>
                                    <p className={`text-xs ${product.stock < 5 && product.stock > 0 ? 'text-orange-600 font-medium' : 'text-[rgba(0,0,0,0.6)]'}`}>
                                        Stock: {product.stock}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="flex flex-col w-full lg:w-1/3 h-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-4">
                    <div className="flex flex-row items-center justify-between border-b border-[rgba(0,0,0,0.1)] pb-3">
                        <div className="flex flex-row items-center gap-2">
                            <img src={posIcon} className="h-6 w-auto" alt="Cart" />
                            <h2 className="text-lg font-medium">Cart ({cart.length})</h2>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <p className="text-4xl mb-2">🛒</p>
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex flex-row items-center justify-between p-3 border border-[rgba(0,0,0,0.1)] rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{item.name}</p>
                                        <p className="text-sm text-[rgba(0,0,0,0.6)]">₱{item.price.toLocaleString()}</p>
                                        <p className="text-xs text-[rgba(0,0,0,0.5)]">
                                            Subtotal: ₱{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateQuantity(item.id, item.quantity - 1)
                                            }}
                                            className="h-7 w-7 border border-[rgba(0,0,0,0.2)] rounded flex items-center justify-center hover:bg-gray-100 font-medium"
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateQuantity(item.id, item.quantity + 1)
                                            }}
                                            className="h-7 w-7 border border-[rgba(0,0,0,0.2)] rounded flex items-center justify-center hover:bg-gray-100 font-medium"
                                        >
                                            +
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFromCart(item.id)
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700 text-xl font-bold w-7 h-7 flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-[rgba(0,0,0,0.1)] pt-4 space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[rgba(0,0,0,0.6)]">Subtotal:</span>
                                <span className="font-medium">₱{getTotalAmount().toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[rgba(0,0,0,0.6)]">Tax (12%):</span>
                                <span className="font-medium">₱{(getTotalAmount() * 0.12).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-[rgba(0,0,0,0.1)]">
                                <span className="text-lg font-medium">Total:</span>
                                <span className="text-2xl font-bold text-green-600">
                                    ₱{(getTotalAmount() + (getTotalAmount() * 0.12)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}