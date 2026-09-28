import { jsPDF } from 'jspdf';

export const exportChatToPDF = (messages, sessionTitle = 'Blockchain Knowledge Chat') => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let cursorY = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title
  doc.setTextColor(0, 229, 255); // #00E5FF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BlockMind AI', margin, 12);

  // Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Offline Blockchain Knowledge Assistant - RAG Export Report', margin, 18);

  // Timestamp
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 50, 18);

  cursorY = 38;

  messages.forEach((msg, idx) => {
    // Check if new page needed
    if (cursorY > pageHeight - 30) {
      doc.addPage();
      cursorY = 20;
    }

    const isUser = msg.role === 'user';
    const roleLabel = isUser ? 'USER QUESTION' : 'BLOCKMIND AI ANSWER';
    const roleColor = isUser ? [123, 97, 255] : [0, 229, 255];

    // Role Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(roleColor[0], roleColor[1], roleColor[2]);
    doc.text(`[${roleLabel}]`, margin, cursorY);
    cursorY += 6;

    // Content text wrapping
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    const splitText = doc.splitTextToSize(msg.content, pageWidth - margin * 2);
    
    // Add page if content exceeds
    if (cursorY + splitText.length * 5 > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
    }

    doc.text(splitText, margin, cursorY);
    cursorY += splitText.length * 5 + 4;

    // Sources citations if assistant
    if (!isUser && msg.sources && msg.sources.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Sources Cited:', margin, cursorY);
      cursorY += 4;

      msg.sources.forEach((src) => {
        const srcLine = `• ${src.book_name} - ${src.chapter} (Score: ${Math.round(src.similarity_score * 100)}%)`;
        doc.text(srcLine, margin + 4, cursorY);
        cursorY += 4;
      });
      cursorY += 2;
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 8;
  });

  // Footer page numbers
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} • BlockMind AI Open-Source Knowledge System`,
      pageWidth / 2 - 35,
      pageHeight - 8
    );
  }

  doc.save(`BlockMind_Export_${Date.now()}.pdf`);
};

export const exportChatToMarkdown = (messages, sessionTitle = 'Blockchain Chat') => {
  let md = `# BlockMind AI - Knowledge Assistant Transcript\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n---\n\n`;

  messages.forEach((msg) => {
    const isUser = msg.role === 'user';
    md += `### ${isUser ? '👤 User Question' : '🧠 BlockMind AI Answer'}\n\n`;
    md += `${msg.content}\n\n`;

    if (!isUser && msg.sources && msg.sources.length > 0) {
      md += `**📚 Sources Cited:**\n`;
      msg.sources.forEach((s) => {
        md += `- **${s.book_name}** | *${s.chapter}* (Match: ${Math.round(s.similarity_score * 100)}%)\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BlockMind_Chat_${Date.now()}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
