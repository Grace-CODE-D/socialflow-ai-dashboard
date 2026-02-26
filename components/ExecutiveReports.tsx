import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ViewProps, ReportTemplate, ReportSection, ReportMetric, Platform } from '../types';
import { ReportCustomizer } from './reports/ReportCustomizer';
import { ExecutiveSummaryGenerator } from './reports/ExecutiveSummaryGenerator';
import { ReportPreview } from './reports/ReportPreview';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const defaultTemplate: ReportTemplate = {
  id: 'default',
  name: 'Monthly Executive Report',
  sections: [
    { id: '1', type: 'summary', title: 'Executive Summary', order: 0 },
    { id: '2', type: 'metrics', title: 'Key Metrics', order: 1 },
    { id: '3', type: 'chart', title: 'Performance Trends', order: 2 },
    { id: '4', type: 'text', title: 'Analysis', order: 3 },
  ],
  metrics: [
    { id: 'm1', name: 'Total Engagement', value: 125000, change: 15.3, category: 'engagement', enabled: true },
    { id: 'm2', name: 'Follower Growth', value: 8500, change: 12.1, category: 'growth', enabled: true },
    { id: 'm3', name: 'Reach', value: 450000, change: 8.7, category: 'performance', enabled: true },
    { id: 'm4', name: 'Conversion Rate', value: '3.2%', change: 0.5, category: 'performance', enabled: true },
  ],
  branding: {
    primaryColor: '#3b82f6',
    secondaryColor: '#14b8a6',
    companyName: 'SocialFlow',
  },
  filters: {
    dateRange: { start: new Date(2026, 1, 1), end: new Date(2026, 1, 28) },
    platforms: [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.TIKTOK],
    compareWithPrevious: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const ExecutiveReports: React.FC<ViewProps> = () => {
  const [activeTab, setActiveTab] = useState<'customize' | 'summary' | 'preview'>('customize');
  const [template, setTemplate] = useState<ReportTemplate>(defaultTemplate);
  const [savedTemplates, setSavedTemplates] = useState<ReportTemplate[]>([defaultTemplate]);

  const handleSaveTemplate = () => {
    const newTemplate = { ...template, id: Date.now().toString(), updatedAt: new Date() };
    setSavedTemplates([...savedTemplates, newTemplate]);
    alert('Template saved successfully!');
  };

  const handleExportReport = () => {
    console.log('Exporting report:', template);
    alert('Report exported as PDF!');
  };

  return (
    <div className="p-7 space-y-7 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Executive Reports</h2>
          <p className="text-gray-subtext text-sm mt-1">Create customized reports with AI-powered insights</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-2 bg-dark-surface text-white px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <MaterialIcon name="save" className="text-base" />
            Save Template
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-primary-blue text-white px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            <MaterialIcon name="download" className="text-base" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {[
          { id: 'customize', label: 'Customize Report', icon: 'tune' },
          { id: 'summary', label: 'Executive Summary', icon: 'auto_awesome' },
          { id: 'preview', label: 'Preview', icon: 'visibility' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary-blue'
                : 'text-gray-subtext hover:text-white'
            }`}
          >
            <MaterialIcon name={tab.icon} className="text-base" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'customize' && (
          <ReportCustomizer
            template={template}
            onTemplateChange={setTemplate}
            savedTemplates={savedTemplates}
            onLoadTemplate={setTemplate}
          />
        )}
        {activeTab === 'summary' && (
          <ExecutiveSummaryGenerator template={template} />
        )}
        {activeTab === 'preview' && (
          <ReportPreview template={template} />
        )}
      </div>
    </div>
  );
};
