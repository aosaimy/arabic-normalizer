#!/usr/bin/env node
var fs = require('fs');
var es = require('event-stream');

var utf8_to_ascii = {'\u0660':'0', '\u0661':'1', '\u0662':'2',
                '\u0663':'3', '\u0664':'4', '\u0665':'5',
                '\u0666':'6', '\u0667':'7', '\u0668':'8',
                '\u0669':'9', '\u06F0':'0', '\u06F1':'1',
                '\u06F2':'2', '\u06F3':'3', '\u06F4':'4',
                '\u06F5':'5', '\u06F6':'6', '\u06F7':'7',
                '\u06F8':'8', '\u06F9':'9'}

// Patterns
// Match any character not in the Arabic charts
// Including presentation forms
// var p_not_arb = /[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g

// Segment punctuation
var latin_punc = /([\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u2010-\u2027\u2030-\u205E\u20A0-\u20B5\u2E2E]{1})/g
var arb_punc = /([\u0609-\u060D\u061B-\u061F\u066A\u066C-\u066D\u06D4]{1})/g
var other_punc = /([\u2E2E]{1})/g

// Segment digits
var ascii_digit = /(\d+)/g
var arb_digit = /([\u06F0-\u06F9\u0660-\u0669]+)/g

// Patterns commonly found in newswire (e.g., the ATB)
var date_cluster = /\d+\-\d+/g
var email_cluster = /[\w\-][\w\-\.]+@[\w\-][\w\-\.]+[a-zA-Z]{1,4}/g
var url_cluster = /[a-zA-Z]+.[a-zA-Z]+/g
var ellipsis = /(\.{2,})/g

// Strip diacritics, tatweel, extended Arabic
var p_diac = /[\u064B-\u0652]/g
var p_diac_full = /^[\u064B-\u0652]+$/g
var p_tat = /ـ/g
var p_quran = /[\u0615-\u061A\u06D6-\u06E5]/g

// Normalize alif
var p_alef = /ا|إ|أ|آ|\u0671/

// Escape Basic Latin (U0000) and Latin-1 (U0080) characters
var p_latin = /[\u0000-\u00FF]/

function arb_digit_to_ascii(string){
    "use strict";
    var ascii_digits = []
    for (var c_idx in string) {
        var new_digit = utf8_to_ascii[string[c_idx]]
        if (new_digit)
            ascii_digits.push(new_digit)
        else
            return string
    }
    return '' + ascii_digits
}

function normalize_diac(string){
        "use strict";
    return string
            // to delete starting taskeels (lookbehind)
            .replace(/(\s|^)[\u064B-\u0652]+/g,'$1')
            //beggining of surah
            .replace(/([لمحكهعص])ٓ/g,"$1")

            //remove words that has only diacritics
            .replace(/ [\u064B-\u0652]*(?=\s)/g,"")// used lookahead: look ahead if there is a space

            // //delete harakah before the mad letter (e.g. fathah then alif)
            // .replace(/َا/g,"ا")
            // .replace(/ِي/g,"ي")
            // .replace(/ُو/g,"و")

            // shaddah before harakah
            .replace(/([ًٌٍَُِ])ّ/g,"ّ$1")

            // add sukon to mad Alif
            .replace(/َا/g,"َاْ")
            // .replace(/iy/g,"iyo")
            // .replace(/uw/g,"uwo")

            //remove diac if the same is put more than once
            .replace(/([\u064B-\u0652])\1/g,"$1")

            // tanween then end
            .replace(/اً(?=\s|$)/g,"ًا")
            .replace(/ىً(?=\s|$)/g,"ًى")

            
            //bottom hamza
            .replace(/إ[ًٌٍَُِ]/g,"إ")
            
            //remove incompaitble diacs
            .replace(/([ًٌٍَُِْ])[ًٌٍَُِْ]/g,"$1")

            //remove beginning shaddah
            .replace(/(?=\s|^)ّ/g,"")

            //Tanween in wrong place
            .replace(/[ًٌٍ]([^ ][^ ])/g,"$1")

            //bottom hamza
            .replace(/إ[ًٌٍَُ]/g,"إِ")
            .replace(/إ([^ِ])/g,"إِ$1")
}

function carefully_segment(line,config){
        "use strict";
    var tokens = []
    var stripped = line.trim()
    if ( stripped.length > 0 && stripped[0] == '<'){
        tokens.push(line)
        return tokens
    }
    
    line = line.replace(/\u00AB/g,' " ')
    line = line.replace(/\u00BB/g,' " ')
    line = line.replace(/\u061F/g,' ? ')
    line = line.replace(/\u2E2E/g,' ? ')
    line = line.replace(/&lt;/g,' < ')
    line = line.replace(/&gt;/g,' > ')
    line = line.replace(/&amp;/g,' & ')
    line = line.replace(/&quot;/g,' " ')
    var splitted  =line.split(" ")
    splitted.forEach(word=>{
        if ( date_cluster.test(word))
            tokens.push(word)
        else if ( email_cluster.test(word))
            tokens.push(word)
        else if ( url_cluster.test(word))
            tokens.push(word)   
        else if ( /(-RRB-)|(-LRB-)/.test(word))
            tokens.push(word)   
        else if ( ellipsis.test(word))
            tokens = tokens.concat(word.replace(ellipsis, ' $1 ').split(" "))
        else{
            if(config.remove_punc){
                word = word.replace(latin_punc, '')
                word = word.replace(other_punc, '')
                word = word.replace(arb_punc, '')
            }
            else if(config.punc){
                word = word.replace(latin_punc, ' $1 ')
                word = word.replace(other_punc, ' $1 ')
                word = word.replace(arb_punc, ' $1 ')
            }
            if(config.s_digit){
                word = word.replace(ascii_digit, ' $1 ')
                word = word.replace(arb_digit, ' $1 ')
            }
            word = word.replace(/([\(\)\+])/g,' $1 ').split(/ +/)
            word.forEach(v=>{
                // to prevent adding only taskeel words
                if ( !p_diac_full.test(v))
                    tokens.push(v)
            })
        }
    });
    return tokens
}

var norm_input_line = function (line,config){
        "use strict";
    if(config.normalize_diac)
        line = normalize_diac(line)
    line = carefully_segment(line,config)
    var new_line = []
    for (let word of line) {
        // if(config.normalize_diac && normalize_diac(word) != word)
        //     console.log("n=",normalize_diac(word)," o=",word)
        if (p_latin.test(word))
            new_line.push(word.trim())
        else if (arb_digit.test(word)){
            var asciified = arb_digit_to_ascii(word)
            new_line.push(asciified)
        }
        else if (word == '\u060C')
            new_line.push(',')
        else if (word == '\u061F' || word == '\u2E2E')
            new_line.push('?')
        else{
            if(config.diac)
                word = word.replace(p_diac,'')
            if(config.tatweel)
                word = word.replace(p_tat,'')
            if(config.alif)
                word = word.replace(p_alef,'ا')
            word = word.replace(p_quran,'')
            if(word!=='')
                new_line.push(word.trim())
        }
    }
    new_line = new_line.join(" ")
    return new_line
}
var default_config = {
    'diac':false,
    'alif':false,
    'tatweel':true,
    'digits':true,
    'punc':true,
    's_digits':true,
    'remove_punc': false,
    'debug': false,
    'normalize_diac': true
}

if (require.main === module) { // called directly
    var argv = require('yargs')
    .usage('Usage: $0 [args] -f inputfilename')
    .default('f',"/dev/stdin")
    .describe('f','input file')
    .boolean('diac').describe('diac','remove diac').default('diac',false)
    .boolean('alif').describe('alif','normalize alif').default('alif',false)
    .boolean('tatweel').describe('tatweel','remove tatweel').default('tatweel',true)
    .boolean('digits').describe('digits','romanize digits').default('digits',true)
    .boolean('punc').describe('punc','segment punctuations').default('punc',true)
    .boolean('s_digits').describe('s_digits','segment digits').default('s_digits',true)
    .boolean('normalize_diac').describe('normalize_diac','normalize diacritics to one standard').default('normalize_diac',true)
    .boolean('remove_punc').describe('remove_punc','remove punctuations').default('remove_punc',false)
    .help('h')
    .alias('h', 'help')
    .argv
    
    var lineId = 0
    fs.createReadStream(argv.f)
       .pipe(es.split("\n"))
       .pipe(es.through(function(line){
            "use strict";
            lineId = lineId + 1
            this.emit('data',norm_input_line(line,argv)+"\n")
       },function(){
            "use strict";
            console.error(`Processed ${lineId} lines`)
       }))
      .pipe(process.stdout)
}
else
    module.exports = function (infile,config){
            "use strict";
        
        config = config || {}
        Object.keys(default_config).forEach(e=>config[e] = config[e] || default_config[e])

        if(!Array.isArray(infile))
            infile = infile.split("\n")
        var text = []
        for (let line of infile){
            text.push(norm_input_line(line,config))
        }
        if(config.debug)
        console.error(`Processed ${text.length} lines`)
        return text.join("\n")
    }
