const request = require('request');
const fs = require('fs');
const json2csv = require('json2csv');
const async = require('async');
const _ = require('underscore');
const RateLimiter = require('limiter').RateLimiter;
const flatten = require('flat');
const limiter = new RateLimiter(1, 500);
const credentials = require('dotenv').config();

let apikey = process.env.API_KEY;
let password = process.env.PASSWORD;
let storeName = process.env.STORE_NAME;

let baseurl = 'https://'+apikey+':'+password+'@'+storeName+'.myshopify.com';
let numOrders = 0;
let ordersList = [];

let getOrders = function(page, callback)
{
	request({
	    url: baseurl+'/admin/orders.json?status=any&limit=250&page='+page,
	    json: true
	}, function (error, response, body) {

   	if (!error && response.statusCode === 200) {

				let newList = [];
				for (i = 0; i < body.orders.length; i++)
				{
					newList.push(flatten(body.orders[i]));
				}

				ordersList = ordersList.concat(newList);
				console.log('Received page :'+page+' - count: '+newList.length);
				console.log('ordersList len:'+ordersList.length);
				console.log();
    }

		callback();
	})
}

request({
    url: baseurl+'/admin/orders/count.json?status=any',
    json: true
}, function (error, response, body) {
	if (!error && response.statusCode === 200) {
		numOrders = body.count;
	}
	console.log();
	console.log('Processing: '+numOrders);
	console.log();
	let numPages = numOrders / 250;
	let r = _.range(1, numPages+1);

	async.forEach(r, function(page, callback) {
		limiter.removeTokens(1, function() {
			getOrders(page, callback);
		})

	}, function(err) {
		// Called when all are finished
		console.log('Total: '+ordersList.length);
		console.log();

		json2csv( {data: ordersList, fields : ['closed_at','created_at','email',
		'total_price','browser_ip', 'shipping_address.city', 'shipping_address.province']},
			function(err, csv) {
				if (err) console.log(err);
				  fs.writeFile('orders.csv', csv, function(err) {
				    if (err) throw err;
				    console.log('Done! saved as "orders.csv"');
				  });
			});
	});


});
