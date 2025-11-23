// Employee-Help.jsx
import { useState } from "react"
import Header from "../../Main/Header"

const helpIcon = "/images/help.png"
const searchIcon = "/images/search.png"

export default function HelpPage({ pageLayout, currentUser }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    const faqs = [
        {
            category: 'Attendance',
            question: 'How do I check my attendance records?',
            answer: 'Navigate to the Attendance page from the sidebar. You can view your daily attendance, check-in/check-out times, and monthly summary.'
        },
        {
            category: 'Payslips',
            question: 'Where can I view my payslips?',
            answer: 'Go to the Payslips page to view all your payment history. Select a period from the dropdown to see detailed payslip information.'
        },
        {
            category: 'Payslips',
            question: 'Can I print my payslip?',
            answer: 'Printing is disabled for security reasons. You can view your payslip digitally. For official copies, please contact HR.'
        },
        {
            category: 'Profile',
            question: 'How do I update my personal information?',
            answer: 'Visit the Profile page where you can update your contact details, address, and profile picture. Employment information like position and pay grade cannot be changed.'
        },
        {
            category: 'KPI',
            question: 'How is my KPI score calculated?',
            answer: 'Your KPI score is calculated based on multiple weighted metrics set by your manager. Each metric has a target value, and your performance is measured against these targets.'
        },
        {
            category: 'General',
            question: 'How do I change my password?',
            answer: 'Go to Settings > Change Password tab. Enter your current password and your new password twice to confirm the change.'
        },
        {
            category: 'POS',
            question: 'How do I process a sale?',
            answer: 'Navigate to Sales/POS, search for products, add them to the cart, adjust quantities as needed, and click Checkout to complete the transaction.'
        },
        {
            category: 'Stocks',
            question: 'Can I see inventory levels?',
            answer: 'Yes, visit the Stocks page to view all products, their current quantities, and stock status (In Stock, Low Stock, Out of Stock).'
        }
    ]

    const categories = ['all', ...Array.from(new Set(faqs.map(faq => faq.category)))]

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
            <Header pageLayout={pageLayout} pageTitle="Help & Support" pageDescription="Get answers to your questions" currentUser={currentUser} />
            
            <div className="flex flex-col items-center justify-start h-9/10 w-full p-5 gap-5 overflow-y-scroll">
                {/* Search and Filter */}
                <div className="flex flex-col w-full gap-4">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-[rgba(0,0,0,0.2)] rounded-lg px-4 py-3 pl-12 focus:outline-none focus:border-black text-lg"
                        />
                        <img src={searchIcon} className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-auto" alt="Search" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    activeCategory === category 
                                        ? 'bg-black text-white' 
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-3">
                    <h2 className="text-lg font-medium">Quick Links</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <a href="/admin/settings" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition">
                            <p className="text-sm font-medium text-center">Change Password</p>
                        </a>
                        <a href="/admin/attendance" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition">
                            <p className="text-sm font-medium text-center">View Attendance</p>
                        </a>
                        <a href="/admin/payroll" className="flex flex-col items-center justify-center p-4 border border-[rgba(0,0,0,0.1)] rounded-lg hover:bg-gray-50 transition">
                            <p className="text-sm font-medium text-center">View Payslips</p>
                        </a>
                    </div>
                </div>

                {/* FAQs */}
                <div className="flex flex-col w-full bg-white rounded-2xl border border-[rgba(0,0,0,0.2)] p-5 gap-4">
                    <div className="flex flex-row items-center gap-3">
                        <img src={helpIcon} className="h-6 w-auto" alt="Help" />
                        <h2 className="text-lg font-medium">Frequently Asked Questions</h2>
                    </div>

                    {filteredFAQs.length > 0 ? (
                        <div className="space-y-3">
                            {filteredFAQs.map((faq, index) => (
                                <details key={index} className="group border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden">
                                    <summary className="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 transition">
                                        <div>
                                            <span className="text-xs font-medium text-blue-600 mb-1 block">{faq.category}</span>
                                            <span className="font-medium">{faq.question}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-500 transition group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <div className="p-4 pt-0 text-sm text-[rgba(0,0,0,0.7)] border-t border-[rgba(0,0,0,0.05)]">
                                        {faq.answer}
                                    </div>
                                </details>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            No FAQs found matching your search
                        </div>
                    )}
                </div>

                {/* Contact Support */}
                <div className="flex flex-col w-full bg-blue-50 rounded-2xl border border-blue-200 p-5 gap-3">
                    <h2 className="text-lg font-medium text-blue-900">Need More Help?</h2>
                    <p className="text-sm text-blue-800">
                        If you can't find the answer you're looking for, please contact the HR department or your manager for assistance.
                    </p>
                    <div className="flex flex-col md:flex-row gap-3 mt-2">
                        <div className="flex flex-col p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Email Support</p>
                            <p className="font-medium text-sm">dvella.clothing@gmail.com</p>
                        </div>
                        <div className="flex flex-col p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Phone Support</p>
                            <p className="font-medium text-sm">+63 123 456 7890</p>
                        </div>
                        <div className="flex flex-col p-3 bg-white rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">Office Hours</p>
                            <p className="font-medium text-sm">Mon-Fri, 8AM-5PM</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}