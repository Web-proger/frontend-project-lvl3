import 'bootstrap';
import axios from 'axios';
import yup from 'yup';
import onChange from 'on-change';

const PROXY_URL = 'https://cors-anywhere.herokuapp.com';

const form = document.querySelector('.rss-form');
const button = form.querySelector('#submit-button');
const inputField = form.querySelector('#rss-input');

// http://feeds.feedburner.com/css-live   - ёщё RSS
inputField.value = 'https://ru.hexlet.io/lessons.rss';  // Для тестирования

const state = {
  feeds: [],
}


const handleSubmit = (evt) => {
  evt.preventDefault();
  const rssUrl = inputField.value;
  const url = encodeURI(`${PROXY_URL}/${rssUrl}`);
  console.log(url);

  axios.get(url)
    .then((response) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'application/xml');
      const data = {};
      data.feed = doc.querySelector('channel title').textContent;
      data.description = doc.querySelector('channel description').textContent;
      data.posts = [...doc.querySelectorAll('channel item')].map((el) => ({
        title: el.querySelector('title').textContent,
        link: el.querySelector('link').textContent,
      }));

      console.log(doc);
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
};

form.addEventListener('submit', handleSubmit);
