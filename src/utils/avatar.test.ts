import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAvatarInitials,
  getAvatarPaletteForName,
  hasConfiguredAvatarPhoto,
  MAX_AVATAR_UPLOAD_BYTES,
  validateAvatarImageFile,
} from './avatar';

test('extractAvatarInitials extracts first and last meaningful initials for workers', () => {
  assert.equal(extractAvatarInitials('João Carlos da Silva'), 'JS');
  assert.equal(extractAvatarInitials('Maria Eduarda Oliveira'), 'MO');
  assert.equal(extractAvatarInitials('Ávila dos Santos'), 'AS');
  assert.equal(extractAvatarInitials('Carlos'), 'CA');
  assert.equal(extractAvatarInitials('Ana'), 'AN');
  assert.equal(extractAvatarInitials('J'), 'J');
});

test('extractAvatarInitials ignores Portuguese connectors and legal suffixes for construtoras', () => {
  assert.equal(extractAvatarInitials('Construtora Cerrado Sul'), 'CS');
  assert.equal(extractAvatarInitials('Engenharia Mato Grosso Ltda'), 'EG');
  assert.equal(extractAvatarInitials('Rondonópolis Obras & Infra'), 'RI');
  assert.equal(extractAvatarInitials('Pantanal Edificações'), 'PE');
  assert.equal(extractAvatarInitials('Araguaia S.A.'), 'AR');
});

test('extractAvatarInitials returns fallback when name is empty or punctuation-only', () => {
  assert.equal(extractAvatarInitials(''), 'BJ');
  assert.equal(extractAvatarInitials('   '), 'BJ');
  assert.equal(extractAvatarInitials(null, 'BR'), 'BR');
  assert.equal(extractAvatarInitials('--- & ---', 'CR'), 'CR');
});

test('getAvatarPaletteForName returns consistent deterministic palettes', () => {
  const first = getAvatarPaletteForName('Construtora Cerrado Sul', 'company');
  const second = getAvatarPaletteForName('  construtora cerrado sul ', 'company');
  assert.deepEqual(first, second);
  assert.equal(first.textColor, '#FFFFFF');
});

test('hasConfiguredAvatarPhoto accurately detects empty vs configured photo strings', () => {
  assert.equal(hasConfiguredAvatarPhoto(undefined), false);
  assert.equal(hasConfiguredAvatarPhoto(null), false);
  assert.equal(hasConfiguredAvatarPhoto(''), false);
  assert.equal(hasConfiguredAvatarPhoto('   '), false);
  assert.equal(hasConfiguredAvatarPhoto('data:image/png;base64,abc'), true);
  assert.equal(hasConfiguredAvatarPhoto('https://example.com/foto.jpg'), true);
});

test('validateAvatarImageFile validates image mime types, extensions, and max file size', () => {
  assert.equal(
    validateAvatarImageFile({ name: 'perfil.jpg', type: 'image/jpeg', size: 120_000 }).ok,
    true
  );
  assert.equal(
    validateAvatarImageFile({ name: 'logo.webp', type: 'image/webp', size: 80_000 }).ok,
    true
  );
  assert.equal(
    validateAvatarImageFile({ name: 'curriculo.pdf', type: 'application/pdf', size: 50_000 }).ok,
    false
  );
  assert.equal(
    validateAvatarImageFile({
      name: 'gigante.png',
      type: 'image/png',
      size: MAX_AVATAR_UPLOAD_BYTES + 1,
    }).ok,
    false
  );
});
