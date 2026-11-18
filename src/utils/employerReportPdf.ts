import { jsPDF } from 'jspdf';
import type { CompanyProfile, CompanyRating, JobPosting } from '../types/brickjobs';
import { sanitizePdfText } from './resumePdf';
import { computeFillTimeDays } from './employerStats';
import { computeCompanyRatingSummary, formatRatingSummaryLabel } from './ratings';
import { formatDecimalPtBr } from './employerStats';

export interface EmployerReportPdfData {
  companyName: string;
  cnpj: string;
  locationLine: string;
  phone: string;
  email: string;
  totalJobs: number;
  openJobs: number;
  closedJobs: number;
  totalVacanciesFilled: number;
  overallRating: number;
  formattedOverallRating: string;
  totalRatings: number;
  averageFillDays: string;
  completedJobsList: Array<{
    funcao: string;
    bairro: string;
    quantidadeVagas: number;
    createdAt: string;
    closedAt: string;
    fillDurationDays: number;
  }>;
  generatedDateLabel: string;
}

export function buildEmployerReportPdfFilename(companyName: string): string {
  const normalized = companyName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = normalized || 'construtora';
  return `relatorio-desempenho-${slug}-brickjobs.pdf`;
}

export function buildEmployerReportPdfData(
  companyProfile: CompanyProfile,
  jobs: JobPosting[],
  ratings: CompanyRating[],
  now: Date = new Date()
): EmployerReportPdfData {
  const companyJobs = jobs.filter((j) => j.companyId === companyProfile.id);
  const openJobs = companyJobs.filter((j) => j.status === 'aberta').length;
  const closedCompanyJobs = companyJobs.filter((j) => j.status === 'encerrada');
  const closedJobsCount = closedCompanyJobs.length;

  let totalVacanciesFilled = 0;
  let totalFillDays = 0;
  let validFillCount = 0;

  const completedJobsList = closedCompanyJobs.map((job) => {
    const vac = Math.max(1, Math.floor(job.quantidadeVagas || 1));
    totalVacanciesFilled += vac;
    const days = computeFillTimeDays(job.createdAt, job.closedAt) ?? 1;
    totalFillDays += days;
    validFillCount += 1;

    return {
      funcao: sanitizePdfText(job.funcao || 'Cargo na construção civil'),
      bairro: sanitizePdfText(job.bairro || 'Rondonópolis'),
      quantidadeVagas: vac,
      createdAt: sanitizePdfText(job.createdAt),
      closedAt: sanitizePdfText(job.closedAt || job.createdAt),
      fillDurationDays: days,
    };
  });

  const avgDays =
    validFillCount > 0 ? Math.round((totalFillDays / validFillCount) * 10) / 10 : 0;
  const averageFillDays =
    validFillCount > 0 ? `${formatDecimalPtBr(avgDays, 1)} dias` : '—';

  const ratingSummary = computeCompanyRatingSummary(
    ratings,
    companyProfile.id,
    companyProfile.nomeFantasia
  );

  const dateStr = now.toLocaleDateString('pt-BR', {
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
    phone: sanitizePdfText(companyProfile.telefone || 'Não informado'),
    email: sanitizePdfText(companyProfile.email || 'Não informado'),
    totalJobs: companyJobs.length,
    openJobs,
    closedJobs: closedJobsCount,
    totalVacanciesFilled,
    overallRating: ratingSummary.average,
    formattedOverallRating: formatRatingSummaryLabel(ratingSummary),
    totalRatings: ratingSummary.count,
    averageFillDays,
    completedJobsList,
    generatedDateLabel: sanitizePdfText(dateStr),
  };
}

export function createEmployerReportPdfDocument(
  companyProfile: CompanyProfile,
  jobs: JobPosting[],
  ratings: CompanyRating[],
  now: Date = new Date()
): { doc: jsPDF; fileName: string; data: EmployerReportPdfData } {
  const data = buildEmployerReportPdfData(companyProfile, jobs, ratings, now);
  const fileName = buildEmployerReportPdfFilename(companyProfile.nomeFantasia);

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

  // Top terracotta bar
  doc.setFillColor(201, 59, 30);
  doc.rect(marginX, cursorY, contentWidth, 1.8, 'F');
  cursorY += 8;

  // Header kicker
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(201, 59, 30);
  doc.text(
    'BRICKJOBS · RELATÓRIO DE DESEMPENHO E VAGAS · RONDONÓPOLIS-MT',
    marginX,
    cursorY
  );
  cursorY += 7;

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  const nameLines = doc.splitTextToSize(data.companyName, contentWidth);
  doc.text(nameLines, marginX, cursorY);
  cursorY += nameLines.length * 7 + 2;

  // Subtitle / CNPJ & Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`CNPJ: ${data.cnpj}  ·  ${data.locationLine}`, marginX, cursorY);
  cursorY += 8;

  // KPI Summary Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, cursorY, contentWidth, 22, 2, 2, 'FD');

  const colW = contentWidth / 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('VAGAS ABERTAS', marginX + 4, cursorY + 6);
  doc.text('VAGAS CONCLUÍDAS', marginX + colW + 4, cursorY + 6);
  doc.text('TEMPO MÉDIO', marginX + colW * 2 + 4, cursorY + 6);
  doc.text('AVALIAÇÃO MÉDIA', marginX + colW * 3 + 4, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(String(data.openJobs), marginX + 4, cursorY + 15);
  doc.text(String(data.closedJobs), marginX + colW + 4, cursorY + 15);
  doc.text(data.averageFillDays, marginX + colW * 2 + 4, cursorY + 15);
  doc.text(
    `${data.formattedOverallRating} ★`,
    marginX + colW * 3 + 4,
    cursorY + 15
  );
  cursorY += 28;

  // Completed Jobs Section
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(
    `Histórico de Vagas Concluídas (${data.completedJobsList.length})`,
    marginX,
    cursorY
  );
  cursorY += 6;

  if (data.completedJobsList.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(
      'Nenhuma vaga concluída registrada no sistema até o momento.',
      marginX,
      cursorY
    );
    cursorY += 8;
  } else {
    for (const job of data.completedJobsList) {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      doc.text(job.funcao, marginX, cursorY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(201, 59, 30);
      doc.text(
        `${job.fillDurationDays} ${
          job.fillDurationDays === 1 ? 'dia' : 'dias'
        } para preencher`,
        marginX + contentWidth,
        cursorY,
        {
          align: 'right',
        }
      );
      cursorY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(
        `Local: ${job.bairro}  ·  Vagas preenchidas: ${job.quantidadeVagas}  ·  Concluída em: ${job.closedAt}`,
        marginX,
        cursorY
      );
      cursorY += 5;

      doc.setDrawColor(243, 244, 246);
      doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
      cursorY += 5;
    }
  }

  // Footer on pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(marginX, pageHeight - 14, marginX + contentWidth, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Relatório gerado pelo BrickJobs (Rondonópolis-MT) em ${data.generatedDateLabel}`,
      marginX,
      pageHeight - 9
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      marginX + contentWidth,
      pageHeight - 9,
      {
        align: 'right',
      }
    );
  }

  return { doc, fileName, data };
}

export function exportEmployerReportPdf(
  companyProfile: CompanyProfile,
  jobs: JobPosting[],
  ratings: CompanyRating[],
  now: Date = new Date()
):
  | { ok: true; fileName: string; pageCount: number }
  | { ok: false; error: string } {
  try {
    const { doc, fileName } = createEmployerReportPdfDocument(
      companyProfile,
      jobs,
      ratings,
      now
    );
    doc.save(fileName);
    return {
      ok: true,
      fileName,
      pageCount: doc.getNumberOfPages(),
    };
  } catch {
    return {
      ok: false,
      error: 'Não foi possível gerar o relatório em PDF. Tente novamente.',
    };
  }
}
