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
