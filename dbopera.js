var config = require('./dbconfig');
var sql = require('mssql');

const getRecipes = async (values) => {
  try {
    var filters = '';
    values.forEach((v, i) => {
      filters += `'${v}'`;
      if (i != values.length - 1) filters += ',';
    })

    var queryStr = `select distinct(d.dishName), max(r.recipeID) recipeID, d.instructions
                    from [dbo].[Recipes] r with(nolock)
                    join [dbo].[Dishes] d with(nolock)
                    on r.dishID = d.dishID
                    join [dbo].[Ingredients] i with(nolock)
                    on r.ingredientID = i.ingredientID
                    where i.ingredientName in (${filters})
                    group by d.dishName, d.instructions`;

    await sql.connect(config);
    const result = await sql.query(queryStr);
    return result.recordset;

  } catch (err) {
    console.log("catch error: ", err);
  }
}

const insertRecipe = async (values) => {
  try {
    var dishName = values.name;
    var instructions = values.instructions;
    var ingredientsList =  values.ingredients;
    
    var queryStr0 = `insert into [Dishes] (dishName, instructions, createdDate, endDate)
                    select '${dishName}', '${instructions}', GETUTCDATE(), '2100-12-31 00:00:00.000'
                    where not exists (select 1 from [Dishes] with(nolock) where dishName = '${dishName}');
                    select @@identity as dishID`;
    await sql.connect(config);
    const result0 = await sql.query(queryStr0);
    var dishID = result0.recordset[0].dishID;
    console.log("insert Recipe result0: ", result0.recordset);

    if (dishID == null) return "Recipe already exists";
    else {
      var recipeID = 0;
      for (let i = 0; i < ingredientsList.length; i++) {
        var queryStr1 = `if not exists (select * from Ingredients where ingredientName = '${ingredientsList[i]}')
                        begin
                          insert into [Ingredients] (ingredientName, createdDate, endDate, shelfLife)
                          values('${ingredientsList[i]}', GETUTCDATE(), '2100-12-31 00:00:00.000', 7);
                          select @@IDENTITY;
                        end
                        else begin select ingredientID from Ingredients where ingredientName = '${ingredientsList[i]}'; end`;
        await sql.connect(config);
        const result1 = await sql.query(queryStr1);
        const ingredientID = result1.recordset[0].ingredientID;
  
        console.log("dishID: ", dishID, "ingredientID: ", ingredientID);
        queryStr2 = `insert into [Recipes] (dishID, ingredientID, createdDate, endDate)
                    values (${dishID}, ${ingredientID}, GETUTCDATE(), '2100-12-31 00:00:00.000');
                    select @@IDENTITY as dishID`;
  
        await sql.connect(config);
        const result2 = await sql.query(queryStr2);
        recipeID =  result2.recordset[0].dishID;
        console.log("recipeID: ", recipeID);
      }
      return "New recipe has been successfully recorded.";
    }
  } catch (err) {
    console.log("catch error: ", err);
    return 500;
  }
}



module.exports = {
  getRecipes : getRecipes,
  insertRecipe : insertRecipe
}