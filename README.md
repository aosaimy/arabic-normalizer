# arabic-normalizer
Configurable normaliser, tokeniser, and standarizer for Arabic raw texts. 

## Normalization
It normalises:
1. diacritics
2. Hamaza
3. digits
4. tatweel
4. etc.

## Tokeniziation
It tokenises: 
1. punctuation
2. digits


## Standardization
It standarize: 
1. diacritics
2. punctionation


It enforces text standard in several aspects: diacritics, letters, and tokenisation.

**Note**: This tokeniziation does not do morphological segmentation. For example, "wfi" is not segmented into "w+fi".
**TODO**: accept other coding. Currently, only utf8 is accepted.

## Install
`npm install aosaimy/arabic-normalizer`

## Usage
```
Usage: main.js [args] -f inputfilename

Options:
  --version         Show version number                                [boolean]
  -f                input file                           [default: "/dev/stdin"]
  --diac            remove diac                       [boolean] [default: false]
  --alif            normalize alif                    [boolean] [default: false]
  --tatweel         remove tatweel                     [boolean] [default: true]
  --digits          romanize digits                    [boolean] [default: true]
  --punc            segment punctuations               [boolean] [default: true]
  --s_digits        segment digits                     [boolean] [default: true]
  --normalize_diac  normalize diacritics to one standard
                                                       [boolean] [default: true]
  --remove_punc     remove punctuations               [boolean] [default: false]
  -h, --help        Show help                                          [boolean]
  ```

 ## Test
 This scripts has its own unit testing. You can add yours to `test/` folder. To run unit tests, run  `npm test`.
 
*Credit:* [Spence Green](http://www.spencegreen.com/2011/01/19/howto-basic-arabic-preprocessing-for-nlp/)
