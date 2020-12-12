// Обновление RSS с определенным интервалом
import axios from 'axios';
import _ from 'lodash';
import parse from './parser';
import config from './config';

const updateRss = (state) => {
  const watchedState = state;
  if (watchedState.feeds.length === 0) {
    setTimeout(() => updateRss(watchedState), config.updateTime);
    return;
  }

  const promises = watchedState.feeds.map((feed) => {
    const url = `${config.proxy}/${feed.link}`;

    return axios.get(url)
      .then((response) => {
        const { posts: newPosts } = parse(response.data);

        const currentPosts = watchedState.posts.filter((post) => post.feedId === feed.id);

        return _.differenceWith(newPosts, currentPosts, (a, b) => a.title === b.title)
          .map((post) => ({ id: _.uniqueId(), feedId: feed.id, ...post }));
      })
      .catch(() => []);
  });

  Promise.all(promises)
    .then((newPosts) => {
      watchedState.posts.unshift(...newPosts.flat());
    })
    .then(() => {
      setTimeout(() => updateRss(watchedState), config.updateTime);
    });
};

export default updateRss;
