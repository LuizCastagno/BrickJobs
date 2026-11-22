/**
 * @file src/utils/employerProfessionalsExport.ts
 * @description Geração e exportação da lista de profissionais registrados da construtora em arquivos CSV (UTF-8 com BOM) e PDF (via jsPDF).
 */

import { jsPDF } from 'jspdf';
import type { CompanyProfile } from '../types/brickjobs';
import type { RegisteredEmployerProfessional } from './employerProfessionals';
import { formatDurationPtBr } from './duration';
import { sanitizePdfText } from './resumePdf';

export interface RegisteredProfessionalsPdfData {
  companyName: string;
  cnpj: string;
  locationLine: string;
  totalRegistered: number;
  activeCount: number;
  completedCount: number;
  generatedDateLabel: string;
  items: Array<{
    nomeCompleto: string;
    funcaoContratada: string;
    statusLabel: string;
    isActive: boolean;
    empresaContratante: string;
    bairroObra: string;
    telefone: string;
    appliedAt: string;
    completedAt: string;
    experienceLabel: string;
    detailLine: string;
  }>;
}

export type RegisteredProfessionalsExportResult =
  | { ok: true; fileName: string; exportedCount: number; pageCount?: number }
  | { ok: false; error: string };

const CSV_HEADERS = [
  'Nome Completo',
  'Função Contratada',
  'Status',
  'Empresa Contratante',
  'Bairro / Obra',
  'Telefone / Contato',
  'Data de Registro',
  'Data de Conclusão',
  'Experiência Total',
  'Currículo / Resumo',
] as const;

export function buildRegisteredProfessionalsExportFilename(
  companyName: string,
  extension: 'pdf' | 'csv',
  now: Date = new Date()
): string {
  const normalized = companyName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = normalized || 'construtora';
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `profissionais-registrados-${slug}-${year}-${month}-${day}.${extension}`;
}

export function sanitizeCsvCell(value: string | number | undefined | null): string {
  const raw = value == null ? '' : String(value);
  const cleaned = raw.replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').trim();
  // Mitigate spreadsheet formula injection when opened in Excel/Sheets
  const safe = /^[=+\-@\t]/.test(cleaned) ? `'${cleaned}` : cleaned;
  if (/[",;\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildRegisteredProfessionalsCsv(
  registrados: RegisteredEmployerProfessional[]
): string {
  const headerLine = CSV_HEADERS.map((col) => sanitizeCsvCell(col)).join(',');
  const rows = registrados.map((item) => {
    const experienceLabel =
      item.totalExperienceMonths > 0
        ? formatDurationPtBr(item.totalExperienceMonths)
        : item.pdfFileName
          ? 'Currículo em PDF'
          : 'Não informada';
    const curriculumOrSummary = item.pdfFileName
      ? `PDF: ${item.pdfFileName}`
      : item.resumoProfissional?.trim() || '—';

    return [
      item.nomeCompleto,
      item.funcaoContratada,
      item.statusLabel,
      item.empresaContratante,
      item.bairroObra,
      item.telefone?.trim() || 'Não informado',
      item.appliedAt,
      item.completedAt?.trim() || '—',
      experienceLabel,
      curriculumOrSummary,
    ]
      .map((cell) => sanitizeCsvCell(cell))
      .join(',');
  });

  // Include UTF-8 BOM so accented pt-BR characters open cleanly in Excel
  return `\uFEFF${[headerLine, ...rows].join('\r\n')}`;
}

export function exportRegisteredProfessionalsCsv(
  companyProfile: CompanyProfile,
  registrados: RegisteredEmployerProfessional[],
  now: Date = new Date()
): RegisteredProfessionalsExportResult {
  if (registrados.length === 0) {
    return {
      ok: false,
      error: 'Não há profissionais registrados na empresa para exportar.',
    };
  }

  if (typeof document === 'undefined' || typeof Blob === 'undefined') {
    return {
      ok: false,
      error: 'Exportação CSV indisponível neste ambiente.',
    };
  }

  try {
    const csvContent = buildRegisteredProfessionalsCsv(registrados);
    const fileName = buildRegisteredProfessionalsExportFilename(
      companyProfile.nomeFantasia || 'Construtora',
      'csv',
      now
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return {
      ok: true,
      fileName,
      exportedCount: registrados.length,
    };
  } catch {
    return {
      ok: false,
      error: 'Não foi possível exportar a lista em CSV. Tente novamente.',
    };
  }
}

export function buildRegisteredProfessionalsPdfData(
  companyProfile: CompanyProfile,
  registrados: RegisteredEmployerProfessional[],
  now: Date = new Date()
): RegisteredProfessionalsPdfData {
  const activeCount = registrados.filter((item) => item.status === 'aceita').length;
  const completedCount = registrados.filter(
    (item) => item.status === 'concluida'
  ).length;

  const generatedDateLabel = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return {
    companyName: sanitizePdfText(
      companyProfile.nomeFantasia || 'Construtora Parceira'
    ),
    cnpj: sanitizePdfText(companyProfile.cnpj || 'Não informado'),
    locationLine: sanitizePdfText(
      `Bairro ${companyProfile.bairro || 'Centro'}, Rondonópolis - MT`
    ),
    totalRegistered: registrados.length,
    activeCount,
    completedCount,
    generatedDateLabel: sanitizePdfText(generatedDateLabel),
    items: registrados.map((item) => {
      const experienceLabel =
        item.totalExperienceMonths > 0
          ? formatDurationPtBr(item.totalExperienceMonths)
          : item.pdfFileName
            ? `Currículo PDF (${item.pdfFileName})`
            : 'Não informada';

      const detailRaw = item.pdfFileName
        ? `Currículo anexado: ${item.pdfFileName}`
        : item.resumoProfissional?.trim() || '';

      return {
        nomeCompleto: sanitizePdfText(item.nomeCompleto || 'Colaborador registrado'),
        funcaoContratada: sanitizePdfText(
          item.funcaoContratada || 'Profissional da construção'
        ),
        statusLabel: sanitizePdfText(item.statusLabel),
        isActive: item.status === 'aceita',
        empresaContratante: sanitizePdfText(item.empresaContratante),
        bairroObra: sanitizePdfText(item.bairroObra || 'Rondonópolis-MT'),
        telefone: sanitizePdfText(item.telefone?.trim() || 'Não informado'),
        appliedAt: sanitizePdfText(item.appliedAt || '—'),
        completedAt: sanitizePdfText(item.completedAt?.trim() || ''),
        experienceLabel: sanitizePdfText(experienceLabel),
        detailLine: sanitizePdfText(detailRaw),
      };
    }),
  };
}

export function createRegisteredProfessionalsPdfDocument(
  companyProfile: CompanyProfile,
  registrados: RegisteredEmployerProfessional[],
  now: Date = new Date()
): { doc: jsPDF; fileName: string; data: RegisteredProfessionalsPdfData } {
  const data = buildRegisteredProfessionalsPdfData(companyProfile, registrados, now);
  const fileName = buildRegisteredProfessionalsExportFilename(
    companyProfile.nomeFantasia || 'Construtora',
    'pdf',
    now
  );

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

  // Top terracotta accent bar
  doc.setFillColor(201, 59, 30);
  doc.rect(marginX, cursorY, contentWidth, 1.8, 'F');
  cursorY += 8;

  // Header kicker
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(201, 59, 30);
  doc.text(
    'BRICKJOBS · PROFISSIONAIS REGISTRADOS NA EMPRESA · RONDONÓPOLIS-MT',
    marginX,
    cursorY
  );
  cursorY += 7;

  // Company title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  const companyLines = doc.splitTextToSize(data.companyName, contentWidth);
  doc.text(companyLines, marginX, cursorY);
  cursorY += companyLines.length * 7 + 2;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`CNPJ: ${data.cnpj}  ·  ${data.locationLine}`, marginX, cursorY);
  cursorY += 8;

  // KPI summary card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, 22, 2, 2, 'FD');

  const colW = contentWidth / 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL REGISTRADOS', marginX + 4, cursorY + 6);
  doc.text('EM SERVIÇO', marginX + colW + 4, cursorY + 6);
  doc.text('CONCLUÍDOS', marginX + colW * 2 + 4, cursorY + 6);
  doc.text('DATA DE EMISSÃO', marginX + colW * 3 + 4, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(String(data.totalRegistered), marginX + 4, cursorY + 15);
  doc.text(String(data.activeCount), marginX + colW + 4, cursorY + 15);
  doc.text(String(data.completedCount), marginX + colW * 2 + 4, cursorY + 15);
  doc.text(data.generatedDateLabel, marginX + colW * 3 + 4, cursorY + 15);
  cursorY += 28;

  // Section heading
  ensureSpace(16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(
    `Lista de Contratados Registrados (${data.items.length})`,
    marginX,
    cursorY
  );
  cursorY += 7;

  if (data.items.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(
      'Nenhum profissional registrado encontrado para esta construtora.',
      marginX,
      cursorY
    );
  } else {
    for (let idx = 0; idx < data.items.length; idx += 1) {
      const item = data.items[idx];
      const detailLines = item.detailLine
        ? doc.splitTextToSize(item.detailLine, contentWidth)
        : [];
      const blockHeight = 20 + detailLines.length * 4.5;
      ensureSpace(blockHeight);

      // Worker name + role
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${idx + 1}. ${item.nomeCompleto}`, marginX, cursorY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (item.isActive) {
        doc.setTextColor(4, 120, 87);
      } else {
        doc.setTextColor(75, 85, 99);
      }
      doc.text(item.statusLabel, marginX + contentWidth, cursorY, {
        align: 'right',
      });
      cursorY += 5;

      // Function + location
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(201, 59, 30);
      doc.text(item.funcaoContratada, marginX, cursorY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `Obra: ${item.bairroObra}  ·  Contato: ${item.telefone}`,
        marginX + contentWidth,
        cursorY,
        { align: 'right' }
      );
      cursorY += 5;

      // Dates + Experience
      const dateSegment = item.completedAt
        ? `Registrado em ${item.appliedAt}  ·  Concluído em ${item.completedAt}`
        : `Registrado em ${item.appliedAt}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `${dateSegment}  ·  Experiência: ${item.experienceLabel}`,
        marginX,
        cursorY
      );
      cursorY += 4.8;

      if (detailLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(55, 65, 81);
        doc.text(detailLines, marginX, cursorY);
        cursorY += detailLines.length * 4.2;
      }

      cursorY += 1.5;
      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += 5;
    }
  }

  // Page footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(marginX, pageHeight - 14, marginX + contentWidth, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `BrickJobs · Lista de Profissionais Registrados · Emitido em ${data.generatedDateLabel}`,
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      marginX + contentWidth,
      pageHeight - 9,
      { align: 'right' }
    );
  }

  return { doc, fileName, data };
}

export function exportRegisteredProfessionalsPdf(
  companyProfile: CompanyProfile,
  registrados: RegisteredEmployerProfessional[],
  now: Date = new Date()
): RegisteredProfessionalsExportResult {
  if (registrados.length === 0) {
    return {
      ok: false,
      error: 'Não há profissionais registrados na empresa para exportar.',
    };
  }

  try {
    const { doc, fileName } = createRegisteredProfessionalsPdfDocument(
      companyProfile,
      registrados,
      now
    );
    doc.save(fileName);
    return {
      ok: true,
      fileName,
      exportedCount: registrados.length,
      pageCount: doc.getNumberOfPages(),
    };
  } catch {
    return {
      ok: false,
      error: 'Não foi possível gerar o PDF dos profissionais registrados. Tente novamente.',
    };
  }
}
