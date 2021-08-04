const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const uuid = require('uuid');

const app = express();
const jsonParser = bodyParser.json();
const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Listening on port ${port}`));

const root = './';
const dir = root.concat('userData');
const filePath_items = dir.concat('/', 'itemList.json');
const filePath_pantry = root.concat('pantryloc.json');



app.get('/items', (req, res) => {
  try {
    if (!fs.existsSync(filePath_items)) {
      res.status(404).send({ error: filePath_items.concat(" could not be found.") });
    } else {
      fs.readFile(filePath_items, 'utf8', (err, data) => {
        if (err) console.log("error: ", err);
        const parsedData = JSON.parse(data);      
        res.status(200).send(parsedData);        
      });
    }

  } catch (err) {
    console.log("ex: ", err);
    res.status(500).send({ error: err });
  }  
});

app.post('/items', jsonParser, (req, res) => {
  try {    
    if (!fs.existsSync(filePath_items)) {
      fs.mkdir(dir, err => { 
        if (err) console.log("error: ", err);
      });
      
      fs.writeFile(filePath_items, '[]', 'utf8', err => { 
        if (err) console.log("error: ", err);
      });
    }
    
    fs.readFile(filePath_items, 'utf8', (err, data) => {
      if (err)  console.log("error: ", err);

      const obj = JSON.parse(data);
      var newItem = req.body;
      newItem["id"] = uuid.v4();
      
      while (obj.some(o => o.id === newItem.id)) {
        newItem.id = uuid.v4();
      }
      newItem["datetime"] = new Date();
      
      var itemSortedProps = Object.keys(newItem).sort().reduce(
        (res, key) => (res[key] = newItem[key], res), {});

      if (!obj.some(o => o.name === newItem.name)) {
        obj.push(itemSortedProps);        
        fs.writeFile(filePath_items, JSON.stringify(obj), err => {
          if (err == null) console.log("error: ", err);
        });
        res.send({ mesage: "Successfully updated user items list." });
      } else {
        res.status(409).send({ error: "Item already exists in user's list." });
      }
    });
    
  } catch (err) {
    console.log('Error parsing JSON: ', err);
    res.status(500).send({ error: err });
  }
});

app.delete('/items', jsonParser, (req, res) => {
  try {
    var newObj = null;
    var itemToRemove = req.body;

    fs.readFile(filePath_items, 'utf8', (err, data) => {
      if (err) console.log("error: ", err);
      const obj = JSON.parse(data);
      newObj = obj.filter(o => o.name != itemToRemove.name);
      
      if (obj.some(o => o.name === itemToRemove.name)) {
        fs.writeFile(filePath_items, JSON.stringify(newObj), err => {
          if (err == null) console.log("error: ", err);
        });
        res.send({ mesage: "Successfully removed item '" + itemToRemove.name + "'." });
      } else {
        res.status(404).send({ mesage: "Item does not exists in user's list." });
      }
    });

  } catch (err) {
    console.log('Error parsing JSON: ', err);
    res.status(500).send({ error: err });
  }
});



app.get('/donate', jsonParser, (req, res) => {
  try {
    if (!fs.existsSync(filePath_pantry)) {
      res.status(404).send({ error: filePath_pantry.concat(" could not be found.") });
    } else {
      fs.readFile(filePath_pantry, 'utf8', (err, data) => {
        if (err) console.log("error: ", err);
        const parsedData = JSON.parse(data);      
        res.status(200).send(parsedData);        
      });
    }

  } catch (err) {
    console.log("ex: ", err);
    res.status(500).send({ error: err });
  }  
});



app.post('/recipes', jsonParser, (req, res) => {
  var values = req.body.ingredients;
  var db = require('./dbopera');
  db.getRecipes(values).then(result => {
    res.send( result );
  });
});

app.post('/submit', jsonParser, (req, res) => {
  try {
    var db = require('./dbopera');    
    var values = req.body;
    db.insertRecipe(values).then( result => {
      res.send( result );
    });
  } catch (err) {
    console.log("ex: ", err);
    res.status(500).send({ error: err });
  }
})