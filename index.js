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

module.exports = {
    areAppreciated,
    readAuthToken,
    findNodeModulesOnGithub,
    getProjectDependencies
};
