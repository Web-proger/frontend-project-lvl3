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
    const rssLink = encodeURIComponent(feed.link);
    const url = `${config.proxy}/get?url=${rssLink}`;

    axios.get(url)
      .then((response) => {
        const { posts } = parse(response.data.contents);

        const currentPostsTitle = watchedObject.posts
          .filter((el) => el.id === feed.id)
          .map((el) => el.title);

        const newPosts = posts
          .filter((post) => !currentPostsTitle.includes(post.title))
          .map((post, i) => ({ ...post, id: feed.id, isViewed: false, postId: watchedObject.posts.length + i }));

        watchedObject.posts.unshift(...newPosts);
        console.log(watchedObject.posts);
      })
      .catch((err) => {
        watchedObject.feedback = err.message;
        watchedObject.status = 'error';
      });
  });
  setTimeout(() => rssUpdate(watchedObject), config.updateTime);
};

export default rssUpdate;
