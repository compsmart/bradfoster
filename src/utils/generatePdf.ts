import jsPDF from 'jspdf';
import type { ResumeData } from '../data/resume';

export interface TailoredCVData {
  tailoredTitle: string;
  tailoredSummary: string;
  prioritizedSkills: {
    category: string;
    items: string[];
  }[];
  tailoredExperience: {
    company: string;
    role: string;
    period: string;
    location: string;
    description: string;
    achievements: string[];
  }[];
  coverNote: string;
}

export const generatePdf = (
  data: ResumeData,
  targetCompany: string,
  targetRole: string,
  tailoredData?: TailoredCVData
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper for text wrapping
  const splitText = (text: string, fontSize: number, maxWidth: number) => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  };

  // Check for page break
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > 280) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(data.personalInfo.name, margin, y);
  y += 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  // Use AI-tailored title if available
  const title = tailoredData?.tailoredTitle || data.personalInfo.title;
  doc.text(title, margin, y);
  y += 15;

  // Contact Info
  doc.setFontSize(10);
  doc.setTextColor(50);
  const contactInfo = `${data.personalInfo.location} | ${data.personalInfo.phone} | ${data.personalInfo.email}`;
  doc.text(contactInfo, margin, y);
  y += 6;
  doc.text(`LinkedIn: ${data.personalInfo.linkedin}`, margin, y);
  y += 6;
  doc.text(`Portfolio: ${data.personalInfo.portfolio}`, margin, y);
  y += 12;

  // AI-Generated Cover Note (if available)
  if (tailoredData?.coverNote && (targetCompany || targetRole)) {
    doc.setFillColor(230, 247, 255); // Light cyan
    const coverLines = splitText(tailoredData.coverNote, 10, pageWidth - margin * 2 - 10);
    const boxHeight = coverLines.length * 5 + 16;
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, boxHeight, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 150);
    //doc.text(`Prepared for ${targetRole || 'the team'} at ${targetCompany || 'your company'}`, margin + 5, y + 3);
    doc.text(`Why choose Brad?`, margin + 5, y + 3);


    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(50, 80, 100);
    doc.text(coverLines, margin + 5, y + 12);
    
    y += boxHeight + 8;
  } else if (targetCompany || targetRole) {
    // Fallback to simple banner if no AI data
    doc.setFillColor(240, 248, 255);
    doc.rect(margin, y - 5, pageWidth - margin * 2, 20, 'F');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Prepared specifically for ${targetRole ? targetRole : 'the team'} at ${targetCompany ? targetCompany : 'your company'}`, margin + 5, y + 8);
    y += 25;
  }

  // Summary
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 120);
  doc.text("Professional Summary", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  // Use AI-tailored summary if available
  const summary = tailoredData?.tailoredSummary || data.personalInfo.summary;
  const summaryLines = splitText(summary, 10, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 10;

  // Skills (use AI-prioritized skills if available)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 120);
  doc.text("Core Competencies", margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  const skills = tailoredData?.prioritizedSkills || data.skills;
  skills.forEach(group => {
    const skillLine = `${group.category}: ${group.items.join(", ")}`;
    const lines = splitText(skillLine, 10, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  });
  y += 10;

  // Experience (use AI-tailored experience if available)
  checkPageBreak(30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 120);
  doc.text("Professional Experience", margin, y);
  y += 10;

  const experience = tailoredData?.tailoredExperience || data.experience;
  experience.forEach(exp => {
    checkPageBreak(50);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(exp.role, margin, y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(`${exp.company}${exp.location ? ` | ${exp.location}` : ''}`, margin, y + 5);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(exp.period, pageWidth - margin - doc.getTextWidth(exp.period), y);
    doc.setTextColor(0);

    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(60);
    const descLines = splitText(exp.description, 10, pageWidth - margin * 2);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 2;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0);
    exp.achievements.forEach(ach => {
      checkPageBreak(15);
      const bullet = `• ${ach}`;
      const lines = splitText(bullet, 10, pageWidth - margin * 2 - 5);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4 + 2;
    });
    
    y += 8;
  });

  // Education
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 80, 120);
  doc.text("Education", margin, y);
  y += 10;

  data.education.forEach(edu => {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(edu.degree, margin, y);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${edu.school} | ${edu.period}`, margin, y + 5);
    y += 15;
  });

  // Footer with AI attribution if tailored
  if (tailoredData) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `CV tailored by AI for ${targetRole} at ${targetCompany} | Generated ${new Date().toLocaleDateString()}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }
  }

  const fileName = targetCompany 
    ? `Brad_Foster_CV_${targetCompany.replace(/\s+/g, '_')}.pdf`
    : 'Brad_Foster_CV.pdf';
  
  doc.save(fileName);
};
