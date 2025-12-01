import { useEffect, useState, useCallback } from "react";
import Header from "../Header";
import CardOne from "./Dashboard-Components/Card1";
import CardTwo from "./Dashboard-Components/Card2";
import CardThree from "./Dashboard-Components/Card3";
import { API_URL } from "../../../config";

const upIcon = "/images/up.png";
const downIcon = "/images/down.png";

// Initial state for cleaner component
const initialState = {
  employees: {
    total: 0,
    addedThisMonth: 0,
    percentageChange: 0
  },
  payroll: {
    current: 0,
    change: 0,
    percentage: 0
  },
  kpi: {
    score: 0,
    change: 0,
    percentage: 0
  },
  recentActivities: [],
  upcomingPayroll: {
    period: {
      period_name: "Loading...",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      pay_date: new Date().toISOString().split('T')[0],
      employee_count: 0,
      estimated_amount: 0,
      status: "open"
    }
  }
};

export default function DashboardPage({ pageLayout, currentUser }) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        employeesRes,
        payrollRes,
        kpiRes,
        activitiesRes,
        payrollDataRes
      ] = await Promise.all([
        fetchTotalEmployees(),
        fetchMonthlyPayroll(),
        fetchAvgKPIScores(),
        fetchRecentActivities(),
        fetchUpcomingPayroll()
      ]);

      setState(prev => ({
        ...prev,
        employees: employeesRes,
        payroll: payrollRes,
        kpi: kpiRes,
        recentActivities: activitiesRes,
        upcomingPayroll: payrollDataRes
      }));
    } catch (err) {
      console.error("Error in fetchData:", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchTotalEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-total-employees`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const result = await response.json();
      const total = result.totalEmployees || 0;
      const added = result.addedThisMonth || 0;
      const lastMonthTotal = Math.max(0, total - added);
      const addedPercentage = lastMonthTotal > 0 
        ? ((added / lastMonthTotal) * 100).toFixed(1) 
        : 0;

      return {
        total,
        addedThisMonth: added,
        percentageChange: parseFloat(addedPercentage)
      };
    } catch (err) {
      console.error('Error in fetchTotalEmployees:', err);
      throw err;
    }
  };

  const fetchMonthlyPayroll = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-monthly-payroll`);
      if (!response.ok) throw new Error('Failed to fetch payroll');
      
      const result = await response.json();
      const current = parseFloat(result.currentMonth) || 0;
      const last = parseFloat(result.lastMonth) || 0;
      const change = current - last;
      const percentage = last > 0 ? ((change / last) * 100).toFixed(1) : 0;

      return {
        current,
        change,
        percentage: parseFloat(percentage)
      };
    } catch (err) {
      console.error("Error in fetchMonthlyPayroll:", err);
      throw err;
    }
  };

  const fetchAvgKPIScores = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-avg-kpi-score`);
      if (!response.ok) throw new Error('Failed to fetch KPI scores');
      
      const result = await response.json();
      const current = parseFloat(result.currentMonth) || 0;
      const last = parseFloat(result.lastMonth) || 0;
      const change = current - last;
      const percentage = last > 0 ? ((change / last) * 100).toFixed(1) : 0;

      return {
        score: current,
        change,
        percentage: parseFloat(percentage)
      };
    } catch (err) {
      console.error("Error in fetchAvgKPIScores:", err);
      throw err;
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-recent-activities`);
      if (!response.ok) throw new Error('Failed to fetch recent activities');
      
      const result = await response.json();
      return Array.isArray(result.activities) ? result.activities : [];
    } catch (err) {
      console.error("Error in fetchRecentActivities:", err);
      return [];
    }
  };

  const fetchUpcomingPayroll = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get-upcoming-payroll`);
      if (!response.ok) throw new Error('Failed to fetch upcoming payroll');
      
      const result = await response.json();
      
      return {
        period: {
          period_name: result.period_name || "Current Pay Period",
          start_date: result.start_date || new Date().toISOString().split('T')[0],
          end_date: result.end_date || new Date().toISOString().split('T')[0],
          pay_date: result.pay_date || new Date().toISOString().split('T')[0],
          employee_count: result.employee_count || result.employeeCount || 0,
          estimated_amount: parseFloat(result.estimated_amount || result.amount || 0),
          status: result.status || "open"
        }
      };
    } catch (err) {
      console.error("Error in fetchUpcomingPayroll:", err);
      return initialState.upcomingPayroll;
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchData();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    employees,
    payroll,
    kpi,
    recentActivities,
    upcomingPayroll
  } = state;

  return (
    <div className={`${pageLayout ? 'col-span-5' : 'col-span-17 xl:col-start-2'} col-start-2 flex flex-col w-full min-h-full`}>
      <Header 
        pageLayout={pageLayout} 
        pageTitle="Dashboard" 
        pageDescription="Overview and key metrics" 
        currentUser={currentUser} 
      />
      
      <div className="flex flex-col items-center justify-start h-9/10 w-full py-5 pl-1 xl:p-5 gap-5 overflow-y-auto">
        <div className="flex flex-col items-start justify-start w-full h-auto">
          <h2 className="text-md font-medium">Good morning, {currentUser?.first_name || 'User'}</h2>
          <p className="font-sans text-sm text-gray-500">Here's what's happening at your company today</p>
        </div>
        
        {/* Metrics Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardOne
            loading={loading}
            cardTitle="Total Employees"
            cardValue={employees.total.toString()}
            cardImage={upIcon}
            changes={`+${employees.addedThisMonth}`}
            cardDescription={`+${employees.percentageChange}% from last month`}
          />
          
          <CardOne
            loading={loading}
            cardTitle="Monthly Payroll"
            cardValue={`₱${payroll.current.toLocaleString()}`}
            cardImage={payroll.percentage >= 0 ? upIcon : downIcon}
            changes={`${payroll.percentage >= 0 ? '+' : ''}${payroll.percentage}%`}
            cardDescription={`${payroll.percentage >= 0 ? 'Increase' : 'Decrease'} from last month`}
          />
          
          <CardOne
            loading={loading}
            cardTitle="Avg KPI Score"
            cardValue={`${kpi.score.toFixed(1)}%`}
            cardImage={kpi.percentage >= 0 ? upIcon : downIcon}
            changes={`${kpi.percentage >= 0 ? '+' : ''}${kpi.percentage}%`}
            cardDescription={kpi.score >= 85 ? "Above target of 85%" : "Below target of 85%"}
          />
        </div>
        
        {/* Activity and Payroll Panels */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardTwo 
            activities={recentActivities} 
            loading={loading} 
          />
          <CardThree 
            payroll={upcomingPayroll} 
            loading={loading} 
          />
        </div>
      </div>
    </div>
  );
}