// using assert passed to the test function that just logs failures 
var assert = require('assert');
var normalizer = require("../main.js");
var b2u = require("buckwalter-transliteration")("bw2utf");
var u2b = require("buckwalter-transliteration")("utf2bw");
describe('diacritics', ()=>{
	"use strict";
	describe('remove_diacritics', function() {
    	it('should remove diacs', ()=>{
			assert.equal(u2b(normalizer(b2u(">alif"),{diac:true})), ">lf")
		})
		it('should not removed diacs', ()=>{
			assert.equal(u2b(normalizer(b2u(">alif"),{diac:false})), ">alif")
		})
	})

	describe('use its functions and regexp directly', function() {
		var funcs = normalizer()
    	it('funcs', ()=>{
			assert.equal(u2b(funcs.normalize_diac(b2u(">aalif"))), ">alif")
		})
    	it('regexp', ()=>{
			assert.equal("شسيasd1س١٢٣".replace(funcs.regexp.p_not_arb,""), "شسيس١٢٣")
			assert.equal("شسيasd1س١٢٣".replace(funcs.regexp.arb_digit,""), "شسيasd1س")
		})
	})

	describe('normalize_diacritics', function() {
		it("should remove starting diacritics", ()=>{
			assert.equal(u2b(normalizer(b2u("aamno"),{diac:false,normalize_diac:true})), "mno")
			assert.equal(u2b(normalizer(b2u("faqaAola <in a>Hdakumo <i*aAo qaAoma"),{diac:false,normalize_diac:true})), "faqaAola <in >Hdakumo <i*aAo qaAoma")
		})
		it("should remove words that has only diacritics", ()=>{
			assert.equal(u2b(normalizer(b2u("bsm i min"),{diac:false,normalize_diac:true})), "bsm min")
		})
		it("should add sokun diacritic on the vowel letters (e.g. fathah then alif)", ()=>{
			assert.equal(u2b(normalizer(b2u("laA"),{diac:false,normalize_diac:true})), "laAo")	
			// assert.equal(u2b(normalizer(b2u("hw"),{diac:false,normalize_diac:true})), "huwo")	// wrong!
			// assert.equal(u2b(normalizer(b2u("fy"),{diac:false,normalize_diac:true})), "fiyo")	// but wrong with "liyawomK"
		})
		it("should remove duplicates of the same diacritic", ()=>{
			assert.equal(u2b(normalizer(b2u("maano"),{diac:false,normalize_diac:true})), "mano")
		})
		it("should alif tanween be tanween then the alif", ()=>{
			assert.equal(u2b(normalizer(b2u("mtmyzAF"),{diac:false,normalize_diac:true})), "mtmyzFA")
		})
		it("should swap shaddah if before harakah", ()=>{
			assert.equal(u2b(normalizer(b2u("mima~A"),{diac:false,normalize_diac:true})), "mim~aAo")
		})
		it("should remove incompatible diacritics", ()=>{
		assert.equal(u2b(normalizer(b2u("miano"),{diac:false,normalize_diac:true})), "mino")
		})
		it("should remove tanween in wrong place", ()=>{
			assert.equal(u2b(normalizer(b2u("mFno"),{diac:false,normalize_diac:true})), "mno")
			assert.equal(u2b(normalizer(b2u("sma~A"),{diac:false,normalize_diac:true})), "sm~aAo")
		})
		it("should remove shaddah at the beginning of word", ()=>{
			assert.equal(u2b(normalizer(b2u("~mino"),{diac:false,normalize_diac:true})), "mino")
		})
		it("should normalize bottom hamza", ()=>{
			assert.equal(u2b(normalizer(b2u("<ansAn"),{diac:false,normalize_diac:true})), "<insAn")
			assert.equal(u2b(normalizer(b2u("<nsAn"),{diac:false,normalize_diac:true})), "<insAn")
		})
	})
})
