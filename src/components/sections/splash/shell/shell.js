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
        this.length = 0;
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
        ++this.length;
        this._invalidateCache();
    }

    popChar() {
        const cursor = this.cursor;
        cursor.prev.next = cursor.next;
        cursor.next.prev = cursor.prev;
        this.cursor = cursor.prev;
        --this.length;
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

let nextId = 0;
class InputLine extends Component {
    constructor(props) {
        super(props);
        this.history = [];
        this.head = 0;
        const buffer = new LineBuffer();
        this.bufferChain = { buffer };
        this.state = {
            id: nextId++,
            inputValue: buffer.toJsx(),
            currentBuffer: buffer
        };
    }

    render() {
        if (this.props.awaitingInput) {
            return null;
        }
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
        if (!this.props.focused || e.metaKey || this.props.blocking) {
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
            buffer.incrementCursor();
            shouldUpdate = true;
        } else if (key === 'ArrowUp') {
            this._lastBuffer();
            e.preventDefault();
        } else if (key === 'ArrowDown') {
            this._nextBuffer();
            e.preventDefault();
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
        this.io = {
            print: (s) => this.print(s),
            println: (s) => this.println(s),
            sys: (s) => this.sys(s),
            input: (secure) => this.input(secure),
            clear: () => this.clear(),
            reset: () => this.reset()
        };
        this.state = {
            flush: true,
            hasFocus: true,
            blocking: false,
            redirectIn: false
        };
    }

    componentDidMount() {
        window.addEventListener('click', this._onClick);

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
        this.parse('cat README.txt');
    }

    render() {
        const focusStyle = this.state.hasFocus ? null : { opacity: 0.8, filter: 'blur(1px)' };
        return (
            <div
                className="shell"
                style={focusStyle}
                ref={$ => this.$ = $}
            >
                {this.lines}
                <InputLine
                    focused={this.state.hasFocus}
                    blocking={this.state.blocking}
                    awaitingInput={this.awaitingInput}
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

    _onClick = (e) => {
        if (this.blocking) {
            return;
        }
        if (this.$.contains(e.target) && !this.state.hasFocus) {
            this.setState({hasFocus: true});
        } else if (!this.$.contains(e.target) && this.state.hasFocus) {
            this.setState({hasFocus: false});
        }
    };

    componentWillUnmount() {
        window.removeEventListener('click', this._onClick);
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
                this.setState({blocking: true});
                program(tokens, this.fs, this.io).then((ret=0) => {
                    if (ret) {
                        this.println(ret);
                    }
                    this.setState({blocking: false});
                });
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
            if (!possibilities.length) {
                return;
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

    print(s) {
        // TODO: Same line print
    }

    println(s) {
        if (!s || (Array.isArray(s) && !s.length)) {
            return;
        }
        this.lines.push(<shln key={this.lines.length}>{s}</shln>);
        this.flush();
    }

    sys(msg) {
        this.lines.push(<shln key={this.lines.length}><sys>{SHELL_CONFIG.SYS_MSG}: </sys>{msg}</shln>);
        this.flush();
    }
    
    input(secure=false) {
        const buf = new LineBuffer();
        const lbuf = new LineBuffer();
        const bufIndex = this.lines.length;
        this.lines.push(<shln key={bufIndex}>{buf.toJsx()}</shln>);
        this.awaitingInput = true;
        this.flush();
        return new Promise(resolve => {
            const keyListener = (e) => {
                if (!this.state.hasFocus || e.metaKey) {
                    return;
                }
                const key = e.key;
                let shouldUpdate = false;

                if (key.length === 1) {
                    buf.pushChar(secure ? '*' : key);
                    lbuf.pushChar(key);
                    shouldUpdate = true;
                } else if (key === 'ArrowLeft') {
                    buf.decrementCursor();
                    lbuf.decrementCursor();
                    shouldUpdate = true;
                } else if (key === 'ArrowRight') {
                    buf.incrementCursor();
                    lbuf.incrementCursor();
                    shouldUpdate = true;
                } else if (key === 'Backspace') {
                    buf.popChar();
                    lbuf.popChar();
                    shouldUpdate = true;
                } else if (key === 'Enter') {
                    this.lines[bufIndex] = <shln key={bufIndex}>{buf.toString() || '\n'}</shln>;
                    window.removeEventListener('keydown', keyListener);
                    this.awaitingInput = false;
                    resolve(lbuf.toString());
                }
                if (key === ' ') {
                    e.preventDefault();
                }

                if (shouldUpdate) {
                    this.lines[bufIndex] = <shln key={bufIndex}>{buf.toJsx()}</shln>;
                    this.flush();
                }
            };
            window.addEventListener('keydown', keyListener);
        });
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