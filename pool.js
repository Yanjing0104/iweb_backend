const mysql = require('mysql');
let pool = mysql.createPool({
	host:'127.0.0.1',
	port:3306,
	user:'root',
	password:'',
	database:'iweb',
	connectionLimit : 10
});
// 测试数据库是否连接
// 用pool.query，console.log()测试不出结果
// pool.query('select 1+2',(err,res)=>{
// 	if(err){
// 		throw err
// 	}
// 	console.log(res);
// })
// 执行node pool.js
module.exports = pool;