import onChange from 'on-change';
import i18next from 'i18next';

const getHtml = (data, type) => {
  switch (type) {
    case 'feeds': {
      const list = document.createElement('ul');
      list.classList.add('list-group', 'mb-5');
      data.forEach(({ title, description }) => {
        const item = document.createElement('li');
        item.classList.add('list-group-item');
        const itemTitle = document.createElement('h3');
        itemTitle.textContent = title;
        const itemDescription = document.createElement('p');
        itemDescription.textContent = description;
        item.append(itemTitle, itemDescription);
        list.append(item);
      });
      return list;
    }
    case 'posts': {
      return data.posts.map(({ link, title, id }) => {
        const isViewed = data.viewedPostIds.includes(id);
        return (`<li class="list-group-item ${isViewed ? 'font-weight-normal' : 'font-weight-bold'}">
                   <button id="${id}" type="button" class="btn btn-primary mr-3" data-toggle="modal" data-target="#modal">View</button>
                   <a href="${link}">${title}</a>
                 </li>`);
      }).join('');
    }
    case 'errors': {
      const container = document.createElement('div');
      data.forEach((name) => {
        const message = i18next.t(`message.${name}`) === `message.${name}` ? name : i18next.t(`message.${name}`);
        const item = document.createElement('div');
        item.textContent = message;
        container.append(item);
      });
      return container;
    }
    default:
      throw new Error(`unknownType ${type}`);
  }
};

const initInterface = () => {
  document.querySelector('#title').innerHTML = i18next.t('title');
  document.querySelector('#description').innerHTML = i18next.t('description');
  document.querySelector('#example').innerHTML = i18next.t('example');
  document.querySelector('#submit-button').innerHTML = i18next.t('buttonText');
  document.querySelector('#footer-text').innerHTML = i18next.t('footerText');
  document.querySelector('#footer-link-text').innerHTML = i18next.t('footerLinkText');
};

export default (state, elementObject) => {
  const element = elementObject;
  initInterface();

  return onChange(state, (path) => {
    const {
      uiState,
      form,
      loading,
      feeds,
      posts,
    } = state;

    const paintLoading = (status) => {
      switch (status) {
        case 'idle':
          element.button.removeAttribute('disabled');
          element.inputField.value = '';
          element.message.classList.remove('text-success', 'text-danger');
          break;
        case 'fetching':
          element.button.setAttribute('disabled', '');
          break;
        case 'success':
          element.button.removeAttribute('disabled');
          element.inputField.value = '';
          element.message.textContent = i18next.t('message.successMessage');
          element.message.classList.remove('text-danger');
          element.message.classList.add('text-success');
          element.inputField.classList.remove('is-invalid');
          break;
        case 'failure':
          element.message.innerHTML = '';
          element.message.append(getHtml(loading.errors, 'errors'));
          element.button.removeAttribute('disabled');
          element.message.classList.add('text-danger');
          element.message.classList.remove('text-success');
          break;
        default:
          throw new Error(`Unknown status ${status}`);
      }
    };

    const paintForm = (valid) => {
      switch (valid) {
        case true:
          element.inputField.classList.remove('is-invalid');
          break;
        case false:
          element.message.innerHTML = '';
          element.message.append(getHtml(form.errors, 'errors'));
          element.inputField.classList.add('is-invalid');
          element.message.classList.add('text-danger');
          element.message.classList.remove('text-success');
          break;
        default:
          throw new Error(`Unknown value ${valid}`);
      }
    };

    switch (path) {
      case 'loading.state':
        paintLoading(loading.state);
        break;
      case 'loading.errors':
        break;
      case 'form':
        paintForm(form.isValid);
        break;
      case 'uiState.language':
        if (uiState.language) {
          document.querySelector(`[data-language=${uiState.language}]`).classList.remove('active');
        }
        document.querySelector(`[data-language=${uiState.language}]`).classList.add('active');
        i18next.changeLanguage(uiState.language).then(initInterface);
        break;
      case 'uiState.previewPostId': {
        const { title, description, link } = posts.find((el) => el.id === uiState.previewPostId);
        element.modalLink.innerHTML = title;
        element.modalLink.href = link;
        element.modalDescription.innerHTML = description;
        break;
      }
      case 'uiState.viewedPostIds': {
        const html = getHtml({ posts, viewedPostIds: uiState.viewedPostIds }, 'posts');
        element.posts.innerHTML = `<h2>Posts</h2><ul class="list-group">${html}</ul>`;
        break;
      }
      case 'feeds':
        element.feeds.innerHTML = '<h2>Feeds</h2>';
        element.feeds.append(getHtml(feeds, 'feeds'));
        break;
      case 'posts': {
        const html = getHtml({ posts, viewedPostIds: uiState.viewedPostIds }, 'posts');
        element.posts.innerHTML = `<h2>Posts</h2><ul class="list-group">${html}</ul>`;
        break;
      }
      default:
        throw new Error(`Unknown path ${path}`);
    }
  });
};
