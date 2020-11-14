import onChange from 'on-change';
import i18next from 'i18next';

const feedback = document.querySelector('.feedback');
const feeds = document.querySelector('.feeds');
const posts = document.querySelector('.posts');
const inputField = document.querySelector('[name=rss-input]');
const button = document.querySelector('#submit-button');

const getFeeds = (data) => data
  .map(({ title, description }) => (`<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`))
  .join('');

const getPosts = (data) => data
  .map(({ link, title }) => (`<li class="list-group-item"><a href="${link}">${title}</a></li>`))
  .join('');

const initInterface = () => {
  document.querySelector('#title').innerHTML = i18next.t('title');
  document.querySelector('#description').innerHTML = i18next.t('description');
  document.querySelector('#example').innerHTML = i18next.t('example');
  document.querySelector('#submit-button').innerHTML = i18next.t('buttonText');
  document.querySelector('#footer-text').innerHTML = i18next.t('footerText');
  document.querySelector('#footer-link-text').innerHTML = i18next.t('footerLinkText');
};

export default (state) => onChange(state, (path, value, previousValue) => {
  switch (path) {
    case 'status':
      if (value === previousValue) return;
      if (value === 'sending') {
        button.setAttribute('disabled', true);
      }
      if (value === 'input') {
        button.removeAttribute('disabled');
        inputField.value = '';
      }
      if (value === 'error') {
        button.removeAttribute('disabled');
      }
      break;
    case 'lang':
      if (value === previousValue) return;
      if (previousValue) {
        document.querySelector(`#${previousValue}`).classList.remove('active');
      }
      document.querySelector(`#${value}`).classList.add('active');
      i18next.changeLanguage(value).then(() => initInterface());
      break;
    case 'feedback':
      if (value === previousValue) return;
      feedback.textContent = value;
      if (value === '') {
        feedback.classList.remove('text-success', 'text-danger');
        return;
      }
      if (value === i18next.t('message.successMessage')) {
        feedback.classList.add('text-success');
        return;
      }
      feedback.classList.add('text-danger');
      break;
    // Валидность формы
    case 'valid':
      if (value === previousValue) return;
      if (value) {
        inputField.classList.remove('is-invalid');
        return;
      }
      inputField.classList.add('is-invalid');
      break;
    // Формирую блок фидов
    case 'feeds':
      feeds.innerHTML = `<h2>Feeds</h2><ul class="list-group mb-5">${getFeeds(value)}</ul>`;
      break;
    // Формирую блок постов
    case 'posts':
      posts.innerHTML = `<h2>Posts</h2><ul class="list-group">${getPosts(value)}</ul>`;
      break;
    default:
      throw new Error('Unknown path');
  }
});
