#!/usr/bin/env node
'use strict';

const fs = require('mz/fs');
const expandHomeDir = require('expand-home-dir');
const chalk = require('chalk');

const api = require('./');

// No command line arguments so far.
api.readAuthToken()
.then(
    () => {
        console.info('Reading package.json ...');
        fs.readFile('./package.json')
        .then(
            data => {
                let pkgJSON = JSON.parse(data.toString('utf8'));
                let dependencies = api.getProjectDependencies(pkgJSON);
                return api.findNodeModulesOnGithub(dependencies);
            },
            err => {
                console.error('Could not read package.json in the current folder.');
                console.error('Error:', err);
                console.error('Please execute this program in your Node project folder.');
                return Promise.reject(null);
            }
        ).then(githubInfos => {
            githubInfos.forEach(x => {
                if (x.error) {
                    console.error(chalk.red(x.moduleName), '\t:', x.error);
                    return;
                }

                console.log(chalk.green(x.moduleName), '\t:', x.githubInfo.user + '/' + x.githubInfo.repo);
            });
        });
    },
    err => {
        const tokenFile = expandHomeDir('~/.appreciate');
        console.error('Could not read the Access token from', tokenFile);
        console.error('Error:', err);
        console.error('Please generate an Github access token ' +
                      'using the following URL and place it in', tokenFile);
        console.error('\n\thttps://help.github.com/articles/creating-an-access-token-for-command-line-use/');
    }
);
