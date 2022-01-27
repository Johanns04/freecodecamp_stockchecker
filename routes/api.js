'use strict';
require('dotenv').config();
const fetch = require("node-fetch");
const mongoose = require('mongoose');
const ip = require('ip');
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });

const stockSchema = new mongoose.Schema({
  symbol: String,
  price: Number,
  likes: Number, 
  ipInfo: [{
      ip: String,
      liked: Boolean
  }]
});
const Stock = mongoose.model("Stock", stockSchema);
//to check IP
//let firstIP = false;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const stock = req.query.stock;
      const liked = req.query.like === 'false' ? false : true;
      const currentIP = ip.address();
      
      const urls = await getUrls(stock);
      //summon api and get stock info
      const data = await getAllUrls(urls);
      //console.log(data)
      let jsonData = [];

      let jsonPromise = new Promise((resolve)=>{
          data.forEach((sec, index) => {
            Stock.find({symbol: sec.symbol}).exec("find", function(err, dbData){
              if(err){
                console.log(err);
                resolve();
              }
              
              if(!dbData.length){//if data is empty
                let likes = liked ? 1 : 0;
                //stock doesn't exist in db so put it in
                createAndSaveStock(sec, likes, currentIP, liked);
                jsonData.push({
                  "stock":sec.symbol,
                  "price":sec.latestPrice,
                  "likes":likes
                });
              }else{//if stock exists in database
                //let findIP = dbData[0].ipInfo.findIndex((info)=> info.ip === "10.10");
                //console.log("IP poops nothing: ", !findIP)
                let ipIndex = dbData[0].ipInfo.findIndex((info)=> info.ip === currentIP);
                //console.log("Index:", dbData[0].ipInfo[ipIndex].liked)
                let likes = liked ? dbData[0].likes + 1 : dbData[0].likes;

                if(ipIndex == -1){//if ip is undefined => doesn't exist in db
                  //console.log("Hello A")
                  //add ip and update as needed
                  dbData[0].ipInfo.push({
                    ip: currentIP,
                    liked: liked
                  });
                  dbData[0].likes = likes;

                  jsonData.push({
                    "stock":sec.symbol,
                    "price":sec.latestPrice,
                    "likes":likes
                  });
                }else if(!dbData[0].ipInfo[ipIndex].liked){
                  //ip does exist in database and is set to false
                  //console.log("hello B")
                  //update everything as needed
                  dbData[0].ipInfo[ipIndex].liked = liked;
                  dbData[0].likes = likes;
                  dbData[0].latestPrice = sec.latestPrice;

                  jsonData.push({
                    "stock":sec.symbol,
                    "price":sec.latestPrice,
                    "likes":likes
                  });
                }else{//ip does exsit in database and is already set to true
                  //console.log("Hello C")
                  //update price
                  dbData[0].latestPrice = sec.latestPrice;
                  
                  jsonData.push({
                    "stock":sec.symbol,
                    "price":sec.latestPrice,
                    "likes":dbData[0].likes
                  });
                }
                
                dbData[0].save();
              }

              
              if(index === data.length - 1){
                resolve();
              }
            })
          });
        }
      )
      
      Promise.all([jsonPromise]).then(() => {
        //console.log("Json at the end:", jsonData);
        if(jsonData.length === 1){
          res.send({
            "stockData":jsonData[0]
          })
        }else{
          res.send({
            "stockData":[
              {
                "stock":jsonData[0].stock,
                "price":jsonData[0].price,
                "rel_likes":jsonData[0].likes - jsonData[1].likes
              },
              {
                "stock":jsonData[1].stock,
                "price":jsonData[1].price,
                "rel_likes":jsonData[1].likes - jsonData[0].likes
              }
            ]
          })
        }
      });
    }); 
};

/*async function getJsonData(data, liked, currentIP){
  let jsonData = [];

  let promise1 = new Promise((resolve)=>{
      data.map((sec, index) => {
        Stock.find({symbol: sec.symbol}).exec("find", function(err, dbData){
          console.log("dbdata:", dbData)
          jsonData.push("hello 34232")
          if(index === data.length - 1){
            resolve();
          }
        })
      });
    }
  )
  Promise.all([promise1]).then(values => {
    console.log("This is happening!")
    console.log(jsonData);
    return jsonData;
  });
  
}*/


async function getAllUrls(urls) {
    try {
        var data = await Promise.all(
          urls.map(url =>
            fetch(url).then((response) => 
              response.json())
            )
        );

        return data

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

function createAndSaveStock(sec, likes, currentIP, liked){
  const newStock = new Stock({
      symbol: sec.symbol,
      price: sec.latestPrice,
      likes: likes,
      ipInfo: [{
        ip: currentIP,
        liked: liked
      }]
  });
  newStock.save();
}

function getUrls(stock){
  let urls = undefined;
  if(Array.isArray(stock)){
    urls = stock.map(function generateUrl(stockSymbol){
      return `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockSymbol}/quote`
    });
  }else{
    urls = [`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`];
  }

  return urls;
}