import React from 'react';

const NODE_TYPE = {
    DIR: 'dir',
    FILE: 'file',
    EXE: 'exe'
};

const PATH = [
    '/.bin'
];

class FileSystemNode {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.parent = null;
    }

    getDisplayPath() {
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
        return path.reverse().join('/') || '/';
    }

    getAbsolutePath() {
        const path = [this.name];
        let node = this.parent;
        while (node) {
            path.push(node.name);
            node = node.parent;
        }
        return path.reverse().join('/') || '/';
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
    constructor(name, program) {
        super(NODE_TYPE.EXE, name);
        this.program = program;
    }

    toString() {
        return this.program.toString();
    }
}

const PROGRAMS = {
    pwd(args, fs, out) {
        out.print(fs.wd.getAbsolutePath());
    },

    ls(args, fs, out) {
        out.print(fs.wd.children.map(child => child.name).join('\u00A0\u00A0'));
    },

    cd(args, fs, out) {
        const target = args[0] || '~';
        const node = fs.resolve(target);
        if (!node) {
            out.sys(`cd: ${target}: No such file or directory`);
            return;
        }
        if (node.type !== NODE_TYPE.DIR) {
            out.sys(`cd: ${target}: Not a directory`);
            return;
        }
        fs.wd = node;
    },

    cat(args, fs, out) {
        const target = args[0];
        if (!target) {
            out.sys(`cat: No target`);
        }
        const node = fs.resolve(target);
        if (!node) {
            out.sys(`cat: ${target}: No such file or directory`);
            return;
        }
        if (node.type === NODE_TYPE.DIR) {
            out.sys(`cat: ${target}: Is a directory`);
            return;
        }
        out.print(node.toString());
    },

    echo(args, fs, out) {
        out.print(args.join(' '));
    },

    clear(args, fs, out) {
        out.clear();
    },

    reset(args, fs, out) {
        out.reset();
    }
};

const BIN = new DirNode(
    '.bin',
    Object.entries(PROGRAMS).map(([name, program]) => new ExeNode(name, program))
);

const HOME = new DirNode('guest', [
    new DirNode('about'),
    new DirNode('experience'),
    new DirNode('projects'),
    new FileNode(
        'README.md',
        [
            'Hello',
            <b>Dillon Yao</b>,
            'There'
        ]
    )
]);

const ROOT = new DirNode('', [
    BIN,
    new DirNode('Users', [
        HOME
    ])
]);

class FileSystem {
    constructor() {
        this.root = ROOT;
        this.home = this.wd = HOME;
    }

    resolveProgram(programName) {
        for (const path of PATH) {
            const fileNode = this.resolve(path);
            if (fileNode.type === NODE_TYPE.DIR) {
                for (const child of fileNode.children) {
                    if (child.type === NODE_TYPE.EXE && child.name === programName) {
                        return child.program;
                    }
                }
            }
        }
        return null;
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

    getLocationString() {
        return this.wd.getDisplayPath();
    }
}



export default FileSystem;