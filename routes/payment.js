const express = require('express');
const router = express.Router();
const https = require('https');
const Order = require('../models/Order');

router.post('/verify', (req, res) => {
  const { reference, orderId } = req.body;
  
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/transaction/verify/${reference}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
    }
  };

  const request = https.request(options, response => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      const result = JSON.parse(data);
      
      if (result.data && result.data.status === 'success') {
        Order.findByIdAndUpdate(orderId, { 
          status: 'paid',
          paymentReference: reference 
        })
        .then(() => {
          res.json({ 
            success: true, 
            message: 'Payment successful! Your order is being prepared.' 
          });
        })
        .catch(err => res.status(500).json({ error: err.message }));
      } else {
        res.json({ 
          success: false, 
          message: 'Payment verification failed. Please try again.' 
        });
      }
    });
  });

  request.on('error', err => {
    res.status(500).json({ error: err.message });
  });

  request.end();
});

router.get('/success', (req, res) => {
  res.render('payment-success');
});

module.exports = router;