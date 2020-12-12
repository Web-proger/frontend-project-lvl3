import onChange from 'on-change';
import i18next from 'i18next';

const getHtml = (data, type) => {
  switch (type) {
    case 'feeds':
      return data
        .map(({ title, description }) => (`<li class="list-group-item"><h3>${title}</h3><p>${description}</p></li>`))
        .join('');
    case 'posts':
      return data
        .map(({
          link,
          title,
          postId,
          isViewed,
        }) => (`
            <li class="list-group-item ${isViewed ? 'font-weight-normal' : 'font-weight-bold'}">
                <button id="${postId}" type="button" class="btn btn-primary mr-3" data-toggle="modal" data-target="#modal">View</button>
                <a href="${link}">${title}</a>
            </li>
        `))
        .join('');
    case 'errors':
      return data.map((name) => {
        const message = i18next.t(`message.${name}`) === `message.${name}` ? name : i18next.t(`message.${name}`);
        return (`<div>${message}</div>`);
      }).join('');
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

  const regExp = RegExp(/^posts.\d+.isViewed$/);

  return onChange(state, (path, value, previousValue) => {
    if (value === previousValue || regExp.test(path)) return;

    switch (path) {
      case 'form.state':
        if (value === 'idle') {
          element.button.removeAttribute('disabled');
          element.inputField.value = '';
          element.message.classList.remove('text-success', 'text-danger');
        }
        if (value === 'fetching') {
          element.button.setAttribute('disabled', '');
        }
        if (value === 'success') {
          element.button.removeAttribute('disabled');
          element.inputField.value = '';
          element.message.textContent = i18next.t('message.successMessage');
          element.message.classList.remove('text-danger');
          element.message.classList.add('text-success');
        }
        if (value === 'failure') {
          element.button.removeAttribute('disabled');
          element.message.classList.add('text-danger');
          element.message.classList.remove('text-success');
        }
        break;
      case 'form.isValid':
        if (value) {
          element.inputField.classList.remove('is-invalid');
          return;
        }
        element.inputField.classList.add('is-invalid');
        break;
      case 'form.errors':
        element.message.innerHTML = `${getHtml(value, 'errors')}`;
        break;
      case 'uiState.language':
        if (previousValue) {
          document.querySelector(`[data-language=${previousValue}]`).classList.remove('active');
        }
        document.querySelector(`[data-language=${value}]`).classList.add('active');
        i18next.changeLanguage(value).then(initInterface);
        break;
      case 'uiState.modal':
        element.modalLink.innerHTML = value.title;
        element.modalLink.href = value.link;
        element.modalDescription.innerHTML = value.description;
        break;
      case 'feeds':
        element.feeds.innerHTML = `<h2>Feeds</h2><ul class="list-group mb-5">${getHtml(value, 'feeds')}</ul>`;
        break;
      case 'posts':
        element.posts.innerHTML = `<h2>Posts</h2><ul class="list-group">${getHtml(value, 'posts')}</ul>`;
        break;
      default:
        throw new Error(`Unknown path ${path}`);
    }
  });
};
