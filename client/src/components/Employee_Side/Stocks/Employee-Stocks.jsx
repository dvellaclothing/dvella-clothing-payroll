
import { useState, useEffect } from "react"
import { API_URL } from "../../../config"
import Header from "../../Main/Header"

const stockIcon = "/images/forecasting.png"
const searchIcon = "/images/search.png"

export default function EmployeeStocks({ pageLayout, currentUser }) {
    const [stocks, setStocks] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, low, out

    useEffect(() => {
        fetchStocks()
    }, [])

    const fetchStocks = async () => {
        try {
            // Replace with actual API endpoint
            const response = await fetch(`${API_URL}/api/stocks`)
            const data = await response.json()
            if (Array.isArray(data)) {
                setStocks(data)
            }
        } catch (error) {
            console.error('Error fetching stocks:', error)
            // Sample data for demonstration
            setStocks([
                { id: 1, name: 'Product A', sku: 'SKU001', quantity: 150, min_quantity: 50, category: 'Electronics' },
                { id: 2, name: 'Product B', sku: 'SKU002', quantity: 25, min_quantity: 50, category: 'Accessories' },
                { id: 3, name: 'Product C', sku: 'SKU003', quantity: 0, min_quantity: 30, category: 'Electronics' },
                { id: 4, name: 'Product D', sku: 'SKU004', quantity: 200, min_quantity: 100, category: 'Office' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const getStockStatus = (quantity, minQuantity) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
        if (quantity < minQuantity) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
        return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
    }

    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            stock.sku.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (filter === 'low') return matchesSearch && stock.quantity < stock.min_quantity && stock.quantity > 0
        if (filter === 'out') return matchesSearch && stock.quantity === 0
        return matchesSearch
    })

    const stockSummary = {
        total: stocks.length,
        inStock: stocks.filter(s => s.quantity >= s.min_quantity).length,
        lowStock: stocks.filter(s => s.quantity < s.min_quantity && s.quantity > 0).length,
        outOfStock: stocks.filter(s => s.quantity === 0).length
    }

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Stocks" pageDescription="View inventory levels" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <div className="flex flex-col items-start justify-between h-28 bg-white rounded-lg border border-[rgba(0,0,0,0.2)] p-4">
                        <p className="text-xs text-[rgba(0,0,0,0.6)]">Total Items</p>
                        <p className="text-3xl font-bold">{stockSummary.total}</p>
                    </div>
                    <div className="flex flex-col items-start justify-between h-28 bg-green-50 rounded-lg border border-green-200 p-4">
                        <p className="text-xs text-green-600">In Stock</p>
                        <p className="text-3xl font-bold text-green-600">{stockSummary.inStock}</p>
                    </div>
                    <div className="flex flex-col items-start justify-between h-28 bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                        <p className="text-xs text-yellow-600">Low Stock</p>
                        <p className="text-3xl font-bold text-yellow-600">{stockSummary.lowStock}</p>
                    </div>
                    <div className="flex flex-col items-start justify-between h-28 bg-red-50 rounded-lg border border-red-200 p-4">
                        <p className="text-xs text-red-600">Out of Stock</p>
                        <p className="text-3xl font-bold text-red-600">{stockSummary.outOfStock}</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row items-center justify-between w-full gap-3">
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-[rgba(0,0,0,0.2)] rounded-lg px-4 py-2 pl-10 focus:outline-none focus:border-black"
                        />
                        <img src={searchIcon} className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-auto" alt="Search" />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilter('low')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'low' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Low Stock
                        </button>
                        <button 
                            onClick={() => setFilter('out')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'out' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            Out of Stock
                        </button>
                    </div>
                </div>

                {/* Stock Table */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium">SKU</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">Product Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">Category</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">Quantity</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">Min. Quantity</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">Loading...</td>
                                    </tr>
                                ) : filteredStocks.length > 0 ? (
                                    filteredStocks.map(stock => {
                                        const status = getStockStatus(stock.quantity, stock.min_quantity)
                                        return (
                                            <tr key={stock.id} className="border-t border-[rgba(0,0,0,0.05)] hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm font-mono">{stock.sku}</td>
                                                <td className="py-3 px-4 text-sm font-medium">{stock.name}</td>
                                                <td className="py-3 px-4 text-sm">{stock.category}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`font-bold ${stock.quantity === 0 ? 'text-red-600' : stock.quantity < stock.min_quantity ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {stock.quantity}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-[rgba(0,0,0,0.6)]">{stock.min_quantity}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8 text-gray-500">No items found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}