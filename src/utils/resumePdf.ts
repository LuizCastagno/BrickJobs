import { jsPDF } from 'jspdf';
import type { WorkerProfile } from '../types/brickjobs';
import {
  calculateExperienceMonths,
  calculateTotalExperienceMonths,
  formatDurationPtBr,
  formatMonthYearPtBr,
} from './duration';

export interface FormattedExperienceEntry {
  funcao: string;
  empresaLocal: string;
  periodoLabel: string;
  duracaoLabel: string;
  atividades: string;
}

export interface ResumePdfData {
  fullName: string;
  primaryRole: string;
  availability: string;
  locationLine: string;
  interestRegion: string;
  phone: string;
  email: string;
  summary: string;
  totalDurationLabel: string;
  totalMonths: number;
  historyMode: WorkerProfile['tipoHistorico'];
  attachedPdfName: string | null;
  experiences: FormattedExperienceEntry[];
  generatedDateLabel: string;
}

export function sanitizePdfText(value: string): string {
  return value
    .replace(/[–—]/g, '-')
    .replace(/[•·]/g, '·')
    .replace(/[^\x20-\xFF\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildResumePdfFilename(nomeCompleto: string): string {
  const normalized = nomeCompleto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = normalized || 'profissional';
  return `curriculo-${slug}-brickjobs.pdf`;
}

export function buildResumePdfData(
  profile: WorkerProfile,
  now: Date = new Date()
): ResumePdfData {
  const totalMonths = calculateTotalExperienceMonths(profile.experiencias);
  const experiences: FormattedExperienceEntry[] = profile.experiencias.map((exp) => {
    const duration = calculateExperienceMonths(
      exp.dataInicio,
      exp.dataFim,
      exp.atual
    );
    const startLabel = formatMonthYearPtBr(exp.dataInicio);
    const endLabel = exp.atual ? 'Atual' : formatMonthYearPtBr(exp.dataFim);
    return {
      funcao: sanitizePdfText(exp.funcao || 'Função na construção civil'),
      empresaLocal: sanitizePdfText(exp.empresaLocal || 'Obra / Empresa local'),
      periodoLabel: sanitizePdfText(`${startLabel} - ${endLabel}`),
      duracaoLabel: sanitizePdfText(
        duration.valid ? formatDurationPtBr(duration.months) : 'Período informado'
      ),
      atividades: sanitizePdfText(exp.atividades ?? ''),
    };
  });

  const dateStr = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    fullName: sanitizePdfText(profile.nomeCompleto || 'Profissional BrickJobs'),
    primaryRole: sanitizePdfText(profile.funcaoPrincipal || 'Construção Civil'),
    availability: sanitizePdfText(profile.disponibilidade || 'Imediata'),
    locationLine: sanitizePdfText(
      `Bairro ${profile.bairro || 'Centro'}, ${profile.cidade || 'Rondonópolis - MT'}`
    ),
    interestRegion: sanitizePdfText(
      profile.regiaoInteresse || 'Toda Rondonópolis e Região'
    ),
    phone: sanitizePdfText(profile.telefone || 'Não informado'),
    email: sanitizePdfText(profile.email || 'Não informado'),
    summary: sanitizePdfText(profile.resumoProfissional || ''),
    totalDurationLabel: sanitizePdfText(
      totalMonths > 0 ? formatDurationPtBr(totalMonths) : 'Não informado'
    ),
    totalMonths,
    historyMode: profile.tipoHistorico,
    attachedPdfName: profile.pdfCurriculo?.fileName
      ? sanitizePdfText(profile.pdfCurriculo.fileName)
      : null,
    experiences,
    generatedDateLabel: sanitizePdfText(dateStr),
  };
}

export function createWorkerResumePdfDocument(
  profile: WorkerProfile,
  now: Date = new Date()
): { doc: jsPDF; fileName: string; data: ResumePdfData } {
  const data = buildResumePdfData(profile, now);
  const fileName = buildResumePdfFilename(profile.nomeCompleto);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 18;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 18;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > pageHeight - 20) {
      doc.addPage();
      cursorY = 18;
    }
  };

  // Top terracotta structural bar
  doc.setFillColor(201, 59, 30);
  doc.rect(marginX, cursorY, contentWidth, 1.8, 'F');
  cursorY += 8;

  // Brand kicker
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(201, 59, 30);
  doc.text('BRICKJOBS · CURRÍCULO PROFISSIONAL · RONDONÓPOLIS-MT', marginX, cursorY);
  cursorY += 7;

  // Candidate name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  const nameLines = doc.splitTextToSize(data.fullName, contentWidth);
  doc.text(nameLines, marginX, cursorY);
  cursorY += nameLines.length * 7.5;

  // Primary role & availability
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(55, 65, 81);
  doc.text(`${data.primaryRole}  ·  Disponibilidade: ${data.availability}`, marginX, cursorY);
  cursorY += 6.5;

  // Location & region
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`${data.locationLine}  ·  Região de interesse: ${data.interestRegion}`, marginX, cursorY);
  cursorY += 8;

  // Contact summary strip
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TELEFONE / WHATSAPP', marginX + 4, cursorY + 6);
  doc.text('E-MAIL', marginX + 68, cursorY + 6);
  doc.text('TEMPO TOTAL DE ATUAÇÃO', marginX + 130, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(data.phone, marginX + 4, cursorY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(data.email, 58)[0] || 'Não informado', marginX + 68, cursorY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 59, 30);
  doc.text(data.totalDurationLabel, marginX + 130, cursorY + 13);
  cursorY += 25;

  // Professional summary if provided
  if (data.summary) {
    ensureSpace(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Resumo e Observações Profissionais', marginX, cursorY);
    cursorY += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
    doc.text(summaryLines, marginX, cursorY);
    cursorY += summaryLines.length * 5 + 6;
  }

  // Divider before experiences
  doc.setDrawColor(229, 231, 235);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 7;

  // Experiences or Attached PDF section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(
    data.experiences.length > 0
      ? `Experiências Profissionais (${data.experiences.length})`
      : 'Histórico Profissional',
    marginX,
    cursorY
  );
  cursorY += 7;

  if (data.experiences.length > 0) {
    for (const exp of data.experiences) {
      const activityLines = exp.atividades
        ? doc.splitTextToSize(`Atividades: ${exp.atividades}`, contentWidth - 4)
        : [];
      const blockHeight = 14 + activityLines.length * 4.8;
      ensureSpace(blockHeight + 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(exp.funcao, marginX, cursorY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(201, 59, 30);
      doc.text(exp.duracaoLabel, marginX + contentWidth, cursorY, {
        align: 'right',
      });
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`${exp.empresaLocal}  ·  ${exp.periodoLabel}`, marginX, cursorY);
      cursorY += 5;

      if (activityLines.length > 0) {
        doc.setFontSize(9.5);
        doc.setTextColor(55, 65, 81);
        doc.text(activityLines, marginX, cursorY);
        cursorY += activityLines.length * 4.8;
      }

      cursorY += 4;
      doc.setDrawColor(243, 244, 246);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += 5;
    }
  } else if (data.historyMode === 'pdf' && data.attachedPdfName) {
    ensureSpace(18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const noteLines = doc.splitTextToSize(
      `Currículo original anexado na plataforma: ${data.attachedPdfName}. Os dados de contato, região de atuação e função principal estão consolidados neste documento.`,
      contentWidth
    );
    doc.text(noteLines, marginX, cursorY);
    cursorY += noteLines.length * 5 + 4;
  } else {
    ensureSpace(14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(
      'Nenhuma experiência detalhada cadastrada até o momento.',
      marginX,
      cursorY
    );
    cursorY += 8;
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(marginX, pageHeight - 14, marginX + contentWidth, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Gerado pelo BrickJobs (Rondonópolis-MT) em ${data.generatedDateLabel}`,
      marginX,
      pageHeight - 9
    );
    doc.text(`Página ${i} de ${totalPages}`, marginX + contentWidth, pageHeight - 9, {
      align: 'right',
    });
  }

  return { doc, fileName, data };
}

export function generateWorkerResumePdfBuffer(
  profile: WorkerProfile,
  now: Date = new Date()
): { bytes: Uint8Array; fileName: string; pageCount: number; data: ResumePdfData } {
  const { doc, fileName, data } = createWorkerResumePdfDocument(profile, now);
  const arrayBuffer = doc.output('arraybuffer');
  return {
    bytes: new Uint8Array(arrayBuffer),
    fileName,
    pageCount: doc.getNumberOfPages(),
    data,
  };
}

export function exportWorkerResumePdf(
  profile: WorkerProfile,
  now: Date = new Date()
): { ok: true; fileName: string; pageCount: number } | { ok: false; error: string } {
  try {
    const { doc, fileName } = createWorkerResumePdfDocument(profile, now);
    doc.save(fileName);
    return {
      ok: true,
      fileName,
      pageCount: doc.getNumberOfPages(),
    };
  } catch {
    return {
      ok: false,
      error: 'Não foi possível gerar o currículo em PDF. Tente novamente.',
    };
  }
}
