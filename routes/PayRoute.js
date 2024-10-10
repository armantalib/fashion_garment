const express = require('express');
const { default: axios } = require('axios');
const router = express.Router();
const lang2 = require('./lang.json');
const lang = require('./lang.json');

const CCLW='04704CB103DA6FEF16EA2E089D0D1D51AC61E61270F394ACEB33030A1D4C71D5F7F1E17C40E75EDDA2FD4A4D4B2A6E17F8E42C8F33A2924F83115340D4FEFDFF';
const redirectUrl="https://api.trabajos24.com/newredirect/callback";
// const redirectUrl="https://api.trabajos24.com/api/payment/redirect/callback";

const createRedirectUrl=()=>{    
     // Step 1: Encode the URL
     let encodedUrl = encodeURIComponent(redirectUrl);
    
     // Step 2: Convert the encoded URL to hexadecimal
     let hexEncodedUrl = '';
     for (let i = 0; i < encodedUrl.length; i++) {
         hexEncodedUrl += encodedUrl.charCodeAt(i).toString(16).toUpperCase();
     }

    return hexEncodedUrl
}
// Define a route to render the payment form
router.post('/',async (req, res) => {
    try {
        const {amount}=req.body
        const body = {
            "CCLW": CCLW,
            "CMTN": amount,
            "CDSC": "Agregar dinero en la cuenta.",
            "CTAX": 0.0,
            "RETURN_URL" : createRedirectUrl(),
        }
        const response= await axios.post('https://secure.paguelofacil.com/LinkDeamon.cfm', body, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*'
          }
        })

        res.send(response.data);
    } catch (error) {
        res.send(error);
    }
});
    // Define a route to render the payment form
router.get('/redirect/:callback?', (req, res) => {
    // Render the payment form view
    res.send(req?.user?.lang=='english'?lang["paydone"]:lang2["paydone"])
});
router.post('/redirect/:callback?', (req, res) => {
  console.log("addadas")
    // Render the payment form view
    res.json({data:req.params,query:req.query})
});

// Generate a UUID (v4)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
// Define a route to render the payment form
router.post('/newPayment',async (req, res) => {
  try {
    const {amount}=req.body
    const token = req.header("x-auth-token");
    const guid=generateUUID()
    const requestBody={
      "TransactionIdentifier": guid,
      "TotalAmount": amount,
      "CurrencyCode": "840",
      "ThreeDSecure": false,
      "source": {},
      "OrderIdentifier": `INT-${guid}-Orc`,
      "AddressMatch": "false",
      "ExtendedData": {
         "merchantResponseUrl": redirectUrl+"?token="+token,
         "hostedPage": {
            "pageSet": "ptz/Trabajos24",
            "pageName": "PayNow"
         }
      }
     }
    const response= await axios.post('https://staging.ptranz.com/Api/spi/Sale', requestBody, {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'PowerTranz-PowerTranzId': '77700407',
        'PowerTranz-PowerTranzPassword': 'TOeYNvkFBgY2CT3BZwXemHzJJUM9tf1RfYXyBCz2ImZOEEwba06S64'
      },
    })
    const redirectData = response.data;
    res.send({data:redirectData});
    } catch (error) {
        res.send({message:error?.Message||"Transaction is not approved",});
    }
});

module.exports = router;
