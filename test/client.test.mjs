import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, pickPageTarget, CDPUnavailable } from '../src/client.js';
import { wrap, playTrackData } from '../src/js.js';

describe('config / target pick', () => {
  it('default port 9222', () => {
    assert.equal(defaultConfig().port, 9222);
  });

  it('picks page by url hint', () => {
    const t = pickPageTarget([
      { type: 'page', url: 'https://music.163.com/#/discover', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/1' },
      { type: 'page', url: 'about:blank', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/devtools/page/2' },
    ], defaultConfig());
    assert.match(t.url, /music\.163\.com/);
  });

  it('fails closed without pages', () => {
    assert.throws(() => pickPageTarget([], defaultConfig()), CDPUnavailable);
  });
});

describe('js helpers', () => {
  it('wrap embeds ensureStore', () => {
    const expr = wrap('return 1;');
    assert.match(expr, /_ensureStore/);
    assert.match(expr, /return 1;/);
  });

  it('playTrackData embeds id', () => {
    assert.match(playTrackData(1446615816), /1446615816/);
  });
});
