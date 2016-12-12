'use strict';

const path = require('path');
const configparser = require('gemini-configparser');
const _ = require('lodash');
const GeminiError = require('../errors/gemini-error');
const util = require('./util');

const browserOptions = require('./browser-options');
const options = require('gemini-core').options;

const is = util.is;
const anyObject = util.anyObject;
const resolveWithProjectRoot = util.resolveWithProjectRoot;
const booleanOption = util.booleanOption;
const positiveIntegerOption = util.positiveIntegerOption;
const root = configparser.root;
const section = configparser.section;
const option = configparser.option;
const map = configparser.map;

module.exports = root(
    section(_.extend(browserOptions.getTopLevel(), {
        system: section({
            projectRoot: option({
                validate: is('string'),
                map: _.ary(path.resolve, 1)
            }),

            sourceRoot: option({
                validate: is('string'),
                map: resolveWithProjectRoot,
                defaultValue: function(config) {
                    return config.system.projectRoot;
                }
            }),

            tempDir: option({
                validate: is('string'),
                defaultValue: ''
            }),

            plugins: anyObject(),

            debug: booleanOption(false),

            parallelLimit: positiveIntegerOption(Infinity),

            diffColor: option({
                defaultValue: '#ff00ff',
                validate: function(value) {
                    if (typeof value !== 'string') {
                        throw new GeminiError('Field "diffColor" must be string');
                    }

                    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
                        throw new GeminiError('Field "diffColor" must be hexadecimal color string (i.e. #ff0000)');
                    }
                }
            }),

            coverage: section({
                enabled: booleanOption(false),
                map: option({
                    defaultValue: () => {
                        return (url, rootUrl) => url.replace(rootUrl, '').replace(/^\//, '');
                    },
                    validate: (value) => {
                        if (!_.isFunction(value)) {
                            throw new GeminiError('"coverage.map" must be a function');
                        }
                    }
                }),
                exclude: option({
                    defaultValue: [],
                    validate: function(value) {
                        if (!_.isArray(value)) {
                            throw new GeminiError('"coverage.exclude" must be an array');
                        }

                        if (!_.every(value, _.isString)) {
                            throw new GeminiError('"coverage.exclude" must be an array of strings');
                        }
                    }
                }),
                html: booleanOption(true)
            }),

            exclude: option({
                defaultValue: [],
                validate: function(value) {
                    if (_.isString(value)) {
                        return;
                    }

                    if (!_.every(value, _.isString)) {
                        throw new GeminiError('"exclude" must be an array of strings');
                    }
                },
                map: (value) => [].concat(value)
            })
        }),

        sets: options.sets,

        browsers: map(section(browserOptions.getPerBrowser()))
    }))
);
