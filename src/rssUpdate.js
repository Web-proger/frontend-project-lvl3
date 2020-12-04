// Обновление RSS с определенным интервалом
import axios from 'axios';
import parse from './parser';
import config from './config';

// TODO сделать глушилку ошибок для promises в Promise.all
const rssUpdate = (state) => {
  const watchedObject = state;
  if (watchedObject.feeds.length === 0) {
    setTimeout(() => rssUpdate(watchedObject), config.updateTime);
    return;
  }

  const promises = watchedObject.feeds.map((feed) => {
    const rssLink = encodeURIComponent(feed.link);
    const url = `${config.proxy}/get?url=${rssLink}`;

    return axios.get(url)
      .then((response) => {
        const { posts } = parse(response.data.contents);

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
      console.log('data!!!', data);
      // const newPosts = data.reduce((posts, acc ) => [...posts, ...acc], []);
      const newPosts = data.flat();
      console.log('newPosts!!!', newPosts);

      watchedObject.posts.unshift(...newPosts);
    }).then(() => {
      setTimeout(() => rssUpdate(watchedObject), config.updateTime);
    })
};

export default rssUpdate;
