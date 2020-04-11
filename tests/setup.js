jest.setTimeout(30000);

require('../models/User');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose
	.connect('mongodb://127.0.0.1/Blog', {
		useMongoClient: true
	})
	.then(() => console.log('mongodb connected'))
	.catch(() => console.log('err -> ', err));
