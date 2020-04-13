const express = require('express');
const pool = require('../pool');
let router = express.Router();

/*
接口URL  /type GET
成功响应示例[{"tpid": 1,"tpname": "基础课程"},{"tpid": 2,"tpname": "核心课程"},{"tpid": 3,"tpname": "进阶课程"}]
*/
router.get('/',(req,res,next)=>{
  let sql = "SELECT tpid,tpname FROM type ORDER BY tpid";
  pool.query(sql,(err,result)=>{
    if(err){
      next(err);
      return;
    }
    res.send(result);
  })
})

module.exports = router;