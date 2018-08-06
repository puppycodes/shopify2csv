const request = require('request');
const fs = require('fs');
const json2csv = require('json2csv');
const async = require('async');
const _ = require('underscore');
const RateLimiter = require('limiter').RateLimiter;
const flatten = require('flat');
const limiter = new RateLimiter(1, 500);

let apikey = '';
let password = '';
let shopname = '';

let baseurl = 'https://'+apikey+':'+password+'@'+shopname+'.myshopify.com';
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

	console.log('Total Order Count :'+numOrders);
	console.log();
	let numPages = numOrders / 250;
	let r = _.range(1, numPages+1);

	async.forEach(r, function(page, callback) {
		limiter.removeTokens(1, function() {
			getOrders(page, callback);
		})

	}, function(err) {
		// Called when all are finished
		console.log('Total orders: '+ordersList.length)

		json2csv( {data: ordersList, fields : ['closed_at','created_at','email',
		'total_price','browser_ip', 'shipping_address.city', 'shipping_address.province']},
			function(err, csv) {
				if (err) console.log(err);
				  fs.writeFile('ShopifyOrders.csv', csv, function(err) {
				    if (err) throw err;
				    console.log('File saved');
				  });
			});
	});


});
