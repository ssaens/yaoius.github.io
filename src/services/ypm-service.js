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
                }
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

    main(args, fs, out) {
        this.modulesDir = fs.resolve(MODULE_DIR);
        this.modules = { fs, out };
        if (args[0] === 'list') {
            this.list(args);
        } else if (args[0] === 'search') {
            this.search(args);
        } else if (args[0] === 'install' || args[0] === 'i') {
            this.install(args);
        } else if (args[0] === 'help') {
            this.help();
        }
    }

    help() {
        const { out } = this.modules;
        out.print('usage:');
    }

    list(args) {
        const { out } = this.modules;
        const modules = this.modulesDir.children;
        out.print(modules.map(node => node.name));
    }

    search(args) {
        const { out } = this.modules;
        out.print("Available packages:");
        this.ypm.fetchPackageList().then(list => {
            for (const p of Object.keys(list)) {
                out.print(p);
            }
        }).catch(error => {
            out.print("Error in fetching register");
        });
        // this.wait();
    }

    install(args) {
        const { out } = this.modules;
        const name = args[1];
        if (!name) {
            this.help();
            return;
        }
        out.print('fetching package...');
        this.ypm.fetchPackage(name).then(p => {
            out.print('installing...');
            this._installPackage(p.name, p.data);
            out.print(`installed package ${p.name} v${p.version}`);
        }).catch(error => {
            out.print(error);
        });
        // this.wait();
    }

    _installPackage(name, src) {
        let __main__ = null;
        const include = (module) => this._include(module);
        const closure = `(function() { const out = include('out'); ${src} __main__ = main; })()`;
        eval(closure);

        const { fs } = this.modules;
        fs.createNode(NODE_TYPE.EXE, MODULE_DIR, name, __main__, src);
    }

    _include(name) {
        const module = this.modules[name];
        if (!module) {
            // TODO
        }
        return module;
    }

    wait() {
        // console.log(this.working);
        // while (this.working) {
        //     console.log(this.working);
        // }
    }
}

const ypmManager = new Ypm();
const ypm = (args, fs, out) => ypmManager.main(args, fs, out);

export default ypm;