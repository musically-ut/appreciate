#!/usr/bin/env node
'use strict';

const fs = require('mz/fs');
const expandHomeDir = require('expand-home-dir');
const chalk = require('chalk');

const api = require('./');

// No command line arguments so far.
api.readAuthToken()
.then(
    token => {
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
        ).then(moduleInfos => {
            return api.areAppreciated(token, moduleInfos);
        }).then(starredInfos => {
            starredInfos.forEach(x => {
                if (x.error) {
                    console.error(chalk.red(x.moduleName), '\t:', x.error);
                    return;
                }

                let githubName = x.githubInfo.user + '/' + x.githubInfo.repo;
                if (x.starred) {
                    console.log(chalk.green(x.moduleName), '\t:', githubName, 'is starred!');
                } else {
                    console.log(chalk.yellow(x.moduleName), '\t:', githubName, 'is not starred!');
                }
            });
        }).catch(err => {
            console.error(chalk.red('Error: '), err);
        });
    },
    err => {
        const tokenFile = expandHomeDir('~/.appreciate');
        console.error('Could not read the Access token from', chalk.blue(tokenFile));
        console.error('Error:', chalk.red(err.message || err));
        console.error('Please generate an Github access token ' +
                      'using the following URL and place it in', chalk.blue(tokenFile));
        console.error(chalk.blue('\n\thttps://help.github.com/articles/creating-an-access-token-for-command-line-use/'));
    }
);
