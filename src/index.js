import 'bootstrap';
import axios from 'axios';
import { string } from 'yup';
import i18next from 'i18next';

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

// Модель стейта
const state = {
  status: 'input',
  feedback: '',
  valid: true,
  feeds: [],
  posts: [],
  language: '',
};

const watchedObject = watch(state);

// Обновление RSS с определенным интервалом
const rssUpdate = () => {
  if (watchedObject.feeds.length === 0) {
    setTimeout(rssUpdate, UPDATE_TIME);
    return;
  }
  watchedObject.feeds.forEach((feed) => {
    const url = encodeURI(`${PROXY_URL}/get?url=${feed.link}`);

    Promise.resolve()
      .then(() => axios.get(url))
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
  setTimeout(rssUpdate, UPDATE_TIME);
};

const handleSubmit = (evt) => {
  evt.preventDefault();
  watchedObject.feedback = '';

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');

  urlSchema.isValid(rssUrl)
    // Валидность ссылки
    .then((valid) => {
      if (!valid) {
        watchedObject.valid = false;
        throw new Error(i18next.t('message.noValidUrl'));
      }
      watchedObject.valid = true;
    })
    // Уникальность ссылки
    .then(() => {
      if (watchedObject.feeds.length === 0) return;

      // Существет ли добаляемая ссылка
      const isLinkExists = watchedObject.feeds.filter((el) => el.link === rssUrl).length > 0;
      if (isLinkExists) {
        watchedObject.valid = false;
        throw new Error(i18next.t('message.urlExists'));
      }
      watchedObject.valid = true;
    })
    // Запрос с указанным урлом
    .then(() => {
      const url = encodeURI(`${PROXY_URL}/get?url=${rssUrl}`);
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      watchedObject.status = 'input';
      watchedObject.feedback = i18next.t('message.successMessage');

      const rssData = parse(response.data.contents);
      const id = watchedObject.feeds.length;
      const rssPosts = rssData.posts.map((item) => ({ ...item, id }));

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
  lng: 'en',
  debug: false,
  resources,
})
  .then(() => {
    watchedObject.language = DEFAULT_LANGUAGE;

    document.querySelector('.rss-form').addEventListener('submit', handleSubmit);
    document.querySelector('#buttons').addEventListener('click', (evt) => {
      watchedObject.language = evt.target.dataset.language;
    });

    setTimeout(rssUpdate, UPDATE_TIME);
  });
