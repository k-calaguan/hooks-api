var config = require('./dbconfig');
var sql = require('mssql');


const getRecipes = async (values) => {
  try {
    var filters = '';
    values.forEach((v, i) => {
      filters += `'${v}'`;
      if (i != values.length-1) filters += ',';
    })

    var queryStr = `select r.recipeID, d.dishName, d.instructions, i.ingredientName
                    from [dbo].[Recipes] r with(nolock)
                    join [dbo].[Dishes] d with(nolock)
                    on r.dishID = d.dishID
                    join [dbo].[Ingredients] i with(nolock)
                    on r.ingredientID = i.ingredientID
                    where i.ingredientName in (${filters})`;

    await sql.connect(config);
    const result = await sql.query(queryStr);
    return result.recordset;

  } catch (err) {
    console.log("catch error: ", err);
  }
}

module.exports = {
  getRecipes : getRecipes
}