const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const client = redis.createClient();
client.on('connect', () => {
	console.log('redis Connected');
});
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
	this.Usecache = true;
	this.hashkey = JSON.stringify(options.key || '');
	//chainable
	return this;
};

mongoose.Query.prototype.exec = async function() {
	if (!this.Usecache) {
		return exec.apply(this, arguments);
	}
	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name
		})
	);

	//see if we have a value in redis
	const cacheValue = await client.hget(this.hashkey, key);
	//if we do return the valuequery
	if (cacheValue) {
		const doc = JSON.parse(cacheValue);
		return Array.isArray(doc) ? doc.map((d) => new this.model(d)) : new this.model(doc);
	}
	//otherwise issue the query and store the result in redis

	const result = await exec.apply(this, arguments);
	client.hset(this.hashkey, key, JSON.stringify(result), 'Ex', 10);
	return result;
};

module.exports = {
	clearHash(hashkey) {
		client.del(JSON.stringify(hashkey));
	}
};
