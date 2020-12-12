// Обновление RSS с определенным интервалом
import axios from 'axios';
import _ from 'lodash';
import parse from './parser';
import config from './config';

const updateRss = (state) => {
  const watchedState = state;

  const promises = watchedState.feeds.map((feed) => axios.get(`${config.proxy}/${feed.link}`));

  Promise.all(promises)
    .then((responses) => {
      const uniquePosts = responses.map((response, i) => {
        const feed = watchedState.feeds[i];
        const newPosts = parse(response.data).posts;
        const oldPosts = watchedState.posts.filter((post) => post.feedId === feed.id);

        return _.differenceWith(newPosts, oldPosts, (a, b) => a.title === b.title)
          .map((post) => ({ id: _.uniqueId(), feedId: feed.id, ...post }));
      });

      if (_.isEmpty(uniquePosts)) return;

      watchedState.posts.unshift(...uniquePosts.flat());
    })
    .catch((err) => {
      throw new Error(err.message);
    })
    .finally(() => {
      setTimeout(() => updateRss(watchedState), config.updateTime);
    });
};

export default updateRss;
