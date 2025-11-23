import { useEffect, useState } from "react"

import Header from "../Header"
import CardOne from "./Dashboard-Components/Card1"
import { API_URL } from "../../../config"

const upIcon = "/images/up.png"
const downIcon = "/images/down.png"

export default function DashboardPage({ pageLayout, currentUser }) {
    const [totalEmployees, setTotalEmployees] = useState(0)
    const [addedThisMonth, setAddedThisMonth] = useState(0)
    const [percentageChange, setPercentageChange] = useState(0)

    const [monthlyPayroll, setMonthlyPayroll] = useState(0)
    const [payrollChange, setPayrollChange] = useState(0)
    const [payrollPercentage, setPayrollPercentage] = useState(0)

    const [avgKPIScore, setAvgKPIScore] = useState(0)
    const [kpiChange, setKpiChange] = useState(0)
    const [kpiPercentage, setKpiPercentage] = useState(0)

    const [growthForecast, setGrowthForecast] = useState(0)
    const [forecastConfidence, setForecastConfidence] = useState(0)
    const [forecastPeriod, setForecastPeriod] = useState("Q1 2025")
    
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTotalEmployees()
        fetchMonthlyPayroll()
        fetchAvgKPIScores()
    }, [])

    const fetchTotalEmployees = async () => {
        try {
            const response = await fetch(`${API_URL}/api/get-total-employees`)
            const result = await response.json()
            const total = result.totalEmployees
            const added = result.addedThisMonth
            const lastMonthTotalEmployees = total - added
            const addedEmployeesPercentage = lastMonthTotalEmployees > 0 ? ((added / lastMonthTotalEmployees) * 100).toFixed(1) : 0
            setTotalEmployees(total)
            setAddedThisMonth(added)
            setPercentageChange(addedEmployeesPercentage)
            setLoading(false)
        } catch (err) {
            console.error('Error fetching employees: ', err)
            setLoading(false)
        }
    }

    const fetchMonthlyPayroll = async () => {
        try {
            const response = await fetch(`${API_URL}/api/get-monthly-payroll`)
            const result = await response.json()
            const current = result.currentMonth
            const last = result.lastMonth
            const change = current - last
            const percentage = last > 0 ? ((change / last) * 100).toFixed(1) : 0
            setMonthlyPayroll(current)
            setPayrollChange(change)
            setPayrollPercentage(percentage)
        } catch (err) {
            console.error("Error fetching payroll: ", err)
        }
    }

    const fetchAvgKPIScores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/get-avg-kpi-score`)
            const result = await response.json()
            const current = result.currentMonth
            const last = result.lastMonth
            const change = current - last
            const percentage = last > 0 ? ((change / last) * 100).toFixed(1) : 0
            setAvgKPIScore(current)
            setKpiChange(change)
            setKpiPercentage(percentage)
        } catch (err) {
            console.error("Error fetching KPI Scores: ", err)
        }
    }

    const fetchGrowthForecast = async () => {
        try {
            const response = await fetch(`${API_URL}/api/get-growth-forecast`)
            const result = await response.json()
            setGrowthForecast(result.predictedValue)
            setForecastConfidence(result.confidence)
            setForecastPeriod(result.period)
        } catch (err) {
            console.error("Error fetching growth forecast: ", err)
        }
    }

    return(
        <>
            <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
                <Header pageLayout={pageLayout} pageTitle="Dashboard" pageDescription="Overview and key metrics" currentUser={currentUser} />
                <div className="flex flex-col items-center justify-start h-9/10 w-full py-5 pl-1 xl:p-5 gap-5 overflow-y-scroll">
                    <div className="flex flex-col items-start justify-start w-full h-auto">
                        <h2 className="text-md font-medium">Good morning, {currentUser.first_name}</h2>
                        <p className="font-sans text-sm text-[rgba(0,0,0,0.6)]">Here's what's happening at your company today</p>
                    </div>
                    <CardOne
                        cardTitle="Total Employees"
                        cardValue={loading ? "..." : totalEmployees}
                        cardImage={upIcon}
                        changes={loading ? "..." : `+${addedThisMonth}`}
                        cardDescription={loading ? "..." : `+${percentageChange}% from last month`}
                    />
                    <CardOne
                        cardTitle="Monthly Payroll"
                        cardValue={loading ? "..." : `₱${monthlyPayroll}`}
                        cardImage={payrollPercentage >= 0 ? upIcon : downIcon}
                        changes={loading ? "..." : `${payrollPercentage >= 0 ? '+' : '-'}${payrollPercentage}%`}
                        cardDescription="On schedule for UNDEFINED"
                    />
                    <CardOne
                        cardTitle="Avg KPI Score"
                        cardValue={loading ? "..." : `${avgKPIScore.toFixed(1)}%`}
                        cardImage={kpiPercentage >= 0 ? upIcon : downIcon}
                        changes={loading ? "..." : `${kpiPercentage >= 0 ? '+' : ''}${kpiPercentage}%`}
                        cardDescription={loading ? "..." : avgKPIScore >= 85 ? "Above target of 85%" : "Below target of 85%"}
                    />
                    <CardOne
                        cardTitle="Growth Forecast"
                        cardValue={loading ? "..." : `${growthForecast}%`}
                        cardImage=""
                        changes={forecastPeriod}
                        cardDescription={loading ? "..." : `ML prediction confidence: ${forecastConfidence}%`}
                    />
                </div>
            </div>
        </>
    )
}