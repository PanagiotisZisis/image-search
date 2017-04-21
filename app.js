var express = require('express');
var cors = require('cors');
var bing = require('node-bing-api') ({accKey: process.env.BING_API_KEY});
var mongo = require('mongodb').MongoClient;

var app = express();

app.use(cors());

app.get('/imagesearch/:value', function(req, res) {
    var value = req.params.value;
    var offset = req.query.offset;

    bing.images(value, {top: 10, skip: offset}, function(error, response, body) {
        if (error) {
            res.send('There was an error.');
        }
       var result = [];
       body['value'].forEach(function(item) {
        result.push(
            {
                url: item.contentUrl,
                snippet: item.name,
                thumbnail: item.thumbnailUrl,
                context: item.hostPageDisplayUrl
            }
        );
       });
       mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
           if (err) {
               res.send('There was an error connecting to the database.');
           }
           var searches = db.collection('searches');
           var date = new Date();
           var obj = {
               term: value,
               when: date
           };
           searches.insert(obj);
           db.close();
       });
       res.json(result);
    });
});

app.get('/latest', function(req, res) {
    mongo.connect(process.env.MONGOLAB_URI, function(err, db) {
        if (err) {
            res.send('There was an error connecting to the database.');
        }
        var searches = db.collection('searches');
        searches.find({}, {_id: 0}).toArray(function(err, result) {
            if (err) {
                res.send('There was an error reading the data from the database.');
            }
            res.json(result);
        });
        db.close();
    });
});

app.listen(process.env.PORT || 8000, function() {
    console.log('App is working...');
})