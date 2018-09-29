import * as express from 'express';
import {Server} from 'ws';
import * as path from 'path';

const app = express();

export class Product {

    constructor(public id: number,
                public title: string,
                public price: number,
                public rating: number,
                public descri: string,
                public categories: Array<string>) {
    }
}

export class Comment {

    constructor(public id: number,
                public productId: number,
                public timestamp: string,
                public user: string,
                public rating: number,
                public content: string) {}

}

const products: Product[] = [
    new Product(1, 'Canada Goose', 1.99, 3.5, 'This is the first product I made', ['clothes']),
    new Product(2, 'Sony', 2.99, 4.5, 'This is the second product I made', ['electric']),
    new Product(3, 'Cheese', 3.99, 5.0, 'This is the third product I made', ['food']),
    new Product(4, 'Bose', 4.99, 2.5, 'This is the forth product I made', ['electric']),
    new Product(5, 'Roots', 5.99, 1.0, 'This is the fifth product I made', ['clothes','food']),
    new Product(6, 'Milk', 6.99, 4.5, 'This is the sixth product I made', ['food']),
];

const comments: Comment[] = [
    new Comment(1, 1, '2017-02-22 22:22:22', 'san', 3, 'fair good'),
    new Comment(2, 1, '2017-02-23 23:22:22', 'si', 4, 'good'),
    new Comment(3, 3, '2017-02-24 00:22:22', 'wu', 5, 'nice'),
    new Comment(4, 2, '2017-02-25 02:22:22', 'liu', 4.5, 'perfect'),
];

app.use('/',express.static(path.join(__dirname, '..','client')));

app.get('/api/products',(req, res) => {
    let result = products;
    let params = req.query;

    if(params.title){
        result = result.filter((p) => p.title.indexOf(params.title) !== -1)
    }
    console.log(params.title);
    if(params.price && result.length > 0){
        result = result.filter((p) => p.price <= parseInt(params.price));
    }
    console.log(params.price);
    if(params.category && params.category !== '-1' && result.length > 0){
        result = result.filter((p) => p.categories.indexOf(params.category) !== -1);
    }
    console.log(params.category);
    res.json(result);
});
app.get('/api/product/:id',(req, res) => {
    res.json(products.find((product) => product.id == req.params.id));
});

app.get('/api/product/:id/comments',(req, res) => {
    res.json(comments.filter((comment: Comment) => comment.productId == req.params.id));
});

const server = app.listen(8000,'localhost', () => {
    console.log('Server has started, address is http://localhost:8000');
});

const subscriptions = new Map<any, number[]>();
const wsServer = new Server({port:8085});
wsServer.on("connection",websocket => {
    websocket.send("This message is pushed by server!");
    websocket.on("message", message => {
        let messageObj: any;
        messageObj = JSON.parse(message);
        let productIds = subscriptions.get(websocket) || [];
        subscriptions.set(websocket,[...productIds, messageObj.productId]);
    });
});

const currentBids = new Map<number, number>();

setInterval( () => {
    products.forEach(p => {
        let currentBid = currentBids.get(p.id) || p.price;
        let newBid = currentBid + Math.random() * 5;
        currentBids.set(p.id, newBid);
    });
    subscriptions.forEach((productIds: number[], ws)=> {
        if(ws.readyState === 1) {
            let newBids = productIds.map(pid => ({
                productId: pid,
                bid: currentBids.get(pid),
            }));
            ws.send(JSON.stringify(newBids));
            console.log(JSON.stringify(newBids));
        }else{
            subscriptions.delete(ws);
        }
    });
},2000);
