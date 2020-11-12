import 'bootstrap';
import axios from 'axios';
import yup from 'yup';
import onChange from 'on-change';

const PROXY_URL = 'https://cors-anywhere.herokuapp.com';

const form = document.querySelector('.rss-form');
const button = form.querySelector('#submit-button');
const inputField = form.querySelector('#rss-input');
const feedback = document.querySelector('.feedback');
const feeds = document.querySelector('.feeds');
const posts = document.querySelector('.posts');

// Регулярка для урла:
// (^https?:\/{2})([a-zA-Z0-9\._-]+)(\.[a-zA-Z]{2,6})([\/a-zA-Z-])+(\?([a-zA-Z0-9=_\&.]*))?(#[a-zA-Z0-9_%\.]*)?$
// http://feeds.feedburner.com/css-live xml 1.0  - ёщё RSS
// https://3dnews.ru/workshop/rss/ rss 2.0
inputField.value = 'https://ru.hexlet.io/lessons.rss'; // Для тестирования

const state = {
  status: 'input',
  valid: false,
  feedback: '',
  feeds: [],
  posts: [],
};

const watchedObject = onChange(state, (path, value, previousValue) => {
  if (path === 'status') {
    if (value === previousValue) return;
    if (value === 'sending') {
      button.setAttribute('disabled', true);
    }
    if (value === 'input') {
      button.removeAttribute('disabled');
    }
  }

  if (path === 'feedback') {
    if (value === previousValue) return;
    feedback.textContent = value;
    if (value === '') {
      feedback.classList.remove('text-success', 'text-danger');
      return;
    }
    if (value === 'Rss has been loaded') {
      feedback.classList.add('text-success');
      return
    }
    feedback.classList.add('text-danger');
  }

  if (path === 'feeds') {
    // Заголовок Feeds
    const feedsTitle = document.createElement('h2');
    feedsTitle.textContent = 'Feeds';

    // Список ul
    const list = document.createElement('ul');
    list.classList.add('list-group', 'mb-5');

    // Элементы списка li
    value.forEach(({ title, description }) => {
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      const listItemTitle = document.createElement('h3');
      listItemTitle.textContent = title;
      const listItemDescription = document.createElement('p');
      listItemDescription.textContent = description;

      // Формирую список
      listItem.appendChild(listItemTitle);
      listItem.appendChild(listItemDescription);
      list.appendChild(listItem);
    });

    // Формирую блок фидов
    feeds.innerHTML = '';
    feeds.appendChild(feedsTitle);
    feeds.appendChild(list);
  }

  if (path === 'posts') {
    // Заголовок Posts
    const postsTitle = document.createElement('h2');
    postsTitle.textContent = 'Posts';

    // Список ul постов
    const postList = document.createElement('ul');
    postList.classList.add('list-group');

    // Элементы списка постов li
    value.forEach(({ link, title }) => {
      const postsListItem = document.createElement('li');
      postsListItem.classList.add('list-group-item');

      const postsLink = document.createElement('a');
      postsLink.textContent = title;
      postsLink.href = link;

      postsListItem.appendChild(postsLink);
      postList.appendChild(postsListItem);
    });

    posts.innerHTML = '';
    posts.appendChild(postsTitle);
    posts.appendChild(postList);
  }
});

const handleSubmit = (evt) => {
  evt.preventDefault();
  watchedObject.feedback = '';

  const rssUrl = inputField.value;
  const url = encodeURI(`${PROXY_URL}/${rssUrl}`);

  watchedObject.status = 'sending';
  axios.get(url)
    .then((response) => {
      watchedObject.status = 'input';
      watchedObject.feedback = 'Rss has been loaded';
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'application/xml');

      watchedObject.feeds.unshift({
        title: doc.querySelector('channel title').textContent,
        description: doc.querySelector('channel description').textContent,
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
      watchedObject.status = 'input';
    });
};

form.addEventListener('submit', handleSubmit);
