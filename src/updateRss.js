// Обновление RSS с определенным интервалом
import axios from 'axios';
import _ from 'lodash';
import parse from './parser';
import config from './config';

// TODO сделать глушилку ошибок для promises в Promise.all
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
        const { posts } = parse(response.data);

        const currentPostsTitle = watchedState.posts
          .filter((post) => post.feedId === feed.id)
          .map((post) => post.title);

        return posts
          .filter((post) => !currentPostsTitle.includes(post.title))
          .map((post) => ({
            ...post,
            feedId: feed.id,
            isViewed: false,
            postId: _.uniqueId(),
          }));
      })
      .catch(() => []);
  });

  Promise.all(promises)
    .then((data) => {
      const newPosts = data.flat();

      watchedState.posts.unshift(...newPosts);
    }).then(() => {
      setTimeout(() => updateRss(watchedState), config.updateTime);
    });
};

export default updateRss;
