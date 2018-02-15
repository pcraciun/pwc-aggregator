const express = require('express');
const router = express.Router();

const uzs = require('../services/unzipService');

const fs = require('fs');
const dataFolderPath = './data';


const readDirectory = (path) => {

  console.log('trying to read from :', path);
  fs.readdir(path, (err, files) => {
    if (files) {
      for (let i = 0; i < files.length; i++) {

        let filePath = `${path}/${files[i]}`;
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.log('error getting file stats: ', err)
          }

          process.nextTick(() => {
            if (stats.isDirectory()) {
              readDirectory(filePath);
            } else {
              console.log('zip path: ',filePath);
              uzs.readZipStream(filePath);
            }
          })

        })
      }
    } else {
      console.log('no files at path :', path);
    }

  });
};

/* GET home page. */
router.get('/', function(req, res, next) {

  readDirectory(dataFolderPath);
  res.render('index', { title: 'Express' });
});

module.exports = router;
