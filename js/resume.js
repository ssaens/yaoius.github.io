BR = '</br>'

function tag(type, attrs, data) {
    var html = '<' + type;
    Object.keys(attrs).forEach(function(attr) {
        html += ' ' + attr + '=\'' + attrs[attr] + '\'';
    });
    html += '>' + data + '</' + type + '>';
    return html;
}

function edu_entry(name, start, end, major, gpa, standing, coursework) {
    this.name = name;
    this.start = start;
    this.end = end;
    this.major = major;
    this.gpa = gpa;
    this.standing = standing;
    this.coursework = coursework;
    
    this.toString = function() {
        var timeframe = tag('span', {'style': 'float: right;'}, this.start + ' - ' + this.end);;
        var head = tag('div', {'class': 'edu_header'}, this.name + timeframe);
        
        var info = tag('li', {'class': 'major'}, this.major) +
                    tag('li', {'class': 'gpa'}, this.gpa) +
                    tag('li', {'class': 'standing'}, this.standing);
        info = tag('ul', {'class': 'edu_entry_info'}, info);
        
        var course_html = '';
        for (var i = 0; i < this.coursework.length; ++i) {
            course_html += this.coursework[i];
        }
        course_html = tag('div', {'class': 'courses'}, course_html);   
        return head + tag('div', {'class': 'entry_data'}, info + course_html);
    }
}

function course(code, name) {
    this.code = code;
    this.name = name;
    this.toString = function() {
        var code = tag('span', {'class': 'code'}, this.code + ': ');
        var name = tag('span', {'class': 'name'}, this.name);
        var entry = code + name;
        return tag('div', {'class': 'course'}, entry);
    }
}

/* Education */
var courses = [
    new course('CS61A', 'The Structure and interpretation of computer programs'),
    new course('CS61B', 'Data Structures'),
    new course('CS61C', 'Great Ideas in Computer Architecture'),
    new course('CS70', 'Discrete Math and Probability Theory'),
    new course('CS170', 'Efficient Algorithms and Intractibility Theory'),
    new course('CS184', 'Foundations of Computer Graphics'),
    new course('CS188', 'Indroduction to AI'), 
    new course('CS161', 'Computer Security'),
    new course('EE16A/B', 'Designing Information Devices and Systems')
]

var schools = [
    new edu_entry('University of California, Berkeley', 
                  'Fall 2015', 'Fall 2018', 
                  'Electrical Engineering and Computer Science',
                  '4.0', 'Senior', courses),
]

/* Skills */
var languages = [
    'Python',
    'Java',
    'C/C++',
    'Scheme',
    'MIPS',
    'HTML/CSS',
    'SQL',
]


function build_resume() {
    
    var edu_title = tag('h2', {'class': 'title'}, 'Education');
    var school_html = '';
    schools.forEach(function(entry) {
        school_html += entry; 
    });
    var education_sec = tag('div', {'class': 'resume_sec'}, edu_title + school_html);
    
    var skills_title = tag('h2', {'class': 'title'}, 'Skills');
    var skills_sec = '';
    languages.forEach(function(entry) {
        skills_sec += entry + BR;
    });
    skills_sec = tag('div', {'class': 'resume_sec'}, skills_title + skills_sec);
    
    var resume_sections = [education_sec, skills_sec];
    var resume_html = '';
    resume_sections.forEach(function(sec) {
        resume_html += sec;
    });
    
    document.getElementById('resume').children[0].innerHTML = resume_html;
}