require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const logger = require('./startup/logger'); // Adjust the path as needed
const lang2 = require('./routes/lang.json');
const { default: axios } = require('axios');
const lang = require('./routes/lang.json');
const jwt = require("jsonwebtoken");
const mainconfig = require("config");

// const admin = require("firebase-admin");
const Wallet = require('./models/Wallet');
const Transaction = require('./models/Transaction');

// const config = {
//   "type": process.env.TYPE,
//   "project_id":process.env.PROJECTID,
//   "private_key_id": process.env.PRIVATE_KEY_ID,
//   "private_key":process.env.PRIVATE_KEY,
//   "client_email":process.env.CLIENT_EMAIL,
//   "client_id": process.env.CLIENTID,
//   "auth_uri": process.env.AUTH_URI,
//   "token_uri": process.env.TOKEN_URL,
//   "auth_provider_x509_cert_url":process.env.AUTHPROVIDER,
//   "client_x509_cert_url": process.env.CLIENT_CERT,
//   "universe_domain": process.env.DOMAIN
//   };
  
//   admin.initializeApp({
//     credential: admin.credential.cert(config),
//     storageBucket: "gs://trabojos-648e6.appspot.com"
//   });
  
  app.use(cors());

require('./startup/config')();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/validation')();

// Middleware to parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Route to handle the POST request
app.post('/newredirect/callback', async(req, res) => {
  const redirectUrl="https://api.trabajos24.com/payment/callback";
    try {
        const response = JSON.parse(req.body.Response);
        if (response?.SpiToken) {
          const payload = JSON.stringify(response?.SpiToken);

          await axios.post('https://staging.ptranz.com/api/spi/payment', payload, {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
          })  

          const token=req.query.token;
          const userId = jwt.verify(token, mainconfig.get("jwtPrivateKey")); //JWT need to be defined somewherelese

          const balance=Number(response.TotalAmount)
          const wallet=await Wallet.findOne({user:userId});
        
          
          const transaction = new Transaction({
            user: userId,
            balance: Number(balance),
            type: "deposit",
            description_en: balance+ lang["dep"],
            description_sp: balance+ lang2["dep"],
          });
          await transaction.save();
        
          if (!wallet) {
        
            const wallets= new Wallet({
              user:userId,
              balance:Number(balance)
            })
        
            await wallets.save()
        
          }else{
            wallet.balance=Number(wallet.balance)+Number(balance)
          
            await wallet.save()

          }

          res.redirect(redirectUrl+"?success=true");
        }else{
          res.redirect(redirectUrl+"?success=false");
        }
      } catch (error) {   
        logger.error(error)
        res.redirect(redirectUrl+"?success=false");
    }
});

// Route to handle the POST request
app.get('/payment/callback', async(req, res) => {
    try {
      console.log(req.query)
      const text=req.query.success=='true'?"Payment Successfully completed!":"Payment is not completed yet!"
      res.send(text);
    } catch (error) {   
        res.status(400).send({ success: false, message: lang2["error"]  });
    }
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => logger.info(`Listening on port ${port}...`));

require('./startup/sockets')(server, app);

module.exports = server;