reedsolomon.js
==============

reedsolomon.js is an implementation of Reed-Solomon coding method for both encoding and decoding.

This is ported from [Zxing][1] open source project written in Java. Almost code is copied from [com.google.zxing.common.reedsolomon package][2].

[1]: https://github.com/zxing/zxing
[2]: https://github.com/zxing/zxing/tree/master/core/src/main/java/com/google/zxing/common/reedsolomon

### SYNOPSIS

This library provides only low-level RS coding classes (faithfully imported from original Zxing).

	// running on node.js
	var rs = require('./reedsolomon.js');

	function RS(messageLength, errorCorrectionLength) {
		var dataLength = messageLength - errorCorrectionLength;
		var encoder = new rs.ReedSolomonEncoder(rs.GenericGF.AZTEC_DATA_8());
		var decoder = new rs.ReedSolomonDecoder(rs.GenericGF.AZTEC_DATA_8());
		return {
			dataLength: dataLength,
			messageLength: messageLength,
			errorCorrectionLength: errorCorrectionLength,

			encode : function (message) {
				encoder.encode(message, errorCorrectionLength);
			},

			decode: function (message) {
				decoder.decode(message, errorCorrectionLength);
			}
		};
	}

	var ec = RS(32, 8);
	var message = new Int32Array(ec.messageLength);
	for (var i = 0; i < ec.dataLength; i++) message[i] = i;

	console.log('raw data');
	console.log(Array.prototype.join.call(message));
	//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,0,0,0,0,0,0,0

	ec.encode(message);

	console.log('rs coded');
	console.log(Array.prototype.join.call(message));
	//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,180,183,0,112,111,203,47,126

	console.log('corrupted');
	for (var i = 0; i < 4; i++) message[ Math.floor(Math.random() * message.length) ] = 0xff;
	console.log(Array.prototype.join.call(message));
	//=> 0,1,2,3,4,255,6,7,8,9,10,11,12,13,14,15,255,17,18,19,20,21,22,23,255,183,255,112,111,203,47,126

	ec.decode(message);

	console.log('rs decoded');
	console.log(Array.prototype.join.call(message));
	//=> 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,180,183,0,112,111,203,47,126

### API

See also: http://zxing.github.io/zxing/apidocs/com/google/zxing/common/reedsolomon/package-frame.html

