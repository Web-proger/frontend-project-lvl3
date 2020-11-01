import 'bootstrap';
import axios from 'axios';
import yup from 'yup';
import onChange from 'on-change';
import cors_proxy from 'cors-anywhere';

const form = document.querySelector('.rss-form');
const button = form.querySelector('#submit-button');
const inputField = form.querySelector('#rss-input');

const handleSubmit = (evt) => {
  evt.preventDefault();

  axios.get('https://ru.hexlet.io/lessons.rss')
    .then((data) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, "application/xml");
      console.log(doc);
    })
    .catch((err) => {
      console.log(err);
    })
};

form.addEventListener('submit', handleSubmit);



