import React from 'react';
import { Card } from '../ui/Card';
import { CampaignReport as CampaignReportType } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface CampaignReportProps {
  report: CampaignReportType;
  onClose: () => void;
}

export const CampaignReport: React.FC<CampaignReportProps> = ({ report, onClose }) => {
  const handleExportPDF = () => {
    alert('Exporting report to PDF...');
  };

  const handleExportCSV = () => {
    alert('Exporting report to CSV...');
  };

  const handleShareReport = () => {
    const shareLink = `https://socialflow.app/reports/${report.campaignId}`;
    navigator.clipboard.writeText(shareLink);
    alert('Report link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <Card>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Campaign Performance Report</h2>
              <p className="text-gray-subtext text-sm">{report.campaignName}</p>
              <p className="text-gray-subtext text-xs mt-1">
                Generated: {report.generatedAt.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
            >
              <MaterialIcon name="close" className="text-gray-subtext hover:text-white" />
            </button>
          </div>

          {/* Period */}
          <div className="mb-6 p-4 bg-dark-bg rounded-xl">
            <p className="text-sm text-gray-subtext mb-1">Report Period</p>
            <p className="text-white font-medium">
              {report.period.start.toLocaleDateString()} - {report.period.end.toLocaleDateString()}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Total Participants</p>
                <p className="text-2xl font-bold text-white">{report.metrics.totalParticipants}</p>
              </div>
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Total Engagement</p>
                <p className="text-2xl font-bold text-white">{report.metrics.totalEngagement.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Rewards Distributed</p>
                <p className="text-2xl font-bold text-white">{report.metrics.totalRewardsDistributed}</p>
              </div>
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Budget Utilization</p>
                <p className="text-2xl font-bold text-white">{report.metrics.budgetUtilization.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">ROI</p>
                <p className="text-2xl font-bold text-green-400">+{report.metrics.roi.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-dark-bg rounded-xl">
                <p className="text-xs text-gray-subtext mb-1">Avg. Reward/User</p>
                <p className="text-2xl font-bold text-white">{report.metrics.averageRewardPerUser.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
            <div className="space-y-2">
              {report.topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center gap-3 p-3 bg-dark-bg rounded-xl">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-amber-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-600 text-white' :
                    'bg-dark-surface text-gray-subtext'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{performer.username}</p>
                    <p className="text-gray-subtext text-xs">{performer.engagementCount} engagements</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-teal font-medium text-sm">{performer.rewardsEarned}</p>
                    <p className="text-gray-subtext text-xs">{performer.walletAddress.slice(0, 8)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reward History */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Reward Distributions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.rewardHistory.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-dark-bg rounded-xl text-sm">
                  <div>
                    <p className="text-white font-medium">{reward.participantName}</p>
                    <p className="text-gray-subtext text-xs">{reward.action}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">+{reward.amount} {reward.asset}</p>
                    <p className="text-gray-subtext text-xs">{reward.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* On-chain Verification */}
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-blue/10 to-primary-teal/10 rounded-xl border border-primary-blue/30">
            <div className="flex items-start gap-3">
              <MaterialIcon name="verified" className="text-primary-teal text-xl" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">On-chain Verification</p>
                <p className="text-gray-subtext text-xs mb-2">All transactions are verified on the blockchain</p>
                <a
                  href={report.onChainVerification}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-blue hover:text-blue-400 text-xs font-medium flex items-center gap-1"
                >
                  View on Explorer
                  <MaterialIcon name="open_in_new" className="text-xs" />
                </a>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex-1 px-4 py-3 rounded-xl bg-dark-surface text-white hover:bg-dark-border transition-colors flex items-center justify-center gap-2"
            >
              <MaterialIcon name="picture_as_pdf" />
              Export PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 px-4 py-3 rounded-xl bg-dark-surface text-white hover:bg-dark-border transition-colors flex items-center justify-center gap-2"
            >
              <MaterialIcon name="table_chart" />
              Export CSV
            </button>
            <button
              onClick={handleShareReport}
              className="flex-1 px-4 py-3 rounded-xl bg-primary-blue text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <MaterialIcon name="share" />
              Share Link
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper function to generate a campaign report
export const generateCampaignReport = (campaignId: string, campaignName: string): CampaignReportType => {
  return {
    campaignId,
    campaignName,
    generatedAt: new Date(),
    period: {
      start: new Date('2026-02-15'),
      end: new Date()
    },
    metrics: {
      totalParticipants: 234,
      totalEngagement: 1250,
      totalRewardsDistributed: 450,
      budgetUtilization: 45.0,
      roi: 245.5,
      averageRewardPerUser: 1.92
    },
    topPerformers: [
      { id: '1', username: '@sarah_creator', avatar: '', walletAddress: 'GABC...XYZ', rewardsEarned: 45.5, engagementCount: 89, joinedAt: new Date('2026-02-15'), rank: 1 },
      { id: '2', username: '@mike_influencer', avatar: '', walletAddress: 'GDEF...ABC', rewardsEarned: 38.2, engagementCount: 76, joinedAt: new Date('2026-02-16'), rank: 2 },
      { id: '3', username: '@emma_social', avatar: '', walletAddress: 'GHIJ...DEF', rewardsEarned: 32.8, engagementCount: 65, joinedAt: new Date('2026-02-16'), rank: 3 }
    ],
    rewardHistory: [
      { id: '1', participantId: '1', participantName: '@sarah_creator', amount: 5.0, asset: 'XLM', action: 'Likes milestone', timestamp: new Date('2026-02-21 10:30'), txHash: '0xabc123...' },
      { id: '2', participantId: '2', participantName: '@mike_influencer', amount: 3.5, asset: 'XLM', action: 'Shares milestone', timestamp: new Date('2026-02-21 09:15'), txHash: '0xdef456...' }
    ],
    onChainVerification: 'https://stellar.expert/explorer/public/tx/abc123'
  };
};
