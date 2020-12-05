// Схема валидации url
import { string } from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import config from './config';
import parse from './parser';

const urlSchema = string().url();

export default (evt, state) => {
  const watchedState = state;
  evt.preventDefault();
  watchedState.feedback = '';

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');

  urlSchema.isValid(rssUrl)
    // Валидность ссылки
    .then((valid) => {
      watchedState.valid = valid;
      if (!valid) {
        throw new Error(i18next.t('message.noValidUrl'));
      }
    })
    // Уникальность ссылки
    .then(() => {
      if (watchedState.feeds.length === 0) return;

      // Существет ли добаляемая ссылка
      const isLinkUnique = watchedState.feeds.filter((el) => el.link === rssUrl).length === 0;
      watchedState.valid = isLinkUnique;
      if (!isLinkUnique) {
        throw new Error(i18next.t('message.urlExists'));
      }
    })
    // Запрос с указанным урлом
    .then(() => {
      const url = `${config.proxy}/${rssUrl}`;
      watchedState.status = 'sending';
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

      watchedState.status = 'input';
      watchedState.feedback = i18next.t('message.successMessage');

      watchedState.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id,
      });

      watchedState.posts.unshift(...rssPosts);
    })
    .catch((err) => {
      watchedState.feedback = err.message;
      watchedState.status = 'error';
    });
};
