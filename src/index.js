import 'bootstrap';
import axios from 'axios';
import { string } from 'yup';
import onChange from 'on-change';

// TODO уникальный записи в посты и фиды

const PROXY_URL = 'https://cors-anywhere.herokuapp.com';

const form = document.querySelector('.rss-form');
const button = form.querySelector('#submit-button');
const inputField = form.querySelector('#rss-input');
const feedback = document.querySelector('.feedback');
const feeds = document.querySelector('.feeds');
const posts = document.querySelector('.posts');

// Регулярка для урла:
// http://feeds.feedburner.com/css-live xml 1.0  - ёщё RSS
// https://3dnews.ru/workshop/rss/ rss 2.0
inputField.value = 'https://ru.hexlet.io/lessons.rss'; // Для тестирования

// Схема валидации url
const urlSchema = string().url();

const state = {
  status: 'input',
  feedback: '',
  valid: true,
  feeds: [],
  posts: [],
};

const getFeeds = (data) => data
  .map(({ title, description }) => (`<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`))
  .join('');

const getPosts = (data) => data
  .map(({ link, title }) => (`<li class="list-group-item"><a href="${link}">${title}</a></li>`))
  .join('');

const watchedObject = onChange(state, (path, value, previousValue) => {
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

const handleSubmit = (evt) => {
  evt.preventDefault();
  watchedObject.feedback = '';

  const rssUrl = inputField.value;

  urlSchema.isValid(rssUrl)
    .then((valid) => {
      if (!valid) {
        watchedObject.valid = false;
        throw new Error('Must be valid url');
      }
      watchedObject.valid = true;
    })
    .then(() => {
      if (watchedObject.feeds.length === 0) return;

      const isLinkExists = watchedObject.feeds.filter((el) => el.link === rssUrl).length > 0;
      if (isLinkExists) {
        watchedObject.valid = false;
        throw new Error('Rss already exists');
      }
      watchedObject.valid = true;
    })
    .then(() => {
      const url = encodeURI(`${PROXY_URL}/${rssUrl}`);
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    .then((response) => {
      watchedObject.status = 'input';
      watchedObject.feedback = 'Rss has been loaded';

      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'application/xml');

      watchedObject.feeds.unshift({
        title: doc.querySelector('channel title').textContent,
        description: doc.querySelector('channel description').textContent,
        link: rssUrl,
      });

      const postsData = doc.querySelectorAll('channel item');
      const newPost = Array.from(postsData).map((el) => ({
        title: el.querySelector('title').textContent,
        link: el.querySelector('link').textContent,
      }));

      watchedObject.posts.unshift(...newPost);

      console.log(doc);
    })
    .catch((err) => {
      watchedObject.feedback = err.message;
      watchedObject.status = 'error';
    });
};

form.addEventListener('submit', handleSubmit);
