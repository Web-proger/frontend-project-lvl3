import axios from 'axios';
import _ from 'lodash';
import parse from './parser';
import config from './config';

const updateRss = (state) => {
  const watchedState = state;

  const promises = watchedState.feeds.map((feed) => axios.get(`${config.proxy}/${feed.link}`)
    .then((response) => {
      const { posts: newPosts } = parse(response.data);
      const oldPosts = watchedState.posts.filter((post) => post.feedId === feed.id);

      const uniquePosts = _.differenceWith(newPosts, oldPosts, (a, b) => a.title === b.title)
        .map((post) => ({ id: _.uniqueId(), feedId: feed.id, ...post }));
      if (_.isEmpty(uniquePosts)) return;
      watchedState.posts.unshift(...uniquePosts);
    })
    .catch((err) => {
      console.log(err.message);
    }));

  Promise.all(promises)
    .finally(() => {
      setTimeout(() => updateRss(watchedState), config.updateTime);
    });
};

export default updateRss;
