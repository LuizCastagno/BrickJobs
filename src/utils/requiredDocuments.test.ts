import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countAttachedRequiredDocuments,
  formatRegistrantSexLabel,
  getResolvedDocumentRequirements,
  normalizeRegistrantSex,
  sanitizeRequiredDocumentsMap,
  validateDocumentFile,
  validateRequiredRegistrationDocuments,
} from './requiredDocuments';
import type { DocumentAttachment, RequiredDocumentsMap } from '../types/brickjobs';

const sampleDoc = (name: string): DocumentAttachment => ({
  fileName: name,
  fileSizeBytes: 10240,
  mimeType: 'application/pdf',
  uploadedAt: '2026-11-17',
  dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK',
});

test('both sexes require historicoCriminal and tituloEleitor', () => {
  const femaleReqs = getResolvedDocumentRequirements('feminino', {});
  assert.equal(femaleReqs.find((r) => r.key === 'historicoCriminal')?.required, true);
  assert.equal(femaleReqs.find((r) => r.key === 'tituloEleitor')?.required, true);
  assert.equal(femaleReqs.find((r) => r.key === 'reservistaOuCdi')?.required, false);

  const outroReqs = getResolvedDocumentRequirements('outro', {});
  assert.equal(outroReqs.find((r) => r.key === 'historicoCriminal')?.required, true);
  assert.equal(outroReqs.find((r) => r.key === 'tituloEleitor')?.required, true);
  assert.equal(outroReqs.find((r) => r.key === 'reservistaOuCdi')?.required, false);
});

test('male registrants additionally require reservistaOuCdi', () => {
  const maleReqs = getResolvedDocumentRequirements('masculino', {});
  assert.equal(maleReqs.find((r) => r.key === 'historicoCriminal')?.required, true);
  assert.equal(maleReqs.find((r) => r.key === 'tituloEleitor')?.required, true);
  assert.equal(maleReqs.find((r) => r.key === 'reservistaOuCdi')?.required, true);
});

test('validation fails when sex is not selected', () => {
  const result = validateRequiredRegistrationDocuments('', {}, 'contratado');
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.errorMessage, /Selecione o sexo/);
  }
});

test('validation fails when male registrant is missing reservistaOuCdi even with both common docs attached', () => {
  const docs: RequiredDocumentsMap = {
    historicoCriminal: sampleDoc('antecedentes.pdf'),
    tituloEleitor: sampleDoc('titulo.pdf'),
  };
  const maleResult = validateRequiredRegistrationDocuments('masculino', docs, 'contratante');
  assert.equal(maleResult.valid, false);
  if (!maleResult.valid) {
    assert.deepEqual(maleResult.missingKeys, ['reservistaOuCdi']);
    assert.match(maleResult.errorMessage, /Reservista/);
  }

  const femaleResult = validateRequiredRegistrationDocuments('feminino', docs, 'contratante');
  assert.equal(femaleResult.valid, true);
});

test('validation passes for male registrant when all 3 documents are attached', () => {
  const docs: RequiredDocumentsMap = {
    historicoCriminal: sampleDoc('antecedentes.pdf'),
    tituloEleitor: sampleDoc('titulo.pdf'),
    reservistaOuCdi: sampleDoc('cdi.pdf'),
  };
  const result = validateRequiredRegistrationDocuments('masculino', docs, 'contratado');
  assert.equal(result.valid, true);
});

test('countAttachedRequiredDocuments computes accurate progress per sex', () => {
  const partialDocs: RequiredDocumentsMap = {
    historicoCriminal: sampleDoc('antecedentes.pdf'),
    tituloEleitor: sampleDoc('titulo.pdf'),
  };

  assert.deepEqual(countAttachedRequiredDocuments('feminino', partialDocs), {
    attachedCount: 2,
    totalRequired: 2,
    isComplete: true,
  });

  assert.deepEqual(countAttachedRequiredDocuments('masculino', partialDocs), {
    attachedCount: 2,
    totalRequired: 3,
    isComplete: false,
  });

  assert.deepEqual(
    countAttachedRequiredDocuments('masculino', {
      ...partialDocs,
      reservistaOuCdi: sampleDoc('reservista.pdf'),
    }),
    {
      attachedCount: 3,
      totalRequired: 3,
      isComplete: true,
    }
  );
});

test('validateDocumentFile checks file format and 1.5 MB limit', () => {
  assert.equal(
    validateDocumentFile({ name: 'doc.pdf', type: 'application/pdf', size: 2048 }).ok,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'foto.jpg', type: 'image/jpeg', size: 50000 }).ok,
    true
  );
  assert.equal(
    validateDocumentFile({ name: 'planilha.xlsx', type: 'application/vnd.ms-excel', size: 2048 }).ok,
    false
  );
  assert.equal(
    validateDocumentFile({
      name: 'grande.pdf',
      type: 'application/pdf',
      size: 2 * 1024 * 1024,
    }).ok,
    false
  );
  assert.equal(
    validateDocumentFile({ name: 'vazio.pdf', type: 'application/pdf', size: 0 }).ok,
    false
  );
});

test('normalizeRegistrantSex, formatRegistrantSexLabel, and sanitizeRequiredDocumentsMap handle malformed inputs', () => {
  assert.equal(normalizeRegistrantSex('masculino'), 'masculino');
  assert.equal(normalizeRegistrantSex('invalido'), '');
  assert.equal(formatRegistrantSexLabel('feminino'), 'Feminino');
  assert.equal(formatRegistrantSexLabel(''), 'Não informado');

  const sanitized = sanitizeRequiredDocumentsMap({
    historicoCriminal: sampleDoc('ok.pdf'),
    tituloEleitor: { fileName: '', fileSizeBytes: 0, mimeType: '', uploadedAt: '', dataUrl: '' },
  });
  assert.equal(sanitized.historicoCriminal?.fileName, 'ok.pdf');
  assert.equal(sanitized.tituloEleitor, null);
  assert.equal(sanitized.reservistaOuCdi, null);
});
