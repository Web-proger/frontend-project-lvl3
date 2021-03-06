import i18next from 'i18next';
import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import watch from './watch';
import resources from './locales';
import updateRss, { getUrl } from './updateRss';
import parse from './parser';
import config from './config';

const validateUrl = (url, urls) => {
  const urlSchema = yup.string().url('noValidUrl').required().notOneOf(urls, 'urlExists');
  urlSchema.validateSync(url);
};

const handleSubmit = (evt, state) => {
  evt.preventDefault();
  const watchedState = state;

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');
  const feedUrls = watchedState.feeds.map((feed) => feed.link);
  const url = getUrl(rssUrl);

  try {
    validateUrl(rssUrl, feedUrls);
    watchedState.form = { isValid: true, errors: [] };
  } catch (err) {
    watchedState.form = { isValid: false, errors: [err.message] };
    return;
  }

  watchedState.loading.state = 'fetching';

  axios.get(url)
    .then((response) => {
      const { posts, description, title } = parse(response.data);
      const feedId = _.uniqueId();
      const rssPosts = posts.map((item) => ({ id: _.uniqueId(), feedId, ...item }));

      watchedState.loading.state = 'success';

      watchedState.feeds.unshift({
        title,
        description,
        link: rssUrl,
        id: feedId,
      });
      watchedState.posts.unshift(...rssPosts);
    })
    .catch((err) => {
      watchedState.loading.errors = [err.message];
      watchedState.loading.state = 'failure';
    });
};

const previewClick = (evt, state) => {
  const watchedState = state;

  if (evt.target.dataset.toggle !== 'modal') return;

  const { id } = evt.target;

  watchedState.uiState.viewedPostIds = _.union(watchedState.uiState.viewedPostIds, [id]);
  watchedState.uiState.previewPostId = id;
};

export default () => i18next.init({
  lng: config.defaultLanguage,
  debug: false,
  resources,
})
  .then(() => {
    const state = {
      uiState: {
        language: config.defaultLanguage,
        previewPostId: null,
        viewedPostIds: [],
      },
      form: {
        isValid: null,
        errors: [],
      },
      loading: {
        state: 'idle',
        errors: [],
      },
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

    element.form.addEventListener('submit', (evt) => handleSubmit(evt, watchedState));
    element.posts.addEventListener('click', (evt) => previewClick(evt, watchedState));
    element.language.addEventListener('click', (evt) => {
      watchedState.uiState.language = evt.target.dataset.language;
    });

    setTimeout(() => updateRss(watchedState), config.updateTime);
  });
