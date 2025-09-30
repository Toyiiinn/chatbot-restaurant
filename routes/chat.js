const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const menuData = require('../data/menu');

router.post('/', (req, res) => {
  const { message } = req.body;
  const userInput = message.trim();

  handleChatMessage(req, userInput)
    .then(response => res.json(response))
    .catch(err => res.status(500).json({ error: err.message }));
});

const handleChatMessage = async (req, input) => {
  const state = req.session.chatState;

  if (state === 'main') {
    if (input === '1') {
      req.session.chatState = 'ordering';
      return {
        message: formatMenuMessage(),
        options: getMainOptions()
      };
    } else if (input === '99') {
      return await checkoutOrder(req);
    } else if (input === '98') {
      return await getOrderHistory(req);
    } else if (input === '97') {
      return getCurrentOrder(req);
    } else if (input === '0') {
      return cancelOrder(req);
    } else {
      return {
        message: 'Invalid option. Please select a valid option.',
        options: getMainOptions()
      };
    }
  }

  if (state === 'ordering') {
    if (input === '99') {
      req.session.chatState = 'main';
      return await checkoutOrder(req);
    } else if (input === '0') {
      req.session.chatState = 'main';
      return cancelOrder(req);
    } else if (input === '97') {
      return getCurrentOrder(req);
    } else {
      const itemIndex = parseInt(input) - 1;
      if (itemIndex >= 0 && itemIndex < menuData.length) {
        const item = menuData[itemIndex];
        req.session.currentOrder.push(item);
        return {
          message: `${item.name} added to cart (₦${item.price})\n\n${formatMenuMessage()}`,
          options: getMainOptions()
        };
      } else {
        return {
          message: 'Invalid item number. Please select from the menu.',
          options: getMainOptions()
        };
      }
    }
  }

  return {
    message: 'Something went wrong. Returning to main menu.',
    options: getMainOptions()
  };
};

const formatMenuMessage = () => {
  let message = '🍽️ **Our Menu**\n\n';
  menuData.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - ₦${item.price}\n   ${item.description}\n\n`;
  });
  message += 'Select item number to add to cart';
  return message;
};

const getMainOptions = () => {
  return `
📋 **Menu Options:**
1️⃣ - Place an order
9️⃣7️⃣ - See current order
9️⃣9️⃣ - Checkout order
9️⃣8️⃣ - Order history
0️⃣ - Cancel order
  `.trim();
};

const getCurrentOrder = (req) => {
  if (req.session.currentOrder.length === 0) {
    return {
      message: 'Your cart is empty.',
      options: getMainOptions()
    };
  }

  let total = 0;
  let message = '**Current Order:**\n\n';
  req.session.currentOrder.forEach((item, index) => {
    message += `${index + 1}. ${item.name} - ₦${item.price}\n`;
    total += item.price;
  });
  message += `\n**Total: ₦${total}**`;

  return {
    message,
    options: getMainOptions()
  };
};

const checkoutOrder = async (req) => {
  if (req.session.currentOrder.length === 0) {
    return {
      message: 'No order to place.\n\nWould you like to place a new order?',
      options: getMainOptions()
    };
  }

  const total = req.session.currentOrder.reduce((sum, item) => sum + item.price, 0);
  
  const order = new Order({
    sessionId: req.sessionID,
    items: req.session.currentOrder,
    total,
    status: 'pending'
  });

  return order.save()
    .then(savedOrder => {
      req.session.currentOrder = [];
      req.session.chatState = 'main';
      
      return {
        message: `Order placed successfully!\n\nOrder ID: ${savedOrder._id}\nTotal: ₦${total}\n\n💳 Proceed to payment?`,
        orderId: savedOrder._id.toString(),
        amount: total,
        showPayment: true,
        options: getMainOptions()
      };
    });
};

const getOrderHistory = async (req) => {
  return Order.find({ sessionId: req.sessionID })
    .sort({ createdAt: -1 })
    .then(orders => {
      if (orders.length === 0) {
        return {
          message: '📜 No order history found.',
          options: getMainOptions()
        };
      }

      let message = '📜 **Order History:**\n\n';
      orders.forEach((order, index) => {
        message += `**Order #${index + 1}** (${order.createdAt.toLocaleDateString()})\n`;
        message += `Status: ${order.status}\n`;
        message += `Total: ₦${order.total}\n`;
        order.items.forEach(item => {
          message += `  - ${item.name}\n`;
        });
        message += '\n';
      });

      return {
        message,
        options: getMainOptions()
      };
    });
};

const cancelOrder = (req) => {
  if (req.session.currentOrder.length === 0) {
    return {
      message: 'No order to cancel.',
      options: getMainOptions()
    };
  }

  req.session.currentOrder = [];
  req.session.chatState = 'main';
  
  return {
    message: '🗑️ Order cancelled successfully.',
    options: getMainOptions()
  };
};

module.exports = router;