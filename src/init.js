import i18next from 'i18next';
import onChange from 'on-change';
import view from './view';
import resources from './locales';
import addRss from './addRss';
import updateRss from './updateRss';
import config from './config';

const updateData = (evt, state) => {
  const watchedState = state;
  const previewId = Number(evt.target.id);
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

const changeLanguage = (evt, state) => {
  const watchedState = state;
  watchedState.language = evt.target.dataset.language;
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

      const watchedState = onChange(state, view);

      watchedState.language = config.defaultLanguage;

      // Отправка формы
      document.querySelector('.rss-form').addEventListener('submit', (evt) => addRss(evt, watchedState));
      // Открытие модального окна
      document.querySelector('.posts').addEventListener('click', (evt) => updateData(evt, watchedState));
      // Переключение языков
      document.querySelector('#buttons').addEventListener('click', (evt) => changeLanguage(evt, watchedState));

      setTimeout(() => updateRss(watchedState), config.updateTime);

      return 'success init';
    });
};
