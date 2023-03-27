//jshint esversion:6

// Include required packages
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

// Create an instance of Express
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

// Connect to MongoDB using mongoose
async function main() {
  await mongoose.connect('mongodb+srv://admin_marta:aDmin123Test@cluster0.aufzbke.mongodb.net/todolistDB');
  console.log("Connected");
}

// Create to-do list item schema
const itemsSchema = new mongoose.Schema ({
  name: String
});

// Create Item model
const Item = mongoose.model("Item", itemsSchema);

// Creat default to-do list items
const item1 = new Item({
  name: "Welcome to your to-do list!"
});
const item2 = new Item({
  name: "Press + button to add a new item."
});
const item3 = new Item({
  name: "<-- Press this to delete an item."
});

// Create items array
const defaultItems = [item1, item2, item3];

// Create to-do list schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

// Create List model
const List = mongoose.model("List", listSchema);

// Insert user input into db or displays saved list items
app.get("/", function(req, res) {
  
  Item.find({}).then((foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then((res) => {
        console.log("Default items inserted.");
      }).catch((err) => {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// Add new item to the list
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }  
});

// Delete item from the list by checking the checkbox
app.post("/delete", (req, res) => {
  const checkedItemId = (req.body.checkbox);
  const listName = (req.body.listName);

  if (listName == "Today") {
    Item.findByIdAndDelete(checkedItemId).then(() => {
      console.log("Item deleted.");
      res.redirect("/");
    }).catch((err) =>{
      console.log(err);
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then((foundList) => {
      res.redirect("/" + listName);
    }).catch((err) => {
      console.log(err);
    });
  }
});

// Create custom list names
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }).catch((err) => {
    console.log(err);
  });
});

// About page - not functional
app.get("/about", function(req, res){
  res.render("about");
});

// Connection to the server
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
