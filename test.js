import test from 'ava';
import appreciateApi from './';

test('successful parsing of auth token', t => {
    return appreciateApi.readAuthToken('./test/sample_auth_token').then(result => {
        t.is(result, '12345678901234567890abcdefabcdef12345678');
    });
});

test('unsuccessful parsing of auth token', t => {
    t.throws(appreciateApi.readAuthToken('./test/non-existent-file'));
});

test('extracts dependencies correctly', t => {
    const pkgJSON = JSON.parse('{    ' +
      '"dependencies": {             ' +
      '  "expand-home-dir": "0.0.3", ' +
      '  "gh-got": "^5.0.0",         ' +
      '  "mz": "^2.4.0"              ' +
      '},                            ' +
      '"devDependencies": {          ' +
      '  "ava": "^0.16.0",           ' +
      '  "xo": "^0.16.0"             ' +
      '}                             ' +
    '}');

    let deps = appreciateApi.getProjectDependencies(pkgJSON);
    deps.sort();
    t.deepEqual(deps, ['ava', 'expand-home-dir', 'gh-got', 'mz', 'xo']);
});
