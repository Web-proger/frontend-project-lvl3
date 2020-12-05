// Схема валидации url
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';
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
      const feedId = _.uniqueId();
      const rssPosts = posts.map((item) => ({
        ...item,
        feedId,
        isViewed: false,
        postId: _.uniqueId(),
      }));

      watchedState.form.status = 'input';
      watchedState.form.feedback = i18next.t('message.successMessage');

      watchedState.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id: feedId,
      });
      watchedState.posts.unshift(...rssPosts);
    });
};
