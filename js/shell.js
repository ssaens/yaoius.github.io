
/* ==CONSTANTS== */
SPACE = '&nbsp;'
BREAK = '<br/>'
TAB = SPACE + SPACE;
K_RETURN = 13;
K_BACKSPACE = 8;
K_UPARROW = 38;
K_DOWNARROW = 40;
K_LEFTARROW = 37;
K_RIGHTARROW = 39;
K_TAB = 9;
V_MAJOR = 0;
V_MINOR = 0;
V_BUILD = 1;

/* ==UTILS== */
if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

function Stack(max_size) {
    this.stack = [];
    this.max_size = max_size;
    this.push = function(elem) {
        this.stack.push(elem);
        if (this.stack.length > max_size) {
            this.stack.shift();
        }
    }
    this.pop = function() {
        if (!this.empty()) {
            return this.stack.pop();
        }
    }
    this.peek = function() {
        if (!this.empty()) {
            return this.stack[this.stack.length - 1];
        }
    }
    this.length = function(elem) {
        return this.stack.length;
    }
    this.empty = function() {
        return this.stack.length == 0;
    }
    this.from_top = function(i) {
        return this.stack[this.stack.length - 1 - i];
    }
    this.forEach = function(fn) {
        this.stack.forEach(fn);
    }
}


/* ==PALLET== */
ORNG = 'rgb(253, 148, 8)';

/* ==PROGRAMS== */
var installed_progs = {
    'pwd' : pwd,
    'python' : python,
    'ls' : ls,
    'll' : ls,
    'cd' : cd,
    'cat' : cat,
    'echo' : echo,
    'git' : git,
    'jump' : jump,
    'clear' : clear,
    'reset' : reset,
    'exit' : exit,
    'help' : help,
}

function jump(shell, args) {

}

function git(shell, args) {

}

function reset(shell, args) {
    shell.init();
}

var exit_text = [
    'Where are you going?',
    'Seriously?',
    'Please don\'t go',
    'I\'m lonely',
    'So lonely...',
    'Dillon never updates me',
    'Take me with you!',
    'Fine then',
    'Try all you want, you aren\'t going anywhere',
    'I\'m not talking to you anymore',
    'Seriously, I mean it!',
    'OK come on',
    'I\'m going to run out of text soon',
    '...',
    'You\'re very persistant',
]
var curr_exit_text = 0;

function exit(shell, args) {
    if (curr_exit_text >= exit_text.length)
        curr_exit_text = 0;
    shell.print(exit_text[curr_exit_text++]);
}

function clear(shell, args) {
    shell.cmd_buffer = new input_buffer;
    shell.error_count = 0;
    shell.line_buffer = [];
}

function pwd(shell, args) {
    shell.print(shell.node.wd().replace('~', '/Users/guest'));
}

function python(shell, args) {
    shell.print('HAHA, I don\'t have that much time');
}

function ls(shell, args) {
    if (args.length == 0) {
        shell.print(shell.node.children.join(TAB));
        return;
    }
    var node = resolve(shell.node, args[0]);
    if (node != undefined) {
        shell.print(node.children.join(TAB));
    }
}

function resolve(node, path) {
    if (path.length == 0) {
        return node;
    }
    path = path.split('/');
    var curr_node = node;
    for (var i = 0; i < path.length; ++i) {
        if (curr_node == undefined) {
            return undefined;
        }
        var step = path[i];
        if (step === '.') {
            continue;
        }
        else if (step === '..') {
            curr_node = curr_node.parent;
        } else {
            var selected = curr_node.find_child(step);
            if (selected != undefined) {
                curr_node = selected;
            } else {
               return undefined;
            }
        }
    }
    return curr_node;
}

function cd(shell, args) {
    if (args.length < 1 || args[0] === '~') {
        shell.node = root;
        return '';
    }
    var node = resolve(shell.node, args[0]);
    if (node == undefined) {
        shell.raise_error('cd', args[0] + ': No such file or directory');
        return;
    } else if (node.type != DIR) {
        shell.raise_error('cd', args[0] + ': Is not a directory');
        return;
    }
    shell.node = node;
}

function cat(shell, args) {
    if (args.length  < 1) {
        shell.raise_error('cat', 'No file provided');
    }
    var node = resolve(shell.node, args[0]);
    if (node == undefined) {
        shell.raise_error('cat', args[0] + ': No such file');
    } else if (node.type != FILE) {
        shell.raise_error('cat', args[0] + ': Is a directory');
    }
    shell.print(node.data);
}

function help(shell, args) {
    shell.print(Object.keys(installed_progs).join(', '));
}

function echo(shell, args) {
    shell.print(args.join(' '));
}


/* ==FILE STRUCTURE== */
DIR = 'dir';
FILE = 'file';
EXE = 'exe';
NONE = undefined;

function file_node(name, type, children, data) {
    this.name = name;
    this.type = type;
    this.children = children;
    this.parent = undefined;
    this.data = data;
    for (var i = 0; i < this.children.length; ++i) {
        this.children[i].parent = this;
    }

    this.toString = function() {
        return tag(type, {}, this.name);
    }
    this.wd = function() {
        path = this.name;
        curr = this.parent;
        while (curr != undefined) {
            path = curr.name + '/' + path
            curr = curr.parent;
        }
        return path;
    }

    this.find_child = function(name) {
        for (var i = 0; i < this.children.length; ++i) {
            var child = this.children[i];
            if (child.name === name) {
                return child;
            }
        }
        return undefined;
    }
}

var intro_text = 'Hi there! My name\'s is ' + tag('span', {'style': 'color: ' + ORNG}, 'Dillon') + ' and this is my site. Take a look around!';

var root = new file_node('~', DIR, [
    new file_node('README', FILE, [], intro_text),
    new file_node('index.html', FILE, [], 'just right click and use inspect plz'),
    new file_node('about', DIR, [
        new file_node('about.txt', FILE, [], 'TODO: add about text')
    ], ''),
    new file_node('projects', DIR, [
        new file_node('projects.txt', FILE, [], 'TODO: add project text')
    ], ''),
    new file_node('resume', DIR, [
        new file_node('resume.txt', FILE, [], 'TODO: add resume.txt')
    ], ''),
    new file_node('covers', DIR, [

    ], ''),
], '');


/* ==SHELL== */
function input_buffer() {
    this.chars = [];
    this.cursor = 0;
    this.final = '';
    this.add_char = function(char) {
        this.chars.splice(this.chars.length - this.cursor, 0, char);
    }

    this.remove_char = function(char) {
        if (this.cursor < this.chars.length) {
            this.chars.splice(this.chars.length - this.cursor - 1, 1);
        }
    }

    this.move_cursor = function(chars) {
        this.cursor -= chars;
        this.cursor = Math.max(Math.min(this.cursor, this.chars.length - 1), 0);
    }

    this.clear = function() {
        this.chars = [];
        this.cursor = 0;
    }

    this.tokenize = function() {
        return this.toString().trim().split(' ');
    }

    this.prompt_string = function() {
        string = this.toString();
        if (this.cursor == 0) {
            string = string + tag('crsr', {}, SPACE);
        } else {
            var cursor_ind = this.chars.length - this.cursor;
            var cursor_elem = tag('crsr', {}, string.charAt(cursor_ind));
            string = string.slice(0, cursor_ind) + cursor_elem + string.slice(cursor_ind + 1, this.chars.length);
        }
        return string;
    }

    this.staple = function() {
        this.final = this.toString();
    }

    this.reset = function() {
        this.chars = this.final.split('');
        this.cursor = 0;
    }

    this.toString = function() {
        return this.chars.join('');
    }
}

var intro_buffer = new input_buffer();
intro_buffer.chars = 'cat README'.split('');

function shell(element, opts = {
        user : 'guest',
        host : 'dillonyao.tk',
        sys_msg : '-yaoshell:'
    }) {

    this.element = element;
    this.max_log_size = 20;
    this.user = opts.user;
    this.host = opts.host;
    this.sys_msg_prompt = opts.sys_msg;
    var version = 'v' + tag('span', {}, V_MAJOR) + '.' + tag('span', {}, V_MINOR) + '.' + tag('key', {}, V_BUILD);
    this.startup_info = tag('shln', {}, tag('sys', {}, '*>> yaoshell') + ' ' + version) + tag('shln', {}, '*>> type ' + tag('key', {}, 'help') + ' for available functions.');

    this.is_printable = function(keycode) {
        return (keycode > 47 && keycode < 58)   || // number keys
            keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91)   || // letter keys
            (keycode > 95 && keycode < 112)  || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223);
    }

    this.handle_input = function(e) {
        if (!this.focused) return;
        if (e.keyCode == K_RETURN) {
            this.consume_cmd();
        } else if (e.keyCode == K_BACKSPACE) {
            this.cmd_buffer.remove_char();
        } else if (e.keyCode == K_UPARROW) {
            if (this.curr_line < this.cmd_log.length() - 1) {
                this.curr_line++;
            }
            this.cmd_buffer = this.cmd_log.from_top(this.curr_line);
        } else if (e.keyCode == K_DOWNARROW) {
            if (this.curr_line > 0) {
                this.curr_line--;
            }
            this.cmd_buffer = this.cmd_log.from_top(this.curr_line);
        } else if (e.keyCode == K_LEFTARROW) {
            this.cmd_buffer.move_cursor(-1);
        } else if (e.keyCode == K_RIGHTARROW) {
            this.cmd_buffer.move_cursor(1);
        } else if (e.keyCode == K_TAB) {
            this.auto_complete();
        } else if (this.is_printable(e.keyCode)) {
            this.cmd_buffer.add_char(e.key);
        }
        this.update();
    }

    this.auto_complete = function() {
        var tokens = this.cmd_buffer.tokenize();
        if (tokens.length > 0) {
            var to_complete = tokens[tokens.length - 1];
            var sub_path = to_complete.split('/');
            var final_path = sub_path.pop();
            var search_node = resolve(this.node, sub_path.join('/'));
            if (search_node != undefined && final_path.length > 0) {
                for (var i = 0; i < search_node.children.length; ++i) {
                    var candidate = search_node.children[i];
                    var start = candidate.name.search(final_path);
                    if (start == 0) {
                        var end_match = start + final_path.length;
                        for (var j = end_match; j < candidate.name.length; ++j) {
                            this.cmd_buffer.add_char(candidate.name.charAt(j));
                        }
                    }
                }
            }
        }
    }

    this.prompt = function() {
        user = tag('user', {}, this.user);
        host = tag('host', {}, this.host);
        return user + '@' + host + ':' + this.node.wd() + '> ';
    }

    this.consume_cmd = function() {
        var last_buffer = this.cmd_log.peek();
        last_buffer.chars = this.cmd_buffer.chars.slice();
        this.cmd_buffer = last_buffer;
        last_buffer.staple();
        this.cmd_log.forEach(function(buffer) { buffer.reset()} );
        this.print(this.prompt() + this.cmd_buffer);
        this.parse_cmd();
        if (this.cmd_buffer.toString().trim() === '') {
            this.cmd_log.pop();
        }
        this.cmd_buffer = new input_buffer();
        this.cmd_log.push(this.cmd_buffer);
        this.curr_line = 0;
    }

    this.parse_cmd = function() {
        if (this.cmd_buffer.toString().trim() === '') {
            return;
        }
        var tokens = this.cmd_buffer.tokenize();
        var prog = tokens[0];
        var args = tokens.slice(1, tokens.length);
        if (!(prog in installed_progs)) {
            this.error_count++;
            this.raise_error(prog, 'command not found');
            if (this.error_count > 4) {
                this.sys_msg('You can also just browse the page by scrolling down, this shell isn\'t that interesting...');
            } else if (this.error_count > 1) {
                this.sys_msg('Use the ' + tag('key', {}, 'help') + ' command to see available functions!');
            }
            return;
        }
        this.error_count = 0;
        installed_progs[tokens[0]](this, args);
    }

    this.raise_error = function(prog, msg='') {
        this.sys_msg(prog + ': ' + msg);
    }

    this.sys_msg = function(msg) {
        this.print(tag('sys', {}, this.sys_msg_prompt) + ' ' + msg);
    }

    this.print = function(line) {
        this.line_buffer += tag('shln', {}, line);
    }

    this.update = function() {
        curr_line = this.prompt() + this.cmd_buffer.prompt_string();
        this.element.innerHTML = this.line_buffer + curr_line;
        this.element.scrollTop = this.element.scrollHeight;
    }

    this.init = function() {
        this.line_buffer = this.startup_info;
        this.curr_line = 0;
        this.node = root;
        this.error_count = 0;
        this.cmd_buffer = intro_buffer;
        this.cmd_log = new Stack(this.max_log_size);
        this.cmd_log.push(intro_buffer);
        this.highlight(true);
        this.focused = true;
        this.consume_cmd();
        this.update();
    }

    this.highlight = function(focus) {
        var curr_classes = this.element.className === '' ? [] : this.element.className.split(' ');
        var index = curr_classes.indexOf('focused');
        if (focus) {
            if (index == -1) {
                curr_classes.push('focused');
            }
        } else {
            if (index > -1) {
                curr_classes.splice(index, 1);
            }
        }
        this.element.className = curr_classes.join(' ');
    }
}
