require("dotenv").config();
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();
const mapperRouter = require("./mapper");
const KiteConnect = require("kiteconnect").KiteConnect;
const KiteTicker = require("kiteconnect").KiteTicker;

const apiKey = process.env.API_KEY;
const accessToken = process.env.ACCESS_TOKEN;

const kc = new KiteConnect({
  api_key: apiKey,
});
kc.setAccessToken(accessToken);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "build")));

app.use("/mapper", mapperRouter);

// Order function
const order = async (stock) => {
  const timestamp = new Date();
  console.log(
    `Order placed for ${stock.exchange}:${stock.tradingsymbol}, Transaction: ${stock.transactionType}, product: ${stock.product}, quantity: ${stock.quantity}`,
  );
  console.log(`Time of order: ${timestamp.toUTCString()}`);

  // return kc.placeOrder("regular", {
  //   exchange: stock.exchange,
  //   tradingsymbol: stock.tradingsymbol,
  //   transaction_type: stock.transactionType,
  //   quantity: stock.quantity,
  //   product: stock.product,
  //   order_type: "MARKET",
  // });

  return `Order placed for ${stock.exchange}:${stock.tradingsymbol}, Transaction: ${stock.transactionType}, product: ${stock.product}, quantity: ${stock.quantity}`;
};

app.post("/startButterfly", ({ body }, response) => {
  butterflyStrategy(body.stockA, body.stockB, body.stockC, body.entryPrice);
  response.send("Check console.");
});

const lookForEntry = (aBuyersBid, bSellersBid, cBuyersBid, entryPrice) => {
  if (aBuyersBid - bSellersBid + cBuyersBid > entryPrice) {
    return true;
  }
};

const butterflyStrategy = (stockA, stockB, stockC, entryPrice) => {
  const aToken = parseInt(stockA.instrument_token);
  const bToken = parseInt(stockB.instrument_token);
  const cToken = parseInt(stockC.instrument_token);

  let enteredMarket = false;
  let aBuyersBid, bSellersBid, cBuyersBid;

  const ticker = new KiteTicker({
    api_key: apiKey,
    access_token: accessToken,
  });

  ticker.on("connect", () => {
    console.log("Subscribing to stocks...");
    const items = [aToken, bToken, cToken];
    ticker.subscribe(items);
    ticker.setMode(ticker.modeFull, items);
  });

  ticker.on("ticks", (ticks) => {
    if (!enteredMarket) {
      // Check tick and update corresponding stock bid price
      ticks.forEach((t) => {
        if (t.instrument_token == aToken) {
          if (t.depth) {
            if (t.depth.buy) {
              aBuyersBid = t.depth.buy[1].price;
            }
          }
        } else if (t.instrument_token == bToken) {
          if (t.depth) {
            if (t.depth.sell) {
              bSellersBid = t.depth.sell[1].price;
            }
          }
        } else if (t.instrument_token == cToken) {
          if (t.depth) {
            if (t.depth.buy) {
              cBuyersBid = t.depth.buy[1].price;
            }
          }
        }
      });

      // Check for entry condition
    } else if (enteredMarket) {
      ticker.disconnect();
    }
  });
};

app.listen(5000, () => {
  console.log("App started on http://localhost:5000");
});
