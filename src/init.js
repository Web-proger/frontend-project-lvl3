import i18next from 'i18next';
import axios from 'axios';
import { string } from 'yup';
import _ from 'lodash';
import watch from './watch';
import resources from './locales';
import updateRss from './updateRss';
import parse from './parser';
import config from './config';

const handleSubmit = (evt, state) => {
  evt.preventDefault();
  const watchedState = state;
  const urlSchema = string().url();
  watchedState.form.feedback = '';

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');
  const url = `${config.proxy}/${rssUrl}`;

  urlSchema.isValid(rssUrl)
    // Валидность и уникальность ссылки
    .then((valid) => {
      watchedState.form.isValid = valid;
      if (!valid) throw new Error(i18next.t('message.noValidUrl'));

      const isLinkUnique = watchedState.feeds.filter((el) => el.link === rssUrl).length === 0;
      watchedState.form.isValid = isLinkUnique;
      if (!isLinkUnique) throw new Error(i18next.t('message.urlExists'));

      watchedState.form.status = 'sending';
      return axios.get(url)
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
    })
    .catch((err) => {
      watchedState.form.feedback = err.message;
      watchedState.form.status = 'error';
    })
};

const updateData = (evt, state) => {
  const watchedState = state;
  const previewId = evt.target.id;
  const post = watchedState.posts.find((el) => el.postId === previewId);

  if (post === 'undefined') return;

  post.isViewed = true;

  watchedState.uiState.modal = {
    title: post.title,
    description: post.description,
    link: post.link,
  };
  watchedState.posts = [...watchedState.posts];
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
          modal: {
            title: '',
            description: '',
            link: '',
          },
        },
        form: {
          isValid: false,
          status: 'input',
          feedback: '',
        },
        feeds: [],
        posts: [],
      };

      const element = {
        form: document.querySelector('.rss-form'),
        feedback: document.querySelector('.feedback'),
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

      // Отправка формы
      element.form.addEventListener('submit', (evt) => handleSubmit(evt, watchedState));
      // Открытие модального окна
      element.posts.addEventListener('click', (evt) => updateData(evt, watchedState));
      // Переключение языков
      element.language.addEventListener('click', (evt) => {
        watchedState.uiState.language = evt.target.dataset.language;
      });

      setTimeout(() => updateRss(watchedState), config.updateTime);

      return 'success init';
    });
};
