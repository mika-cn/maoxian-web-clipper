const H = require('./helper.js');
const CacheService = H.depJs('background/cache-service.js');

describe('CacheService', () => {
  it('cache action - resolve', async () => {
    const action = () => Promise.resolve(1);
    await H.assertResolve(
      CacheService.findOrCache('key', action),
      (v) => {
        H.assertFalse(v.fromCache);
        H.assertEqual(v.result, 1);
      }
    );

    await H.assertResolve(
      CacheService.findOrCache('key', action),
      (v) => {
        H.assertTrue(v.fromCache);
        H.assertEqual(v.result, 1);
      }
    );
  })

  it('cache action - reject', async () => {
    CacheService.removeByKeyPrefix('k');
    const action = () => Promise.reject(0);
    await H.assertReject(
      CacheService.findOrCache('key', action),
      (v) => {
        H.assertFalse(v.fromCache);
        H.assertEqual(v.result, 0);
      }
    );

    await H.assertReject(
      CacheService.findOrCache('key', action),
      (v) => {
        H.assertTrue(v.fromCache);
        H.assertEqual(v.result, 0);
      }
    );

  });

});
