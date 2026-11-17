import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectIsIOSUserAgent,
  detectStandaloneDisplayMode,
  formatPwaInstallFeedback,
  getPwaInstallSteps,
  resolvePwaInstallMode,
} from './pwaInstall';

test('detectIsIOSUserAgent identifies iPhone, iPad, and iPod cleanly', () => {
  assert.equal(
    detectIsIOSUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15'
    ),
    true
  );
  assert.equal(
    detectIsIOSUserAgent(
      'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15'
    ),
    true
  );
  assert.equal(
    detectIsIOSUserAgent(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile'
    ),
    false
  );
  assert.equal(detectIsIOSUserAgent(''), false);
});

test('detectStandaloneDisplayMode checks both media query and navigator.standalone', () => {
  assert.equal(
    detectStandaloneDisplayMode({ matchMediaStandalone: true, navigatorStandalone: false }),
    true
  );
  assert.equal(
    detectStandaloneDisplayMode({ matchMediaStandalone: false, navigatorStandalone: true }),
    true
  );
  assert.equal(
    detectStandaloneDisplayMode({ matchMediaStandalone: false, navigatorStandalone: false }),
    false
  );
});

test('resolvePwaInstallMode prioritizes installed > native_prompt > ios_guide > manual_guide', () => {
  assert.equal(
    resolvePwaInstallMode({
      isInstalled: true,
      hasDeferredPrompt: true,
      isIOS: true,
    }),
    'installed'
  );
  assert.equal(
    resolvePwaInstallMode({
      isInstalled: false,
      hasDeferredPrompt: true,
      isIOS: false,
    }),
    'native_prompt'
  );
  assert.equal(
    resolvePwaInstallMode({
      isInstalled: false,
      hasDeferredPrompt: false,
      isIOS: true,
    }),
    'ios_guide'
  );
  assert.equal(
    resolvePwaInstallMode({
      isInstalled: false,
      hasDeferredPrompt: false,
      isIOS: false,
    }),
    'manual_guide'
  );
});

test('formatPwaInstallFeedback returns clear pt-BR status messages', () => {
  assert.match(formatPwaInstallFeedback('accepted'), /adicionado à tela inicial/i);
  assert.match(formatPwaInstallFeedback('dismissed'), /cancelada/i);
});

test('getPwaInstallSteps returns 3 structured steps for iOS and manual modes', () => {
  const iosSteps = getPwaInstallSteps('ios_guide');
  assert.equal(iosSteps.length, 3);
  assert.match(iosSteps[0].description, /Safari/i);
  assert.match(iosSteps[1].title, /Adicionar à Tela de Início/i);

  const manualSteps = getPwaInstallSteps('manual_guide');
  assert.equal(manualSteps.length, 3);
  assert.match(manualSteps[1].description, /Adicionar à tela inicial/i);
});
