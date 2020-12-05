import i18next from 'i18next';
import onChange from 'on-change';
import { string } from 'yup';
import watch from './watch';
import resources from './locales';
import addRss from './addRss';
import updateRss from './updateRss';
import config from './config';

const handleSubmit = (evt, state) => {
  evt.preventDefault();
  const watchedState = state;
  const urlSchema = string().url();
  watchedState.form.feedback = '';

  const formData = new FormData(evt.target);
  const rssUrl = formData.get('rss-input');

  urlSchema.isValid(rssUrl)
    // Валидность ссылки
    .then((valid) => {
      watchedState.form.valid = valid;
      if (!valid) {
        throw new Error(i18next.t('message.noValidUrl'));
      }
    })
    // Уникальность ссылки
    .then(() => {
      if (watchedState.feeds.length > 0) {
        // Существет ли добаляемая ссылка
        const isLinkUnique = watchedState.feeds.filter((el) => el.link === rssUrl).length === 0;
        watchedState.form.valid = isLinkUnique;
        if (!isLinkUnique) throw new Error(i18next.t('message.urlExists'));
      }

      return addRss(rssUrl, watchedState);
    })
    .catch((err) => {
      watchedState.form.feedback = err.message;
      watchedState.form.status = 'error';
    });
};

const updateData = (evt, state) => {
  const watchedState = state;
  const previewId = evt.target.id;
  const post = watchedState.posts.find((el) => el.postId === previewId);

  if (post === 'undefined') return;

  post.isViewed = true;

  watchedState.modal = {
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
        form: {
          status: 'input',
          feedback: '',
          valid: true,
        },
        feeds: [],
        posts: [],
        language: '',
        modal: {
          title: '',
          description: '',
          link: '',
        },
      };

      // TODO понять как прокинуть в watch.js
      const element = {
        rssForm: document.querySelector('.rss-form'),
        posts: document.querySelector('.posts'),
        language: document.querySelector('#buttons'),
        feedback: document.querySelector('.feedback'),
        feeds: document.querySelector('.feeds'),
        inputField: document.querySelector('[name=rss-input]'),
        button: document.querySelector('#submit-button'),
        modalLink: document.querySelector('#modalLink'),
        modalDescription: document.querySelector('#postDescription'),
      };

      const watchedState = onChange(state, watch);

      watchedState.language = config.defaultLanguage;

      // Отправка формы
      element.rssForm.addEventListener('submit', (evt) => handleSubmit(evt, watchedState));
      // Открытие модального окна
      element.posts.addEventListener('click', (evt) => updateData(evt, watchedState));
      // Переключение языков
      element.language.addEventListener('click', (evt) => {
        watchedState.language = evt.target.dataset.language;
      });

      setTimeout(() => updateRss(watchedState), config.updateTime);

      return 'success init';
    });
};
