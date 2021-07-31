const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const sharp = require("sharp");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("services"));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b31bz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const productCollection = client.db(`${process.env.DB_NAME}`).collection(`products`);
  const adminCollection = client.db(`${process.env.DB_NAME}`).collection(`admin`);
  const orderCollection = client.db(`${process.env.DB_NAME}`).collection(`orders`);
  const promoCodeCollection = client.db(`${process.env.DB_NAME}`).collection(`promo-code`);

  // products 
  app.get("/getProducts", (req, res) => {
    productCollection.find({}).toArray((err, document) => {
      res.send(document);
    });
  });
  app.post("/addNewProduct", (req, res) => {
    let image;
    sharp(req.files.file.data)
      .resize(500, 500)
      .rotate()
      .toBuffer()
      .then(data => {
        image = Buffer.from(data.toString("base64"),"base64");
  
        productCollection.insertOne({ image, ...req.body }).then((result) => {
          res.send(result.insertedCount > 0);
        });
      });
  });

  //checking admin
   app.post("/checkAdmin", (req, res) => {
     adminCollection
       .find({userId:req.body.userId})
       .toArray((err, document) => {
         res.send(document);
       });
   });

  // orders api start;
   app.post("/addNewOrder", (req, res) => {
     orderCollection.insertOne(req.body).then((result) => {
       res.send(result.insertedCount > 0);
     });
   });
  app.post("/getOrdersData", (req, res) => {
    orderCollection.find(req.body).toArray((err, document) => {
      res.send(document);
    });
  });
  app.patch("/updateOrderStatus/:id", (req, res) => {
    delete req.body._id;
    orderCollection
      .updateOne({ _id: ObjectId(req.params.id) }, { $set: req.body })
      .then((result) => res.send(result.modifiedCount > 0));
  });


  // promo code api start;
   app.post("/addNewPromoCode", (req, res) => {
    promoCodeCollection.insertOne(req.body).then((result) => {
      res.send(result.insertedCount > 0);
    });
   });
  app.get("/getPromoCode", (req, res) => {
    promoCodeCollection.find({}).toArray((err, document) => {
      res.send(document);
    });
  });
  app.post("/checkPromoCode", (req, res) => {
    promoCodeCollection
      .find({ promoCode: req.body.promoCode })
      .toArray((err, document) => {
        res.send(document);
      });
  });

  app.patch("/updatePromoCode/:id", (req, res) => {
    delete req.body._id;
    promoCodeCollection
      .updateOne(
        { _id: ObjectId(req.params.id) },
        { $set: req.body }
      )
      .then((result) => res.send(result.modifiedCount > 0));
  });
  // promo code api end;





});



app.listen(process.env.PORT || 8000);
