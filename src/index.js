import 'bootstrap';
import axios from 'axios';
import { string } from 'yup';
import watch from './view';
import parse from './parser';

// TODO уникальный записи в посты и фиды
// TODO Избавится от inputField, даные формы получать в событии
// TODO сопоставить посты с фидами через ID
// TODO i18next только для текстов интерфейса

const PROXY_URL = 'https://api.allorigins.win';

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
      const url = encodeURI(`${PROXY_URL}/get?url=${rssUrl}`);
      watchedObject.status = 'sending';
      return axios.get(url);
    })
    // Формирование списка Постов и Фидов
    .then((response) => {
      watchedObject.status = 'input';
      watchedObject.feedback = 'Rss has been loaded';

      const rssData = parse(response.data.contents);

      watchedObject.feeds.unshift({
        title: rssData.title,
        description: rssData.description,
        link: rssUrl,
      });

      watchedObject.posts.unshift(...rssData.posts);
    })
    .catch((err) => {
      watchedObject.feedback = err.message;
      watchedObject.status = 'error';
    });
};

form.addEventListener('submit', handleSubmit);
