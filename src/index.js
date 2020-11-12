import 'bootstrap';
import axios from 'axios';
import { string } from 'yup';
import watch from './view';

// TODO уникальный записи в посты и фиды
// TODO Избавится от inputField, даные формы получать в событии

const PROXY_URL = 'https://cors-anywhere.herokuapp.com';

const form = document.querySelector('.rss-form');
const inputField = form.querySelector('#rss-input');

// Регулярка для урла:
// http://feeds.feedburner.com/css-live xml 1.0  - ёщё RSS
// https://3dnews.ru/workshop/rss/ rss 2.0
inputField.value = 'https://ru.hexlet.io/lessons.rss'; // Для тестирования

// Схема валидации url
const urlSchema = string().url();

// Модель стейта
const state = {
  status: 'input',
  feedback: '',
  valid: true,
  feeds: [],
  posts: [],
};

const watchedObject = watch(state);

const handleSubmit = (evt) => {
  evt.preventDefault();
  watchedObject.feedback = '';

  const rssUrl = inputField.value;

  urlSchema.isValid(rssUrl)
    // Валидность ссылки
    .then((valid) => {
      if (!valid) {
        watchedObject.valid = false;
        throw new Error('Must be valid url');
      }
      watchedObject.valid = true;
    })
    // Уникальность ссылки
    .then(() => {
      if (watchedObject.feeds.length === 0) return;

      const isLinkExists = watchedObject.feeds.filter((el) => el.link === rssUrl).length > 0;
      if (isLinkExists) {
        watchedObject.valid = false;
        throw new Error('Rss already exists');
      }
      watchedObject.valid = true;
    })
    // Запрос с указанным урлом
    .then(() => {
      const url = encodeURI(`${PROXY_URL}/${rssUrl}`);
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
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
