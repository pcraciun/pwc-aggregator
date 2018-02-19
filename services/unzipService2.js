const streamZip = require('node-stream-zip');
const admZip = require('adm-zip');
const dbService = require('./dbService');
let counter = 0;
let zips = 0;

const service = {

  // to read big archive
  readZipStream: (path) => {
    if (!path) {
      return;
    }

    let ext = service.getExtension(path).toLowerCase();
    if (!ext) {
      console.log('No extension found');
    } else if (ext === 'xml') {
      service.readAdmZip(path);

    } else if (ext === 'json') {
      console.log('--- json, do nothing: ', path);

    } else if (ext === 'zip') {
      const zip = new streamZip({
        file: path,
        storeEntries: true
      });

      const parseStreamEntry = async (entries, keys, index) => {
        if (index < keys.length) {

          if (index > 0) {
            entries[keys[index - 1]] = null;
          }

          let entry = entries[keys[index]];
          let entryData = zip.entryDataSync(entry.name);
          const extension = service.getExtension(entry.name);

          if (extension.toLowerCase() === 'xml') {
            try {
              await service.saveXmlFile(entryData, entry.name, path)
                .then(() => {
                  entryData = null;
                  entry = entries[keys[index]] = null;
                }).catch((errSaveXml) => {
                  console.log('errSaveXml: ', errSaveXml);
                })
            } catch (err) {
              console.log('ERROR XML stream: ', err);
            }
          } else if (extension.toLowerCase() === 'zip') {
            await service.readAdmZip(entryData, entry.name)
              .then(() => {
                entry = entries[keys[index]] = null;
                entryData = null;
              }).catch(err => console.log('Error reading zip entry: ', err));
          } else if (extension.toLowerCase() === 'json') {






            try {
              await service.readJsonFile(entryData, entry.name)
                .then(() => {
                  console.log('ddd');
                  entry = entries[index] = null;
                  entryData = null;
                })
                .catch((errSave) => {
                  console.log('err save json: ', errSave);
                })
            } catch (err) {
              console.log('ERROR JSON: ', err);
            }
          } else {
            console.log('wrong extension');
          }
        }
        await parseStreamEntry(entries, keys, ++index).catch(err => console.log('Parsing error, number of entries: ', keys.length, '. Error:', err));

      };

      zip.on('error', err => console.log('error reading zip stream at', path, ' :', err));
      zip.on('ready', async () => {
        let entries = Object.assign({}, zip.entries());
        let keys = Object.keys(zip.entries());
        let index = 0;
        await parseStreamEntry(entries, keys, index).catch(err => console.log('Parsing error, number of entries: ', keys.length, '. Error:', err));
      });
    }
  },

  // for buffer archives
  readAdmZip: async (archive, archiveName) => {

    console.log('========================================');
    console.log('adm starts: ', archiveName);
    console.log('archives processed: ', ++zips, ' |||  memory used: ', process.memoryUsage().rss);
    let zip = admZip(archive);
    let entries = zip.getEntries();

    const parseEntry = async (entries, index) => {
      index = index || 0;
      if (index < entries.length) {
        if (index > 0) {
          entries[index - 1] = null;
        }
        let entry = entries[index];

        let entryData = entry.getData();
        const extension = service.getExtension(entry.entryName);
        if (extension === 'xml') {
          try {
            await service.saveXmlFile(entryData, entry.entryName, archiveName)
              .then(() => {
                entry = entries[index] = null;
                entryData = null;
              })
              .catch((errSave) => {
                console.log('err save: ', errSave);
              })
          } catch (err) {
            console.log('ERROR XML: ', err);
          }
        } else if (extension === 'zip') {
          await service.readAdmZip(entryData, entry.entryName)
            .then(() => {
              entry = entries[index] = null;
              entryData = null;
            }).catch(err => console.log('Error reading zip entry: ', err))
        } else if (extension === 'json'){
          console.log('JSON!!!', entry);
        } else {
          console.log('wrong extension');
        }
        await parseEntry(entries, ++index).catch(err => console.log('Parsing error, number of entries: ', entries.length, '. Error:', err));
      }
    };

    await parseEntry(entries).catch(err => console.log('Parsing error, number of entries: ', entries.length, '. Error:', err));
  },


  readJsonFile: (data, name) => {
    return new Promise(((resolve, reject) => {
      const article = JSON.parse(data);
      console.log('json: ', name);
      if (article && article.unid) {
        console.log('================  has unid  ==============');
        //   console.log('data: ', article.data);

        resolve(article);
      } else {
        reject();
      }
    }))

  },


  saveXmlFile: async (file, name, archiveName) => {
    await dbService.read(`/tmp-${name}`).then(resp => {
      if (!resp[0] || !resp[0].content) {
        dbService.write(`/tmp-${name}`, file, archiveName).then(() => {
          console.log('Entries processed: ', ++counter, '===  memory used: ', process.memoryUsage().rss);
          console.log(`File ${name} written to db, parent: ${archiveName}`);
        }).catch((err) => {
          console.log('Error writing to db: ', err);
        });
      } else {
        console.log('Entries processed: ', ++counter, '===  memory used: ', process.memoryUsage().rss);
        console.log('Already exist in db, wont write: ', name);
        console.log('-------------------------------');

      }
    }).catch((err) => {
      console.log('Error reading from db: ', err);
    });

    /*
        await dbService.remove(`/tmp-${name}`)
          .then(() => {
            console.log('removing successful');
          }).catch(err => console.log('Error removing: ', err));
        */
  },

  getExtension: (title) => {
    const arr = title.split('.');
    return arr[arr.length - 1].toLowerCase() || undefined;
  }


};

module.exports = service;