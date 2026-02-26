import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { ReportTemplate, ReportSection, ReportMetric } from '../../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ReportCustomizerProps {
  template: ReportTemplate;
  onTemplateChange: (template: ReportTemplate) => void;
  savedTemplates: ReportTemplate[];
  onLoadTemplate: (template: ReportTemplate) => void;
}

export const ReportCustomizer: React.FC<ReportCustomizerProps> = ({
  template,
  onTemplateChange,
  savedTemplates,
  onLoadTemplate,
}) => {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;

    const sections = [...template.sections];
    const draggedIdx = sections.findIndex(s => s.id === draggedSection);
    const targetIdx = sections.findIndex(s => s.id === targetId);

    const [removed] = sections.splice(draggedIdx, 1);
    sections.splice(targetIdx, 0, removed);

    sections.forEach((s, idx) => s.order = idx);
    onTemplateChange({ ...template, sections });
  };

  const handleMetricToggle = (metricId: string) => {
    const metrics = template.metrics.map(m =>
      m.id === metricId ? { ...m, enabled: !m.enabled } : m
    );
    onTemplateChange({ ...template, metrics });
  };

  const handleBrandingChange = (field: string, value: string) => {
    onTemplateChange({
      ...template,
      branding: { ...template.branding, [field]: value },
    });
  };

  const handleAddTextSection = () => {
    const newSection: ReportSection = {
      id: Date.now().toString(),
      type: 'text',
      title: 'Custom Section',
      order: template.sections.length,
      config: { content: '' },
    };
    onTemplateChange({
      ...template,
      sections: [...template.sections, newSection],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Section Reordering */}
      <Card className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Report Sections</h3>
          <button
            onClick={handleAddTextSection}
            className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <MaterialIcon name="add" className="text-base" />
            Add Text Section
          </button>
        </div>

        <div className="space-y-3">
          {template.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(section.id)}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragEnd={() => setDraggedSection(null)}
                className="flex items-center gap-4 bg-dark-surface p-4 rounded-xl cursor-move hover:bg-gray-700 transition-colors group"
              >
                <MaterialIcon name="drag_indicator" className="text-gray-subtext group-hover:text-white" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MaterialIcon
                      name={
                        section.type === 'summary' ? 'summarize' :
                        section.type === 'metrics' ? 'analytics' :
                        section.type === 'chart' ? 'show_chart' : 'text_fields'
                      }
                      className="text-primary-blue"
                    />
                    <span className="text-white font-medium">{section.title}</span>
                  </div>
                  <span className="text-xs text-gray-subtext capitalize">{section.type}</span>
                </div>
                <span className="text-sm text-gray-subtext">Order: {section.order + 1}</span>
              </div>
            ))}
        </div>
      </Card>

      {/* Metric Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Select Metrics</h3>
        <div className="space-y-3">
          {template.metrics.map((metric) => (
            <label
              key={metric.id}
              className="flex items-center gap-3 p-3 bg-dark-surface rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={metric.enabled}
                onChange={() => handleMetricToggle(metric.id)}
                className="w-5 h-5 rounded border-gray-600 text-primary-blue focus:ring-primary-blue focus:ring-offset-0"
              />
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{metric.name}</div>
                <div className="text-xs text-gray-subtext capitalize">{metric.category}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Branding Customization */}
      <Card className="lg:col-span-2">
        <h3 className="text-lg font-semibold text-white mb-6">Branding</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={template.branding.companyName}
              onChange={(e) => handleBrandingChange('companyName', e.target.value)}
              className="w-full bg-dark-surface text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-primary-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Logo URL
            </label>
            <input
              type="text"
              value={template.branding.logo || ''}
              onChange={(e) => handleBrandingChange('logo', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-dark-surface text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-primary-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.branding.primaryColor}
                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer"
              />
              <input
                type="text"
                value={template.branding.primaryColor}
                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                className="flex-1 bg-dark-surface text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-primary-blue focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-subtext mb-2">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.branding.secondaryColor}
                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer"
              />
              <input
                type="text"
                value={template.branding.secondaryColor}
                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                className="flex-1 bg-dark-surface text-white px-4 py-2.5 rounded-xl border border-gray-700 focus:border-primary-blue focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Saved Templates */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-6">Saved Templates</h3>
        <div className="space-y-2">
          {savedTemplates.map((t) => (
            <button
              key={t.id}
              onClick={() => onLoadTemplate(t)}
              className="w-full text-left p-3 bg-dark-surface rounded-xl hover:bg-gray-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-gray-subtext">
                    {t.sections.length} sections • {t.metrics.filter(m => m.enabled).length} metrics
                  </div>
                </div>
                <MaterialIcon name="chevron_right" className="text-gray-subtext group-hover:text-white" />
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
