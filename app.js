const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 5000;

let userSessions = {};

const menuItems = [
    { id: 1, name: 'Jazzy Burger', price: 10000 },
    { id: 2, name: 'Pizza', price: 7000 },
    { id: 3, name: 'Massa', price: 2000 },
    { id: 4, name: 'Awara', price: 500 }
];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    const sessionId = socket.id;
    userSessions[sessionId] = {
        currentOrder: [],
        orderHistory: []
    };

    socket.emit('bot-message', `Welcome! Select an option:
    1: Place an order
    99: Checkout order
    98: See order history
    97: See current order
    0: Cancel order`);

    socket.on('user-message', (msg) => {
    const userSession = userSessions[sessionId];
    switch (msg) {
        case '1':
        let menuMessage = 'Please select an item:\n';
        menuItems.forEach(item => {
            menuMessage += `${item.id}: ${item.name} - N${item.price}\n`;
        });
        socket.emit('bot-message', menuMessage);
        break;
        case '99':
        if (userSession.currentOrder.length > 0) {
            userSession.orderHistory.push([...userSession.currentOrder]);
            userSession.currentOrder = [];
            socket.emit('bot-message', 'Order placed. You can place a new order.');
        } else {
        socket.emit('bot-message', 'No order to place.');
        }
        break;
        case '98':
        if (userSession.orderHistory.length > 0) {
            let historyMessage = 'Order History:\n';
            userSession.orderHistory.forEach((order, index) => {
            historyMessage += `Order ${index + 1}:\n`;
            order.forEach(item => {
                historyMessage += `  - ${item.name} - $${item.price}\n`;
                });
            });
        socket.emit('bot-message', historyMessage);
        } else {
            socket.emit('bot-message', 'No order history.');
        }
        break;
        case '97':
        if (userSession.currentOrder.length > 0) {
            let currentOrderMessage = 'Current Order:\n';
            userSession.currentOrder.forEach(item => {
            currentOrderMessage += `  - ${item.name} - $${item.price}\n`;
            });
            socket.emit('bot-message', currentOrderMessage);
        } else {
            socket.emit('bot-message', 'No current order.');
        }
        break;
        case '0':
        userSession.currentOrder = [];
        socket.emit('bot-message', 'Order canceled.');
        break;
        default:
        const selectedItem = menuItems.find(item => item.id == msg);
        if (selectedItem) {
            userSession.currentOrder.push(selectedItem);
            socket.emit('bot-message', `${selectedItem.name} added to your order. Select more items or type 99 to checkout.`);
        } else {
            socket.emit('bot-message', 'Invalid option. Please try again.');
        }
        break;
    }
    });

socket.on('disconnect', () => {
    delete userSessions[sessionId];
    });
});

server.listen(port, () => {
console.log(`Server running at http://localhost:${port}`);
});
