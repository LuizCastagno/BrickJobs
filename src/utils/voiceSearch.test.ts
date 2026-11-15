import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractTranscriptFromSpeechEvent,
  getSpeechRecognitionConstructor,
  getVoiceErrorMessage,
  isWebSpeechSupported,
  normalizeVoiceTranscript,
  parseVoiceJobCommand,
} from './voiceSearch';

test('getSpeechRecognitionConstructor and isWebSpeechSupported detect standard and webkit APIs', () => {
  class MockSpeechRecognition {}
  class MockWebkitSpeechRecognition {}

  assert.equal(isWebSpeechSupported({}), false);
  assert.equal(isWebSpeechSupported(null), false);
  assert.equal(
    getSpeechRecognitionConstructor({ SpeechRecognition: MockSpeechRecognition }),
    MockSpeechRecognition
  );
  assert.equal(
    getSpeechRecognitionConstructor({
      webkitSpeechRecognition: MockWebkitSpeechRecognition,
    }),
    MockWebkitSpeechRecognition
  );
  assert.equal(
    isWebSpeechSupported({ webkitSpeechRecognition: MockWebkitSpeechRecognition }),
    true
  );
});

test('normalizeVoiceTranscript removes stray punctuation and extra spaces', () => {
  assert.equal(
    normalizeVoiceTranscript('  Buscar vagas de pedreiro!  '),
    'Buscar vagas de pedreiro'
  );
  assert.equal(
    normalizeVoiceTranscript('Instalações   elétricas.'),
    'Instalações elétricas'
  );
});

test('parseVoiceJobCommand extracts job keywords from Portuguese voice phrases', () => {
  assert.deepEqual(parseVoiceJobCommand('pedreiro'), {
    action: 'search',
    query: 'pedreiro',
    rawTranscript: 'pedreiro',
  });

  assert.deepEqual(parseVoiceJobCommand('Buscar vagas de pedreiro.'), {
    action: 'search',
    query: 'pedreiro',
    rawTranscript: 'Buscar vagas de pedreiro',
  });

  assert.deepEqual(parseVoiceJobCommand('Quero oportunidade para eletricista predial por favor'), {
    action: 'search',
    query: 'eletricista predial',
    rawTranscript: 'Quero oportunidade para eletricista predial por favor',
  });

  assert.deepEqual(parseVoiceJobCommand('Procurar instalações elétricas'), {
    action: 'search',
    query: 'instalações elétricas',
    rawTranscript: 'Procurar instalações elétricas',
  });
});

test('parseVoiceJobCommand recognizes voice reset/clear commands', () => {
  assert.deepEqual(parseVoiceJobCommand('limpar busca'), {
    action: 'clear',
    query: '',
    rawTranscript: 'limpar busca',
  });

  assert.deepEqual(parseVoiceJobCommand('mostrar todas as vagas'), {
    action: 'clear',
    query: '',
    rawTranscript: 'mostrar todas as vagas',
  });
});

test('extractTranscriptFromSpeechEvent handles interim and final speech result lists', () => {
  const interimEvent = {
    resultIndex: 0,
    results: {
      length: 1,
      0: {
        isFinal: false,
        length: 1,
        0: { transcript: 'buscar vagas de armador' },
      },
    },
  };
  assert.deepEqual(extractTranscriptFromSpeechEvent(interimEvent), {
    transcript: 'buscar vagas de armador',
    isFinal: false,
  });

  const finalEvent = {
    resultIndex: 0,
    results: {
      length: 1,
      0: {
        isFinal: true,
        length: 1,
        0: { transcript: 'eletricista predial' },
      },
    },
  };
  assert.deepEqual(extractTranscriptFromSpeechEvent(finalEvent), {
    transcript: 'eletricista predial',
    isFinal: true,
  });
});

test('getVoiceErrorMessage provides friendly pt-BR messages for speech errors', () => {
  assert.match(getVoiceErrorMessage('not-allowed'), /Permissão do microfone negada/);
  assert.match(getVoiceErrorMessage('no-speech'), /Nenhuma fala detectada/);
  assert.match(getVoiceErrorMessage('audio-capture'), /Nenhum microfone encontrado/);
  assert.match(getVoiceErrorMessage('network'), /Erro de conexão/);
  assert.match(getVoiceErrorMessage('aborted'), /cancelada/);
});
