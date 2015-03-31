#!node

var rs = require('../reedsolomon.js');

var dataSize = 100;
var ecSize = Math.round(dataSize * 0.1);
var message = new Int32Array(dataSize + ecSize);
for (var i = 0; i < dataSize; i++) {
	message[i] = Math.floor(Math.random() * 256);
}

benchmark({
	"encode" : function () {
		var encoder = new rs.ReedSolomonEncoder(rs.GenericGF.DATA_MATRIX_FIELD_256());
		encoder.encode(message, ecSize);
		// console.log(Array.prototype.join.call(message));
	},
	"decode" : function () {
		var decoder = new rs.ReedSolomonDecoder(rs.GenericGF.DATA_MATRIX_FIELD_256());
		decoder.decode(message, ecSize);
		// console.log(Array.prototype.join.call(message));
	}
});


// ============================================================================
// try n counts in 1sec
function measure (fun) {
	var now, start = new Date().getTime();
	var count = 0, n = 500;
	do {
		for (var i = 0; i < n; i++) fun();
		count += n;
		now = new Date().getTime();
	} while ( (now - start) < 1000);
	return (count / (now - start)) * 1000;
}

function benchmark (funcs) {
	var os = require('os');
	console.log('%s (%s) %s %s', os.type(), os.platform(), os.arch(), os.release());
	console.log(os.cpus());

	var empty = 1000 / measure(function () {});
	console.log('empty function call: %d msec', empty);

	var result = [];
	for (var key in funcs) if (funcs.hasOwnProperty(key)) {
		console.log('running... %s', key);
		result.push({ name : key, counts : measure(funcs[key]) });
	}
	result.sort(function (a, b) { return b.counts - a.counts });

	console.log('=== result ===');

	for (var i = 0, it; (it = result[i]); i++) {
		console.log("%d: (%d msec) %s", it.counts.toFixed(1), (1000 / it.counts - (empty * it.counts)).toFixed(3), it.name);
	}
}
