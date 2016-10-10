'use strict';
const path = require('path');
const fs = require('mz/fs');
const ghGot = require('gh-got');
const expandHomeDir = require('expand-home-dir');
const hostedGitInfo = require('hosted-git-info');

function isStarredURL(githubInfo) {
    return 'user/starred/' + githubInfo.user + '/' + githubInfo.repo;
}

function getAppreciateModuleInfo() {
    return {
        moduleName: 'appreciate',
        githubInfo: {
            user: 'musically-ut',
            repo: 'appreciate'
        }
    };
}

function getName(moduleInfo) {
    if (moduleInfo.error) {
        // If there was an error early on, then githubInfo may not be present
        // in the moduleInfo at all.
        return moduleInfo.moduleName;
    }

    return moduleInfo.githubInfo.user + '/' + moduleInfo.githubInfo.repo;
}

function isAppreciated(githubAccessToken, moduleRepoInfo) {
    const opts = {token: githubAccessToken};
    if (moduleRepoInfo.error) {
        // The moduleRepoInfo has an error embedded in it.
        return Promise.resolve(moduleRepoInfo);
    }

    return ghGot(isStarredURL(moduleRepoInfo.githubInfo), opts)
            .then(
                () => {
                    return Object.assign({}, moduleRepoInfo, {starred: true});
                },
                err => {
                    if (err.statusCode === 404) {
                        return Object.assign(
                            {},
                            moduleRepoInfo,
                            {starred: false}
                        );
                    }

                    return Object.assign(
                        {},
                        moduleRepoInfo,
                        {error: err.statusMessage || 'Unknown error.'}
                    );
                }
            );
}

function areAppreciated(githubAccessToken, moduleRepoInfos) {
    return Promise.all(moduleRepoInfos.map(moduleRepoInfo => {
        return isAppreciated(githubAccessToken, moduleRepoInfo);
    }));
}

function findNodeModulesOnGithub(moduleNames, forProject, verbose) {
    forProject = forProject || '.';

    let nodeModulesPath = path.join(forProject, 'node_modules');
    return Promise.all(moduleNames.map(moduleName => {
        let pkgJSONpath = path.join(nodeModulesPath, moduleName, 'package.json');
        return fs.readFile(pkgJSONpath).then(
            data => {
                return {
                    moduleName: moduleName,
                    pkgJSON: JSON.parse(data.toString('utf8'))
                };
            },
            err => {
                if (verbose) {
                    console.error('Error: ', err, 'Ignoring file.');
                }

                return {
                    moduleName: moduleName,
                    error: 'package.json not found.'
                };
            }
        );
    })).then(maybePkgJSONs => {
        // Extract only those modules which have valid Github repository
        // information.
        return maybePkgJSONs.map(x => {
            if (x.pkgJSON) {
                let githubInfo = getProjectUserRepo(x.pkgJSON);

                if (!githubInfo) {
                    return {
                        moduleName: x.moduleName,
                        error: 'Not a Github repository.'
                    };
                }

                return {
                    moduleName: x.moduleName,
                    githubInfo: githubInfo
                };
            }
            return x;
        });
    });
}

function getUniqueRepos(mbModuleInfos) {
    // Keep only one moduleInfo for one repository.
    // This is because more than one module can point to the same repository.
    // The ties are broken in an arbitrary way.
    // See #2.

    let uniqueModuleMap = {};
    mbModuleInfos.forEach(x => {
        uniqueModuleMap[getName(x)] = x;
    });

    return Object.keys(uniqueModuleMap).map(x => uniqueModuleMap[x]);
}

function readAuthToken(authFile) {
    if (!authFile) {
        authFile = expandHomeDir('~/.appreciate');
    }

    return fs.readFile(authFile).then(tokenBuffer => {
        // Convert the buffer to string
        return tokenBuffer.toString('utf8').trim();
    });
}

function getProjectDependencies(packageJSON) {
    let dependencies = packageJSON.dependencies ? Object.keys(packageJSON.dependencies) : [];
    let devDependencies = packageJSON.devDependencies ? Object.keys(packageJSON.devDependencies) : [];

    return dependencies.concat(devDependencies);
}

function getProjectUserRepo(packageJSON) {
    if (!packageJSON.repository) {
        // If the package does not have any repository field, return null
        return null;
    }

    const info = hostedGitInfo.fromUrl(typeof packageJSON.repository === 'string' ?
                                       packageJSON.repository :
                                       packageJSON.repository.url);
    if (info && info.type === 'github') {
        return {
            user: info.user,
            repo: info.project
        };
    }

    return null;
}

module.exports = {
    isStarredURL,
    isAppreciated,
    areAppreciated,
    readAuthToken,
    findNodeModulesOnGithub,
    getProjectDependencies,
    getProjectUserRepo,
    getName,
    getUniqueRepos,
    getAppreciateModuleInfo

};
