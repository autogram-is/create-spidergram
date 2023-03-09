import { Spidergram } from 'spidergram';

await Spidergram.load()
  .then(sg => sg.arango.erase({ eraseAll: true }))
  .then(() => console.log('Crawl data erased.'))
  .catch(reason => {
    if (reason instanceof Error) console.error(reason, 1);
  });
