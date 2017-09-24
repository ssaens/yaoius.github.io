import React from 'react';
import ypm from '../../../../services/ypm-service';
import { longestCommonPrefix } from '../../../../services/utils';

const sha256 = require('hash.js/lib/hash/sha/256');

const ROOT_KEY = 'd9748af994f492fea9e115460d30289721618d198791d121bb5c6e88ce5448ce';

const NODE_TYPE = {
    DIR: 'dir',
    FILE: 'file',
    EXE: 'exe'
};

const PATH = [
    '/.bin',
    '/.ypm_modules'
];

class FileSystemNode {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.parent = null;
    }

    getDisplayPath() {
        if (!this._displayPath) {
            const path = [];
            let node = this;
            do {
                if (node === HOME) {
                    path.push('~');
                    break;
                }
                path.push(node.name);
                node = node.parent;
            } while (node);
            this._displayPath = path.reverse().join('/') || '/';
        }
        return this._displayPath;
    }

    getAbsolutePath() {
        if (!this._absolutePath) {
            const path = [this.name];
            let node = this.parent;
            while (node) {
                path.push(node.name);
                node = node.parent;
            }
            this._absolutePath = path.reverse().join('/') || '/';
        }
        return this._absolutePath;
    }
}

class DirNode extends FileSystemNode {
    constructor(name, children=[]) {
        super(NODE_TYPE.DIR, name);
        this.children = children;
        for (const child of children) {
            child.parent = this;
        }
    }
}

class FileNode extends FileSystemNode {
    constructor(name, content) {
        super(NODE_TYPE.FILE, name);
        this.content = content;
    }

    toString() {
        return this.content;
    }
}

class ExeNode extends FileSystemNode {
    constructor(name, program, repr) {
        super(NODE_TYPE.EXE, name);
        this.program = this._promisifyProgram(program);
        this.repr = repr || program.toString();
    }

    _promisifyProgram(p) {
        return function(...args) {
            return new Promise((resolve) => {
                p(resolve, ...args);
            }).catch(error => error.toString());
        };
    }

    toString() {
        return this.repr;
    }
}

const PROGRAMS = {
    pwd(resolve, args, fs, io) {
        io.println(fs.wd.getAbsolutePath());
        resolve();
    },

    la(resolve, args, fs, io) {
        let node = fs.wd;
        if (args && args[0]) {
            let resolvedNode = fs.resolve(args[0]);
            if (!resolvedNode) {
                io.sys(`ls: ${args[0]}: No such file or directory`);
                resolve();
                return;
            }
            if (resolvedNode.type !== NODE_TYPE.DIR) {
                io.println(args[0]);
                resolve();
                return;
            }
            node = resolvedNode;
        }
        const list = [];
        for (const c of node.children) {
            let name = c.name;
            if (c.type === NODE_TYPE.DIR) {
                name = <direc key={list.length}>{name}</direc>;
            } else if (c.type === NODE_TYPE.EXE) {
                name = <exe key={list.length}>{name}</exe>;
            }
            list.push(name);
            list.push('\u00A0\u00A0');
        }
        io.println(list);
        resolve();
    },

    ls(resolve, args, fs, io) {
        let node = fs.wd;
        if (args && args[0]) {
            let resolvedNode = fs.resolve(args[0]);
            if (!resolvedNode) {
                io.sys(`ls: ${args[0]}: No such file or directory`);
                resolve();
                return;
            }
            if (resolvedNode.type !== NODE_TYPE.DIR) {
                io.println(args[0]);
                resolve();
                return;
            }
            node = resolvedNode;
        }
        const visible = node.children.filter(child => !child.name.startsWith('.'));
        const list = [];
        for (const c of visible) {
            let name = c.name;
            if (c.type === NODE_TYPE.DIR) {
                name = <direc key={list.length}>{name}</direc>;
            } else if (c.type === NODE_TYPE.EXE) {
                name = <exe key={list.length}>{name}</exe>;
            }
            list.push(name);
            list.push('\u00A0\u00A0');
        }
        io.println(list);
        resolve();
    },

    cd(resolve, args, fs, io) {
        const target = args[0] || '~';
        const node = fs.resolve(target);
        if (!node) {
            io.sys(`cd: ${target}: No such file or directory`);
            resolve();
            return;
        }
        if (node.type !== NODE_TYPE.DIR) {
            io.sys(`cd: ${target}: Not a directory`);
            resolve();
            return;
        }
        fs.wd = node;
        resolve();
    },

    cat(resolve, args, fs, io) {
        const target = args[0];
        if (!target) {
            io.sys(`cat: No target`);
            resolve();
            return;
        }
        const node = fs.resolve(target);
        if (!node) {
            io.sys(`cat: ${target}: No such file or directory`);
            resolve();
            return;
        }
        if (node.type === NODE_TYPE.DIR) {
            io.sys(`cat: ${target}: Is a directory`);
            resolve();
            return;
        }
        io.println(node.toString());
        resolve();
    },

    echo(resolve, args, fs, io) {
        io.println(args.join(' '));
        resolve();
    },

    clear(resolve, args, fs, io) {
        io.clear();
        resolve();
    },

    reset(resolve, args, fs, io) {
        io.reset();
        resolve();
    },

    help(resolve, args, fs, io) {
        const programs = fs.getProgramPossibilities('');
        io.println(programs.join('\u00A0\u00A0'));
        resolve();
    },

    dev: (function() {
        let attempts = 0;
        return function(resolve, args, fs, io) {
            if (attempts > 3) {
                io.println('Password attempts exceeded');
                resolve();
                return;
            }
            io.println('Enter Passcode:');
            io.input(true).then(input => {
                if (sha256().update(input).digest('hex') === ROOT_KEY) {
                    attempts = 0;
                    io.sys('Authenticated. Starting dev mode...');
                    io.println('Done. Welcome!');
                } else {
                    ++attempts;
                    io.sys('Password invalid.');
                    if (attempts > 3) {
                        io.sys('Password attempts exceeded. Sending incident report.');
                    }
                }
                resolve();
            });
        }
    })(),

    ypm
};

const HOME = new DirNode('guest', [
    new DirNode('about', [
        new FileNode('about.txt',
            'TODO: Insert about text'
        )
    ]),
    new DirNode('experience', [
        new FileNode('experience.txt',
            'TODO: Add experience'
        )
    ]),
    new DirNode('projects', [
        new FileNode('projects.txt',
            'TODO: Add projects'
        )
    ]),
    new FileNode('README.txt',
        [
            <user>Hi there,</user>,
            ' take a look around'
        ]
    ),
    new DirNode('.stuff')
]);

const ROOT = new DirNode('', [
    new DirNode('.bin', Object.entries(PROGRAMS).map(([name, program]) => new ExeNode(name, program))),
    new DirNode('.ypm_modules'),
    new DirNode('Users', [
        HOME,
    ])
]);

class FileSystem {
    constructor() {
        this.root = ROOT;
        this.home = this.wd = HOME;
    }

    getLocationString() {
        return this.wd.getDisplayPath();
    }

    resolveProgram(programName) {
        if (programName.indexOf('/') < 0) {
            for (const path of PATH) {
                const fileNode = this.resolve(`${path}/${programName}`);
                if (fileNode && (fileNode.type === NODE_TYPE.EXE)) {
                    if (fileNode.type === NODE_TYPE.EXE) {
                        return fileNode.program;
                    }
                }
            }
        }
        const programNode = this.resolve(programName);
        if (programNode && programNode.type === NODE_TYPE.EXE) {
            return programNode.program;
        }
    }

    resolve(path) {
        const tokens = path.split('/');
        let node = this.wd;
        if (path.startsWith('/')) {
            node = this.root;
        } else if (path.startsWith('~')) {
            node = this.home;
            tokens.shift();
        }
        for (const token of tokens) {
            if (token === '' || token === '.') {
                continue;
            } else if (token === '..') {
                if (node.parent) {
                    node = node.parent;
                }
                continue;
            }
            let success = false;
            for (const child of node.children) {
                if (child.name === token) {
                    success = true;
                    node = child;
                    break;
                }
            }
            if (!success) {
                return null;
            }
        }
        return node;
    }

    autoResolveProgram(name) {
        for (const path of PATH) {
            const possibilities = this._getPossibilities(`${path}/${name}`);
            if (possibilities.length === 1 && possibilities[0].type === NODE_TYPE.EXE) {
                return `${possibilities[0].name} `;
            }
            const lcp = longestCommonPrefix(possibilities.map(node => node.name));
            if (lcp) return lcp;
        }
        return null;
    }

    autoResolvePath(path) {
        const possibilities = this._getPossibilities(path);
        if (possibilities.length === 1) {
            const resolved = possibilities[0];
            return resolved.type === NODE_TYPE.DIR ? `${resolved.name}/` : `${resolved.name} `;
        }
        return longestCommonPrefix(possibilities.map(node => node.name));
    }

    createNode(type, parent, name, ...args) {
        const path = this.resolve(parent);
        if (!path) {
            return;
        }
        let node;
        if (type === NODE_TYPE.DIR) {
            node = new DirNode(name, ...args);
        } else if (type === NODE_TYPE.FILE) {
            node = new FileNode(name, ...args);
        } else if (type === NODE_TYPE.EXE) {
            node = new ExeNode(name, ...args);
        }
        path.children.push(node);
    }

    getProgramPossibilities(name) {
        const allPossible = [];
        for (const path of PATH) {
            const possibilities = this._getPossibilities(`${path}/${name}`);
            allPossible.push(...possibilities);
        }
        return allPossible.map(node => node.name);
    }

    getPathPossibilities(path) {
        return this._getPossibilities(path).map(node => node.name);
    }

    _getPossibilities(path) {
        const tokens = path.split('/');
        const toComplete = tokens.pop();
        let subPath = tokens.join('/');
        if (path.startsWith('/')) {
            subPath = `/${subPath}`
        }
        const node = this.resolve(subPath);
        if (!node) {
            return [];
        }
        const possibilities = [];
        for (const child of node.children) {
            if (child.name.startsWith(toComplete)) {
                possibilities.push(child);
            }
        }
        return possibilities;
    }
}

export {
    NODE_TYPE,
    FileSystem
}

export default FileSystem;