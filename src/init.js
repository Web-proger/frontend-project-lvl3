import i18next from 'i18next';
import onChange from 'on-change';
import view from './view';
import resources from './locales';
import addRss from './addRss';
import rssUpdate from './rssUpdate';
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

      const watchedObject = onChange(
        state,
        (path, value, previousValue) => view(watchedObject, path, value, previousValue),
      );

      watchedObject.language = config.defaultLanguage;

      document.querySelector('.rss-form').addEventListener('submit', (evt) => addRss(evt, watchedObject));
      document.querySelector('.posts').addEventListener('click', (evt) => {
        const id = Number(evt.target.id);
        const post = watchedObject.posts.find((post) => post.postId === id);
        if (post === 'undefined') return;
        watchedObject.modal = { ...post };
        post.isViewed = true;
      });
      document.querySelector('#buttons').addEventListener('click', (evt) => {
        watchedObject.language = evt.target.dataset.language;
      });

      view(watchedObject);

      setTimeout(() => rssUpdate(watchedObject), config.updateTime);
    });
};
