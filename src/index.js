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

      const feeds = document.querySelector('.feeds');
      const posts = document.querySelector('.posts');

      // Заголовок Feeds
      const feedsTitle = document.createElement('h2');
      feedsTitle.textContent = 'Feeds';

      // Список ul
      const list = document.createElement('ul');
      list.classList.add('list-group', 'mb-5');

      // Элементы списка li
      const listItem = document.createElement('li');
      listItem.classList.add('list-group-item');
      const listItemTitle = document.createElement('h3');
      listItemTitle.textContent =data.feed;
      const listItemDescription = document.createElement('p');
      listItemDescription.textContent = data.description;

      // Формирую список
      listItem.appendChild(listItemTitle);
      listItem.appendChild(listItemDescription);
      list.appendChild(listItem);

      // Формирую блок фидов
      feeds.appendChild(feedsTitle);
      feeds.appendChild(list);


      // Заголовок Posts
      const postsTitle = document.createElement('h2');
      postsTitle.textContent = 'Posts';

      // Список ul постов
      const postList = document.createElement('ul');
      postList.classList.add('list-group');

      // Элементы списка постов li
      data.posts.forEach(({link, title}) => {
        const postsListItem = document.createElement('li');
        postsListItem.classList.add('list-group-item');

        const postsLink = document.createElement('a');
        postsLink.textContent = title;
        postsLink.href = link;

        postsListItem.appendChild(postsLink);
        postList.appendChild(postsListItem);

      })

      posts.appendChild(postsTitle);
      posts.appendChild(postList);



      console.log(doc);
      console.log(data);
    })
    .catch((err) => {
      console.log(err);
    });
};

form.addEventListener('submit', handleSubmit);
