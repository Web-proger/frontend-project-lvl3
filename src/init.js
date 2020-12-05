import i18next from 'i18next';
import onChange from 'on-change';
import view from './view';
import resources from './locales';
import addRss from './addRss';
import updateRss from './updateRss';
import config from './config';

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
        modal: {
          title: '',
          description: '',
          link: '',
        }
      };

      const watchedObject = onChange(state, view);

      watchedObject.language = config.defaultLanguage;

      // Отправка формы
      document.querySelector('.rss-form').addEventListener('submit', (evt) => addRss(evt, watchedObject));
      // Открытие модального окна
      document.querySelector('.posts').addEventListener('click', (evt) => {
        const previewId = Number(evt.target.id);
        const post = watchedObject.posts.find((el) => el.postId === previewId);

        if (post === 'undefined') return;

        post.isViewed = true
        watchedObject.modal = {
          title: post.title,
          description: post.description,
          link: post.link,
        };
        watchedObject.posts = [...watchedObject.posts];
      });
      // Переключение языков
      document.querySelector('#buttons').addEventListener('click', (evt) => {
        watchedObject.language = evt.target.dataset.language;
      });

      view(watchedObject);

      setTimeout(() => updateRss(watchedObject), config.updateTime);
    });
};
