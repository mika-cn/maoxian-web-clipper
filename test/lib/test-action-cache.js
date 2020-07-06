
import H from '../helper.js';
import ActionCache from '../../src/js/lib/action-cache.js';

describe('CacheService', () => {
  it('cache action - resolve', async () => {
    const action = () => Promise.resolve(1);
    await H.assertResolve(
      ActionCache.findOrCache('key', action),
      (v) => {
        H.assertFalse(v.fromCache);
        H.assertEqual(v.result, 1);
      }
    );

    await H.assertResolve(
      ActionCache.findOrCache('key', action),
      (v) => {
        H.assertTrue(v.fromCache);
        H.assertEqual(v.result, 1);
      }
    );
  })

  it('cache action - reject', async () => {
    ActionCache.removeByKeyPrefix('k');
    const action = () => Promise.reject(0);
    await H.assertReject(
      ActionCache.findOrCache('key', action),
      (v) => {
        H.assertFalse(v.fromCache);
        H.assertEqual(v.result, 0);
      }
    );

    await H.assertReject(
      ActionCache.findOrCache('key', action),
      (v) => {
        H.assertTrue(v.fromCache);
        H.assertEqual(v.result, 0);
      }
    );

  });

});
