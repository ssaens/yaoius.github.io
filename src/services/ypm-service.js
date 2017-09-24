import React from 'react';
import { fetchJson, makeRequest } from './utils';
import { NODE_TYPE } from '../components/sections/splash/shell/filesystem';

const PREFIX_STRING = 'https://raw.githubusercontent.com/yaoius/ypm/master';
const REGISTER_URL = `${PREFIX_STRING}/register.json`;
const MODULE_DIR = '/.ypm_modules';

class YpmService {
    constructor() {
        this._cachedPackageListPromise = null;
    }

    fetchPackageList(force=false) {
        if (force || !this._cachedPackageListPromise) {
            this._cachedPackageListPromise = fetchJson(REGISTER_URL).then(data => {
                return data.packages;
            });
        }
        return this._cachedPackageListPromise;
    }

    fetchPackage(name, version) {
        return this.fetchPackageList().then(list => {
            const module = list[name];
            if (!module) {
                return Promise.reject('No such module');
            }
            version = version || module.latest;
            const ref = this._getUrl(module.ref[version]);
            return makeRequest('GET', ref).then(data => {
                return {
                    data,
                    version,
                    name: name
                };
            }).catch(error => {
                return Promise.reject(`Error in fetching module ${name} v${version}`);
            });
        });
    }

    _getUrl(file) {
        return `${PREFIX_STRING}/${file}`;
    }
}

class Ypm {
    constructor() {
        this.ypm = new YpmService();
    }

    main(resolve, args, fs, io) {
        this.modulesDir = fs.resolve(MODULE_DIR);
        this.resolve = resolve;
        this.modules = this.modules || { fs, io };
        if (args[0] === 'list') {
            this.list(args);
            resolve();
        } else if (args[0] === 'search') {
            this.search(args);
        } else if (args[0] === 'install' || args[0] === 'i') {
            this.install(args);
            resolve();
        } else if (args[0] === 'help') {
            this.help();
            resolve();
        } else {
            resolve();
        }
    }

    help() {
        const { io } = this.modules;
        io.println('usage:');
    }

    list(args) {
        const { io } = this.modules;
        const modules = this.modulesDir.children;
        io.println(modules.map((node, i) => <exe key={i}>{node.name}</exe>));
    }

    search(args) {
        const { io } = this.modules;
        io.print("Available packages:");
        this.ypm.fetchPackageList().then(list => {
            for (const p of Object.keys(list)) {
                io.println(p);
            }
            this.resolve();
        }).catch(error => {
            io.print("Error in fetching register");
            this.resolve();
        });
    }

    install(args) {
        const { io } = this.modules;
        const name = args[1];
        if (!name) {
            this.help();
            this.resolve();
            return;
        }
        io.println('fetching package...');
        this.ypm.fetchPackage(name).then(p => {
            io.println('installing...');
            this._installPackage(p.name, p.data);
            io.println(`installed package ${p.name} v${p.version}`);
            this.resolve();
        }).catch(error => {
            io.println(error.toString());
            this.resolve();
        });
    }

    _installPackage(name, src) {
        let __main__ = null, __exports__ = null;
        const include = (module) => this._include(module, name);
        const code = `(function() {
            const io = include('io');
            let resolve, exports;
            ${src}
            if (main) {
                __main__ = (__resolve, args) => {
                    resolve = __resolve;
                    main(args);
                }; 
            }
            if (exports) {
                __exports__ = exports;
            }
        })()`;
        eval(code);

        if (__main__) {
            const { fs } = this.modules;
            fs.createNode(NODE_TYPE.EXE, MODULE_DIR, name, __main__, src);
        }
        if (__exports__) {
            this.modules[name] = __exports__;
        } else {
            this.modules[name] = null;
        }
    }

    _include(name, parent) {
        const module = this.modules[name];
        const { io } = this.modules;
        if (module === null) {
            io.println(`Module ${name} has no exports defined`);
        } else if (!module) {
            io.println(`Module ${parent} requires an include of ${name}`);
        }
        return module;
    }
}

const ypmManager = new Ypm();
const ypm = (resolve, args, fs, io) => ypmManager.main(resolve, args, fs, io);

export default ypm;