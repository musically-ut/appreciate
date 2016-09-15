'use strict';
// const ghGot = require('gh-got');
const fs = require('mz/fs');
const expandHomeDir = require('expand-home-dir');

function areAppreciated(/* githubAuthToken, dependentModules */) {

}

function findNodeModulesOnGithub(path) {
    if (!path) {
        path = './node_modules';
    }
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
        return null;
    }

    if (typeof packageJSON.repository === 'string') {
        let repoStr = packageJSON.repository;

        if (repoStr.indexOf(':') !== -1) {
            // This means that the location is not on Github.
            // As Github does not allow ':' in the names and the other services
            // use it as a delimiter.
            return null;
        }

        let userRepo = repoStr.split('/');
        return {
            user: userRepo[0],
            repo: userRepo[1]
        };
    }

    if (!packageJSON.repository.type || !packageJSON.repository.url) {
        // Most likely malformed package.json
        return null;
    }

    let repoType = packageJSON.repository.type.toLowerCase();
    let repoUrl = packageJSON.repository.url.toLowerCase();

    if (repoType !== 'git') {
        // We are looking only for Github
        return null;
    }

    let idxOfGithubCom = repoUrl.indexOf('github.com');

    if (idxOfGithubCom === -1) {
        // If the URL does not contain github.com, return null
        return null;
    }

    let userRepo = repoUrl
         // Gobble up the github.com + 1 delimiter
        .substr(idxOfGithubCom + 'github.com'.length + 1)
         // Replace the .git at the end with ''
        .replace(/\.git$/, '')
         // Split at the '/'
        .split('/');

    return {
        user: userRepo[0],
        repo: userRepo[1]
    };
}

module.exports = {
    areAppreciated,
    readAuthToken,
    findNodeModulesOnGithub,
    getProjectDependencies,
    getProjectUserRepo
};
