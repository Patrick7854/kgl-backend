// ========================================
// Reports Controller - Analytics and summaries
// ========================================

const Sale = require('../models/Sale');
const Produce = require('../models/Produce');
const CreditSale = require('../models/CreditSale');
const User = require('../models/User');

// @desc    Get dashboard summary (KPI cards)
// @route   GET /api/reports/dashboard
// @access  Private (All roles)
const getDashboardSummary = async (req, res) => {
    try {
        let saleQuery = {};
        let produceQuery = {};
        let creditQuery = {};
        
        // Filter by branch for non-director roles
        if (req.user.role !== 'Director') {
            saleQuery.branch = req.user.branch;
            produceQuery.branch = req.user.branch;
            creditQuery.branch = req.user.branch;
        }

        // Get totals
        const totalProduce = await Produce.find(produceQuery);
        const totalStockValue = totalProduce.reduce((sum, item) => sum + (item.cost || 0), 0);
        const totalStockKg = totalProduce.reduce((sum, item) => sum + item.tonnage, 0);
        
        // Today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        saleQuery.dateTime = { $gte: today, $lt: tomorrow };
        
        const todaySales = await Sale.find(saleQuery);
        const todaySalesAmount = todaySales.reduce((sum, sale) => sum + sale.amountPaid, 0);
        
        // Credit summary
        const creditSales = await CreditSale.find(creditQuery);
        const pendingCredit = creditSales
            .filter(c => c.status === 'Pending')
            .reduce((sum, c) => sum + c.amountDue, 0);
        
        // Low stock alerts (items below 1000kg)
        const lowStockItems = totalProduce.filter(item => item.tonnage < 1000);
        
        // User count (Director only sees all, managers see their branch)
        let userQuery = {};
        if (req.user.role !== 'Director') {
            userQuery.branch = req.user.branch;
        }
        const totalUsers = await User.countDocuments(userQuery);

        res.json({
            success: true,
            summary: {
                totalStockValue,
                totalStockKg,
                todaySales: todaySalesAmount,
                todaySalesCount: todaySales.length,
                pendingCredit,
                lowStockCount: lowStockItems.length,
                lowStockItems: lowStockItems.map(item => ({
                    name: item.name,
                    branch: item.branch,
                    tonnage: item.tonnage
                })),
                totalUsers,
                branch: req.user.branch || 'All Branches'
            }
        });

    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get sales report with date range
// @route   GET /api/reports/sales
// @access  Private (Manager and Director)
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = {};
        
        // Filter by branch for managers
        if (req.user.role !== 'Director') {
            query.branch = req.user.branch;
        }
        
        // Date filter
        if (startDate && endDate) {
            query.dateTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Get all sales in period
        const sales = await Sale.find(query).sort({ dateTime: -1 });
        
        // Group by branch
        const byBranch = {};
        sales.forEach(sale => {
            if (!byBranch[sale.branch]) {
                byBranch[sale.branch] = {
                    count: 0,
                    total: 0,
                    quantity: 0
                };
            }
            byBranch[sale.branch].count++;
            byBranch[sale.branch].total += sale.amountPaid;
            byBranch[sale.branch].quantity += sale.quantity;
        });

        // Group by produce
        const byProduce = {};
        sales.forEach(sale => {
            if (!byProduce[sale.produceName]) {
                byProduce[sale.produceName] = {
                    count: 0,
                    total: 0,
                    quantity: 0
                };
            }
            byProduce[sale.produceName].count++;
            byProduce[sale.produceName].total += sale.amountPaid;
            byProduce[sale.produceName].quantity += sale.quantity;
        });

        // Overall totals
        const totalSales = sales.length;
        const totalAmount = sales.reduce((sum, s) => sum + s.amountPaid, 0);
        const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);

        res.json({
            success: true,
            report: {
                period: { startDate, endDate },
                totals: {
                    count: totalSales,
                    amount: totalAmount,
                    quantity: totalQuantity
                },
                byBranch,
                byProduce,
                sales: sales.slice(0, 50) // Last 50 transactions
            }
        });

    } catch (error) {
        console.error('Sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get credit report
// @route   GET /api/reports/credit
// @access  Private (Manager and Director)
const getCreditReport = async (req, res) => {
    try {
        let query = {};
        
        // Filter by branch for managers
        if (req.user.role !== 'Director') {
            query.branch = req.user.branch;
        }

        const creditSales = await CreditSale.find(query).sort({ dueDate: 1 });

        // Separate pending and paid
        const pending = creditSales.filter(c => c.status === 'Pending');
        const paid = creditSales.filter(c => c.status === 'Paid');

        // Calculate totals
        const pendingTotal = pending.reduce((sum, c) => sum + c.amountDue, 0);
        const paidTotal = paid.reduce((sum, c) => sum + c.amountDue, 0);

        // Group by branch
        const byBranch = {};
        creditSales.forEach(c => {
            if (!byBranch[c.branch]) {
                byBranch[c.branch] = {
                    pending: 0,
                    paid: 0,
                    total: 0
                };
            }
            if (c.status === 'Pending') {
                byBranch[c.branch].pending += c.amountDue;
            } else {
                byBranch[c.branch].paid += c.amountDue;
            }
            byBranch[c.branch].total += c.amountDue;
        });

        // Overdue (due date passed and still pending)
        const today = new Date();
        const overdue = pending.filter(c => new Date(c.dueDate) < today);
        const overdueTotal = overdue.reduce((sum, c) => sum + c.amountDue, 0);

        res.json({
            success: true,
            report: {
                summary: {
                    totalCredit: pendingTotal + paidTotal,
                    pending: {
                        count: pending.length,
                        total: pendingTotal
                    },
                    paid: {
                        count: paid.length,
                        total: paidTotal
                    },
                    overdue: {
                        count: overdue.length,
                        total: overdueTotal
                    }
                },
                byBranch,
                recent: creditSales.slice(0, 30)
            }
        });

    } catch (error) {
        console.error('Credit report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get stock report
// @route   GET /api/reports/stock
// @access  Private (All roles)
const getStockReport = async (req, res) => {
    try {
        let query = {};
        
        // Filter by branch for non-director roles
        if (req.user.role !== 'Director') {
            query.branch = req.user.branch;
        }

        const stock = await Produce.find(query).sort({ branch: 1, name: 1 });

        // Group by branch
        const byBranch = {};
        stock.forEach(item => {
            if (!byBranch[item.branch]) {
                byBranch[item.branch] = {
                    items: [],
                    totalKg: 0,
                    totalValue: 0,
                    lowStock: 0
                };
            }
            byBranch[item.branch].items.push(item);
            byBranch[item.branch].totalKg += item.tonnage;
            byBranch[item.branch].totalValue += item.tonnage * item.sellingPrice;
            if (item.tonnage < 1000) {
                byBranch[item.branch].lowStock++;
            }
        });

        // Overall totals
        const totalKg = stock.reduce((sum, i) => sum + i.tonnage, 0);
        const totalValue = stock.reduce((sum, i) => sum + (i.tonnage * i.sellingPrice), 0);
        const lowStockCount = stock.filter(i => i.tonnage < 1000).length;

        res.json({
            success: true,
            report: {
                summary: {
                    totalItems: stock.length,
                    totalKg,
                    totalValue,
                    lowStockCount
                },
                byBranch,
                stock: stock.slice(0, 100)
            }
        });

    } catch (error) {
        console.error('Stock report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

module.exports = {
    getDashboardSummary,
    getSalesReport,
    getCreditReport,
    getStockReport
};