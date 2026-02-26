import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Plus,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  ReportConfig,
  ReportDistributionList,
  ReportDelivery,
  ReportStatus,
} from '../types';
import { ReportScheduler } from '../services/reportScheduler';

export const ExecutiveReporting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'schedules' | 'recipients' | 'history'>('reports');
  const [reportConfigs, setReportConfigs] = useState<ReportConfig[]>([]);
  const [distributionLists, setDistributionLists] = useState<ReportDistributionList[]>([]);
  const [deliveryHistory, setDeliveryHistory] = useState<ReportDelivery[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setReportConfigs(ReportScheduler.getAllReportConfigs());
    setDistributionLists(ReportScheduler.getAllDistributionLists());
    setDeliveryHistory(ReportScheduler.getDeliveryHistory(50));
  };

  const handleGenerateReport = async (config: ReportConfig) => {
    await ReportScheduler.executeReport(config);
    loadData();
  };

  const toggleReportActive = (config: ReportConfig) => {
    const updated = { ...config, active: !config.active };
    ReportScheduler.saveReportConfig(updated);
    loadData();
  };

  const deleteReport = (configId: string) => {
    if (confirm('Are you sure you want to delete this report configuration?')) {
      ReportScheduler.deleteReportConfig(configId);
      loadData();
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.COMPLETED:
      case ReportStatus.DELIVERED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ReportStatus.FAILED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      case ReportStatus.GENERATING:
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Executive Reporting</h1>
        <p className="text-gray-600">Generate and schedule professional reports with automated delivery</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        {[
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'schedules', label: 'Schedules', icon: Calendar },
          { id: 'recipients', label: 'Recipients', icon: Users },
          { id: 'history', label: 'History', icon: Clock },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Report Configurations</h2>
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              <span>New Report</span>
            </button>
          </div>

          <div className="grid gap-4">
            {reportConfigs.map(config => (
              <div key={config.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    {config.description && (
                      <p className="text-gray-600 text-sm mt-1">{config.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleReportActive(config)}
                      className={`p-2 rounded ${
                        config.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}
                      title={config.active ? 'Pause' : 'Activate'}
                    >
                      {config.active ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleGenerateReport(config)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      title="Generate Now"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteReport(config.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <p className="font-medium text-gray-900">{config.format.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Schedule:</span>
                    <p className="font-medium text-gray-900 capitalize">{config.schedule}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Run:</span>
                    <p className="font-medium text-gray-900">
                      {config.lastRun ? new Date(config.lastRun).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Next Run:</span>
                    <p className="font-medium text-gray-900">
                      {config.nextRun ? new Date(config.nextRun).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {reportConfigs.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No report configurations yet</p>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="mt-4 text-blue-500 hover:text-blue-600"
                >
                  Create your first report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipients Tab */}
      {activeTab === 'recipients' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Distribution Lists</h2>
            <button
              onClick={() => setShowListModal(true)}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus className="w-5 h-5" />
              <span>New List</span>
            </button>
          </div>

          <div className="grid gap-4">
            {distributionLists.map(list => (
              <div key={list.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {list.recipients.filter(r => r.active).length} active recipients
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this distribution list?')) {
                        ReportScheduler.deleteDistributionList(list.id);
                        loadData();
                      }
                    }}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {list.recipients.map(recipient => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{recipient.name}</p>
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          recipient.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {recipient.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {distributionLists.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No distribution lists yet</p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="mt-4 text-blue-500 hover:text-blue-600"
                >
                  Create your first list
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Delivery History</h2>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deliveryHistory.map(delivery => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{getStatusIcon(delivery.status)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{delivery.reportName}</p>
                      {delivery.error && (
                        <p className="text-xs text-red-600 mt-1">{delivery.error}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {delivery.format.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {delivery.recipients.length} recipients
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(delivery.generatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {delivery.fileSize
                        ? `${(delivery.fileSize / 1024).toFixed(1)} KB`
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {deliveryHistory.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No delivery history yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
