// Обновление RSS с определенным интервалом
import axios from 'axios';
import parse from './parser';
import config from './config';

// TODO сделать глушилку ошибок для promises в Promise.all
const updateRss = (state) => {
  const watchedObject = state;
  if (watchedObject.feeds.length === 0) {
    setTimeout(() => updateRss(watchedObject), config.updateTime);
    return;
  }

  const promises = watchedObject.feeds.map((feed) => {
    const url = `${config.proxy}/${feed.link}`;

    return axios.get(url)
      .then((response) => {
        //const { posts } = parse(response.data.contents);
        const { posts } = parse(response.data);

        const currentPostsTitle = watchedObject.posts
          .filter((el) => el.id === feed.id)
          .map((el) => el.title);

        return posts
          .filter((post) => !currentPostsTitle.includes(post.title))
          .map((post, i) => ({ ...post, id: feed.id, isViewed: false, postId: watchedObject.posts.length + i }));
      })
      .catch(() => {
        return [];
      });
  });

  Promise.all(promises)
    .then((data) => {
      const newPosts = data.flat();

      watchedObject.posts.unshift(...newPosts);
    }).then(() => {
      setTimeout(() => updateRss(watchedObject), config.updateTime);
    })
};

export default updateRss;
