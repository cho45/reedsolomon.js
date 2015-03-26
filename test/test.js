#!/usr/bin/env node
/*
 * Original implementation is ZXing and ported to JavaScript by cho45
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var assert = require('assert');
var rs = require('../reedsolomon.js');

var GenericGF = rs.GenericGF;
var GenericGFPoly = rs.GenericGFPoly;
var ReedSolomonEncoder = rs.ReedSolomonEncoder;
var ReedSolomonDecoder = rs.ReedSolomonDecoder;
var DECODER_RANDOM_TEST_ITERATIONS = 3;
var DECODER_TEST_ITERATIONS = 10;

var System = {
	arraycopy : function (src, srcPos, dest, destPos, length) {
		dest.set(src.subarray(srcPos, srcPos + length), destPos);
	}
};

function corrupt(received, howMany, random, max) {
	var corrupted = new Array(received.length);
	for (var j = 0; j < howMany; j++) {
		var location = random.nextInt(received.length);
		var value = random.nextInt(max);
		if (corrupted[location] || received[location] == value) {
			j--;
		} else {
			corrupted[location] = true;
			received[location] = value;
		}
	}
}

function getPseudoRandom () {
	return {
		nextInt : function (n) {
			return Math.floor(Math.random() * n);
		}
	};
}

function testEncodeDecodeRandom(field, dataSize, ecSize) {
	assert(dataSize > 0 && dataSize <= field.getSize() - 3, "Invalid data size for " + field);
	assert(ecSize > 0 && ecSize + dataSize <= field.getSize(), "Invalid ECC size for " + field);

	var encoder = new ReedSolomonEncoder(field);
	var message = new Int32Array(dataSize + ecSize);
	var dataWords = new Int32Array(dataSize);
	var ecWords = new Int32Array(ecSize);
	var random = getPseudoRandom();
	var iterations = field.getSize() > 256 ? 1 : DECODER_RANDOM_TEST_ITERATIONS;
	for (var i = 0; i < iterations; i++) {
		console.log('testEncodeDecodeRandom', i);
		// generate random data
		for (var k = 0; k < dataSize; k++) {
			dataWords[k] = random.nextInt(field.getSize());
		}
		// generate ECC words
		System.arraycopy(dataWords, 0, message, 0, dataWords.length);
		encoder.encode(message, ecWords.length);
		System.arraycopy(message, dataSize, ecWords, 0, ecSize);
		// check to see if Decoder can fix up to ecWords/2 random errors
		testDecoder(field, dataWords, ecWords);
	}

}

function testEncoder(field, dataWords, ecWords) {
//	console.log(Array.prototype.join.call(field.logTable));
//	console.log(Array.prototype.join.call(field.expTable));
//	console.log(field);
	var encoder = new ReedSolomonEncoder(field);
	var messageExpected = new Int32Array(dataWords.length + ecWords.length);
	var message = new Int32Array(dataWords.length + ecWords.length);
	System.arraycopy(dataWords, 0, messageExpected, 0, dataWords.length);
	System.arraycopy(ecWords, 0, messageExpected, dataWords.length, ecWords.length);
	System.arraycopy(dataWords, 0, message, 0, dataWords.length);
	encoder.encode(message, ecWords.length);
	assert.deepEqual(messageExpected, message, "Encode in " + field + " (" + dataWords.length + ',' + ecWords.length + ") failed");
}

function testDecoder(field, dataWords, ecWords) {
	var decoder = new ReedSolomonDecoder(field);
	var message = new Int32Array(dataWords.length + ecWords.length);
	var maxErrors = ecWords.length / 2;
	var random = getPseudoRandom();
	var iterations = field.getSize() > 256 ? 1 : DECODER_TEST_ITERATIONS;
	for (var j = 0; j < iterations; j++) {
		for (var i = 0; i < ecWords.length; i++) {
			console.log('testDecoder', j, i);
			if (i > 10 && i < ecWords.length / 2 - 10) {
				// performance improvement - skip intermediate cases in long-running tests 
				i += ecWords.length / 10;
			}
			System.arraycopy(dataWords, 0, message, 0, dataWords.length);
			System.arraycopy(ecWords, 0, message, dataWords.length, ecWords.length);
			corrupt(message, i, random, field.getSize());
			try {
				decoder.decode(message, ecWords.length);
			} catch (e) {
				// fail only if maxErrors exceeded
				assert(i > maxErrors, "Decode in " + field + " (" + dataWords.length + ',' + ecWords.length + ") failed at " + i + " errors: " + e);
				// else stop
				break;
			}
			if (i < maxErrors) {
				assertDataEquals(dataWords, message.subarray(0, dataWords.length), "Decode in " + field + " (" + dataWords.length + ',' + ecWords.length + ") failed at " + i + " errors");
			}
		}
	}
}


function testEncodeDecode(field, dataWords, ecWords) {
	testEncoder(field, dataWords, ecWords);
	testDecoder(field, dataWords, ecWords);
}

function dump (array) {
	console.log(Array.prototype.join.call(array));
}

function assertDataEquals(expected, received, message) {
	for (var i = 0; i < expected.length; i++) {
		if (expected[i] != received[i]) {
			assert.fail(received.subarray(0, expected.length), expected, message);
		}
	}
}

(function testDataMatrix() {
	// real life test cases
	testEncodeDecode(GenericGF.DATA_MATRIX_FIELD_256(), new Int32Array([ 142, 164, 186 ]), new Int32Array([ 114, 25, 5, 88, 102 ]));
	testEncodeDecode(GenericGF.DATA_MATRIX_FIELD_256(), new Int32Array([
		0x69, 0x75, 0x75, 0x71, 0x3B, 0x30, 0x30, 0x64,
		0x70, 0x65, 0x66, 0x2F, 0x68, 0x70, 0x70, 0x68,
		0x6D, 0x66, 0x2F, 0x64, 0x70, 0x6E, 0x30, 0x71,
		0x30, 0x7B, 0x79, 0x6A, 0x6F, 0x68, 0x30, 0x81,
		0xF0, 0x88, 0x1F, 0xB5 ]),
		new Int32Array([
		0x1C, 0x64, 0xEE, 0xEB, 0xD0, 0x1D, 0x00, 0x03,
		0xF0, 0x1C, 0xF1, 0xD0, 0x6D, 0x00, 0x98, 0xDA,
		0x80, 0x88, 0xBE, 0xFF, 0xB7, 0xFA, 0xA9, 0x95 ]));
	// synthetic test cases
	testEncodeDecodeRandom(GenericGF.DATA_MATRIX_FIELD_256(), 10, 240);
	testEncodeDecodeRandom(GenericGF.DATA_MATRIX_FIELD_256(), 128, 127);
	testEncodeDecodeRandom(GenericGF.DATA_MATRIX_FIELD_256(), 220, 35);
})();

(function testQRCode() {
	// Test case from example given in ISO 18004, Annex I
	testEncodeDecode(GenericGF.QR_CODE_FIELD_256(), new Int32Array([
		0x10, 0x20, 0x0C, 0x56, 0x61, 0x80, 0xEC, 0x11,
		0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11 ]),
		new Int32Array([
		0xA5, 0x24, 0xD4, 0xC1, 0xED, 0x36, 0xC7, 0x87,
		0x2C, 0x55 ]));
	testEncodeDecode(GenericGF.QR_CODE_FIELD_256(), new Int32Array([
		0x72, 0x67, 0x2F, 0x77, 0x69, 0x6B, 0x69, 0x2F,
		0x4D, 0x61, 0x69, 0x6E, 0x5F, 0x50, 0x61, 0x67,
		0x65, 0x3B, 0x3B, 0x00, 0xEC, 0x11, 0xEC, 0x11,
		0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11, 0xEC, 0x11 ]),
		new Int32Array([
		0xD8, 0xB8, 0xEF, 0x14, 0xEC, 0xD0, 0xCC, 0x85,
		0x73, 0x40, 0x0B, 0xB5, 0x5A, 0xB8, 0x8B, 0x2E,
		0x08, 0x62 ]));
	// real life test cases
	// synthetic test cases
	testEncodeDecodeRandom(GenericGF.QR_CODE_FIELD_256(), 10, 240);
	testEncodeDecodeRandom(GenericGF.QR_CODE_FIELD_256(), 128, 127);
	testEncodeDecodeRandom(GenericGF.QR_CODE_FIELD_256(), 220, 35);
})();
