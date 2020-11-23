import i18next from 'i18next';
import onChange from 'on-change';
import axios from 'axios';
import { string } from 'yup';
import watch from './view';
import resources from './locales';
import parse from './parser';
import rssUpdate from './rssUpdate';
import config from './config';

// Схема валидации url
const urlSchema = string().url();

const handleSubmit = (evt, state) => {
  const watchedObject = state;
  evt.preventDefault();
  watchedObject.feedback = '';

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');

  urlSchema.isValid(rssUrl)
    // Валидность ссылки
    .then((valid) => {
      watchedObject.valid = valid;
      if (!valid) {
        throw new Error(i18next.t('message.noValidUrl'));
      }
    })
    // Уникальность ссылки
    .then(() => {
      if (watchedObject.feeds.length === 0) return;

      // Существет ли добаляемая ссылка
      const isLinkUnique = watchedObject.feeds.filter((el) => el.link === rssUrl).length === 0;
      watchedObject.valid = isLinkUnique;
      if (!isLinkUnique) {
        throw new Error(i18next.t('message.urlExists'));
      }
    })
    // Запрос с указанным урлом
    .then(() => {
      const rssLink = encodeURIComponent(rssUrl);
      const url = `${config.proxy}/get?url=${rssLink}`;
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      const { posts, description, title } = parse(response.data.contents);
      const id = watchedObject.feeds.length;
      const rssPosts = posts.map((item) => ({ ...item, id }));

      watchedObject.status = 'input';
      watchedObject.feedback = i18next.t('message.successMessage');

      watchedObject.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id,
      });

      watchedObject.posts.unshift(...rssPosts);
    })
    .catch((err) => {
      watchedObject.feedback = err.message;
      watchedObject.status = 'error';
    });
};

export default () => {
  i18next.init({
    lng: config.defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      // Модель стейта
      const state = {
        status: 'input',
        feedback: '',
        valid: true,
        feeds: [],
        posts: [],
        language: '',
      };

      const watchedObject = onChange(
        state,
        (path, value, previousValue) => watch(watchedObject, path, value, previousValue),
      );

      watchedObject.language = config.defaultLanguage;

      document.querySelector('.rss-form').addEventListener('submit', (evt) => handleSubmit(evt, watchedObject));
      document.querySelector('#buttons').addEventListener('click', (evt) => {
        watchedObject.language = evt.target.dataset.language;
      });

      watch(watchedObject);

      setTimeout(() => rssUpdate(watchedObject), config.updateTime);
    });
};
