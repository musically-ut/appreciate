import test from 'ava';
import api from './';

test('successful parsing of auth token', t => {
    return api.readAuthToken('./test/sample_auth_token').then(result => {
        t.is(result, '12345678901234567890abcdefabcdef12345678');
    });
});

test('unsuccessful parsing of auth token', t => {
    t.throws(api.readAuthToken('./test/non-existent-file'));
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

    let deps = api.getProjectDependencies(pkgJSON);
    deps.sort();
    t.deepEqual(deps, ['ava', 'expand-home-dir', 'gh-got', 'mz', 'xo']);
});

test('extracts extended https Github repo info correctly', t => {
    const pkgJSON = {
        repository: {
            type: 'git',
            url: 'https://github.com/user/repo.git'
        }
    };

    t.deepEqual(api.getProjectUserRepo(pkgJSON), {
        user: 'user',
        repo: 'repo'
    });
});

test('extracts extended ssh Github repo info correctly 2', t => {
    const pkgJSON = {
        repository: {
            type: 'git',
            url: 'git@github.com:user/repo.git'
        }
    };

    t.deepEqual(api.getProjectUserRepo(pkgJSON), {
        user: 'user',
        repo: 'repo'
    });
});

test('extracts compact Github repo info correctly ', t => {
    const pkgJSON = {
        repository: 'user/repo'
    };

    t.deepEqual(api.getProjectUserRepo(pkgJSON), {
        user: 'user',
        repo: 'repo'
    });
});

test('ignores non-git repo info', t => {
    const pkgJSON = {
        repository: {
            type: 'svn',
            url: 'https://some-repository.com/some-user/some-repo'
        }
    };

    t.is(api.getProjectUserRepo(pkgJSON), null);
});

test('ignores Gist repo info', t => {
    const pkgJSON = {
        repository: 'gist:some-gist'
    };

    t.is(api.getProjectUserRepo(pkgJSON), null);
});

test('ignores BitBucket repo info', t => {
    const pkgJSON = {
        repository: 'bitbucket:example/repo'
    };

    t.is(api.getProjectUserRepo(pkgJSON), null);
});

test('ignores GitLab repo info', t => {
    const pkgJSON = {
        repository: 'gitlab:example/repo'
    };

    t.is(api.getProjectUserRepo(pkgJSON), null);
});

test('ignores missing repo info', t => {
    const pkgJSON = {};
    t.is(api.getProjectUserRepo(pkgJSON), null);
});

test('should find Github info of node_modules', t => {
    return api.findNodeModulesOnGithub(['xo', 'nyc', 'hosted-git-info', 'mz']).then(githubInfos => {
        let g = {};
        githubInfos.forEach(x => {
            g[x.moduleName] = x.githubInfo;
        });

        t.is(g.xo.user, 'sindresorhus');
        t.is(g.xo.repo, 'xo');

        t.is(g.nyc.user, 'istanbuljs');
        t.is(g.nyc.repo, 'nyc');

        t.is(g.mz.user, 'normalize');
        t.is(g.mz.repo, 'mz');

        t.is(g['hosted-git-info'].user, 'npm');
        t.is(g['hosted-git-info'].repo, 'hosted-git-info');
    });
});

test('should ignore missing/non-github modules', t => {
    return api.findNodeModulesOnGithub(['non-existent-module', 'no-git-module', 'no-repo-module', 'proper-git-module'], './test/').then(githubInfos => {
        t.is(githubInfos.length, 4);
        t.truthy(githubInfos[0].error);
        t.truthy(githubInfos[1].error);
        t.truthy(githubInfos[2].error);

        t.is(githubInfos[3].githubInfo.user, 'musically-ut');
        t.is(githubInfos[3].githubInfo.repo, 'lovely-forks');
    });
});
