import onChange from 'on-change';

const feedback = document.querySelector('.feedback');
const feeds = document.querySelector('.feeds');
const posts = document.querySelector('.posts');
const inputField = document.querySelector('#rss-input');
const button = document.querySelector('#submit-button');

const getFeeds = (data) => data
  .map(({ title, description }) => (`<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`))
  .join('');

const getPosts = (data) => data
  .map(({ link, title }) => (`<li class="list-group-item"><a href="${link}">${title}</a></li>`))
  .join('');

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
    case 'feedback':
      if (value === previousValue) return;
      feedback.textContent = value;
      if (value === '') {
        feedback.classList.remove('text-success', 'text-danger');
        return;
      }
      if (value === 'Rss has been loaded') {
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
