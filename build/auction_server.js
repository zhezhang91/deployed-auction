"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var ws_1 = require("ws");
var path = require("path");
var app = express();
var Product = /** @class */ (function () {
    function Product(id, title, price, rating, descri, categories) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.rating = rating;
        this.descri = descri;
        this.categories = categories;
    }
    return Product;
}());
exports.Product = Product;
var Comment = /** @class */ (function () {
    function Comment(id, productId, timestamp, user, rating, content) {
        this.id = id;
        this.productId = productId;
        this.timestamp = timestamp;
        this.user = user;
        this.rating = rating;
        this.content = content;
    }
    return Comment;
}());
exports.Comment = Comment;
var products = [
    new Product(1, 'Canada Goose', 1.99, 3.5, 'This is the first product I made', ['clothes']),
    new Product(2, 'Sony', 2.99, 4.5, 'This is the second product I made', ['electric']),
    new Product(3, 'Cheese', 3.99, 5.0, 'This is the third product I made', ['food']),
    new Product(4, 'Bose', 4.99, 2.5, 'This is the forth product I made', ['electric']),
    new Product(5, 'Roots', 5.99, 1.0, 'This is the fifth product I made', ['clothes', 'food']),
    new Product(6, 'Milk', 6.99, 4.5, 'This is the sixth product I made', ['food']),
];
var comments = [
    new Comment(1, 1, '2017-02-22 22:22:22', 'san', 3, 'fair good'),
    new Comment(2, 1, '2017-02-23 23:22:22', 'si', 4, 'good'),
    new Comment(3, 3, '2017-02-24 00:22:22', 'wu', 5, 'nice'),
    new Comment(4, 2, '2017-02-25 02:22:22', 'liu', 4.5, 'perfect'),
];
app.use('/', express.static(path.join(__dirname, '..', 'client')));
app.get('/api/products', function (req, res) {
    var result = products;
    var params = req.query;
    if (params.title) {
        result = result.filter(function (p) { return p.title.indexOf(params.title) !== -1; });
    }
    console.log(params.title);
    if (params.price && result.length > 0) {
        result = result.filter(function (p) { return p.price <= parseInt(params.price); });
    }
    console.log(params.price);
    if (params.category && params.category !== '-1' && result.length > 0) {
        result = result.filter(function (p) { return p.categories.indexOf(params.category) !== -1; });
    }
    console.log(params.category);
    res.json(result);
});
app.get('/api/product/:id', function (req, res) {
    res.json(products.find(function (product) { return product.id == req.params.id; }));
});
app.get('/api/product/:id/comments', function (req, res) {
    res.json(comments.filter(function (comment) { return comment.productId == req.params.id; }));
});
var server = app.listen(8000, 'localhost', function () {
    console.log('Server has started, address is http://localhost:8000');
});
var subscriptions = new Map();
var wsServer = new ws_1.Server({ port: 8085 });
wsServer.on("connection", function (websocket) {
    websocket.send("This message is pushed by server!");
    websocket.on("message", function (message) {
        var messageObj;
        messageObj = JSON.parse(message);
        var productIds = subscriptions.get(websocket) || [];
        subscriptions.set(websocket, productIds.concat([messageObj.productId]));
    });
});
var currentBids = new Map();
setInterval(function () {
    products.forEach(function (p) {
        var currentBid = currentBids.get(p.id) || p.price;
        var newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });
    subscriptions.forEach(function (productIds, ws) {
        if (ws.readyState === 1) {
            var newBids = productIds.map(function (pid) { return ({
                productId: pid,
                bid: currentBids.get(pid),
            }); });
            ws.send(JSON.stringify(newBids));
            console.log(JSON.stringify(newBids));
        }
        else {
            subscriptions.delete(ws);
        }
    });
}, 2000);
