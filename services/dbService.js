'use strict';
const marklogic = require('marklogic');

const db = marklogic.createDatabaseClient({
  host: 'localhost',
  port: '8000',
  user: 'admin',
  password: 'admin',
  authType: 'DIGEST'
});

const queryBuilder = marklogic.queryBuilder;

const dbService = {
  write: (url, data, parent) => {
    console.log('writing in db: ', url);
    return db.documents.write({
      uri: url,
      // contentType: 'application/json',
      content: data
    }).result()
      .then(response => {
        console.log('success: ',JSON.stringify(response, null, 2));
        console.log('---------------------------');
      })
      .catch(err => console.error('error writing db: ',err))
  },
  read: (url) => {
    console.log('reading from db: ', url);
    return db.documents.read({uris: url}).result()
  },
  remove: (url) => {
    console.log('removing from db: ', url);
    return db.documents.remove(url)
      .result()
      .then(response => console.log('removed: ', JSON.stringify(response, null, 2)))
      .catch(err => console.error(err));
  },
  search: function(qTerm) {
    var q = db.documents.query(
      queryBuilder.where(
        queryBuilder.term(qTerm)
      )
    );
    return q.result();
  }
};

module.exports = dbService;