
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

    getAbsolutePath() {
        const path = [this.name];
        let node = this.parent;
        while (node) {
            path.push(node.name);
            node = this.parent;
        }
        return `/${path.reverse().join('/')}`;
    }
}

class DirNode extends FileSystemNode {
    constructor(name, children) {
        super(NODE_TYPE.DIR, name);
        this.children = children;
        for (const child of children) {
            child.parent = this;
        }
    }
}

class FileNode extends FileSystemNode {
    constructor(name) {
        super(NODE_TYPE.FILE, name);
    }

    contents() {

    }
}

class ExeNode extends FileSystemNode {
    constructor(name, program) {
        super(NODE_TYPE.EXE, name);
        this.program = program;
    }

    contents() {
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
        out.print(node.contents());
    },

    echo(args, fs, out) {
        out.print(args.join(' '));
    }
};

const ROOT = new DirNode('', [
    new DirNode('.bin', [
        new ExeNode('pwd', PROGRAMS.pwd),
        new ExeNode('ls', PROGRAMS.ls),
        new ExeNode('cd', PROGRAMS.cd),
        new ExeNode('cat', PROGRAMS.cat),
        new ExeNode('echo', PROGRAMS.echo)
    ])
]);

class FileSystem {
    constructor() {
        this.root = ROOT;
        this.home = ROOT;
        this.wd = ROOT;
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
            } else if (node.parent && token === '..') {
                node = node.parent;
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

    getChildren() {

    }
}



export default FileSystem;