// Схема валидации url
import i18next from 'i18next';
import axios from 'axios';
import config from './config';
import parse from './parser';

export default (rssUrl, state) => {
  const watchedState = state;

  // Запрос с указанным урлом
  return Promise.resolve()
    .then(() => {
      const url = `${config.proxy}/${rssUrl}`;
      watchedState.form.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      const { posts, description, title } = parse(response.data);
      const id = watchedState.feeds.length;
      const rssPosts = posts.map((item, i) => ({
        ...item,
        id,
        isViewed: false,
        postId: watchedState.posts.length + i,
      }));

      watchedState.form.status = 'input';
      watchedState.form.feedback = i18next.t('message.successMessage');

      watchedState.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id,
      });
      watchedState.posts.unshift(...rssPosts);
    });
};
