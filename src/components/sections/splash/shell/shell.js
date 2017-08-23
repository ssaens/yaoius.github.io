import React, {Component} from 'react';
import FileSystem from './filesystem';
import { leftTrim } from '../../../../services/utils';
import './shell.css';

const SHELL_CONFIG = {
    USER: 'guest',
    HOST: 'dillonyao.tk',
    SYS_MSG: '-yaoshell',
    SYS_PROMPT: '>',
    SYS_ERR: '(!)',
    V_MAJOR: 0,
    V_MINOR: 2,
    V_PATCH: 0
};

class LineBuffer {
    constructor() {
        this.sentinel = { value: ' ' };
        this.clearContent();
    }

    clearContent() {
        this.sentinel.prev = this.sentinel.next = this.sentinel;
        this.cursor = this.sentinel;
        this._invalidateCache();
    }

    setContent(content) {
        this.clearContent();
        for (const c of content) {
            this.pushChar(c);
        }
        this._invalidateCache();
    }

    empty() {
        return this.sentinel.next === this.sentinel;
    }

    toJsx() {
        if (!this._cachedJSX) {
            let content = [];
            const jsx = [];
            let currNode = this.sentinel.next;
            do {
                if (currNode.prev === this.cursor) {
                    jsx.push(content.join(''));
                    jsx.push(<crsr key="crsr">{currNode.value}</crsr>);
                    content = [];
                } else if (currNode !== this.sentinel) {
                    content.push(currNode.value);
                }
                currNode = currNode.next;
            } while (currNode.prev !== this.sentinel);
            if (content.length) {
                jsx.push(content.join(''));
            }
            this._cachedJSX = jsx;
        }
        return this._cachedJSX;
    }

    toString() {
        if (!this._cachedString) {
            const content = [];
            let currNode = this.sentinel.next;
            while (currNode !== this.sentinel) {
                content.push(currNode.value);
                currNode = currNode.next;
            }
            this._cachedString = content.join('');
        }
        return this._cachedString;
    }

    pushChar(c) {
        const node = {
            value: c,
            prev: this.cursor,
            next: this.cursor.next,
        };
        node.prev.next = node;
        node.next.prev = node;
        this.cursor = node;
        this._invalidateCache();
    }

    popChar() {
        const cursor = this.cursor;
        cursor.prev.next = cursor.next;
        cursor.next.prev = cursor.prev;
        this.cursor = cursor.prev;
        this._invalidateCache();
    }

    incrementCursor() {
        if (this.cursor.next !== this.sentinel) {
            this.cursor = this.cursor.next;
            this._invalidateCache(false);
        }
    }

    decrementCursor() {
        if (this.cursor !== this.sentinel) {
            this.cursor = this.cursor.prev;
            this._invalidateCache(false);
        }
    }

    _invalidateCache(invalidateString=true) {
        this._cachedJSX = false;
        if (invalidateString) this._cachedString = false;
    }
}

class InputLine extends Component {
    constructor(props) {
        super(props);
        this.history = [];
        this.head = 0;
        const buffer = new LineBuffer();
        this.bufferChain = { buffer };
        this.state = {
            inputValue: buffer.toJsx(),
            currentBuffer: buffer
        };
    }

    render() {
        return (
            <shln>
                <user>{SHELL_CONFIG.USER}</user>@
                <host>{SHELL_CONFIG.HOST}</host>
                {`:${this.props.path}> `}{this.state.inputValue}
            </shln>
        );
    }

    componentDidMount() {
        window.addEventListener('keydown', this._handleKeydown)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this._handleKeydown);
    }

    componentDidUpdate() {
        this.props.align();
    }

    _clearBuffer() {
        const buffer = new LineBuffer();
        this.bufferChain = { buffer };
        this.setState({
            inputValue: buffer.toJsx(),
            currentBuffer: buffer
        })
    }

    _consume() {
        const output = this.state.currentBuffer.toString();
        if (output) {
            this.history.push(output);
            this.head = this.history.length;
        }
        this._clearBuffer();
        this.props.parse(output);
    }

    _nextBuffer() {
        if (this.bufferChain.next) {
            this.head += 1;
            this.bufferChain = this.bufferChain.next;
            this.bufferChain.buffer.cursor = this.bufferChain.buffer.sentinel.prev;
            this.setState({
                inputValue: this.bufferChain.buffer.toJsx(),
                currentBuffer: this.bufferChain.buffer
            });
        }
    }

    _lastBuffer() {
        let update = false;
        if (this.bufferChain.prev) {
            this.head -= 1;
            this.bufferChain = this.bufferChain.prev;
            this.bufferChain.buffer.cursor = this.bufferChain.buffer.sentinel.prev;
            update = true;
        } else if (this.head > 0) {
            this.head -= 1;
            const lastBuffer = new LineBuffer();
            const historyEntry = this.history[this.head];
            lastBuffer.setContent(historyEntry);
            const chainNode = {
                buffer: lastBuffer,
                next: this.bufferChain
            };
            this.bufferChain.prev = chainNode;
            this.bufferChain = chainNode;
            this.bufferChain.buffer.cursor = this.bufferChain.buffer.sentinel.prev;
            update = true;
        }
        if (update) {
            this.setState({
                inputValue: this.bufferChain.buffer.toJsx(),
                currentBuffer: this.bufferChain.buffer
            });
        }
    }

    _autoResolve() {
        const currentInputValue = this.state.currentBuffer.toString();
        const resolved = this.props.autoResolve(currentInputValue, this.tabbed);
        if (resolved) {
            for (const c of resolved) {
                this.state.currentBuffer.pushChar(c);
            }
            this.tabbed = false;
            const inputValue = this.state.currentBuffer.toJsx();
            this.setState({ inputValue });
        }
    }

    _handleKeydown = (e) => {
        if (e.metaKey) {
            return;
        }

        const key = e.key;
        const buffer = this.state.currentBuffer;
        let shouldUpdate = false;

        if (key.length === 1) {
            buffer.pushChar(key);
            shouldUpdate = true;
        } else if (key === 'Enter') {
            this._consume();
        } else if (key === 'Tab') {
            this._autoResolve();
            this.tabbed = true;
            e.preventDefault();
        } else if (key === 'ArrowLeft') {
            buffer.decrementCursor();
            shouldUpdate = true;
        } else if (key === 'ArrowRight') {
            const buffer = this.state.currentBuffer;
            buffer.incrementCursor();
            shouldUpdate = true;
        } else if (key === 'ArrowUp') {
            this._lastBuffer();
        } else if (key === 'ArrowDown') {
            this._nextBuffer();
        } else if (key === 'Backspace') {
            buffer.popChar();
            shouldUpdate = true;
        }

        if (key === ' ') {
            e.preventDefault();
        }

        if (shouldUpdate) {
            this.tabbed = false;
            this.setState({
                inputValue: buffer.toJsx(),
            });
        }
    };
}


class Shell extends Component {
    constructor(props) {
        super(props);
        this.lines = [];
        this.fs = new FileSystem();
        this.out = {
            print: (line) => this.print(line),
            sys: (line) => this.sys(line),
            clear: () => this.clear(),
            reset: () => this.reset()
        };
        this.state = { flush: true };
    }

    componentDidMount() {
        const versionString = 0;
        const loadInfo = [
            <sys key="sys">*>> yaoshell</sys>,
            ' v0.0.0'
        ];
        const helpInfo = [
            '*>> type ',
            <lblue key="lblue">help</lblue>,
            ' for available functions'
        ];
        this.print(loadInfo);
        this.print(helpInfo);
        this.parse('cat README.md');
    }

    render() {
        return (
            <div
                className="shell"
                ref={$ => this.$ = $}
            >
                {this.lines}
                <InputLine
                    path={this.fs.getLocationString()}
                    parse={(line) => this.parse(line)}
                    align={() => this.componentDidUpdate()}
                    autoResolve={(line, tabbed) => this.autoResolve(line, tabbed)}
                />
            </div>
        );
    }

    componentDidUpdate() {
        if (this.$) {
            this.$.scrollTop = this.$.scrollHeight;
        }
    }

    parse(line) {
        const path = this.fs.getLocationString();
        const output = (
            <shln key={this.lines.length}>
                <user>{SHELL_CONFIG.USER}</user>@
                <host>{SHELL_CONFIG.HOST}</host>:{path}> {line}
            </shln>
        );
        this.lines.push(output);
        const tokens = line.split(' ').filter(Boolean);
        if (tokens.length) {
            const programName = tokens.shift();
            const program = this.fs.resolveProgram(programName);
            if (program) {
                program(tokens, this.fs, this.out);
            } else {
                this.sys(`${programName}: command not found`);
            }
        }
        this.flush();
    }

    autoResolve(line, displayPossibilities) {
        const tokens = leftTrim(line).split(' ');
        const toResolve = tokens.pop();
        const isArg = tokens.length;
        if (displayPossibilities) {
            let possibilities;
            if (isArg) {
                possibilities = this.fs.getPathPossibilities(toResolve);
            } else {
                possibilities = this.fs.getProgramPossibilities(toResolve);
            }
            const path = this.fs.getLocationString();
            const output = (
                <shln key={this.lines.length}>
                    <user>{SHELL_CONFIG.USER}</user>@
                    <host>{SHELL_CONFIG.HOST}</host>:{path}> {line}
                </shln>
            );
            this.lines.push(output);
            this.lines.push(possibilities.join('\u00A0\u00A0'));
            this.flush();
        } else {
            let result;
            if (isArg) {
                result = this.fs.autoResolvePath(toResolve);
            } else {
                result = this.fs.autoResolveProgram(toResolve);
            }
            if (result) {
                const lastToken = toResolve.split('/').pop();
                return result.substring(lastToken.length);
            }
        }
    }

    print(line) {
        this.lines.push(<shln key={this.lines.length}>{line}</shln>);
        this.flush();
    }

    sys(msg) {
        this.lines.push(<shln key={this.lines.length}><sys>{SHELL_CONFIG.SYS_MSG}: </sys>{msg}</shln>);
        this.flush();
    }

    clear() {
        this.lines = [];
        this.flush();
    }

    flush() {
        this.setState({ flush: true });
    }

    reset() {
        this.lines = [];
        this.fs = new FileSystem();
        this.flush();
        this.componentDidMount();
    }
}

export default Shell;