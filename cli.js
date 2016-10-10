#!/usr/bin/env node
'use strict';

const fs = require('mz/fs');
const Multispinner = require('multispinner');
const expandHomeDir = require('expand-home-dir');
const chalk = require('chalk');
const dotsSpinner = require('cli-spinners').dots;

const api = require('./');

function makePadding(spaces) {
    if (spaces === 0) {
        return '';
    } else if (spaces % 2 === 0) {
        const ch = makePadding(spaces / 2);
        return ch + ch;
    }

    return makePadding(spaces - 1) + ' ';
}

function makeTask(token, moduleInfo, multiSpinners, maxPad) {
    const moduleName = api.getName(moduleInfo);
    const padding = makePadding(maxPad - moduleName.length + 1);

    return api.isAppreciated(token, moduleInfo).then(
        x => {
            if (x.error) {
                multiSpinners.spinners[moduleName].text += padding + chalk.red(x.error);
                multiSpinners.error(moduleName);
                return;
            }

            multiSpinners.spinners[moduleName].text += padding + (x.starred ? chalk.blue('★ Starred.') : chalk.yellow('☆ Not starred!'));
            multiSpinners.success(moduleName);
            return Promise.resolve();
        },
        err => {
            multiSpinners.spinners[moduleName].text += padding + err;
            multiSpinners.error(moduleName);
            return Promise.reject(err);
        }
    );
}

// No command line arguments so far.
api.readAuthToken()
.then(
    token => {
        console.info('Project dependencies: ');
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
        ).then(moduleInfos => api.getUniqueRepos(moduleInfos))
        .then(uniqueModuleInfos => {
            // make the repository names unique to allow for multiple packages
            // pointing to the same repository.
            const spinnerNames = uniqueModuleInfos.map(x => {
                return api.getName(x);
            });

            spinnerNames.sort();

            const maxPadding = Math.max.apply(
                null,
                spinnerNames.map(x => {
                    return x.length;
                })
            );

            const multiSpinners = new Multispinner(spinnerNames, {
                clear: false,
                autoStart: true,
                frames: dotsSpinner.frames,
                interval: dotsSpinner.interval
            });

            return Promise.all(uniqueModuleInfos.map(x => {
                return makeTask(token, x, multiSpinners, maxPadding);
            }));
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
