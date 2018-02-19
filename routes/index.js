const express = require('express');
const router = express.Router();

const uzs = require('../services/unzipService');
const nlfiscaalService = require('../services/nlfiscaalService');

const fs = require('fs');
const dataFolderPath = './data';

const jsonFilePath = './data/jsons';


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
              console.log('zip path: ', filePath);
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


const checkJsonFile = () => {
  const files = fs.readdir(jsonFilePath, (err, files) => {
    if (files) {
      for (let i = 0; i < files.length; i++) {
        let filePath = `${jsonFilePath}/${files[i]}`;
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.log('error getting file stats: ', err)
          }

          process.nextTick(() => {
            if (!stats.isDirectory()) {

              fs.readFile(filePath, (err, res) => {

                let json = JSON.parse(res);

                console.log('jsonfile: ', json);
              })
            }
          })
        })
      }
    }
  })
};

/* GET home page. */
router.get('/', (req, res, next) => {

  // nlfiscaalService.collectArticlesByNuids();
  readDirectory(dataFolderPath);
  res.render('index', {title: 'Express'});
});

module.exports = router;
