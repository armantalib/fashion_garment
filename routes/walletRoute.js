const express = require('express');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const admin = require('../middleware/admin');
const router = express.Router();
const lang2 = require('./lang.json');
const lang = require('./lang.json');
const Application = require('../models/Application');
const { User } = require('../models/user');

router.get('/balance', async (req, res) => {
  const userId=req.user._id;
  const wallet=await Wallet.findOne({user:userId}).lean();

  if (!wallet) {

    const wallets= new Wallet({
      user:userId
    })

    await wallets.save()

   return res.send({success:true,wallet:wallets});
  }

  const orders = await Application.find({to_id:userId,status:"accepted",transaction:false}).lean();

  const amount=orders.reduce((a,b)=>a + b.bid_price,0)

  res.send({
    success:true,
    wallet,
    currentOrderAmount:amount
  });
});
router.put('/add', async (req, res) => {
  // const userId=req.user._id;
  // const {balance}=req.body
  // const wallet=await Wallet.findOne({user:userId});

  
  // const transaction = new Transaction({
  //   user: userId,
  //   balance: balance,
  //   type: "deposit",
  //   description_en: balance+ lang["dep"],
  //   description_sp: balance+ lang2["dep"],
  // });
  // await transaction.save();

  // if (!wallet) {

  //   const wallets= new Wallet({
  //     user:userId,
  //     balance:balance
  //   })

  //   await wallets.save()

  //  return res.send({success:true,message:req.user.lang=='spanish'?lang2["balcadd"]:lang["balcadd"],wallet:wallets});
  // }
  // wallet.balance=Number(wallet.balance)+Number(balance)

  // await wallet.save()

  res.send({
    success:true,
    // wallet,
    // message:req.user.lang=='spanish'?lang2["balcadd"]:lang["balcadd"],
  });
});

router.put('/order/:id', async (req, res) => {
  const userId=req.user._id;
  const orderId=req.params.id;
  const {balance}=req.body

  
  const transaction = new Transaction({
    user: userId,
    balance: balance,
    type: "orderpay",
    order:orderId,
    description_en: balance+ lang["dep"],
    description_sp: balance+ lang2["dep"],
  });

  await Application.findByIdAndUpdate(orderId,{transaction:true})
  await transaction.save();

  res.send({
    success:true,
    message:req.user.lang=='spanish'?lang2["balcadd"]:lang["balcadd"],
  });
});

router.put('/withdraw', async (req, res) => {
  const userId=req.user._id;
  const {balance,bankdetailId}=req.body
  const wallet=await Wallet.findOne({user:userId});
  
  if (!wallet) {
    return res.status("400").send({success:false,message:req.user.lang=='spanish'?lang2["nobalance"]:lang["nobalance"],});
  }
  
  if (Number(balance)>Number(wallet.balance)) {
    return res.status("400").send({success:false,message:req.user.lang=='spanish'?lang2["nobalance"]:lang["nobalance"],});
  }

  const orders = await Application.find({to_id:userId,status:"accepted",transaction:false}).lean();

  const amount=orders.reduce((a,b)=>a + b.bid_price,0)

  if (Number(balance) > (Number(wallet.balance) - amount)) {
    return res.status("400").send({success:false,message:req.user.lang=='spanish'?lang2["nobalance"]:lang["nobalance"],});
  }

  const transaction = new Transaction({
    user: userId,
    balance: Number(balance),
    type: "withdraw",
    status:"pending",
    description_sp: balance+ lang2["withdraw"],
    description_en: balance+ lang["withdraw"],
    bankdetail:bankdetailId
  });
  await transaction.save();

  wallet.balance=Number(wallet.balance)-Number(balance)
  await wallet.save();

  res.send({
    success:true,
    wallet,
    message:req.user.lang=='spanish'?lang2["requestsent"]:lang["requestsent"],
  });
});

router.get('/transactions/:type/:id?', async (req, res) => {
  const userId=req.user._id;
  let query = {};

  if (req.params.id) {
    query._id = { $lt: req.params.id };
  }
  if (req.params.type!=='all') { 
    query.type=req.params.type
  }
  query.user = userId;

  const transactions=await Transaction.find(query).sort({ _id: -1 }).limit(10).lean();

  const user=await User.findById(userId).lean()

  if (transactions.length > 0) {
    let transactionsArray=[...transactions]
    transactionsArray = transactionsArray.map(obj => {
        obj.description =user.lang=="english" ? obj.description_en:obj.description_sp; 
        delete obj.description_en;          
        delete obj.description_sp;          
        return obj;
      });
      res.send({
        success:true,
        transactions:transactionsArray
      });
  }else{
    res.send({
      success:false,
      transactions:transactions
    });
  }

});

router.put('/admin/update/:id',admin, async (req, res) => {
  const transactionId=req.params.id

  const {receipt}=req.body

  const transactions=await Transaction.findByIdAndUpdate(transactionId,{status:"completed",receipt:receipt},{new:true})
  
  if (!transactions) {
    return res.status("400").send({success:false,message:req.user.lang=='spanish'?lang2["transationnot"]:lang["transationnot"],});
  }

  res.send({
    success:true,
    transactions
  });
});

router.get('/admin/:id/:type/:transtype?',admin, async (req, res) => {
  let query = {};

  const lastId = parseInt(req.params.id)||1;

  // Check if lastId is a valid number
  if (isNaN(lastId) || lastId < 0) {
    return res.status(400).json({ message:req.user.lang=='spanish'?lang2["Invalid_last_id"]:lang["Invalid_last_id"] });
  }
  
  const pageSize = 10;

  const skip = Math.max(0, (lastId - 1)) * pageSize;

  if (req.params.type) { 
    query.status=req.params.type
  }
  if (req.params.type=='pending') {
    query.type="withdraw"
  }
  
  if (req.params?.transtype && req.params.transtype !== 'all') { 
    query.type=req.params.transtype
  }

  try {
    const posts = await Transaction.find(query).populate("user").populate("bankdetail")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(pageSize).lean();    

    const totalCount = await Transaction.find(query);
    const totalPages = Math.ceil(totalCount.length / pageSize);
    const totalAmount=totalCount.reduce((a,b)=>a+b.balance,0)

    if (posts.length > 0) {
      let transactionsArray=[...posts]
      transactionsArray = transactionsArray.map(obj => {
        obj.description =req?.user?.lang=='english'? obj.description_en:obj.description_sp; 
        delete obj.description_en;          
        delete obj.description_sp;          
        return obj;
      });
      res.status(200).json({ success: true, Transactions: transactionsArray,count: { totalPage: totalPages, currentPageSize: transactionsArray.length } ,totalAmount });
    } else {
      res.status(200).json({ success: false, Transactions:[],message: req.user.lang=='spanish'?lang2["nome"]:lang["nome"],count: { totalPage: totalPages, currentPageSize: posts.length } ,totalAmount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: req.user.lang=='spanish'?lang2["error"]:lang["error"]});
  }
});

module.exports = router; 
