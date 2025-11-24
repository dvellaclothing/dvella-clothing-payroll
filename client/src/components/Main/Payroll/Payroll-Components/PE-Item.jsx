import { useState } from "react"
import { API_URL } from "../../../../config"
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const documentIcon = "/images/document.png"

export default function PEItem({ employee, periodId }) {
    const [generating, setGenerating] = useState(false)

    const generatePayslipPDF = (payslipData) => {
        const doc = new jsPDF()
        
        // Format currency helper
        const formatCurrency = (value) => {
            return `PHP ${parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
        
        // Header background
        doc.setFillColor(0, 0, 0)
        doc.rect(0, 0, 210, 45, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(26)
        doc.setFont(undefined, 'bold')
        doc.text('D.VELLA', 105, 20, { align: 'center' })
        
        doc.setFontSize(11)
        doc.setFont(undefined, 'normal')
        doc.text('Payroll Management System', 105, 29, { align: 'center' })
        doc.setFontSize(9)
        doc.text('Bulacan, Philippines | Tel: +63 123 456 7890', 105, 36, { align: 'center' })
        
        // Payslip Title
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(20)
        doc.setFont(undefined, 'bold')
        doc.text('PAYSLIP', 105, 58, { align: 'center' })
        
        // Period Information
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text(`Period: ${payslipData.period_name}`, 20, 70)
        doc.text(`Pay Date: ${new Date(payslipData.pay_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 76)
        
        // Employee Information Box
        doc.setDrawColor(100, 100, 100)
        doc.setFillColor(245, 245, 245)
        doc.setLineWidth(0.5)
        doc.roundedRect(20, 85, 170, 38, 3, 3, 'FD')
        
        doc.setFontSize(11)
        doc.setFont(undefined, 'bold')
        doc.text('Employee Information', 25, 93)
        
        doc.setFont(undefined, 'normal')
        doc.setFontSize(10)
        
        doc.text('Name:', 25, 102)
        doc.text('Employee ID:', 25, 109)
        doc.text('Position:', 25, 116)
        
        doc.setFont(undefined, 'bold')
        doc.text(`${payslipData.first_name} ${payslipData.last_name}`, 60, 102)
        doc.text(payslipData.employee_id, 60, 109)
        doc.text(payslipData.position || 'N/A', 60, 116)
        
        // Earnings Section
        let currentY = 135
        doc.setFillColor(240, 240, 240)
        doc.rect(20, currentY, 170, 10, 'F')
        doc.setFont(undefined, 'bold')
        doc.setFontSize(12)
        doc.text('EARNINGS', 25, currentY + 7)
        
        const earningsData = [
            ['Hourly Rate', formatCurrency(payslipData.hourly_rate)],
        ]
        
        if (payslipData.bonuses && parseFloat(payslipData.bonuses) > 0) {
            earningsData.push(['Bonuses', formatCurrency(payslipData.bonuses)])
        }
        
        if (payslipData.overtime_amount && parseFloat(payslipData.overtime_amount) > 0) {
            earningsData.push([
                `Overtime (${parseFloat(payslipData.overtime_hours || 0).toFixed(1)} hrs)`, 
                formatCurrency(payslipData.overtime_amount)
            ])
        }
        
        earningsData.push(['', ''])
        earningsData.push([
            { content: 'Gross Pay', styles: { fontStyle: 'bold', fontSize: 10 } }, 
            { content: formatCurrency(payslipData.gross_pay), styles: { fontStyle: 'bold', fontSize: 10 } }
        ])
        
        autoTable(doc, {
            startY: currentY + 12,
            head: [],
            body: earningsData,
            theme: 'plain',
            margin: { left: 20, right: 20 },
            styles: { 
                fontSize: 10, 
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 130 },
                1: { cellWidth: 40, halign: 'right' }
            }
        })
        
        // Deductions Section
        currentY = doc.lastAutoTable.finalY + 10
        
        doc.setFillColor(240, 240, 240)
        doc.rect(20, currentY, 170, 10, 'F')
        doc.setFont(undefined, 'bold')
        doc.setFontSize(12)
        doc.text('DEDUCTIONS', 25, currentY + 7)
        
        const deductionsData = [
            ['Total Deductions', formatCurrency(payslipData.deductions)],
        ]
        
        autoTable(doc, {
            startY: currentY + 12,
            head: [],
            body: deductionsData,
            theme: 'plain',
            margin: { left: 20, right: 20 },
            styles: { 
                fontSize: 10, 
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 130 },
                1: { cellWidth: 40, halign: 'right' }
            }
        })
        
        // Net Pay Section
        currentY = doc.lastAutoTable.finalY + 12
        
        doc.setFillColor(0, 120, 50)
        doc.roundedRect(20, currentY, 170, 18, 2, 2, 'F')
        
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(13)
        doc.setFont(undefined, 'bold')
        doc.text('NET PAY', 25, currentY + 12)
        doc.setFontSize(15)
        doc.text(formatCurrency(payslipData.net_pay), 185, currentY + 12, { align: 'right' })
        
        // Work Hours Info
        currentY = currentY + 28
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.text(`Total Hours Worked: ${parseFloat(payslipData.hours_worked || 0).toFixed(1)} hours`, 20, currentY)
        
        // Footer
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 270, 190, 270)
        
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text('This is a computer-generated payslip and does not require a signature.', 105, 275, { align: 'center' })
        doc.text('For any queries, please contact HR Department.', 105, 280, { align: 'center' })
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 105, 285, { align: 'center' })
        
        // Save PDF
        doc.save(`Payslip_${payslipData.employee_id}_${payslipData.period_name.replace(/\s+/g, '_')}.pdf`)
    }

    const handleGeneratePayslip = async () => {
        setGenerating(true)
        try {
            const response = await fetch(
                `${API_URL}/api/payroll/generate-payslip/${employee.user_id}/${periodId}`,
                { method: 'POST' }
            )
            
            if (!response.ok) {
                throw new Error('Failed to generate payslip')
            }
            
            const data = await response.json()
            
            // Generate PDF
            generatePayslipPDF(data)
            
        } catch (error) {
            console.error('Error generating payslip:', error)
            alert('Failed to generate payslip')
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="grid grid-cols-7 gap-4 w-full border-t border-[rgba(0,0,0,0.1)] items-center justify-center h-10 px-2">
            <p className="col-span-1 font-normal text-sm">
                {employee.first_name} {employee.last_name}
            </p>
            <p className="col-span-1 font-normal text-sm">
                ₱{parseFloat(employee.hourly_rate || 0).toLocaleString()}
            </p>
            <p className="col-span-1 font-normal text-sm">
                {parseFloat(employee.hours_worked || 0).toFixed(1)}
            </p>
            <p className="col-span-1 font-normal text-sm">
                ₱{parseFloat(employee.deductions || 0).toLocaleString()}
            </p>
            <p className="col-span-1 font-normal text-sm">
                ₱{parseFloat(employee.overtime_amount || 0).toLocaleString()}
            </p>
            <p className="col-span-1 font-normal text-sm">
                ₱{parseFloat(employee.net_pay || 0).toLocaleString()}
            </p>
            <div className="col-span-1 flex items-center justify-center w-full h-full py-1 px-5">
                <button 
                    onClick={handleGeneratePayslip}
                    disabled={generating}
                    className="h-full w-full flex flex-row items-center justify-center gap-1 border border-[rgba(0,0,0,0.2)] rounded-md font-medium text-sm cursor-pointer hover:invert transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                    <img src={documentIcon} alt="" className="h-5 w-auto" />
                    {generating ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </div>
    )
}