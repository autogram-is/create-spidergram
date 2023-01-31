import { Project } from 'spidergram';

Project.config()
  .then(project => project.graph())
  .then(graph => graph.erase({ eraseAll: true }))
  .then(() => console.log('Crawl data erased.'))
  .catch(reason => {
    if (reason instanceof Error) console.error(reason, 1);
  });
