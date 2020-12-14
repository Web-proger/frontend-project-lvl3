import i18next from 'i18next';
import axios from 'axios';
import { string, mixed } from 'yup';
import _ from 'lodash';
import watch from './watch';
import resources from './locales';
import updateRss from './updateRss';
import parse from './parser';
import config from './config';

const handleSubmit = (evt, state) => {
  evt.preventDefault();
  const watchedState = state;
  watchedState.form.errors = [];

  const feedLinks = watchedState.feeds.map((feed) => feed.link);
  const urlUniqueSchema = mixed().notOneOf(feedLinks);
  const urlSchema = string().url();

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');
  const url = `${config.proxy}/${rssUrl}`;

  urlSchema.isValid(rssUrl)
    .then((valid) => {
      watchedState.form.isValid = valid;
      if (!valid) throw new Error('noValidUrl');

      return urlUniqueSchema.isValid(rssUrl);
    })
    .then((valid) => {
      watchedState.form.isValid = valid;
      if (!valid) throw new Error('urlExists');

      watchedState.loadState = 'fetching';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      const { posts, description, title } = parse(response.data);
      const feedId = _.uniqueId();
      const rssPosts = posts.map((item) => ({ id: _.uniqueId(), feedId, ...item }));

      watchedState.loadState = 'success';

      watchedState.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id: feedId,
      });
      watchedState.posts.unshift(...rssPosts);
    })
    .catch((err) => {
      watchedState.form.errors = [err.message];
      watchedState.loadState = 'failure';
    });
};

const previewClick = (evt, state) => {
  const watchedState = state;

  if (evt.target.tagName !== 'BUTTON') return;

  const { id } = evt.target;

  watchedState.uiState.viewedPostIds = _.union(watchedState.uiState.viewedPostIds, [id]);
  watchedState.uiState.previewPostId = id;
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
        uiState: {
          language: '',
          previewPostId: '',
          viewedPostIds: [],
        },
        form: {
          isValid: false,
          errors: [],
        },
        loadState: 'idle',
        feeds: [],
        posts: [],
      };

      const element = {
        form: document.querySelector('.rss-form'),
        message: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        posts: document.querySelector('.posts'),
        inputField: document.querySelector('[name=rss-input]'),
        button: document.querySelector('#submit-button'),
        modalLink: document.querySelector('#modalLink'),
        modalDescription: document.querySelector('#postDescription'),
        language: document.querySelector('#buttons'),
      };

      const watchedState = watch(state, element);

      watchedState.uiState.language = config.defaultLanguage;

      element.form.addEventListener('submit', (evt) => handleSubmit(evt, watchedState));
      // Открытие модального окна
      element.posts.addEventListener('click', (evt) => previewClick(evt, watchedState));
      // Переключение языков
      element.language.addEventListener('click', (evt) => {
        watchedState.uiState.language = evt.target.dataset.language;
      });

      setTimeout(() => updateRss(watchedState), config.updateTime);

      return 'success init';
    });
};
