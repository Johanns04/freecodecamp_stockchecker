const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(50000);
  test("Viewing one stock: GET request to /api/stock-prices/", (done)=>{
    chai.request(server)
        .get("/api/stock-prices?stock=GOOG")
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.strictEqual(res.body.stockData.stock, "GOOG", "Symbol is equal")
          done();
        });
  });
  test("Viewing one stock and liking it: GET request to /api/stock-prices/", done=>{
    chai.request(server)
        .get("/api/stock-prices?stock=GOOG&like=true")
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.strictEqual(res.body.stockData.stock, "GOOG", "Symbol is equal");
          assert.isTrue(res.body.stockData.likes >= 1, "Error in one like has been added");
          stock_likes = res.body.stockData.likes;
          done();
        });
  });

  test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", done=>{
    chai.request(server)
        .get("/api/stock-prices?stock=GOOG&like=true")
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.strictEqual(res.body.stockData.stock, "GOOG", "Symbol is equal");
          assert.strictEqual(res.body.stockData.likes, stock_likes, "Error in stock likes is same as before");
          done();
        });
  });

  test("Viewing two stocks: GET request to /api/stock-prices/", done=>{
    chai.request(server)
        .get("/api/stock-prices?stock=GOOG&stock=MSFT")
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.isTrue(Array.isArray(res.body.stockData), "Stock data is an array");
          done();
        });
  });

  test("Viewing two stocks and liking them: GET request to /api/stock-prices/", done=>{
    chai.request(server)
        .get("/api/stock-prices?stock=GOOG&stock=MSFT&like=true")
        .end((err, res)=>{
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.isTrue(Array.isArray(res.body.stockData), "Error: stockData is not an array");
          //console.log(res.body.stockData)
          assert.isNotNull(res.body.stockData[0].rel_likes, "rel_likes is null");
          assert.isNotNull(res.body.stockData[1].rel_likes, "rel_likes is null");
          done();
        });
  });
});
