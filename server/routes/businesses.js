const express = require('express');
const { Business } = require('../models/business');
const { ObjectId } = require('mongodb');
const validateLogin = require('../util/validateLogin');
const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const businesses = await Business.find({ owner: req.session.user_id });
        res.status(201).json({ businesses: businesses });
    } catch (error) {
        console.error(error);
    }
});

router.get('/single/:business_id', async (req, res) => {
    try {
        const { business_id } = req.params;

        const business = await Business.findById(business_id);

        res.status(201).json({ business: business });
    } catch (error) {
        console.error(error);
    }
});

router.get('/currentBusiness', async (req, res) => {
    try {
        res.status(201).json({ currentBusiness: req.session.currentBusiness });
    } catch (error) {
        console.error(error);
    }
});
router.post('/', async (req, res) => {
    try {
        console.log(req.session)
        if (!req.session.user_id) {
            res.status(500).json();
            return;
        }
        const newBusiness = new Business(
            {
                name: req.body.name,
                owner: req.session.user_id
            }
        );

        await newBusiness.save()

        res.status(201).json({ newBusiness: newBusiness });
    } catch (error) {
        console.error(error);
    }
})

router.post('/currentBusiness', async (req, res) => {
    try {
        req.session.currentBusiness = req.body.business;
        res.status(201).json({ currentBusiness: req.session.currentBusiness });
    } catch (error) {
        console.error(error);
    }
})

// Example of a GET route to set session data
router.get('/set-session', (req, res) => {
    try {
      // Manually set some session data
      req.session.user_id = '668f6f192cad53b36ea52cf9';  // Example user ID
      req.session.loggedIn = true;  // Mark user as logged in
      console.log('Setting session ID:', req.sessionID);
      // Save the session
      req.session.save();
        res.status(200).json({ message: 'Session set successfully' });
    } catch (error) {
      console.error('Error setting session:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // Example of a GET route to retrieve session data
  router.get('/get-session', (req, res) => {
    try {
      // Check if session is available
      if (req.session && req.session.user_id) {
        res.json({ 
          user_id: req.session.user_id,
          loggedIn: req.session.loggedIn,
        });
      } else {
        res.status(400).send('No session found');
      }
    } catch (error) {
      console.error('Error retrieving session:', error);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = router;