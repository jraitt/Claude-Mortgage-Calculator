'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Home, TrendingDown, DollarSign, Calendar, PieChart } from 'lucide-react';

const MortgageCalculator = () => {
  const [inputs, setInputs] = useState({
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    propertyTax: 8000,
    homeInsurance: 1200,
    pmiRate: 0.5,
    pmiAmount: 0,
    extraMonthlyPrincipal: 0,
    doubleMonthlyPrincipal: false,
    extraAnnualPayment: 0,
    biWeeklyPayments: false,
    // New/existing loan fields
    isExistingLoan: false,
    loanStartDate: new Date().toISOString().split('T')[0],
    originalPrincipal: 320000,
    currentBalance: 300000,
    paymentsMade: 24
  });

  const [activeTab, setActiveTab] = useState('calculator');

  // Calculate loan details
  const loanAmount = inputs.isExistingLoan ? inputs.currentBalance : inputs.homePrice - inputs.downPayment;
  const monthlyRate = inputs.interestRate / 100 / 12;
  const totalPayments = inputs.isExistingLoan ? 
    (inputs.loanTerm * 12) - inputs.paymentsMade : 
    inputs.loanTerm * 12;
  
  // Monthly principal and interest payment
  const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                    (Math.pow(1 + monthlyRate, totalPayments) - 1);
  
  // PMI calculation (removed when loan-to-value reaches 78%)
  const ltvRatio = inputs.isExistingLoan ? 
    (inputs.currentBalance / inputs.originalPrincipal) * 100 : 
    (loanAmount / inputs.homePrice) * 100;
  const monthlyPMI = inputs.isExistingLoan ? 
    inputs.pmiAmount : 
    (ltvRatio > 78 ? (loanAmount * (inputs.pmiRate / 100)) / 12 : 0);
  
  // Monthly escrow (taxes + insurance)
  const monthlyEscrow = inputs.isExistingLoan ? 0 : (inputs.propertyTax + inputs.homeInsurance) / 12;
  
  // Total monthly payment
  const totalMonthlyPayment = monthlyPI + monthlyPMI + monthlyEscrow;

  // Generate amortization schedule
  const generateAmortizationSchedule = (extraMonthly = 0, doubleMonthly = false, extraAnnual = 0, biWeekly = false) => {
    const schedule = [];
    let remainingBalance = loanAmount;
    let totalInterestPaid = 0;
    
    if (biWeekly) {
      // Bi-weekly payments: 26 payments per year = 13 monthly payments
      const biWeeklyPayment = monthlyPI / 2;
      const biWeeklyRate = inputs.interestRate / 100 / 26; // 26 bi-weekly periods per year
      let paymentNumber = 1;
      
      while (remainingBalance > 0.01 && paymentNumber <= totalPayments * 2) {
        const interestPayment = remainingBalance * biWeeklyRate;
        let principalPayment = biWeeklyPayment - interestPayment;
        
        // Don't pay more than remaining balance
        principalPayment = Math.min(principalPayment, remainingBalance);
        
        remainingBalance -= principalPayment;
        totalInterestPaid += interestPayment;
        
        // Add to schedule every 2 payments (monthly equivalent)
        if (paymentNumber % 2 === 0) {
          const currentLTV = inputs.isExistingLoan ? 
            (remainingBalance / inputs.originalPrincipal) * 100 : 
            (remainingBalance / inputs.homePrice) * 100;
          const pmiPayment = inputs.isExistingLoan ? 
            (remainingBalance > 0 ? monthlyPMI : 0) : 
            (currentLTV > 78 ? monthlyPMI : 0);
          
          schedule.push({
            month: Math.ceil(paymentNumber / 2),
            payment: biWeeklyPayment * 2,
            principal: principalPayment * 2, // Approximate for display
            interest: interestPayment * 2, // Approximate for display
            extraPrincipal: 0,
            balance: remainingBalance,
            totalInterest: totalInterestPaid,
            pmi: pmiPayment,
            escrow: monthlyEscrow
          });
        }
        
        paymentNumber++;
      }
    } else {
      // Standard monthly payments
      for (let month = 1; month <= totalPayments && remainingBalance > 0.01; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        let principalPayment = monthlyPI - interestPayment;
        
        // Add extra payments
        let extraPrincipal = extraMonthly;
        if (doubleMonthly) {
          extraPrincipal += principalPayment;
        }
        if (month % 12 === 0) {
          extraPrincipal += extraAnnual;
        }
        
        // Don't pay more than remaining balance
        const totalPrincipal = Math.min(principalPayment + extraPrincipal, remainingBalance);
        
        remainingBalance -= totalPrincipal;
        totalInterestPaid += interestPayment;
        
        const currentLTV = inputs.isExistingLoan ? 
          (remainingBalance / inputs.originalPrincipal) * 100 : 
          (remainingBalance / inputs.homePrice) * 100;
        const pmiPayment = inputs.isExistingLoan ? 
          (remainingBalance > 0 ? monthlyPMI : 0) : 
          (currentLTV > 78 ? monthlyPMI : 0);
        
        schedule.push({
          month,
          payment: monthlyPI + extraPrincipal,
          principal: totalPrincipal,
          interest: interestPayment,
          extraPrincipal,
          balance: remainingBalance,
          totalInterest: totalInterestPaid,
          pmi: pmiPayment,
          escrow: monthlyEscrow
        });
      }
    }
    
    return schedule;
  };

  // Standard schedule and paydown scenarios
  const standardSchedule = useMemo(() => generateAmortizationSchedule(), [inputs]);
  const paydownSchedule = useMemo(() => 
    generateAmortizationSchedule(
      inputs.extraMonthlyPrincipal, 
      inputs.doubleMonthlyPrincipal, 
      inputs.extraAnnualPayment,
      inputs.biWeeklyPayments
    ), [inputs]);

  const updateInput = (field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }: {
    id: string;
    label: string;
    icon: any;
    isActive: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
        isActive 
          ? 'bg-blue-600 text-white border-b-2 border-blue-600' 
          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <div className="flex items-center gap-3">
            <Home size={32} />
            <div>
              <h1 className="text-3xl font-bold">Professional Mortgage Calculator</h1>
              <p className="text-blue-100 mt-1">Complete loan analysis with paydown strategies</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b bg-gray-50">
          <TabButton 
            id="calculator" 
            label="Calculator" 
            icon={Calculator} 
            isActive={activeTab === 'calculator'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="schedule" 
            label="Amortization" 
            icon={Calendar} 
            isActive={activeTab === 'schedule'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="strategies" 
            label="Paydown Strategies" 
            icon={TrendingDown} 
            isActive={activeTab === 'strategies'} 
            onClick={setActiveTab} 
          />
          <TabButton 
            id="analysis" 
            label="Analysis" 
            icon={PieChart} 
            isActive={activeTab === 'analysis'} 
            onClick={setActiveTab} 
          />
        </div>

        <div className="p-6">
          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign size={24} />
                  Loan Details
                </h2>
                
                {/* New/Existing Loan Toggle */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="loanType"
                        checked={!inputs.isExistingLoan}
                        onChange={() => setInputs(prev => ({ ...prev, isExistingLoan: false }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">New Loan</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="loanType"
                        checked={inputs.isExistingLoan}
                        onChange={() => setInputs(prev => ({ ...prev, isExistingLoan: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="font-medium">Existing Loan</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {!inputs.isExistingLoan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Home Price</label>
                      <input
                        type="number"
                        value={inputs.homePrice}
                        onChange={(e) => updateInput('homePrice', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                  
                  {/* Existing Loan Fields */}
                  {inputs.isExistingLoan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loan Start Date</label>
                        <input
                          type="date"
                          value={inputs.loanStartDate}
                          onChange={(e) => setInputs(prev => ({ ...prev, loanStartDate: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Original Principal</label>
                          <input
                            type="number"
                            value={inputs.originalPrincipal}
                            onChange={(e) => updateInput('originalPrincipal', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Balance</label>
                          <input
                            type="number"
                            value={inputs.currentBalance}
                            onChange={(e) => updateInput('currentBalance', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payments Already Made</label>
                        <input
                          type="number"
                          value={inputs.paymentsMade}
                          onChange={(e) => updateInput('paymentsMade', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          {inputs.paymentsMade} of {inputs.loanTerm * 12} payments completed
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Down Payment - only show for new loans */}
                  {!inputs.isExistingLoan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment</label>
                      <input
                        type="number"
                        value={inputs.downPayment}
                        onChange={(e) => updateInput('downPayment', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}% down
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={inputs.interestRate}
                        onChange={(e) => updateInput('interestRate', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (years)</label>
                      <select
                        value={inputs.loanTerm}
                        onChange={(e) => updateInput('loanTerm', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={15}>15 years</option>
                        <option value={20}>20 years</option>
                        <option value={25}>25 years</option>
                        <option value={30}>30 years</option>
                      </select>
                    </div>
                  </div>
                  
                  {!inputs.isExistingLoan && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Annual Property Tax</label>
                        <input
                          type="number"
                          value={inputs.propertyTax}
                          onChange={(e) => updateInput('propertyTax', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Annual Home Insurance</label>
                        <input
                          type="number"
                          value={inputs.homeInsurance}
                          onChange={(e) => updateInput('homeInsurance', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {inputs.isExistingLoan ? 'PMI Amount $' : 'PMI Rate (% annual)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={inputs.isExistingLoan ? inputs.pmiAmount : inputs.pmiRate}
                      onChange={(e) => updateInput(inputs.isExistingLoan ? 'pmiAmount' : 'pmiRate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {inputs.isExistingLoan ? 
                        'Monthly PMI payment amount' : 
                        (ltvRatio > 78 ? 'PMI Required' : 'No PMI Required') + ' (LTV: ' + ltvRatio.toFixed(1) + '%)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Payment Summary</h2>
                
                <div className="grid gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600">{inputs.isExistingLoan ? 'Current Balance' : 'Loan Amount'}</div>
                    <div className="text-2xl font-bold text-blue-800">{formatCurrency(loanAmount)}</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600">Principal & Interest</div>
                    <div className="text-2xl font-bold text-green-800">{formatCurrency(monthlyPI)}</div>
                  </div>
                  
                  {monthlyPMI > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-sm text-yellow-600">Monthly PMI</div>
                      <div className="text-2xl font-bold text-yellow-800">{formatCurrency(monthlyPMI)}</div>
                    </div>
                  )}
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600">Taxes & Insurance</div>
                    <div className="text-2xl font-bold text-purple-800">{formatCurrency(monthlyEscrow)}</div>
                  </div>
                  
                  <div className="bg-gray-900 text-white p-4 rounded-lg">
                    <div className="text-sm text-gray-300">Total Monthly Payment</div>
                    <div className="text-3xl font-bold">{formatCurrency(totalMonthlyPayment)}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Loan Summary</h3>
                  <div className="space-y-2 text-sm">
                    {inputs.isExistingLoan && (
                      <>
                        <div className="flex justify-between">
                          <span>Original Principal:</span>
                          <span className="font-medium">{formatCurrency(inputs.originalPrincipal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payments Made:</span>
                          <span className="font-medium">{inputs.paymentsMade} of {inputs.loanTerm * 12}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining Payments:</span>
                          <span className="font-medium">{totalPayments}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>{inputs.isExistingLoan ? 'Remaining Interest:' : 'Total Interest Paid:'}</span>
                      <span className="font-medium">{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{inputs.isExistingLoan ? 'Total Remaining Cost:' : 'Total Loan Cost:'}</span>
                      <span className="font-medium">{formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payoff Date:</span>
                      <span className="font-medium">
                        {new Date(Date.now() + standardSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amortization Schedule Tab */}
          {activeTab === 'schedule' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Amortization Schedule</h2>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                  Total Payments: {standardSchedule.length} | Total Interest: {formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-lg">
                <table className="w-full border-collapse bg-white">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Payment #</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Date</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Payment</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Principal</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Interest</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Balance</th>
                      <th className="border-b border-gray-200 p-3 text-left font-semibold">Total Interest</th>
                      {monthlyPMI > 0 && <th className="border-b border-gray-200 p-3 text-left font-semibold">PMI</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {standardSchedule.map((payment, index) => {
                      const paymentDate = new Date();
                      paymentDate.setMonth(paymentDate.getMonth() + payment.month);
                      
                      return (
                        <tr key={index} className={`hover:bg-gray-50 ${payment.month % 12 === 0 ? 'bg-blue-50' : ''}`}>
                          <td className="border-b border-gray-100 p-3 font-medium">{payment.month}</td>
                          <td className="border-b border-gray-100 p-3 text-sm">
                            {paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="border-b border-gray-100 p-3">{formatCurrency(payment.payment)}</td>
                          <td className="border-b border-gray-100 p-3 text-green-700 font-medium">{formatCurrency(payment.principal)}</td>
                          <td className="border-b border-gray-100 p-3 text-red-600">{formatCurrency(payment.interest)}</td>
                          <td className="border-b border-gray-100 p-3 font-medium">{formatCurrency(payment.balance)}</td>
                          <td className="border-b border-gray-100 p-3 text-red-700">{formatCurrency(payment.totalInterest)}</td>
                          {monthlyPMI > 0 && (
                            <td className="border-b border-gray-100 p-3 text-yellow-600">
                              {payment.pmi > 0 ? formatCurrency(payment.pmi) : '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="text-green-600 font-medium">Total Principal</div>
                  <div className="text-green-800 font-bold">{formatCurrency(loanAmount)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="text-red-600 font-medium">Total Interest</div>
                  <div className="text-red-800 font-bold">{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="text-blue-600 font-medium">Total Payments</div>
                  <div className="text-blue-800 font-bold">{formatCurrency(loanAmount + (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0))}</div>
                </div>
              </div>
            </div>
          )}

          {/* Paydown Strategies Tab */}
          {activeTab === 'strategies' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Paydown Options</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={inputs.biWeeklyPayments}
                        onChange={(e) => setInputs(prev => ({ 
                          ...prev, 
                          biWeeklyPayments: e.target.checked,
                          // Disable other options when bi-weekly is selected
                          extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                          doubleMonthlyPrincipal: e.target.checked ? false : prev.doubleMonthlyPrincipal,
                          extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment
                        }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-lg font-semibold text-blue-700">Bi-Weekly Payments</span>
                    </label>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                      <p className="text-sm text-blue-700">
                        <strong>How it works:</strong> Pay half your monthly payment ({formatCurrency(monthlyPI / 2)}) every two weeks. 
                        This results in 26 payments per year (equivalent to 13 monthly payments), significantly reducing your loan term and interest.
                      </p>
                      {inputs.biWeeklyPayments && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Bi-weekly payment:</span>
                            <div className="font-bold text-blue-800">{formatCurrency(monthlyPI / 2)}</div>
                          </div>
                          <div>
                            <span className="text-blue-600">Annual total:</span>
                            <div className="font-bold text-blue-800">{formatCurrency((monthlyPI / 2) * 26)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        checked={inputs.doubleMonthlyPrincipal}
                        onChange={(e) => setInputs(prev => ({ 
                          ...prev, 
                          doubleMonthlyPrincipal: e.target.checked,
                          // Disable other options when double monthly is selected
                          biWeeklyPayments: e.target.checked ? false : prev.biWeeklyPayments,
                          extraMonthlyPrincipal: e.target.checked ? 0 : prev.extraMonthlyPrincipal,
                          extraAnnualPayment: e.target.checked ? 0 : prev.extraAnnualPayment
                        }))}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-lg font-semibold text-green-700">Double Monthly Principal Payment</span>
                    </label>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                      <p className="text-sm text-green-700">
                        <strong>How it works:</strong> Pay an extra principal amount equal to your regular principal payment ({formatCurrency(monthlyPI - (loanAmount * monthlyRate))}). 
                        This doubles the principal portion of each payment, dramatically reducing your loan term.
                      </p>
                      {inputs.doubleMonthlyPrincipal && (
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-green-600">Regular principal:</span>
                            <div className="font-bold text-green-800">{formatCurrency(monthlyPI - (loanAmount * monthlyRate))}</div>
                          </div>
                          <div>
                            <span className="text-green-600">Total monthly payment:</span>
                            <div className="font-bold text-green-800">{formatCurrency(monthlyPI + (monthlyPI - (loanAmount * monthlyRate)))}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!inputs.biWeeklyPayments && !inputs.doubleMonthlyPrincipal && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Extra Monthly Principal</label>
                        <input
                          type="number"
                          value={inputs.extraMonthlyPrincipal}
                          onChange={(e) => updateInput('extraMonthlyPrincipal', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Extra Annual Payment</label>
                        <input
                          type="number"
                          value={inputs.extraAnnualPayment}
                          onChange={(e) => updateInput('extraAnnualPayment', e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <p className="text-sm text-gray-500 mt-1">Applied every December (bonus, tax refund, etc.)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Savings Comparison</h2>
                
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-2">Standard Loan</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Payoff Time:</span>
                        <span>{standardSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span>{formatCurrency(standardSchedule[standardSchedule.length - 1]?.totalInterest || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">
                      {inputs.biWeeklyPayments ? 'With Bi-Weekly Payments' : 
                       inputs.doubleMonthlyPrincipal ? 'With Double Monthly Principal' : 'With Extra Payments'}
                    </h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Payoff Time:</span>
                        <span>{paydownSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Interest:</span>
                        <span>{formatCurrency(paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0)}</span>
                      </div>
                      {inputs.biWeeklyPayments && (
                        <div className="flex justify-between">
                          <span>Payment Amount:</span>
                          <span>{formatCurrency(monthlyPI / 2)} bi-weekly</span>
                        </div>
                      )}
                      {inputs.doubleMonthlyPrincipal && (
                        <div className="flex justify-between">
                          <span>Monthly Payment:</span>
                          <span>{formatCurrency(monthlyPI + (monthlyPI - (loanAmount * monthlyRate)))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">Savings Summary</h3>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Time Saved:</span>
                        <span className="font-bold">{standardSchedule.length - paydownSchedule.length} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Saved:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency((standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) - 
                                       (paydownSchedule[paydownSchedule.length - 1]?.totalInterest || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Payoff Date:</span>
                        <span className="font-bold">
                          {new Date(Date.now() + paydownSchedule.length * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Loan Analysis</h2>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Payment Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Principal & Interest</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(monthlyPI / totalMonthlyPayment) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(monthlyPI)}</span>
                        </div>
                      </div>
                      
                      {monthlyPMI > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">PMI</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full" 
                                style={{ width: `${(monthlyPMI / totalMonthlyPayment) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(monthlyPMI)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Taxes & Insurance</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(monthlyEscrow / totalMonthlyPayment) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{formatCurrency(monthlyEscrow)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3">Key Ratios</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Loan-to-Value (LTV):</span>
                        <span className="font-medium">{ltvRatio.toFixed(1)}%</span>
                      </div>
                      {!inputs.isExistingLoan && (
                        <div className="flex justify-between">
                          <span>Down Payment %:</span>
                          <span className="font-medium">{((inputs.downPayment / inputs.homePrice) * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {!inputs.isExistingLoan && (
                        <div className="flex justify-between">
                          <span>Monthly Payment/Home Price:</span>
                          <span className="font-medium">{((totalMonthlyPayment / inputs.homePrice) * 100).toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recommendations</h2>
                
                <div className="space-y-4">
                  {ltvRatio > 80 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-semibold text-yellow-800 mb-2">⚠️ PMI Alert</h3>
                      <p className="text-sm text-yellow-700">
                        Your loan-to-value ratio is {ltvRatio.toFixed(1)}%. Consider a larger down payment to avoid PMI, 
                        or plan to pay extra principal to reach 78% LTV faster.
                      </p>
                    </div>
                  )}
                  
                  {!inputs.isExistingLoan && ((inputs.downPayment / inputs.homePrice) * 100) < 20 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-800 mb-2">💡 Down Payment Tip</h3>
                      <p className="text-sm text-blue-700">
                        Increasing your down payment to 20% ({formatCurrency(inputs.homePrice * 0.2)}) would eliminate PMI 
                        and save you {formatCurrency(monthlyPMI * 12)} per year.
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">🚀 Payoff Strategy</h3>
                    <p className="text-sm text-green-700 mb-3">
                      Adding just {formatCurrency(100)} extra per month would save you approximately{' '}
                      {formatCurrency(
                        (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) - 
                        (generateAmortizationSchedule(100)[generateAmortizationSchedule(100).length - 1]?.totalInterest || 0)
                      )} in interest over the life of the loan.
                    </p>
                    <div className="bg-green-100 p-3 rounded border border-green-300">
                      <p className="text-sm text-green-800">
                        <strong>💡 Bi-Weekly Tip:</strong> Switching to bi-weekly payments ({formatCurrency(monthlyPI / 2)} every 2 weeks) 
                        would save you {formatCurrency(
                          (standardSchedule[standardSchedule.length - 1]?.totalInterest || 0) - 
                          (generateAmortizationSchedule(0, false, 0, true)[generateAmortizationSchedule(0, false, 0, true).length - 1]?.totalInterest || 0)
                        )} in interest and pay off your loan {standardSchedule.length - generateAmortizationSchedule(0, false, 0, true).length} months earlier!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;