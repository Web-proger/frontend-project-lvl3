// Обновление RSS с определенным интервалом
import axios from 'axios';
import parse from './parser';
import config from './config';

// TODO переделать обновление на Promise.all
const rssUpdate = (state) => {
  const watchedObject = state;
  if (watchedObject.feeds.length === 0) {
    setTimeout(() => rssUpdate(watchedObject), config.updateTime);
    return;
  }
  watchedObject.feeds.forEach((feed) => {
    const url = encodeURI(`${config.proxy}/get?url=${feed.link}`);

    axios.get(url)
      .then((response) => {
        const currentPostsTitle = watchedObject.posts
          .filter((el) => el.id === feed.id)
          .map((el) => el.title);

        const { posts } = parse(response.data.contents);
        const newPosts = posts
          .filter((post) => !currentPostsTitle.includes(post.title))
          .map((post) => ({ ...post, id: feed.id }));

        watchedObject.posts.unshift(...newPosts);
      })
      .catch((err) => {
        console.log(err);
        watchedObject.feedback = err.message;
        watchedObject.status = 'error';
      });
  });
  setTimeout(() => rssUpdate(watchedObject), config.updateTime);
};

export default rssUpdate;
