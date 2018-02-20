'use strict';
const axios = require('axios');

const newsListUrl = 'https://www.nlfiscaal.nl/nlf/nlf2.nsf/loadnews?openagent&opinie=false';

const singleArticleUrl = (unid) => (
  (unid)
    ? `https://app.nlfiscaal.nl/fiscanet/fiscaal.nsf/jsonapp/${unid}?opendocument`
    : null
);

const nlFiscaalService = {
  getUidListUpdated: () => {

    return new Promise((resolve, reject) => {
      let newsUnids = [];
      axios.get(newsListUrl)
        .then((res) => {
          for (let key in res.data.r) {
            if (res.data.r.hasOwnProperty(key)) {
              newsUnids.push(res.data.r[key].unid);
            }
          }
          resolve(newsUnids);
        })
        .catch((err) => {
          console.error('Can\'t get news list: ', err)
          reject(err);
        });
    })
  },

  getSingleArticle(unid) {
    return new Promise((resolve, reject) => {
      const url = singleArticleUrl(unid);
      let articleJson;
      if (url) {
        axios.get(url)
          .then((res) => {
            articleJson = res.data;
            resolve(articleJson);
          })
          .catch((err) => {
            console.error(`Can\'t get article ${unid}: `, err)
            reject(err);
          })
      }
    })
  },

  collectArticlesByNuids() {
    const resArr = [];
    this.getUidListUpdated()
      .then(async (list) => {
        if (list) {
          for (let i = 0; i < list.length; i++) {
            try {
              const art = await this.getSingleArticle(list[i]);
              if (art) {
                console.log(art)
              }
            } catch(err) {
              console.log(`Can\'t get article ${list[i]} `, err)
            }
          }
        } else {
          console.log('No list, try again later');
        }
      })
      .then(() => {
        console.log('final array of jsons:  ', resArr);
      });
  }
};

module.exports = nlFiscaalService;