import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { ViewProps } from '../types';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { analyticsService, AggregatedData } from '../services/analyticsService';
import { PerformanceComparison } from './PerformanceComparison';

const MaterialIcon = ({ name, className }: { name: string; className?: string }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type TimeRange = '7d' | '30d';
type ExportFormat = 'pdf' | 'csv';

export const AccountPerformance: React.FC<ViewProps> = () => {
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');
    const [data, setData] = useState<AggregatedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [timeRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const aggregatedData = await analyticsService.getAggregatedData(timeRange);
            setData(aggregatedData);
        } catch (error) {
            console.error('Failed to load analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async (format: ExportFormat) => {
        setIsExporting(true);
        try {
            await analyticsService.exportReport(format, timeRange);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export report. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading || !data) {
        return (
            <div className="p-7 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-subtext">Loading performance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-7 space-y-7 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Account Performance</h2>
                    <p className="text-sm text-gray-subtext mt-1">
                        Unified overview of social and blockchain metrics
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Time Range Selector */}
                    <div className="flex bg-dark-surface rounded-xl p-1">
                        <button
                            onClick={() => setTimeRange('7d')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '7d'
                                    ? 'bg-primary-blue text-white'
                                    : 'text-gray-subtext hover:text-white'
                                }`}
                        >
                            Last 7 Days
                        </button>
                        <button
                            onClick={() => setTimeRange('30d')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === '30d'
                                    ? 'bg-primary-blue text-white'
                                    : 'text-gray-subtext hover:text-white'
                                }`}
                        >
                            Last 30 Days
                        </button>
                    </div>

                    {/* Export Dropdown */}
                    <div className="relative group">
                        <button
                            className="flex items-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            disabled={isExporting}
                        >
                            <MaterialIcon name="download" className="text-base" />
                            {isExporting ? 'Exporting...' : 'Export Report'}
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                            <button
                                onClick={() => handleExport('pdf')}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-t-xl transition-colors"
                                disabled={isExporting}
                            >
                                <MaterialIcon name="picture_as_pdf" className="text-base text-red-400" />
                                Export as PDF
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 rounded-b-xl transition-colors"
                                disabled={isExporting}
                            >
                                <MaterialIcon name="table_chart" className="text-base text-green-400" />
                                Export as CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unified Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <OverviewCard
                    title="Total Follower Growth"
                    value={data.totalFollowers.toLocaleString()}
                    change={`+${data.followerGrowth}%`}
                    icon={<MaterialIcon name="group" className="text-primary-blue" />}
                    subtitle="Across all platforms"
                />
                <OverviewCard
                    title="Total Wallet Value"
                    value={`$${data.totalWalletValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    change={`+${data.walletGrowth}%`}
                    icon={<MaterialIcon name="account_balance_wallet" className="text-primary-teal" />}
                    subtitle="XLM + Tokens"
                />
                <OverviewCard
                    title="Engagement Rate"
                    value={`${data.engagementRate}%`}
                    change="+0.3%"
                    icon={<MaterialIcon name="trending_up" className="text-purple-400" />}
                    subtitle="Average across platforms"
                />
                <OverviewCard
                    title="XLM Spent on Promotions"
                    value={`${data.xlmSpent.toFixed(2)} XLM`}
                    change="-5.2%"
                    icon={<MaterialIcon name="payments" className="text-orange-400" />}
                    subtitle={timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
                    isNegative
                />
            </div>

            {/* Performance Comparison */}
            <PerformanceComparison timeRange={timeRange} />

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Engagement Correlation */}
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-6">Engagement vs XLM Spent</h3>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.performanceHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8892b0', fontSize: 10 }}
                                    tickFormatter={(value) => new Date(value).getDate().toString()}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8892b0', fontSize: 10 }}
                                    tickFormatter={(value) => `${value}%`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#8892b0', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#161b22',
                                        borderColor: '#334155',
                                        borderRadius: '12px',
                                    }}
                                    formatter={(value: any, name: string) => {
                                        if (name === 'Engagement') return [`${value.toFixed(2)}%`, name];
                                        if (name === 'XLM Spent') return [`${value.toFixed(2)} XLM`, name];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="engagement"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    dot={{ fill: '#a855f7', r: 4 }}
                                    name="Engagement"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="xlmSpent"
                                    stroke="#fb923c"
                                    strokeWidth={3}
                                    dot={{ fill: '#fb923c', r: 4 }}
                                    name="XLM Spent"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Reward Distribution Timeline */}
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-6">Reward Distribution Timeline</h3>
                    <div className="space-y-4">
                        {data.rewardDistributions.map((distribution, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 bg-dark-surface rounded-xl hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-teal/20 flex items-center justify-center">
                                        <MaterialIcon name="redeem" className="text-primary-teal" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{distribution.campaign}</p>
                                        <p className="text-sm text-gray-subtext">
                                            {distribution.recipients} recipients • {new Date(distribution.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary-teal">
                                        {distribution.amount.toFixed(2)} XLM
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Token Performance Detail */}
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-6">Token Performance</h3>
                    <div className="space-y-4">
                        {data.walletMetrics.assets.map((asset) => (
                            <div
                                key={asset.code}
                                className={`p-4 rounded-xl cursor-pointer transition-all ${selectedToken === asset.code
                                        ? 'bg-primary-blue/20 border-2 border-primary-blue'
                                        : 'bg-dark-surface hover:bg-white/5 border-2 border-transparent'
                                    }`}
                                onClick={() => setSelectedToken(selectedToken === asset.code ? null : asset.code)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-primary-teal flex items-center justify-center text-white font-bold text-sm">
                                            {asset.code.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{asset.code}</p>
                                            <p className="text-xs text-gray-subtext">
                                                {asset.balance.toLocaleString()} units
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-white">
                                            ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-primary-teal">
                                            ${(asset.value / asset.balance).toFixed(4)} per unit
                                        </p>
                                    </div>
                                </div>
                                {selectedToken === asset.code && (
                                    <div className="mt-4 pt-4 border-t border-dark-border animate-fade-in">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-gray-subtext mb-1">24h Change</p>
                                                <p className="text-sm font-semibold text-primary-teal">+2.4%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-subtext mb-1">7d Change</p>
                                                <p className="text-sm font-semibold text-primary-teal">+8.7%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-subtext mb-1">30d Change</p>
                                                <p className="text-sm font-semibold text-primary-teal">+15.2%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Social Platform Breakdown */}
            <Card>
                <h3 className="text-lg font-semibold text-white mb-6">Social Platform Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {data.socialMetrics.map((metric) => (
                        <div key={metric.platform} className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary-blue to-primary-teal flex items-center justify-center">
                                <MaterialIcon name="trending_up" className="text-white text-2xl" />
                            </div>
                            <h4 className="text-white font-semibold mb-1">{metric.platform}</h4>
                            <p className="text-2xl font-bold text-primary-blue mb-1">
                                {metric.followers.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-subtext mb-2">followers</p>
                            <div className="flex items-center justify-center gap-4 text-xs">
                                <div>
                                    <p className="text-gray-subtext">Engagement</p>
                                    <p className="text-white font-semibold">{metric.engagement}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-subtext">Posts</p>
                                    <p className="text-white font-semibold">{metric.posts}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const OverviewCard = ({
    title,
    value,
    change,
    icon,
    subtitle,
    isNegative = false,
}: {
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
    subtitle: string;
    isNegative?: boolean;
}) => (
    <Card>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm text-gray-subtext font-medium mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-white">{value}</h4>
            </div>
            <div className="p-3 rounded-xl bg-white/5">{icon}</div>
        </div>
        <div className="flex items-center gap-2">
            <span
                className={`flex items-center text-xs font-semibold px-2 py-1 rounded-lg ${isNegative
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-teal-500/10 text-teal-400'
                    }`}
            >
                <MaterialIcon
                    name="arrow_upward"
                    className={`text-sm mr-1 ${isNegative ? 'rotate-180' : ''}`}
                />
                {change}
            </span>
            <span className="text-xs text-gray-subtext">{subtitle}</span>
        </div>
    </Card>
);
