import i18next from 'i18next';
import axios from 'axios';
import { string } from 'yup';
import _ from 'lodash';
import watch from './watch';
import resources from './locales';
import updateRss from './updateRss';
import parse from './parser';
import config from './config';

const validateUrl = (url, urls) => {
  try {
    const urlSchema = string().url('noValidUrl').required().notOneOf(urls, 'urlExists');
    urlSchema.validateSync(url);
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error };
  }
};

const handleSubmit = (evt, state) => {
  evt.preventDefault();
  const watchedState = state;
  watchedState.form.errors = [];

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');
  const feedUrls = watchedState.feeds.map((feed) => feed.link);
  const url = `${config.proxy}/${rssUrl}`;

  const data = validateUrl(rssUrl, feedUrls);
  if (!data.isValid) {
    watchedState.form.isValid = false;
    watchedState.form.errors = [data.error.message];
    return;
  }

  watchedState.form.isValid = true;
  watchedState.loadState = 'fetching';

  axios.get(url)
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
