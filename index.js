'use strict';
// const ghGot = require('gh-got');
const path = require('path');
const fs = require('mz/fs');
const expandHomeDir = require('expand-home-dir');
const hostedGitInfo = require('hosted-git-info');

function areAppreciated(/* githubAccessToken, repositories */) {

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
                return null;
            }
        );
    })).then(maybePkgJSONs => {
        // Ignore all the failures to read package.json files.
        return maybePkgJSONs.filter(Boolean);
    }).then(pkgJSONs => {
        // Extract only those modules which have valid Github repository
        // information.
        return pkgJSONs.map(x => {
            return {
                moduleName: x.moduleName,
                githubInfo: getProjectUserRepo(x.pkgJSON)
            };
        }).filter(x => {
            return Boolean(x.githubInfo);
        });
    });
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
    areAppreciated,
    readAuthToken,
    findNodeModulesOnGithub,
    getProjectDependencies,
    getProjectUserRepo
};
