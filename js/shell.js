SPACE = '&nbsp;'
BREAK = '<br/>'
TAB = SPACE + SPACE;

if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

/* PROGRAMS */
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
    return exit_text[curr_exit_text++];
}

function clear(shell, args) {
    shell.cmd_buffer = new input_buffer;
    shell.error_count = 0;
    shell.line_buffer = [];
}

function pwd(shell, args) {
    return shell.node.wd().replace('~', '/Users/guest');
}

function python(shell, args) {
    return 'HAHA, I don\'t have that much time';
}

function ls(shell, args) {
    if (args.length == 0) {
        return shell.node.children.join(TAB);
    }
    var node = resolve(shell.node, args[0]);
    if (node != undefined) {
        return node.children.join(TAB);
    }
}

function resolve(node, path) {
    if (path.length == 0) {
        return node;
    }
    path = path.split('/');
    var curr_node = node;
    for (var i = 0; i < path.length; ++i) {
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
        return '-yaoshell: ' + 'cd: ' + args[0] + ': No such file or directory'; 
    } else if (node.type != DIR) {
        return '-yaoshell: ' + 'cd: ' + args[0] + ': Is not a directory';
    }
    shell.node = node;
    return '';
}

function cat(shell, args) {
    if (args.length  < 1) {
        return '-yaoshell: ' + 'cat: ' + 'No file provided';
    }
    var node = resolve(shell.node, args[0]);
    if (node == undefined) {
        return '-yaoshell: ' + 'cat: ' + args[0] + ': No such file';
    } else if (node.type != FILE) {
        return '-yaoshell: ' + 'cat: ' + args[0] + ': Is a directory';
    }
    return node.data;
}

function help(shell, args) {
    return Object.keys(installed_progs).join(', ');
}

function echo(shell, args) {
    return args.join(' ');
}


/* FILE STRUCTURE */
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


var intro_text = 'Hi there! My name is ' + tag('span', {'style': 'color: rgb(253, 148, 8)'}, 'Dillon Yao') + '. Take a look around!';

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

function shell(element) {
    this.div = element;
    this.w = element.width;
    this.h = element.height;
    this.user = 'guest';
    this.host = 'dillonyao.tk';
    this.max_log_size = 20;
    
    this.is_printable = function(keycode) {
        return (keycode > 47 && keycode < 58)   || // number keys
            keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91)   || // letter keys
            (keycode > 95 && keycode < 112)  || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223);
    }
    
    this.handle_input = function(e) {
        if (e.keyCode == 13) {
            this.consume_cmd();
        } else if (e.keyCode == 8) {
            this.cmd_buffer.remove_char();
        } else if (e.keyCode == 38) {
            if (this.curr_line < this.cmd_log.length - 1) {
                this.curr_line++;
            }
            this.cmd_buffer = this.cmd_log[this.cmd_log.length - 1 - this.curr_line];
        } else if (e.keyCode == 40) {
            if (this.curr_line > 0) {
                this.curr_line--;
            }
            this.cmd_buffer = this.cmd_log[this.cmd_log.length - 1 - this.curr_line];
        } else if (e.keyCode == 37) {
            this.cmd_buffer.move_cursor(-1);
        } else if (e.keyCode == 39) {
            this.cmd_buffer.move_cursor(1);
        } else if (e.keyCode == 9) {
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
        } else if (this.is_printable(e.keyCode)) {
            this.cmd_buffer.add_char(e.key);
        }
        this.update();
    }
    
    this.prompt = function() {
        user = tag('user', {}, this.user);
        host = tag('host', {}, this.host);
        return user + '@' + host + ':' + this.node.wd() + '$ ';
    }
    
    this.consume_cmd = function() {
        var last_buffer = this.cmd_log[this.cmd_log.length - 1];
        last_buffer.chars = this.cmd_buffer.chars.slice();
        this.cmd_buffer = last_buffer;
        last_buffer.staple();
        this.cmd_log.forEach(function(buffer) {buffer.reset()} );
        this.add_line(this.prompt() + this.cmd_buffer);
        var result = this.parse_cmd();
        if (this.cmd_buffer.toString().trim() === '') {
            this.cmd_log.pop();
        }
        this.cmd_buffer = new input_buffer();
        this.cmd_log.push(this.cmd_buffer);
        if (this.cmd_log.length > this.max_log_size) {
            this.cmd_log.shift();
        }
        this.curr_line = 0;
        if (result) {
            this.add_line(result);
        }
    }
    
    this.parse_cmd = function() {
        if (this.cmd_buffer.toString().trim() === '') {
            return '';
        }
        var tokens = this.cmd_buffer.tokenize();
        var prog = tokens[0];
        var args = tokens.slice(1, tokens.length);
        if (prog in installed_progs) {
            this.error_count = 0;
            return installed_progs[tokens[0]](this, args);
        }
        this.error_count++;
        var error = '-yaoshell: ' + prog + ': command not found';
        if (this.error_count > 4) {
            error += BREAK + '-yaoshell: You can also just browse the page by scrolling down, this shell isn\'t that interesting...';
        } else if (this.error_count > 1) {
            error += BREAK + '-yaoshell: Use the ' + tag('key', {}, 'help') + ' command to see available functions!';
        }
        return error;
    }
    
    this.add_line = function(line) {
        this.line_buffer += tag('shln', {}, line);
    }
    
    this.update = function() {
        curr_line = this.prompt() + this.cmd_buffer.prompt_string();
        this.div.innerHTML = this.line_buffer + curr_line;
        this.div.scrollTop = this.div.scrollHeight;
    }

    this.init = function() {
        this.focussed = false;
        this.line_buffer = '';
        this.curr_line = 0;
        this.node = root;
        this.error_count = 0;
        this.cmd_buffer = intro_buffer;
        this.cmd_log = [intro_buffer];
        this.consume_cmd();
        this.update();
    }
    
    this.onfocus = function() {
        
    }
}