import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Requirement 501.7: PDF Export with Visuals
 * Captures a DOM element and converts it to a PDF report
 */
export const exportToPDF = async (
  elementId: string, 
  onProgress: (p: number) => void
): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) return;

  onProgress(30);
  
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality for charts
    logging: false,
    useCORS: true
  });

  onProgress(60);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  onProgress(90);
  pdf.save(`SocialFlow-Performance-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Requirement 501.7: CSV Export for Raw Data
 */
export const exportToCSV = async (onProgress: (p: number) => void): Promise<void> => {
  // Example Raw Data - In a real app, pass this as an argument
  const data = [
    ["Date", "Token", "Balance", "Transactions", "Engagement"],
    ["2026-02-20", "XLM", "1200", "45", "850"],
    ["2026-02-21", "XLM", "1150", "12", "400"]
  ];

  onProgress(50);

  const csvContent = "data:text/csv;charset=utf-8," 
    + data.map(e => e.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "performance_raw_data.csv");
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  onProgress(100);
};