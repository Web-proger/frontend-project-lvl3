import 'bootstrap';
import axios from 'axios';
import onChange from 'on-change';
import { string } from 'yup';
import i18next from 'i18next';
import 'bootstrap/dist/css/bootstrap.min.css';

import watch from './view';
import parse from './parser';
import resources from './locales/index';

// TODO переделать обновление на Promise.all

const PROXY_URL = 'https://api.allorigins.win';
const DEFAULT_LANGUAGE = 'en';
const UPDATE_TIME = 5000;

// RSS каналы для проверки
// http://lorem-rss.herokuapp.com/feed?unit=second&interval=10
// http://feeds.feedburner.com/css-live xml 1.0  - ёщё RSS
// https://3dnews.ru/workshop/rss/ rss 2.0

// Схема валидации url
const urlSchema = string().url();

// Обновление RSS с определенным интервалом
const rssUpdate = (watchedObject) => {
  if (watchedObject.feeds.length === 0) {
    setTimeout(() => rssUpdate(watchedObject), UPDATE_TIME);
    return;
  }
  watchedObject.feeds.forEach((feed) => {
    const url = encodeURI(`${PROXY_URL}/get?url=${feed.link}`);

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
  setTimeout(() => rssUpdate(watchedObject), UPDATE_TIME);
};

const handleSubmit = (evt, watchedObject) => {
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
      const url = encodeURI(`${PROXY_URL}/get?url=${rssUrl}`);
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      const rssData = parse(response.data.contents);
      const id = watchedObject.feeds.length;
      const rssPosts = rssData.posts.map((item) => ({ ...item, id }));

      watchedObject.status = 'input';
      watchedObject.feedback = i18next.t('message.successMessage');

      watchedObject.feeds.unshift({
        title: rssData.title,
        description: rssData.description,
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

i18next.init({
  lng: DEFAULT_LANGUAGE,
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

    const watchedObject = onChange(state, (path, value, previousValue) => watch(watchedObject, path, value, previousValue));

    watchedObject.language = DEFAULT_LANGUAGE;

    document.querySelector('.rss-form').addEventListener('submit', (evt) => handleSubmit(evt, watchedObject));
    document.querySelector('#buttons').addEventListener('click', (evt) => {
      watchedObject.language = evt.target.dataset.language;
    });

    watch(watchedObject);

    setTimeout(() => rssUpdate(watchedObject), UPDATE_TIME);
  });
